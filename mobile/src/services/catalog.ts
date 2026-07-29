import { ApiError, apiRequest, apiRequestValidated } from "@/lib/api-client";
import { supabase } from "@/lib/supabase";
import catalogSnapshot from "@/data/catalog.snapshot.json";
import { z } from "zod";
import type {
  Banner,
  Category,
  Product,
  Promotion,
  Review,
  Setting,
} from "@/types/commerce";
import { colorPricesFromTags } from "@/lib/product-variant-pricing";

const nullableText = z.string().nullable().optional();
const productResponseSchema = z
  .object({
    id: z.string().min(1),
    slug: z.string().min(1),
    name: z.string().min(1),
    category: z.string(),
    price: z.number().finite().nonnegative(),
    original_price: z.number().finite().nonnegative().nullable(),
    description: z.string().nullable(),
    images: z.array(z.string()),
    stock: z.number().finite().nonnegative(),
    active: z.boolean(),
    created_at: z.string().min(1),
    colors: z.array(z.string()).optional(),
    sizes: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    color_stock: z
      .record(z.string(), z.number().finite().nonnegative())
      .nullable()
      .optional(),
    color_sizes: z.record(z.string(), z.array(z.string())).optional(),
    out_of_stock_colors: z.array(z.string()).optional(),
    out_of_stock_sizes: z.array(z.string()).optional(),
    brand: z.string().nullable().optional(),
    sku: z.string().nullable().optional(),
    barcode: z.string().nullable().optional(),
    video: z.string().nullable().optional(),
    featured: z.boolean().optional(),
  })
  .passthrough()
  .transform((value) => value as Product);

const categoryResponseSchema = z
  .object({
    id: z.string().min(1),
    slug: z.string().min(1),
    label: z.string().min(1),
    image: z.string().nullable(),
    image_mobile: nullableText,
    image_desktop: nullableText,
    active: z.boolean(),
    sort_order: z.number().finite(),
  })
  .passthrough()
  .transform((value) => value as Category);

const promotionResponseSchema = z
  .object({
    id: z.string().min(1),
    label: z.string(),
    product_ids: z.array(z.string()),
    discount_percent: z.number().finite().nullable(),
    expires_at: z.string().nullable(),
    active: z.boolean().optional(),
  })
  .passthrough()
  .transform((value) => value as Promotion & { active?: boolean });

const settingResponseSchema = z.object({
  key: z.string().min(1),
  value: z.string(),
});

function normalizeProduct(product: Product): Product {
  const rawColorStock =
    product.color_stock && typeof product.color_stock === "object"
      ? product.color_stock
      : {};
  const tags = Array.isArray(product.tags) ? product.tags : [];
  const colors =
    Array.isArray(product.colors) && product.colors.length
      ? product.colors
      : Object.keys(rawColorStock);
  const normalizedStockEntries = new Map(
    Object.entries(rawColorStock).map(([color, quantity]) => [
      color.trim().toLocaleLowerCase("fr"),
      Number(quantity),
    ]),
  );
  const colorStock = Object.keys(rawColorStock).length > 0
    ? {
        ...rawColorStock,
        ...Object.fromEntries(
          colors.map((color) => [
            color,
            normalizedStockEntries.get(color.trim().toLocaleLowerCase("fr")) ?? 0,
          ]),
        ),
      }
    : {};
  const taggedOutOfStockColors = tags
    .filter((tag) => tag.startsWith("__oos:"))
    .map((tag) => tag.slice("__oos:".length));
  const stockOutOfStockColors = Object.entries(colorStock)
    .filter(([, quantity]) => Number(quantity) <= 0)
    .map(([color]) => color);
  const sizeStock = new Map<string, number>();
  for (const tag of tags.filter((value) => value.startsWith("__sstock:"))) {
    const parts = tag.slice("__sstock:".length).split(":");
    const quantity = Number(parts.pop());
    const size = parts.join(":");
    if (size && Number.isInteger(quantity) && quantity >= 0) {
      sizeStock.set(size, quantity);
    }
  }
  const sizes =
    Array.isArray(product.sizes) && product.sizes.length ? product.sizes : [];

  return {
    ...product,
    images: Array.isArray(product.images) ? product.images.filter(Boolean) : [],
    colors,
    sizes,
    color_stock: colorStock,
    color_prices: colorPricesFromTags(tags),
    color_sizes: product.color_sizes,
    out_of_stock_colors: Object.keys(rawColorStock).length > 0
      ? stockOutOfStockColors
      : [...new Set([
          ...(product.out_of_stock_colors ?? []),
          ...taggedOutOfStockColors,
        ])],
    out_of_stock_sizes: product.out_of_stock_sizes?.length
      ? product.out_of_stock_sizes
      : sizeStock.size > 0
        ? sizes.filter((size) => (sizeStock.get(size) ?? 0) <= 0)
        : [],
    tags,
    price: Number(product.price) || 0,
    original_price:
      product.original_price === null
        ? null
        : Number(product.original_price) || null,
    stock: Math.max(0, Number(product.stock) || 0),
    rating: Number(product.rating) || 0,
    review_count: Number(product.review_count) || 0,
    newArrival:
      product.newArrival ??
      (Number.isFinite(Date.parse(product.created_at)) &&
        Date.parse(product.created_at) >=
          Date.now() - 45 * 24 * 60 * 60 * 1000),
    brand: product.brand || undefined,
    sku: product.sku || undefined,
    barcode: product.barcode || undefined,
    video: product.video || undefined,
  };
}

function fallbackUnlessAborted<T>(promise: Promise<T>, fallback: () => T) {
  return promise.catch((error) => {
    if (error instanceof ApiError && error.code === "REQUEST_ABORTED") throw error;
    return fallback();
  });
}

export async function getProducts(signal?: AbortSignal): Promise<Product[]> {
  const [data, reviewStats] = await Promise.all([
    fallbackUnlessAborted(apiRequestValidated(
      "/api/products?active=true",
      z.array(productResponseSchema),
      { signal },
    ), () => z.array(productResponseSchema).parse(catalogSnapshot.products)),
    fallbackUnlessAborted(apiRequest<Record<string, { rating: number; count: number }>>(
      "/api/reviews/stats",
      { signal },
    ), (): Record<string, { rating: number; count: number }> => ({})),
  ]);
  return [
    ...new Map(
      data
        .filter(
          (product) =>
            product?.active !== false && product?.id && product?.slug,
        )
        .map((product) => {
          const stats = reviewStats[product.slug];
          return [
            product.id,
            normalizeProduct({
              ...product,
              rating: stats?.rating ?? 0,
              review_count: stats?.count ?? 0,
            }),
          ];
        }),
    ).values(),
  ];
}

/** Live catalogue data only. Never falls back to the bundled snapshot. */
export async function getFreshProducts(signal?: AbortSignal): Promise<Product[]> {
  const data = await apiRequestValidated(
    "/api/products?active=true",
    z.array(productResponseSchema),
    { signal },
  );
  return [
    ...new Map(
      data
        .filter((product) => product.active !== false && product.id && product.slug)
        .map((product) => [product.id, normalizeProduct(product)]),
    ).values(),
  ];
}

export async function getFreshProduct(slug: string, signal?: AbortSignal) {
  const products = await getFreshProducts(signal);
  return products.find((product) => product.slug === slug) ?? null;
}

export async function getProduct(slug: string, signal?: AbortSignal): Promise<Product | null> {
  const products = await getProducts(signal);
  return products.find((item) => item.slug === slug) ?? null;
}

export async function getCategories(signal?: AbortSignal): Promise<Category[]> {
  const data = await fallbackUnlessAborted(apiRequestValidated(
    "/api/categories",
    z.array(categoryResponseSchema),
    { signal },
  ), () => z.array(categoryResponseSchema).parse(catalogSnapshot.categories));
  return data
    .filter(
      (category) =>
        category?.active !== false && category?.id && category?.slug,
    )
    .sort((a, b) => Number(a.sort_order) - Number(b.sort_order));
}

export async function getPromotions(signal?: AbortSignal): Promise<Promotion[]> {
  const data = await fallbackUnlessAborted(apiRequestValidated(
    "/api/promotions",
    z.array(promotionResponseSchema),
    { signal },
  ), () => z.array(promotionResponseSchema).parse(catalogSnapshot.promotions));
  return data.filter((promotion) => promotion.active !== false);
}

export async function getSettings(signal?: AbortSignal): Promise<Setting[]> {
  const data = await fallbackUnlessAborted(apiRequestValidated(
    "/api/settings",
    z.array(settingResponseSchema),
    { signal },
  ), () => z.array(settingResponseSchema).parse(catalogSnapshot.settings));
  return Array.isArray(data) ? data.filter((setting) => setting?.key) : [];
}

export async function getRecommendationSlugs(limit = 12, signal?: AbortSignal): Promise<string[]> {
  const result = await apiRequest<{ slugs?: unknown }>(
    `/api/recommendations?limit=${Math.max(4, Math.min(24, limit))}`,
    { signal },
  );
  return Array.isArray(result.slugs)
    ? result.slugs.filter(
        (slug): slug is string => typeof slug === "string" && Boolean(slug),
      )
    : [];
}

type ApiBanner = {
  id: string;
  title?: string | null;
  subtitle?: string | null;
  badge?: string | null;
  button_label?: string | null;
  button_href?: string | null;
  image_mobile?: string | null;
  image_desktop?: string | null;
  active?: boolean;
};

const bannerResponseSchema = z
  .object({
    id: z.string().min(1),
    title: nullableText,
    subtitle: nullableText,
    badge: nullableText,
    button_label: nullableText,
    button_href: nullableText,
    image_mobile: nullableText,
    image_desktop: nullableText,
    active: z.boolean().optional(),
  })
  .passthrough()
  .transform((value) => value as ApiBanner);

function mobileBannerHref(href?: string | null) {
  const value = href?.trim();
  if (!value || value === "/" || value === "/boutique") return "/catalog";
  if (value === "/nouveautes") return "/catalog?sort=new";
  if (value === "/promotions") return "/catalog?sort=low";
  if (/^\/(homme|femme|chaussures|accessoires)$/.test(value)) {
    return `/catalog?category=${encodeURIComponent(value.slice(1))}`;
  }
  return value;
}

export async function getBanners(signal?: AbortSignal): Promise<Banner[]> {
  const data = await apiRequestValidated(
    "/api/banners",
    z.array(bannerResponseSchema),
    { signal },
  );
  return data
    .filter(
      (banner) =>
        banner.active !== false &&
        banner.id &&
        (banner.image_mobile || banner.image_desktop),
    )
    .map((banner) => ({
      id: banner.id,
      eyebrow: banner.badge || "L’ECOMAX",
      title: banner.title || "",
      description: banner.subtitle || "",
      image: banner.image_mobile || banner.image_desktop || "",
      href: mobileBannerHref(banner.button_href),
      ctaLabel: banner.button_label || "DÉCOUVRIR",
      accent: "#32CD57",
    }));
}

export async function getReviews(slug: string, signal?: AbortSignal): Promise<Review[]> {
  try {
    const data = await apiRequest<{ reviews: Review[] }>(
      `/api/reviews?slug=${encodeURIComponent(slug)}`,
      { signal },
    );
    return data.reviews ?? [];
  } catch (error) {
    if (error instanceof ApiError && error.code === "REQUEST_ABORTED") throw error;
    return [];
  }
}

export type ReviewEligibilityReason =
  | "verified_purchase"
  | "signed_out"
  | "not_ordered"
  | "not_delivered"
  | "already_reviewed";

export type ReviewEligibility = {
  canReview: boolean;
  reason: ReviewEligibilityReason;
};

async function authenticatedHeaders() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : null;
}

export async function getReviewEligibility(
  slug: string,
): Promise<ReviewEligibility> {
  const headers = await authenticatedHeaders();
  if (!headers) return { canReview: false, reason: "signed_out" };
  return apiRequest<ReviewEligibility>(
    `/api/reviews/check?slug=${encodeURIComponent(slug)}`,
    { headers, authenticated: true },
  );
}

export async function submitVerifiedReview(input: {
  productSlug: string;
  rating: number;
  title?: string;
  body: string;
  color?: string;
}) {
  const headers = await authenticatedHeaders();
  if (!headers) throw new Error("Connectez-vous pour laisser un avis.");
  return apiRequest<{ success: true; verified_purchase: true }>(
    "/api/reviews",
    {
      method: "POST",
      headers,
      authenticated: true,
      body: JSON.stringify({
        product_slug: input.productSlug,
        rating: input.rating,
        title: input.title,
        review_body: input.body,
        color: input.color,
      }),
    },
  );
}
