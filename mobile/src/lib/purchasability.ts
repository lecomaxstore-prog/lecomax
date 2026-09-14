export type FulfillmentType = "STANDARD" | "PREORDER";
export type PreorderFields = {
  preorder_enabled?: boolean;
  preorder_estimated_at?: string | null;
  preorder_message?: string | null;
};
export type PreorderSnapshot = {
  fulfillment_type?: FulfillmentType;
  preorder_estimated_at?: string | null;
  preorder_message?: string | null;
};
export function getPurchasability(stock: number, preorderEnabled: boolean, quantity = 1) {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20 || !Number.isFinite(stock) || stock < 0) return "OUT_OF_STOCK";
  return stock >= quantity ? "STANDARD" : preorderEnabled ? "PREORDER" : "OUT_OF_STOCK";
}

/** Exact configured attributes are identifiers. Missing variants never become pre-orders. */
export function selectedInventory(product: {
  stock?: number; colors?: string[]; sizes?: string[];
  color_stock?: Record<string, number>; tags?: string[];
}, color?: string, size?: string): number {
  if (product.colors?.length && (!color || !product.colors.includes(color))) return -1;
  if (product.sizes?.length && (!size || !product.sizes.includes(size))) return -1;
  if (color && !product.colors?.includes(color)) return -1;
  if (size && !product.sizes?.includes(size)) return -1;
  const limits = [Math.max(0, Number(product.stock ?? 0))];
  if (color && Object.keys(product.color_stock ?? {}).length) {
    if (!Object.hasOwn(product.color_stock!, color)) return -1;
    limits.push(product.color_stock![color]);
  }
  const matrix = (product.tags ?? []).filter(tag => tag.startsWith("__vstock:"));
  if (matrix.length) {
    let found = false;
    for (const tag of matrix) {
      try {
        const row: unknown = JSON.parse(tag.slice(9));
        if (Array.isArray(row) && row[0] === color && row[1] && typeof row[1] === "object" && size && Object.hasOwn(row[1], size)) {
          limits.push(Number(row[1][size])); found = true;
        }
      } catch { return -1; }
    }
    if (!found) return -1;
  }
  if (size) {
    const prefix = `__sstock:${size}:`;
    const tag = product.tags?.find(value => value.startsWith(prefix));
    if (tag) limits.push(Number(tag.slice(prefix.length)));
  }
  return limits.every(value => Number.isInteger(value) && value >= 0) ? Math.min(...limits) : -1;
}

export function preorderSnapshot(product: PreorderFields, stock: number, quantity = 1): PreorderSnapshot {
  const fulfillment = stock < 0 ? "OUT_OF_STOCK" : getPurchasability(stock, product.preorder_enabled === true, quantity);
  return {
    fulfillment_type: fulfillment === "PREORDER" ? "PREORDER" : "STANDARD",
    preorder_estimated_at: fulfillment === "PREORDER" ? product.preorder_estimated_at ?? null : null,
    preorder_message: fulfillment === "PREORDER" ? product.preorder_message ?? null : null,
  };
}

/** Only offer sizes purchasable in the selected color, not another color's stock. */
export function availableSizesForColor(product: Parameters<typeof selectedInventory>[0] & PreorderFields & {
  color_sizes?: Record<string, string[]>;
  out_of_stock_colors?: string[];
  out_of_stock_sizes?: string[];
}, color?: string): string[] {
  if (!product.preorder_enabled && color && product.out_of_stock_colors?.includes(color)) return [];
  const sizes = product.preorder_enabled ? product.sizes ?? [] : (color && product.color_sizes?.[color]) || product.sizes || [];
  return sizes.filter(size => {
    const stock = selectedInventory(product, color, size);
    return product.preorder_enabled ? stock >= 0 : stock > 0 && !product.out_of_stock_sizes?.includes(size);
  });
}
