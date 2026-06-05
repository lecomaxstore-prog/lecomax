/**
 * Server-only Supabase helper.
 * Uses the service role key — NEVER import this from client components.
 */
import { createClient } from "@supabase/supabase-js";
import { apiToCard, type CardProduct } from "./products";

function getClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

type ApiProduct = {
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
};

export async function getDbProducts(options?: {
  category?: string;
  featured?: boolean;
  activeOnly?: boolean;
  limit?: number;
}): Promise<CardProduct[]> {
  try {
    const sb = getClient();
    let q = sb.from("products").select("*").order("created_at", { ascending: false });
    if (options?.category) q = q.eq("category", options.category);
    if (options?.featured) q = q.eq("featured", true);
    if (options?.activeOnly !== false) q = q.eq("active", true);
    if (options?.limit) q = q.limit(options.limit);
    const { data } = await q;
    return ((data as ApiProduct[]) ?? []).map(apiToCard);
  } catch {
    return [];
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
