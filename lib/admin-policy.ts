/** null = any active administrator; undefined = owner only. */
export function adminApiPermission(pathname: string, method: string): string | null | undefined {
  const path = pathname.replace(/\/$/, "");
  const read = method === "GET" || method === "HEAD";
  if (path === "/api/admin/staff/permissions" || path === "/api/admin/push-subscribe") return null;
  if (path === "/api/admin/dashboard") return null; // handler filters metrics by permission
  if (path === "/api/admin/approvals") return null; // handler restricts ownership
  if (path.startsWith("/api/admin/approvals/")) return undefined;
  if (/^\/api\/products(?:\/|$)/.test(path)) return read ? "products.view" : method === "DELETE" ? "products.delete" : method === "POST" ? "products.create" : "products.edit";
  if (/^\/api\/orders(?:\/|$)/.test(path)) return read ? "orders.view" : "orders.edit";
  if (path.startsWith("/api/admin/support")) return read ? "messages.view" : "messages.reply";
  const areas: Record<string, string> = {
    settings: "settings.edit", categories: "categories.edit", banners: "banners.edit", pages: "pages.edit",
    shipping: "shipping.edit", promotions: "promotions.edit", coupons: "promotions.edit", ads: "ads.edit",
    announcements: "announcement.edit", "size-guide": "size-guide.edit", newsletter: "newsletter.edit",
    returns: "returns.edit", reviews: "reviews.edit", "trustpilot-featured": "reviews.edit",
    media: "media.manage", upload: "media.manage", "upload-media": "media.manage", customers: "customers.view",
    "abandoned-carts": "carts.view", messages: read ? "messages.view" : "messages.reply",
    "ai-product": "products.create", "ai-reply": "messages.reply", "ai-review": "reviews.edit",
    "ai-broadcast": "broadcast.send", "send-confirmation": "orders.edit",
  };
  if (path.startsWith("/api/admin/")) {
    const section = path.split("/")[3];
    return ({ staff: "staff.manage", roles: "roles.manage", "checkout-settings": "settings.edit", "app-releases": "settings.edit", "mobile-campaigns": "push.send", "mobile-audience": "push.send", "push-test": "push.send" } as Record<string,string>)[section];
  }
  return areas[path.split("/")[2]];
}

export function hasAdminPermission(access: { owner: boolean; permissions: string[] } | null, permission: string | null | undefined) {
  return Boolean(access && (access.owner || permission === null || (permission !== undefined && access.permissions.includes(permission))));
}
