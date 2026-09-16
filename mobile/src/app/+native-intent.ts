function internalPath(value: string) {
  try {
    const url = value.includes("://")
      ? new URL(value)
      : new URL(value, "https://lecomax.com");
    const path = url.pathname.replace(/\/+$/, "") || "/";
    if (path.startsWith("/produit/")) {
      return `/product/${encodeURIComponent(decodeURIComponent(path.slice(9)))}${url.search}`;
    }
    if (path === "/suivre-commande" || path.startsWith("/commande/")) {
      return "/orders";
    }
    if (path === "/promotions") return "/catalog?promotion=true&sort=low";
    if (path === "/nouveautes") return "/catalog?sort=new";
    return `${path}${url.search}`;
  } catch {
    return "/";
  }
}

export function redirectSystemPath({
  path,
}: {
  path: string;
  initial: boolean;
}) {
  return internalPath(path);
}
