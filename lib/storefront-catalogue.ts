/** Shared category rules for live catalogue counts and shop filtering. */
type CategorizedProduct = { category?: string | null; active?: boolean };

export function normalizeCategory(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

export function filterCategoryProducts<T extends CategorizedProduct>(products: readonly T[], category: string) {
  const selected = normalizeCategory(category);
  return products.filter(product => product.active !== false &&
    (selected === "all" || normalizeCategory(product.category) === selected));
}

export function categoryProductCounts(products: readonly CategorizedProduct[]) {
  const counts = new Map<string, number>();
  for (const product of filterCategoryProducts(products, "all")) {
    const category = normalizeCategory(product.category);
    if (category) counts.set(category, (counts.get(category) ?? 0) + 1);
  }
  return Object.fromEntries(counts);
}

/** Campaign percentages are not prices; only actual active product savings count. */
export function maximumProductDiscount(products: readonly { price: number; oldPrice?: number; active?: boolean }[]) {
  let maximum = 0;
  for (const { price, oldPrice, active } of products) {
    if (active === false || !Number.isFinite(price) || !Number.isFinite(oldPrice) ||
      price < 0 || !oldPrice || oldPrice <= price) continue;
    maximum = Math.max(maximum, Math.round((1 - price / oldPrice) * 100));
  }
  return maximum;
}
