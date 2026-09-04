export type NavigationParams = Record<
  string,
  string | string[] | undefined
>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function normalizePath(pathname: string) {
  const path = pathname.split(/[?#]/, 1)[0]?.replace(/\/+$/, "") || "/";
  return path || "/";
}

export function isHomepagePath(pathname: string) {
  const path = normalizePath(pathname);
  return path === "/" || path === "/(tabs)";
}

export function safeParentPath(
  pathname: string,
  params: NavigationParams = {},
) {
  const path = normalizePath(pathname);
  const origin = first(params.origin);

  if (path.startsWith("/product/")) {
    if (origin === "search") return "/search";
    if (origin === "wishlist") return "/wishlist";
    if (origin === "promotion") return "/catalog?sort=low";
    const category = first(params.parentCategory);
    return category
      ? `/catalog?category=${encodeURIComponent(category)}`
      : "/";
  }
  if (path === "/checkout") return "/cart";
  if (path === "/support-chat") return "/support";
  if (path === "/support") return "/account";
  if (path === "/order-confirmation" || path === "/orders") return "/account";
  if (path === "/addresses" || path === "/profile" || path === "/auth") {
    return "/account";
  }
  if (path === "/scanner" || path === "/notifications") return "/";
  if (path.startsWith("/info/")) return "/account";
  return "/";
}
