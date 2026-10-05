import { selectNewArrivals, selectStoreBestsellers } from "./store-collections";
/**
 * Server-only Supabase helper.
 * Uses the service role key — NEVER import this from client components.
 */
import { apiToCard, type CardProduct } from "./products";
import { cache } from "react";
import { createPublicSupabaseClient } from "./supabase-server";
import { selectPromotionProducts } from "@/mobile/src/lib/store-promotions";

function getClient() {
  return createPublicSupabaseClient(["storefront-products"]);
}

type ApiProduct = {
  preorder_enabled?: boolean;
  preorder_estimated_at?: string | null;
  preorder_message?: string | null;
  color_stock?: Record<string, number> | null;
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  original_price: number | null;
  description: string | null;
  images: string[] | null;
  colors: string[] | null;
  sizes: string[] | null;
  featured: boolean;
  brand: string | null;
  stock: number;
  active: boolean;
  created_at: string;
  tags: string[] | null;
  video: string | null;
  description_images: string[] | null;
};

// Primitive arguments share one query between homepage rails and metadata/page renders.
const getProductRows = cache(async (category?: string, featured?: boolean, activeOnly = true) => {
  let query = getClient().from("products").select("*").order("created_at", { ascending: false });
  if (category) query = query.eq("category", category);
  if (featured) query = query.eq("featured", true);
  if (activeOnly) query = query.eq("active", true);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as ApiProduct[];
});

export async function getDbProducts(options?: {
  category?: string;
  featured?: boolean;
  activeOnly?: boolean;
  promotionOnly?: boolean;
  throwOnError?: boolean;
  limit?: number;
}): Promise<CardProduct[]> {
  try {
    const [products, promotions] = await Promise.all([
      getProductRows(options?.category, options?.featured, options?.activeOnly !== false),
      // Keep this schema tolerant: older deployments do not expose product_ids.
      options?.promotionOnly ? createPublicSupabaseClient(["storefront-promotions"]).from("promotions").select("*") : Promise.resolve(null),
    ]);
    if (promotions?.error) throw promotions.error;
    const selected = options?.promotionOnly ? selectPromotionProducts(products, promotions?.data ?? []) : products;
    return (options?.limit ? selected.slice(0, options.limit) : selected).map(apiToCard);
  } catch (error) {
    if (options?.throwOnError) throw error;
    return [];
  }
}

/** Fetch average rating + count per product slug from the reviews table. */
const loadReviewStats = async (): Promise<Record<string, { rating: number; count: number }>> => {
    const sb = createPublicSupabaseClient(["storefront-reviews"]);
    const { data, error } = await sb.from("reviews").select("product_slug,rating").eq("verified_purchase", true);
    if (error) throw error;
    if (!data || data.length === 0) return {};
    const acc: Record<string, { sum: number; count: number }> = {};
    for (const r of data as { product_slug: string; rating: number }[]) {
      if (!acc[r.product_slug]) acc[r.product_slug] = { sum: 0, count: 0 };
      acc[r.product_slug].sum += r.rating;
      acc[r.product_slug].count++;
    }
    return Object.fromEntries(
      Object.entries(acc).map(([slug, { sum, count }]) => [
        slug,
        { rating: Math.round((sum / count) * 10) / 10, count },
      ])
    );
};

// Cache successful HTTP reads, keeping failures within the caller's fallback
// instead of throwing from an unstable_cache background refresh.
export const getReviewStats = cache(async () => {
  try { return await loadReviewStats(); } catch { return {}; }
});

export const getProductReviewStats = cache(async (slug: string) => {
  const stats = await getReviewStats();
  return stats[slug] ?? { rating: 0, count: 0 };
});

export async function getPublicProductSlugs() {
  const { data, error } = await getClient().from("products").select("slug").eq("active", true);
  if (error) return [];
  return (data ?? []) as { slug: string }[];
}

/** Returns the raw API product (all fields) for the product detail page. */
export const getDbProductRaw = cache(async (slug: string): Promise<ApiProduct | null> => {
  const sb = getClient();
  const { data, error } = await sb.from("products").select("*").eq("slug", slug).maybeSingle();
  // Throw on outages so ISR keeps the last good page/image instead of caching a 404.
  if (error) throw error;
  return (data as ApiProduct) ?? null;
});

/** Shared server source; failures must not masquerade as empty collections. */
export async function getStoreCollection(kind: "promotions" | "nouveautes" | "bestsellers") {
  const products = await getDbProducts({ activeOnly: true, promotionOnly: kind === "promotions", throwOnError: true });
  return kind === "nouveautes" ? selectNewArrivals(products) : kind === "bestsellers" ? selectStoreBestsellers(products) : products;
}
