type BestsellerProduct = { name: string; slug: string };

/** These products remain available in the shop, outside bestseller collections. */
export function isBestsellerEligible(product: { name: string; slug: string }): boolean {
  return !/play[\s-]*station|\bps[\s-]*5\b|\bnike\b/i.test(`${product.name} ${product.slug}`);
}

/** Put the live GENAI product in Nike's former slot without duplicating it. */
export function selectBestsellers<T extends BestsellerProduct>(catalogue: T[], preferred: T[]): T[] {
  const genai = catalogue.find((product) => /\bgenai\b/i.test(`${product.name} ${product.slug}`));
  const nikeIndex = preferred.findIndex((product) => /\bnike\b/i.test(`${product.name} ${product.slug}`));
  const selected = preferred.filter((product) => isBestsellerEligible(product) && product.slug !== genai?.slug);
  if (genai) selected.splice(Math.min(nikeIndex >= 0 ? nikeIndex : 1, selected.length), 0, genai);
  return selected;
}
