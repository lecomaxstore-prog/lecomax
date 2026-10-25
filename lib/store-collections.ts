import { isNewArrivalEligible, type CardProduct } from "./products.ts";
import { selectBestsellers } from "./bestseller-eligibility.ts";

/** Preserve the homepage merchandising rules for every collection entry point. */
export function selectNewArrivals(products: CardProduct[]): CardProduct[] {
  const candidates = products.filter(p => p.active !== false && isNewArrivalEligible(p));
  const original = candidates.filter(p => p.badge === "Nouveau");
  const existing = original.length > 0 ? original : candidates;
  const future = candidates.filter(p => p.createdAt && Date.parse(p.createdAt) >= Date.parse("2026-09-15T10:14:41Z"));
  const slugs = new Set(future.map(p => p.slug));
  return [...future, ...existing.filter(p => !slugs.has(p.slug))].map(p => ({ ...p, badge: "Nouveau" }));
}

export function selectStoreBestsellers(products: CardProduct[]): CardProduct[] {
  const active = products.filter(p => p.active !== false);
  return selectBestsellers(active);
}
