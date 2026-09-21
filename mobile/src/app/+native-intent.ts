function internalPath(value: string) {
  try {
    const url = value.includes("://")
      ? new URL(value)
      : new URL(value, "https://lecomax.com");
    // In lecomax://auth, "auth" is the URL hostname, not its pathname.
    // Keep it as the route so OAuth callbacks reach the code-exchange screen.
    const route = url.protocol === "lecomax:" && url.hostname
      ? `/${url.hostname}${url.pathname}`
      : url.pathname;
    const path = route.replace(/\/+$/, "") || "/";
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
