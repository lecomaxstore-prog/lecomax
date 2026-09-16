import { availableSizesForColor, selectedInventory } from "./purchasability.ts";
import { colorPricesFromTags } from "./product-variant-pricing.ts";

type CatalogInventory = {
  active?: boolean;
  stock?: number;
  colors?: string[] | null;
  sizes?: string[] | null;
  tags?: string[] | null;
  color_stock?: Record<string, number> | null;
  preorder_enabled?: boolean;
};

/** Shared public contract: derive every option from the same saved inventory. */
export function catalogAvailability(input: CatalogInventory) {
  const tags = input.tags ?? [];
  const colorStock = input.color_stock ?? {};
  const sizes = input.sizes ?? [];
  const sizeTags = tags.filter(tag => tag.startsWith("__sstock:"));
  const product = {
    ...input, colors: input.colors ?? [], sizes, tags, color_stock: colorStock,
    out_of_stock_colors: Object.keys(colorStock).length ? [] : tags.filter(tag => tag.startsWith("__oos:")).map(tag => tag.slice(6)),
    out_of_stock_sizes: sizeTags.length ? sizes.filter(size => !sizeTags.some(tag => tag.startsWith(`__sstock:${size}:`) && Number(tag.slice(`__sstock:${size}:`.length)) > 0)) : [],
  };
  const color_sizes = Object.fromEntries(product.colors.map(color => [
    color, input.active === false ? [] : availableSizesForColor(product, color),
  ]));
  const canBuyColor = (color?: string) => {
    if (input.active === false) return false;
    if (!product.preorder_enabled && color && product.out_of_stock_colors.includes(color)) return false;
    if (product.sizes.length) return availableSizesForColor(product, color).length > 0;
    const quantity = selectedInventory(product, color);
    return product.preorder_enabled ? quantity >= 0 : quantity > 0;
  };
  const candidates = product.colors.length ? product.colors : [undefined];
  return {
    color_sizes,
    color_prices: colorPricesFromTags(product.tags),
    out_of_stock_colors: product.colors.filter(color => !canBuyColor(color)),
    out_of_stock_sizes: product.sizes.filter(size => input.active === false || !candidates.some(color => availableSizesForColor(product, color).includes(size))),
    purchasable: candidates.some(canBuyColor),
  };
}
