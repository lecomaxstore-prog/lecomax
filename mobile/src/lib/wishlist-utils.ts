import { selectedInventory } from "./purchasability.ts";
import type { Product } from "../types/commerce";

export type WishlistSort =
  "recommended" | "price-asc" | "price-desc" | "newest" | "rating";

export type WishlistVariant = {
  color?: string;
  size?: string;
};

export function mergeWishlistEntries(remote: string[], local: string[]) {
  return [...new Set([...remote, ...local].filter(Boolean))];
}

export function filterWishlistProducts(
  products: Product[],
  inStockOnly: boolean,
) {
  return inStockOnly
    ? products.filter((product) => product.active && product.stock > 0)
    : products;
}

export function availableColors(product: Product) {
  if (product.preorder_enabled) return product.colors ?? [];
  const unavailable = new Set(product.out_of_stock_colors ?? []);
  return (product.colors ?? []).filter(
    (color) =>
      !unavailable.has(color) &&
      (!Number.isFinite(Number(product.color_stock?.[color])) ||
        Number(product.color_stock?.[color]) > 0),
  );
}

export function availableSizes(product: Product, color?: string) {
  if (product.preorder_enabled) return (product.sizes ?? []).filter(size => selectedInventory(product,color,size)>=0);
  const unavailable = new Set(product.out_of_stock_sizes ?? []);
  const sizes =
    (color && product.color_sizes?.[color]?.length
      ? product.color_sizes[color]
      : product.sizes) ?? [];
  return sizes.filter((size) => !unavailable.has(size));
}

export function requiresWishlistVariant(product: Product) {
  return (
    availableColors(product).length > 0 ||
    availableSizes(product).some(
      (size) => size.trim().toLowerCase() !== "taille unique",
    )
  );
}

export function defaultWishlistVariant(
  product: Product,
  saved?: WishlistVariant,
): WishlistVariant {
  const colors = availableColors(product);
  const color =
    saved?.color && colors.includes(saved.color) ? saved.color : colors[0];
  const sizes = availableSizes(product, color);
  const size =
    saved?.size && sizes.includes(saved.size) ? saved.size : sizes[0];
  return { color, size };
}

export function isWishlistVariantAvailable(
  product: Product,
  selection?: WishlistVariant,
) {
  if ((!product.preorder_enabled && product.stock <= 0) || product.active === false) return false;
  const colors = availableColors(product);
  if (
    colors.length > 0 &&
    (!selection?.color || !colors.includes(selection.color))
  ) {
    return false;
  }
  const sizes = availableSizes(product, selection?.color);
  const requiresSize = sizes.some(
    (size) => size.trim().toLowerCase() !== "taille unique",
  );
  return (
    !requiresSize || Boolean(selection?.size && sizes.includes(selection.size))
  );
}

export function sortWishlistProducts(
  products: Product[],
  sort: WishlistSort,
  recommendationSlugs: string[] = [],
) {
  const recommendationOrder = new Map(
    recommendationSlugs.map((slug, index) => [slug, index]),
  );
  return [...products].sort((left, right) => {
    if (sort === "price-asc") return left.price - right.price;
    if (sort === "price-desc") return right.price - left.price;
    if (sort === "newest") {
      return (
        (Date.parse(right.created_at) || 0) - (Date.parse(left.created_at) || 0)
      );
    }
    if (sort === "rating") {
      return (
        Number(right.rating ?? 0) - Number(left.rating ?? 0) ||
        Number(right.review_count ?? 0) - Number(left.review_count ?? 0)
      );
    }
    return (
      (recommendationOrder.get(left.slug) ?? Number.MAX_SAFE_INTEGER) -
        (recommendationOrder.get(right.slug) ?? Number.MAX_SAFE_INTEGER) ||
      Number(right.featured ?? false) - Number(left.featured ?? false) ||
      (Date.parse(right.created_at) || 0) - (Date.parse(left.created_at) || 0)
    );
  });
}

export function splitWishlistEntries(entries: string[], products: Product[]) {
  const byId = new Map(products.map((product) => [product.id, product]));
  const available: Product[] = [];
  const removed: string[] = [];
  for (const entry of entries) {
    const product = byId.get(entry);
    if (product) available.push(product);
    else removed.push(entry);
  }
  return { available, removed };
}
