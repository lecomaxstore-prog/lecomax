import type { CartLine, Product } from "@/types/commerce";

export type CartReconciliationResult = {
  cart: CartLine[];
  removed: CartLine[];
  adjusted: CartLine[];
};

function normalized(value?: string) {
  return value?.trim().toLocaleLowerCase("fr") ?? "";
}

function matchingValue<T>(record: Record<string, T> | undefined, key?: string) {
  if (!record || !key) return undefined;
  const target = normalized(key);
  const entry = Object.entries(record).find(([candidate]) => normalized(candidate) === target);
  return entry?.[1];
}

function includesValue(values: string[] | undefined, value?: string) {
  if (!value) return false;
  const target = normalized(value);
  return (values ?? []).some((candidate) => normalized(candidate) === target);
}

function sizeStockFromTags(tags: string[] | undefined, selectedSize?: string) {
  if (!selectedSize) return undefined;
  const target = normalized(selectedSize);
  for (const tag of tags ?? []) {
    if (!tag.startsWith("__sstock:")) continue;
    const parts = tag.slice("__sstock:".length).split(":");
    const quantity = Number(parts.pop());
    if (normalized(parts.join(":")) === target && Number.isFinite(quantity)) {
      return Math.max(0, quantity);
    }
  }
  return undefined;
}

export function cartLineAvailableStock(product: Product, line: CartLine) {
  const limits = [Math.max(0, Number(product.stock) || 0), 20];
  const colorEntries = Object.keys(product.color_stock ?? {});

  if (line.color && colorEntries.length > 0) {
    const colorStock = matchingValue(product.color_stock, line.color);
    if (colorStock === undefined) return 0;
    limits.push(Math.max(0, Number(colorStock) || 0));
  }

  const sizeStock = sizeStockFromTags(product.tags, line.size);
  if (sizeStock !== undefined) limits.push(sizeStock);
  return Math.min(...limits);
}

function variantIsAvailable(product: Product, line: CartLine) {
  if (line.color && includesValue(product.out_of_stock_colors, line.color)) return false;
  if (line.size && includesValue(product.out_of_stock_sizes, line.size)) return false;

  if (line.color && line.size) {
    const allowedSizes = matchingValue(product.color_sizes, line.color);
    if (allowedSizes?.length && !includesValue(allowedSizes, line.size)) return false;
  }

  return cartLineAvailableStock(product, line) > 0;
}

export function reconcileCartProducts(
  cart: CartLine[],
  authoritativeProducts: Product[],
): CartReconciliationResult {
  const active = authoritativeProducts.filter((product) => product.active !== false);
  const byId = new Map(active.map((product) => [product.id, product]));
  const bySlug = new Map(active.map((product) => [product.slug, product]));
  const nextCart: CartLine[] = [];
  const removed: CartLine[] = [];
  const adjusted: CartLine[] = [];

  for (const line of cart) {
    const product = byId.get(line.product.id) ?? bySlug.get(line.product.slug);
    if (!product || !variantIsAvailable(product, line)) {
      removed.push(line);
      continue;
    }

    const quantity = Math.min(line.quantity, cartLineAvailableStock(product, line));
    const refreshed = { ...line, product, quantity };
    nextCart.push(refreshed);
    if (quantity !== line.quantity) adjusted.push(refreshed);
  }

  return { cart: nextCart, removed, adjusted };
}
