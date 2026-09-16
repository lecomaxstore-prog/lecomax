import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createHash } from "node:crypto";

export type ReviewProof = {
  order_number?: unknown;
  contact_type?: unknown;
  contact?: unknown;
};
export type ReviewOrder = {
  id: string;
  items: unknown;
  status: string;
  customer: Record<string, unknown>;
};
export type ReviewReason =
  | "signed_out"
  | "not_ordered"
  | "not_delivered"
  | "already_reviewed"
  | "verified_purchase";

export function normalizeReviewOrder(value: unknown) {
  const order = String(value ?? "")
    .normalize("NFKC")
    .trim()
    .toUpperCase()
    .replace(/^#/, "")
    .replace(/\s+/g, "");
  return /^\d{6}$/.test(order)
    ? `ECO-${order}`
    : order.replace(/^ECO(?=\d{6}$)/, "ECO-");
}

export function normalizeReviewContact(value: unknown, type: unknown) {
  const text = typeof value === "string" ? value.normalize("NFKC").trim() : "";
  if (type === "email")
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text) ? text.toLowerCase() : "";
  if (type !== "phone" || !/^[+\d\s().-]+$/.test(text)) return "";
  let digits = text.replace(/\D/g, "").replace(/^00/, "");
  if (/^0[5-7]\d{8}$/.test(digits)) digits = `212${digits.slice(1)}`;
  return /^[1-9]\d{7,14}$/.test(digits) ? digits : "";
}

export function reviewOrderMatches(order: ReviewOrder, slug: string) {
  return (
    Array.isArray(order.items) &&
    order.items.some(
      (item) => item && typeof item === "object" && item.slug === slug,
    )
  );
}

export function isReviewDelivered(status: unknown) {
  return [
    "delivered",
    "livré",
    "livree",
    "livrée",
    "completed",
    "complete",
  ].includes(
    String(status ?? "")
      .trim()
      .toLowerCase(),
  );
}

// Order credentials are checked on every request, including publication. Never
// trust a client-side eligibility flag or expose order/customer details.
export async function resolveReviewPurchase(
  db: SupabaseClient,
  slug: string,
  user: User | null,
  proof: ReviewProof = {},
) {
  let orders: ReviewOrder[] = [];
  const hasProof =
    proof.order_number !== undefined || proof.contact !== undefined;
  if (hasProof) {
    const orderNumber = normalizeReviewOrder(proof.order_number);
    const contact = normalizeReviewContact(proof.contact, proof.contact_type);
    if ((orderNumber && !/^ECO-\d{6}$/.test(orderNumber)) || !contact)
      return { reason: "not_ordered" as ReviewReason };
    // Shared across server instances and both phone/email paths. No raw contact
    // information is stored in the rate-limit table.
    const limit = await db.rpc("consume_review_lookup", {
      p_key: createHash("sha256").update(orderNumber || `${proof.contact_type}:${contact}`).digest("hex"),
    });
    if (limit.error || limit.data !== true)
      throw new Error("REVIEW_LOOKUP_UNAVAILABLE");
    if (!orderNumber) {
      const { data, error } = await db.rpc("find_review_orders_by_contact", {
        p_contact_type: proof.contact_type,
        p_contact: contact,
        p_slug: slug,
      });
      if (error) throw new Error("REVIEW_LOOKUP_UNAVAILABLE");
      orders = ((data ?? []) as ReviewOrder[]).filter((order) =>
        normalizeReviewContact(order.customer?.[proof.contact_type === "phone" ? "phone" : "email"], proof.contact_type) === contact,
      );
    } else {
    const { data, error } = await db
      .from("orders")
      .select("id,items,status,customer")
      .eq("order_number", orderNumber)
      .maybeSingle();
    if (error) throw new Error("REVIEW_LOOKUP_UNAVAILABLE");
    if (
      !data ||
      normalizeReviewContact(
        data.customer?.[proof.contact_type === "phone" ? "phone" : "email"],
        proof.contact_type,
      ) !== contact
    ) {
      return { reason: "not_ordered" as ReviewReason };
    }
    orders = [data as ReviewOrder];
    }
  } else {
    if (!user?.email) return { reason: "signed_out" as ReviewReason };
    const email = user.email.trim().toLowerCase();
    const { data, error } = await db
      .from("orders")
      .select("id,items,status,customer")
      .ilike("customer->>email", email.replace(/[\\%_]/g, "\\$&"));
    if (error) throw new Error("REVIEW_LOOKUP_UNAVAILABLE");
    orders = (data ?? []) as ReviewOrder[];
  }
  const matching = orders.filter((order) => reviewOrderMatches(order, slug));
  if (!matching.length) return { reason: "not_ordered" as ReviewReason };
  const delivered = matching.filter((order) => isReviewDelivered(order.status));
  if (!delivered.length) return { reason: "not_delivered" as ReviewReason };
  // Guest and signed-in submissions share the same per-order constraint.
  const { data: existing, error } = await db
    .from("reviews")
    .select("order_id")
    .eq("product_slug", slug)
    .in(
      "order_id",
      delivered.map((order) => order.id),
    );
  if (error) throw new Error("REVIEW_LOOKUP_UNAVAILABLE");
  const order = delivered.find(
    (candidate) =>
      !(existing ?? []).some((review) => review.order_id === candidate.id),
  );
  if (!order) return { reason: "already_reviewed" as ReviewReason };
  if (!hasProof && user) {
    const previous = await db
      .from("reviews")
      .select("id")
      .eq("product_slug", slug)
      .eq("user_id", user.id)
      .limit(1);
    if (previous.error) throw new Error("REVIEW_LOOKUP_UNAVAILABLE");
    if (previous.data?.length)
      return { reason: "already_reviewed" as ReviewReason };
  }
  return {
    reason: "verified_purchase" as ReviewReason,
    order,
    guest: hasProof,
  };
}
