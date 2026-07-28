import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getCustomerUser } from "@/lib/request-auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const DELIVERED_STATUSES = new Set(["delivered", "livré", "livree", "livrée", "completed", "complete"]);

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug")?.trim();
  const user = await getCustomerUser(req);
  if (!user?.email) {
    return NextResponse.json({ canReview: false, reason: "signed_out" }, { status: 401 });
  }
  if (!slug) return NextResponse.json({ error: "Produit manquant." }, { status: 400 });

  const email = user.email.toLowerCase();
  const [{ data: orders, error: ordersError }, { data: existingByUser, error: existingError }] = await Promise.all([
    supabase.from("orders").select("id,items,status").eq("customer->>email", email),
    supabase.from("reviews").select("id").eq("product_slug", slug).eq("user_id", user.id).maybeSingle(),
  ]);

  if (ordersError) return NextResponse.json({ error: "Vérification indisponible." }, { status: 503 });

  let existing = existingByUser;
  if (existingError && /user_id|column/i.test(existingError.message)) {
    const legacy = await supabase
      .from("reviews")
      .select("id")
      .eq("product_slug", slug)
      .ilike("email", email)
      .maybeSingle();
    existing = legacy.data;
  } else if (existingError) {
    return NextResponse.json({ error: "Vérification indisponible." }, { status: 503 });
  }

  if (existing) return NextResponse.json({ canReview: false, reason: "already_reviewed" });

  const matching = (orders ?? []).filter((order) =>
    Array.isArray(order.items) &&
    order.items.some((item) => item && typeof item === "object" && "slug" in item && item.slug === slug),
  );
  if (!matching.length) return NextResponse.json({ canReview: false, reason: "not_ordered" });

  const delivered = matching.some((order) =>
    DELIVERED_STATUSES.has(String(order.status ?? "").trim().toLowerCase()),
  );
  if (!delivered) return NextResponse.json({ canReview: false, reason: "not_delivered" });

  return NextResponse.json({ canReview: true, reason: "verified_purchase" });
}
