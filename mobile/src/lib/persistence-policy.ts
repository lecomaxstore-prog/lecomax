const PUBLIC_QUERY_ROOTS = new Set([
  "products",
  "categories",
  "promotions",
  "settings",
  "recommendations",
  "banners",
  "reviews",
  "product-translations",
]);

export const QUERY_CACHE_BUSTER = "public-catalog-v4-shared-availability";

export function isPublicPersistedQuery(queryKey: readonly unknown[]) {
  const root = queryKey[0];
  return typeof root === "string" && PUBLIC_QUERY_ROOTS.has(root);
}
