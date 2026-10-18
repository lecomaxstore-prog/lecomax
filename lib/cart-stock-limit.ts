/** Unknown inventory cannot authorize an increase until inventory refresh completes. */
export function cartStockLimit(stock: number | undefined, preorderEnabled = false): number {
  if (stock === undefined || !Number.isInteger(stock) || stock < 0) return 0;
  return preorderEnabled ? 20 : Math.min(20, stock);
}

export function cartQuantity(requested: number, stock: number | undefined, preorderEnabled = false): number {
  if (!Number.isFinite(requested)) return 0;
  return Math.min(cartStockLimit(stock, preorderEnabled), Math.max(1, Math.floor(requested)));
}
