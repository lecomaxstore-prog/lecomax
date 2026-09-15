import { readJsonLimited } from "@/lib/request-body";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

const ALLOWED_EVENT_TYPES = new Set([
  "page_view",
  "product_view",
  "cart_add",
  "cart_remove",
  "favorite_add",
  "favorite_remove",
  "search",
  "checkout_start",
  "checkout_complete",
  "engagement",
]);

// POST — record a behavioral event
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await readJsonLimited(req);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    session_id,
    event_type,
    path,
    title,
    product_id,
    product_name,
    category,
    query,
    extra,
  } = body as Record<string, unknown>;

  if (
    !session_id ||
    typeof session_id !== "string" ||
    session_id.length > 100 ||
    !/^[a-zA-Z0-9_-]+$/.test(session_id)
  ) {
    return NextResponse.json({ error: "session_id required" }, { status: 400 });
  }
  if (
    !event_type ||
    typeof event_type !== "string" ||
    !ALLOWED_EVENT_TYPES.has(event_type)
  ) {
    return NextResponse.json({ error: "invalid event_type" }, { status: 400 });
  }

  // Verify consent exists and has not been revoked
  const { data: consent } = await supabase
    .from("data_collection_consents")
    .select("id, revoked_at")
    .eq("session_id", session_id)
    .is("revoked_at", null)
    .maybeSingle();

  if (!consent) {
    return NextResponse.json({ error: "no_consent" }, { status: 403 });
  }

  const safeExtra =
    typeof extra === "object" &&
    extra !== null &&
    JSON.stringify(extra).length <= 4000
      ? extra
      : null;
  const { error } = await supabase.from("client_behavioral_events").insert({
    session_id,
    event_type,
    path: typeof path === "string" ? path.slice(0, 500) : null,
    title: typeof title === "string" ? title.slice(0, 200) : null,
    product_id:
      typeof product_id === "string" ? product_id.slice(0, 100) : null,
    product_name:
      typeof product_name === "string" ? product_name.slice(0, 200) : null,
    category: typeof category === "string" ? category.slice(0, 100) : null,
    query: typeof query === "string" ? query.slice(0, 200) : null,
    extra: safeExtra,
  });

  if (error) {
    console.error("client_behavioral_events insert error:", error.message);
    return NextResponse.json({ ok: true, warning: "table_missing" });
  }

  const intelligenceItems: Array<{
    product_id: string;
    category: string | null;
  }> = [];
  if (typeof product_id === "string" && product_id) {
    intelligenceItems.push({
      product_id: product_id.slice(0, 100),
      category: typeof category === "string" ? category.slice(0, 100) : null,
    });
  }
  if (
    (event_type === "checkout_start" || event_type === "checkout_complete") &&
    safeExtra &&
    "items" in safeExtra
  ) {
    const items = Array.isArray((safeExtra as { items?: unknown }).items)
      ? (safeExtra as { items: unknown[] }).items.slice(0, 30)
      : [];
    for (const item of items) {
      if (!item || typeof item !== "object") continue;
      const candidate = item as { product_id?: unknown; category?: unknown };
      if (typeof candidate.product_id !== "string" || !candidate.product_id)
        continue;
      intelligenceItems.push({
        product_id: candidate.product_id.slice(0, 100),
        category:
          typeof candidate.category === "string"
            ? candidate.category.slice(0, 100)
            : null,
      });
    }
  }

  if (intelligenceItems.length > 0) {
    await Promise.all(
      intelligenceItems.map((item) =>
        supabase
          .rpc("increment_product_intelligence", {
            p_product_id: item.product_id,
            p_category: item.category,
            p_event_type: event_type,
          })
          .then(() => undefined),
      ),
    );
  }

  return NextResponse.json({ ok: true });
}
