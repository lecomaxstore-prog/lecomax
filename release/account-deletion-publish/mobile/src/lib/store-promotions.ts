/** Shared merchandising rules. Promotions select products; product prices remain authoritative. */
type StorePromotion = { active?: boolean; expires_at?: string | null; product_ids?: string[] | null };
type StoreProduct = { id: string; active?: boolean; price: number; original_price?: number | null };

export function isActivePromotion(promotion: StorePromotion, now = Date.now()) {
  return promotion.active !== false && (!promotion.expires_at || Date.parse(promotion.expires_at) > now);
}

export function selectPromotionProducts<T extends StoreProduct>(
  products: readonly T[], promotions: readonly StorePromotion[], now = Date.now(),
): T[] {
  const selected = new Set(promotions.filter(p => isActivePromotion(p, now)).flatMap(p => p.product_ids ?? []));
  return products.filter(p => p.active !== false && (selected.has(p.id) || (p.original_price ?? 0) > p.price));
}
