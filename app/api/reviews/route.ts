import { publicDatabaseError } from "@/lib/public-error";
import { readJsonLimited } from "@/lib/request-body";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { broadcastAdminPushNotification } from "@/lib/push-notifications";
import { resolveReviewPurchase } from "@/lib/review-purchase";
import { enforceRateLimit } from "@/lib/api-security";
import { getCustomerUser, isAdminRequest } from "@/lib/request-auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value
        .replace(/[<>\u0000-\u001F\u007F]/g, "")
        .trim()
        .slice(0, maxLength)
    : "";
}

function isMissingReviewColumn(
  error: { message?: string; code?: string } | null,
) {
  return Boolean(
    error &&
    (error.code === "42703" ||
      error.code === "PGRST204" ||
      /verified_purchase|user_id|order_id|image_urls|image_url/i.test(
        error.message ?? "",
      )),
  );
}

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");

  if (!slug) {
    if (!(await isAdminRequest(req))) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    }
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .order("created_at", { ascending: false });
    if (error)
      return NextResponse.json({ error: publicDatabaseError(error) }, { status: 500 });
    return NextResponse.json(data);
  }

  const primaryResult = await supabase
    .from("reviews")
    .select(
      "id, author_name, city, rating, title, body, color, created_at, image_url, image_urls, verified_purchase, admin_reply",
    )
    .eq("product_slug", slug)
    .order("created_at", { ascending: false });
  let data = primaryResult.data as Record<string, unknown>[] | null;
  let error = primaryResult.error;

  if (error && isMissingReviewColumn(error)) {
    const fallbackResult = await supabase
      .from("reviews")
      .select(
        "id, author_name, city, rating, title, body, color, created_at, image_url",
      )
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

  if (error)
    return NextResponse.json({ error: publicDatabaseError(error) }, { status: 500 });
  return NextResponse.json({
    reviews: (data ?? [])
      .filter((review) => review.verified_purchase === true)
      .map((review) => ({
        ...review,
        verified_purchase: review.verified_purchase === true,
      })),
  });
}

export async function POST(req: NextRequest) {
  const limited = enforceRateLimit(req, "review-submit", 10, 15 * 60_000);
  if (limited) return limited;
  const user = await getCustomerUser(req);

  const { data: featureSetting } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "enable_reviews")
    .maybeSingle();
  if (featureSetting?.value === "false") {
    return NextResponse.json(
      { error: "Les avis sont temporairement désactivés." },
      { status: 403 },
    );
  }

  let input: Record<string, unknown>;
  try {
    input = (await readJsonLimited(req)) as Record<string, unknown>;
    if (!input || typeof input !== "object" || Array.isArray(input))
      throw new Error("Invalid body");
  } catch {
    return NextResponse.json(
      { error: "Corps JSON invalide." },
      { status: 400 },
    );
  }

  const productSlug = cleanText(input.product_slug, 160);
  const rating = Number(input.rating);
  const reviewBody = cleanText(input.review_body, 1200);
  const title = cleanText(input.title, 100);
  const city = cleanText(input.city, 80);
  const color = cleanText(input.color, 50);
  if (
    !productSlug ||
    !Number.isInteger(rating) ||
    rating < 1 ||
    rating > 5 ||
    reviewBody.length < 20
  ) {
    return NextResponse.json(
      {
        error:
          "Choisissez une note et rédigez un avis d’au moins 20 caractères.",
      },
      { status: 400 },
    );
  }

  let purchase;
  try {
    purchase = await resolveReviewPurchase(supabase, productSlug, user, input);
  } catch {
    return NextResponse.json(
      { error: "Impossible de vérifier votre achat." },
      { status: 503 },
    );
  }
  if (!purchase.order) {
    const messages = {
      signed_out:
        "Connectez-vous ou vérifiez votre commande avec votre téléphone ou e-mail.",
      not_ordered:
        "Vérifiez le numéro de commande et le téléphone ou l’e-mail utilisé pour cet achat.",
      not_delivered:
        "Vous pourrez laisser un avis lorsque votre commande aura été livrée.",
      already_reviewed: "Vous avez déjà évalué ce produit pour cette commande.",
      verified_purchase: "Impossible de vérifier votre achat.",
    };
    return NextResponse.json(
      { error: messages[purchase.reason], reason: purchase.reason },
      { status: purchase.reason === "already_reviewed" ? 409 : 403 },
    );
  }
  const deliveredOrder = purchase.order;
  const normalizedEmail = String(deliveredOrder.customer.email ?? "")
    .trim()
    .toLowerCase();
  const authorName =
    cleanText(input.author_name, 60) ||
    cleanText(
      String(deliveredOrder.customer.name ?? "Client").split(" ")[0],
      60,
    ) ||
    "Client";

  const imageUrls = Array.isArray(input.image_urls)
    ? input.image_urls
        .filter(
          (url): url is string =>
            typeof url === "string" && /^https:\/\//.test(url),
        )
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

  const { error: insertError } = await supabase.from("reviews").insert({
    ...baseInsert,
    user_id: purchase.guest ? null : user?.id,
    order_id: deliveredOrder.id,
    verified_purchase: true,
  });

  if (insertError?.code === "23505")
    return NextResponse.json(
      {
        error: "Vous avez déjà évalué ce produit.",
        reason: "already_reviewed",
      },
      { status: 409 },
    );
  if (insertError)
    return NextResponse.json(
      { error: "Votre avis n’a pas pu être enregistré. Réessayez." },
      { status: 503 },
    );

  await broadcastAdminPushNotification({
    eventKey: `review:${productSlug}:${deliveredOrder.id}`,
    title: `Nouvel avis vérifié · ${rating}/5`,
    body: `${authorName} — ${reviewBody.replace(/\s+/g, " ").slice(0, 120)}`,
    url: "/admin/reviews/",
    tag: `admin-review-${productSlug}`,
  }).catch((error) => console.error("Admin review push failed:", error));

  return NextResponse.json(
    { success: true, verified_purchase: true },
    { status: 201 },
  );
}
