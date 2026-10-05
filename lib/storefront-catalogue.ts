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
