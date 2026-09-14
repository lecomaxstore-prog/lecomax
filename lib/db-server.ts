/**
 * Server-only Supabase helper.
 * Uses the service role key — NEVER import this from client components.
 */
import { apiToCard, type CardProduct } from "./products";
import { createServerSupabaseClient } from "./supabase-server";
import { selectPromotionProducts } from "@/mobile/src/lib/store-promotions";

function getClient() {
  return createServerSupabaseClient();
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

export async function getDbProducts(options?: {
  category?: string;
  featured?: boolean;
  activeOnly?: boolean;
  promotionOnly?: boolean;
  limit?: number;
}): Promise<CardProduct[]> {
  try {
    const sb = getClient();
    let q = sb.from("products").select("*").order("created_at", { ascending: false });
    if (options?.category) q = q.eq("category", options.category);
    if (options?.featured) q = q.eq("featured", true);
    if (options?.activeOnly !== false) q = q.eq("active", true);
    if (options?.limit && !options.promotionOnly) q = q.limit(options.limit);
    const [{ data, error }, promotions] = await Promise.all([
      q,
      options?.promotionOnly ? sb.from("promotions").select("active,expires_at,product_ids") : Promise.resolve(null),
    ]);
    if (error || promotions?.error) return [];
    const products = (data as ApiProduct[]) ?? [];
    const selected = options?.promotionOnly ? selectPromotionProducts(products, promotions?.data ?? []) : products;
    return (options?.limit ? selected.slice(0, options.limit) : selected).map(apiToCard);
  } catch {
    return [];
  }
}

/** Fetch average rating + count per product slug from the reviews table. */
export async function getReviewStats(): Promise<Record<string, { rating: number; count: number }>> {
  try {
    const sb = getClient();
    const { data } = await sb.from("reviews").select("product_slug,rating").eq("verified_purchase", true);
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
  } catch {
    return {};
  }
}

/** Returns the raw API product (all fields) for the product detail page. */
export async function getDbProductRaw(slug: string): Promise<ApiProduct | null> {
  try {
    const sb = getClient();
    const { data } = await sb.from("products").select("*").eq("slug", slug).maybeSingle();
    return (data as ApiProduct) ?? null;
  } catch {
    return null;
  }
}
