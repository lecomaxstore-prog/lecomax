import { selectedInventory, preorderSnapshot } from "./purchasability.ts";
import type { CartLine, Product } from "@/types/commerce";

export type CartReconciliationResult = {
  cart: CartLine[];
  removed: CartLine[];
  adjusted: CartLine[];
};

export function cartLineAvailableStock(product: Product, line: CartLine) {
  const canonical = (values: string[] | undefined, value?: string) =>
    values?.find(candidate => candidate.trim().toLowerCase() === value?.trim().toLowerCase()) ?? value;
  const physical = selectedInventory(product,canonical(product.colors,line.color),canonical(product.sizes,line.size));
  return physical < 0 ? 0 : product.preorder_enabled ? 20 : Math.min(20,physical);
}

function variantIsAvailable(product: Product, line: CartLine) {
  if (!product.preorder_enabled) {
    if (line.color && product.out_of_stock_colors?.some(value=>value.toLowerCase()===line.color?.toLowerCase())) return false;
    if (line.size && product.out_of_stock_sizes?.some(value=>value.toLowerCase()===line.size?.toLowerCase())) return false;
    const sizes = line.color ? product.color_sizes?.[line.color] : undefined;
    if (line.size && sizes?.length && !sizes.includes(line.size)) return false;
  }
  return cartLineAvailableStock(product,line)>0;
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

    const canonical = (values: string[] | undefined, value?: string) => values?.find(candidate => candidate.trim().toLowerCase() === value?.trim().toLowerCase()) ?? value;
    const color = canonical(product.colors, line.color);
    const size = canonical(product.sizes, line.size);
    const quantity = Math.min(line.quantity, cartLineAvailableStock(product, line));
    const pricing = color ? product.color_prices?.[color] : undefined;
    const pricedProduct = pricing ? { ...product, price: pricing.price, original_price: pricing.originalPrice ?? null } : product;
    const refreshed = { ...line, color, size, product: pricedProduct, quantity, ...preorderSnapshot(product,selectedInventory(product,color,size),quantity) };
    nextCart.push(refreshed);
    if (quantity !== line.quantity || pricedProduct.price !== line.product.price || refreshed.fulfillment_type !== (line.fulfillment_type ?? "STANDARD") || refreshed.preorder_estimated_at !== (line.preorder_estimated_at ?? null) || refreshed.preorder_message !== (line.preorder_message ?? null)) adjusted.push(refreshed);
  }

  return { cart: nextCart, removed, adjusted };
}
