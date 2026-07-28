import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { broadcastAdminPushNotification } from "@/lib/push-notifications";
import { getCustomerUser, isAdminRequest } from "@/lib/request-auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const DELIVERED_STATUSES = new Set([
  "delivered",
  "livré",
  "livree",
  "livrée",
  "completed",
  "complete",
]);

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.replace(/[<>\u0000-\u001F\u007F]/g, "").trim().slice(0, maxLength)
    : "";
}

function isMissingReviewColumn(error: { message?: string; code?: string } | null) {
  return Boolean(error && (
    error.code === "42703" ||
    error.code === "PGRST204" ||
    /verified_purchase|user_id|order_id|image_urls|image_url/i.test(error.message ?? "")
  ));
}

function orderContainsProduct(items: unknown, slug: string) {
  return Array.isArray(items) && items.some((item) => (
    item &&
    typeof item === "object" &&
    "slug" in item &&
    String(item.slug) === slug
  ));
}

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");

  if (!slug) {
    if (!await isAdminRequest(req)) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    }
    const { data, error } = await supabase.from("reviews").select("*").order("created_at", { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  const primaryResult = await supabase
    .from("reviews")
    .select("id, author_name, city, rating, title, body, color, created_at, image_url, image_urls, verified_purchase, admin_reply")
    .eq("product_slug", slug)
    .order("created_at", { ascending: false });
  let data = primaryResult.data as Record<string, unknown>[] | null;
  let error = primaryResult.error;

  if (error && isMissingReviewColumn(error)) {
    const fallbackResult = await supabase
      .from("reviews")
      .select("id, author_name, city, rating, title, body, color, created_at, image_url")
      .eq("product_slug", slug)
      .order("created_at", { ascending: false });
    data = fallbackResult.data as Record<string, unknown>[] | null;
    error = fallbackResult.error;
  }

  if (error && /image_url/i.test(error.message ?? "")) {
    const legacyResult = await supabase
      .from("reviews")
      .select("id, author_name, city, rating, title, body, color, created_at")
      .eq("product_slug", slug)
      .order("created_at", { ascending: false });
    data = legacyResult.data as Record<string, unknown>[] | null;
    error = legacyResult.error;
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({
    reviews: (data ?? []).map((review) => ({
      ...review,
      verified_purchase: "verified_purchase" in review ? review.verified_purchase === true : true,
    })),
  });
}

export async function POST(req: NextRequest) {
  const user = await getCustomerUser(req);
  if (!user?.email) {
    return NextResponse.json(
      { error: "Connectez-vous avec l’adresse utilisée pour votre commande." },
      { status: 401 },
    );
  }

  const { data: featureSetting } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "enable_reviews")
    .maybeSingle();
  if (featureSetting?.value === "false") {
    return NextResponse.json({ error: "Les avis sont temporairement désactivés." }, { status: 403 });
  }

  let input: Record<string, unknown>;
  try {
    input = await req.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide." }, { status: 400 });
  }

  const productSlug = cleanText(input.product_slug, 160);
  const rating = Number(input.rating);
  const reviewBody = cleanText(input.review_body, 1200);
  const title = cleanText(input.title, 100);
  const city = cleanText(input.city, 80);
  const color = cleanText(input.color, 50);
  const normalizedEmail = user.email.trim().toLowerCase();
  const metadataName = cleanText(user.user_metadata?.full_name ?? user.user_metadata?.name, 60);
  const authorName = metadataName || normalizedEmail.split("@")[0].slice(0, 40);

  if (!productSlug || !Number.isInteger(rating) || rating < 1 || rating > 5 || reviewBody.length < 20) {
    return NextResponse.json(
      { error: "Choisissez une note et rédigez un avis d’au moins 20 caractères." },
      { status: 400 },
    );
  }

  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select("id, items, status")
    .eq("customer->>email", normalizedEmail)
    .order("created_at", { ascending: false });

  if (ordersError) {
    return NextResponse.json({ error: "Impossible de vérifier votre achat." }, { status: 503 });
  }

  const matchingOrders = (orders ?? []).filter((order) => orderContainsProduct(order.items, productSlug));
  if (!matchingOrders.length) {
    return NextResponse.json(
      { error: "Seuls les clients ayant acheté ce produit peuvent laisser un avis." },
      { status: 403 },
    );
  }

  const deliveredOrder = matchingOrders.find((order) =>
    DELIVERED_STATUSES.has(String(order.status ?? "").trim().toLowerCase()),
  );
  if (!deliveredOrder) {
    return NextResponse.json(
      { error: "Vous pourrez laisser un avis lorsque votre commande aura été livrée." },
      { status: 403 },
    );
  }

  let { data: existing, error: existingError } = await supabase
    .from("reviews")
    .select("id")
    .eq("product_slug", productSlug)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingError && isMissingReviewColumn(existingError)) {
    ({ data: existing, error: existingError } = await supabase
      .from("reviews")
      .select("id")
      .eq("product_slug", productSlug)
      .ilike("email", normalizedEmail)
      .maybeSingle());
  }
  if (existingError) return NextResponse.json({ error: "Impossible de vérifier vos avis." }, { status: 503 });
  if (existing) {
    return NextResponse.json({ error: "Vous avez déjà évalué ce produit." }, { status: 409 });
  }

  const imageUrls = Array.isArray(input.image_urls)
    ? input.image_urls
      .filter((url): url is string => typeof url === "string" && /^https:\/\//.test(url))
      .slice(0, 5)
    : [];

  const baseInsert = {
    product_slug: productSlug,
    email: normalizedEmail,
    author_name: authorName,
    city: city || null,
    rating,
    title: title || null,
    body: reviewBody,
    color: color || null,
    image_url: imageUrls[0] ?? null,
    image_urls: imageUrls,
  };

  let { error: insertError } = await supabase.from("reviews").insert({
    ...baseInsert,
    user_id: user.id,
    order_id: deliveredOrder.id,
    verified_purchase: true,
  });

  if (insertError && isMissingReviewColumn(insertError)) {
    ({ error: insertError } = await supabase.from("reviews").insert(baseInsert));
  }
  if (insertError && /image_url/i.test(insertError.message ?? "")) {
    const { image_url: _imageUrl, image_urls: _imageUrls, ...legacyInsert } = baseInsert;
    void _imageUrl;
    void _imageUrls;
    ({ error: insertError } = await supabase.from("reviews").insert(legacyInsert));
  }
  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

  await broadcastAdminPushNotification({
    eventKey: `review:${productSlug}:${user.id}`,
    title: `Nouvel avis vérifié · ${rating}/5`,
    body: `${authorName} — ${reviewBody.replace(/\s+/g, " ").slice(0, 120)}`,
    url: "/admin/reviews/",
    tag: `admin-review-${productSlug}`,
  }).catch((error) => console.error("Admin review push failed:", error));

  return NextResponse.json({ success: true, verified_purchase: true }, { status: 201 });
}
