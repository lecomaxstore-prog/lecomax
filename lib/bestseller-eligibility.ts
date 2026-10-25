type BestsellerProduct = { name: string; slug: string };

/** Owner-curated selection, in storefront display order. */
export const BESTSELLER_SLUGS = [
  "a-genai-tws-hd",
  "a-lenovo-lp40-pro-ecouteurs",
  "a-lenovo-gm2-pro-ecouteurs",
  "a-sac-banane-pu-polyvalent",
] as const;

export function isBestsellerEligible(product: BestsellerProduct): boolean {
  return BESTSELLER_SLUGS.some((slug) => slug === product.slug);
}

/** Select only available catalogue entries; never fill gaps with other products. */
export function selectBestsellers<T extends BestsellerProduct>(catalogue: T[]): T[] {
  return BESTSELLER_SLUGS.flatMap((slug) => {
    const product = catalogue.find((entry) => entry.slug === slug);
    return product ? [product] : [];
  });
}
