import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getProduct } from "@/lib/products";

// Use service role for admin operations; anon for public reads is fine but service role covers all
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET /api/reviews?slug=xxx  OR  GET /api/reviews  (admin, no slug = all reviews)
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");

  if (slug) {
    const { data, error } = await supabase
      .from("reviews")
      .select("id, author_name, city, rating, title, body, color, created_at")
      .eq("product_slug", slug)
      .order("created_at", { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ reviews: data });
  }

  // Admin: return all reviews
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/reviews
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { product_slug, email, author_name, city, rating, title, review_body, color } = body;

  if (!product_slug || !email || !author_name || !rating || !review_body) {
    return NextResponse.json({ error: "Champs manquants." }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Look up product name for fallback matching (old orders stored name not slug)
  const product = getProduct(product_slug);
  const productName = product?.name?.toLowerCase() ?? "";

  // Check if the customer has ordered this product and it was delivered
  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select("id, items, status")
    .filter("customer->>email", "ilike", normalizedEmail);

  if (ordersError) {
    return NextResponse.json({ error: "Erreur de vérification." }, { status: 500 });
  }

  const matchingOrders = orders?.filter((order) => {
    if (!Array.isArray(order.items)) return false;
    return order.items.some(
      (item: { slug?: string; name?: string }) => {
        if (item.slug) return item.slug === product_slug;
        if (typeof item.name === "string" && productName) {
          return item.name.toLowerCase().includes(productName.slice(0, 20));
        }
        return false;
      }
    );
  }) ?? [];

  if (matchingOrders.length === 0) {
    return NextResponse.json(
      { error: "Seuls les clients ayant commandé ce produit peuvent laisser un avis." },
      { status: 403 }
    );
  }

  const DELIVERED_STATUSES = ["delivered", "livré", "livree", "shipped", "expédié", "expedie", "completed"];
  const isDelivered = matchingOrders.some((o) =>
    DELIVERED_STATUSES.includes((o.status ?? "").toLowerCase())
  );

  if (!isDelivered) {
    return NextResponse.json(
      { error: "Votre commande est en cours de livraison. Vous pourrez laisser un avis dès réception." },
      { status: 403 }
    );
  }

  // Check if they already reviewed this product
  const { data: existing } = await supabase
    .from("reviews")
    .select("id")
    .eq("product_slug", product_slug)
    .ilike("email", normalizedEmail)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "Vous avez déjà laissé un avis pour ce produit." },
      { status: 409 }
    );
  }

  const { error: insertError } = await supabase.from("reviews").insert({
    product_slug,
    email: normalizedEmail,
    author_name: author_name.trim(),
    city: city?.trim() ?? null,
    rating: Number(rating),
    title: title?.trim() ?? null,
    body: review_body.trim(),
    color: color?.trim() ?? null,
  });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
