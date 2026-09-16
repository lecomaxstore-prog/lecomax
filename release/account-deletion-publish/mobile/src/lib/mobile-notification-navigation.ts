import { router } from "expo-router";

export function openMobileNotificationLink(value: unknown) {
  if (typeof value !== "string" || value.includes("://") || value.includes("..")) return;
  const [pathname, query = ""] = value.split("?", 2);
  const params = Object.fromEntries(new URLSearchParams(query));
  if (pathname === "/" || pathname === "/catalog" || pathname === "/search" || pathname === "/wishlist" || pathname === "/cart" || pathname === "/account" || pathname === "/orders" || pathname === "/notifications") {
    router.push({ pathname, params });
    return;
  }
  if (pathname.startsWith("/product/")) {
    const slug = pathname.slice("/product/".length);
    if (slug) router.push({ pathname: "/product/[slug]", params: { ...params, slug } });
    return;
  }
  if (pathname.startsWith("/info/")) {
    const topic = pathname.slice("/info/".length);
    if (topic) router.push({ pathname: "/info/[topic]", params: { ...params, topic } });
  }
}
