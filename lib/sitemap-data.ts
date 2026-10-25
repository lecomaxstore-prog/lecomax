import "server-only";
import { createPublicSupabaseClient } from "./supabase-server";

export const SITEMAP_PAGE_SIZE = 1000;
export function xmlEscape(value: string): string {
  return value.replace(/[<>&'\"]/g, c => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!);
}
export function sitemapDb() {
  return createPublicSupabaseClient(["storefront-products", "storefront-categories", "storefront-pages", "storefront-ecomedia", "storefront-seo"], 300);
}
export const sitemapTables = {
  products: { table: "products", active: "active", prefix: "/produit/" },
  categories: { table: "categories", active: "active", prefix: "/" },
  pages: { table: "pages", active: "active", prefix: "/" },
  posts: { table: "ecomedia_posts", active: "is_published", prefix: "/ecomedia/" },
} as const;
export type SitemapKind = keyof typeof sitemapTables;
