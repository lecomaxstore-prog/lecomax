/** Shared refresh policy for the website and native app. */
export const STORE_REFRESH_INTERVAL_MS = 30_000;
export const STORE_REFRESH_EVENT = "lecomax:store-refresh";
export const STORE_TABLE_QUERIES = {
  products: ["products", "recommendations"],
  categories: ["categories"],
  promotions: ["promotions", "products"],
  banners: ["banners"],
  // Category media is stored in settings, alongside store preferences.
  settings: ["settings", "categories", "recommendations"],
  reviews: ["reviews", "products"],
} as const;
