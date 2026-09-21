// These pages load live account/cart/catalogue state in client components.
// Re-rendering their server shell every 30 seconds adds no fresh product data.
const CLIENT_DATA_ROUTES = new Set([
  "/connexion", "/inscription", "/mot-de-passe", "/panier", "/checkout",
  "/wishlist", "/merci", "/suivre-commande", "/nouveautes", "/bestsellers", "/promotions",
]);

export function needsStorefrontServerRefresh(pathname: string) {
  const path = pathname.replace(/\/+$/, "") || "/";
  return !CLIENT_DATA_ROUTES.has(path) && path !== "/compte" && !path.startsWith("/compte/");
}
