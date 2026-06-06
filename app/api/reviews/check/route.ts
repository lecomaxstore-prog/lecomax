import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getProduct } from "@/lib/products";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * GET /api/reviews/check?slug=xxx&email=yyy
 * Returns:
 *   { canReview: true }  — customer has ordered and hasn't reviewed yet
 *   { canReview: false, reason: "not_ordered" | "already_reviewed" }
 */
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  const email = req.nextUrl.searchParams.get("email");

  if (!slug || !email) {
    return NextResponse.json({ error: "Paramètres manquants." }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const product = getProduct(slug);
  const productName = product?.name?.toLowerCase() ?? "";

  // Check orders
  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select("id, items")
    .filter("customer->>email", "ilike", normalizedEmail);

  if (ordersError) {
    return NextResponse.json({ error: "Erreur de vérification." }, { status: 500 });
  }

  const hasOrdered = orders?.some((order) => {
    if (!Array.isArray(order.items)) return false;
    return order.items.some((item: { slug?: string; name?: string }) => {
      if (item.slug) return item.slug === slug;
      if (typeof item.name === "string" && productName) {
        return item.name.toLowerCase().includes(productName.slice(0, 20));
      }
      return false;
    });
  });

  if (!hasOrdered) {
    return NextResponse.json({ canReview: false, reason: "not_ordered" });
  }

  // Check if already reviewed
  const { data: existing } = await supabase
    .from("reviews")
    .select("id")
    .eq("product_slug", slug)
    .ilike("email", normalizedEmail)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ canReview: false, reason: "already_reviewed" });
  }

  return NextResponse.json({ canReview: true });
}
