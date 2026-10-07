/** Select paths only from known source files; arbitrary user paths use the protected source reader. */
export function tutorSourcePaths(text: string, topic: string, mode: string): string[] {
  const q = text.toLowerCase();
  const routes: [RegExp, string[]][] = [
    [/checkout|الدفع|إتمام الطلب/, ["app/checkout/page.tsx", "app/api/orders/route.ts"]],
    [/order|طلب|commandes/, ["app/api/orders/route.ts", "app/admin/orders/page.tsx"]],
    [/auth|login|تسجيل الدخول|connexion/, ["lib/admin-access.ts", "middleware.ts"]],
    [/customer|عميل|عملاء|زبون/, ["app/admin/customers/page.tsx"]],
    [/product|منتج|منتجات|produit/, ["app/produit/[slug]/page.tsx", "app/api/products/route.ts", "components/ProductCard.tsx"]],
    [/cart|panier|السلة/, ["app/panier/page.tsx"]],
    [/notif|إشعار|إشعارات/, ["lib/push-notifications.ts"]],
    [/deploy|vercel|نشر|environment|env\b/, ["next.config.js", "vercel.json"]],
    [/image|upload|صور|ملفات/, ["components/ProductCard.tsx"]],
  ];
  const projectQuestion = mode === "project" || /موقعي|مشروعي|متجري|my (project|site|shop)|mon (site|projet)|lecomax|l.écomax/i.test(q);
  if (!projectQuestion) return [];
  const match = routes.find(([pattern]) => pattern.test(q));
  if (match) return match[1];
  const defaults: Partial<Record<string, string[]>> = { react: ["components/ProductCard.tsx"], api: ["app/api/products/route.ts"], database: ["lib/supabase-server.ts"], auth: ["lib/admin-access.ts"], deployment: ["next.config.js"], commerce: ["app/checkout/page.tsx"] };
  return defaults[topic] ?? ["app/layout.tsx", "app/page.tsx"];
}

