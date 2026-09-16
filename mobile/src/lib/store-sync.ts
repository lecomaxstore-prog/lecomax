/** Shared refresh policy for the website and native app. */
export const STORE_REFRESH_INTERVAL_MS = 30_000;
export const STORE_REFRESH_EVENT = "lecomax:store-refresh";
/** Refresh on entry, resume, reconnect, and while the screen stays open. */
export const LIVE_QUERY_OPTIONS = {
  staleTime: 0,
  refetchOnMount: "always",
  refetchOnWindowFocus: "always",
  refetchInterval: STORE_REFRESH_INTERVAL_MS,
  refetchOnReconnect: true,
} as const;
export const STORE_TABLE_QUERIES = {
  products: ["products", "recommendations"],
  categories: ["categories"],
  promotions: ["promotions", "products"],
  banners: ["banners"],
  // Category media is stored in settings, alongside store preferences.
  settings: ["settings", "categories", "recommendations", "size-guide"],
  reviews: ["reviews", "products"],
} as const;
