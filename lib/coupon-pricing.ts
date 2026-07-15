export type CouponCartLine = {
  slug: string;
  quantity: number;
};

export type CouponPricing = {
  subtotal: number;
  eligibleSubtotal: number;
  excludedSubtotal: number;
  excludedItemsCount: number;
};

type ProductRecord = Record<string, unknown>;

function currentPrice(product: ProductRecord): number {
  return Number(product.price);
}

export function isProductAlreadyPromoted(product: ProductRecord): boolean {
  const price = currentPrice(product);
  const originalPrice = Number(product.original_price ?? product.oldPrice);
  return Number.isFinite(price) && Number.isFinite(originalPrice) && originalPrice > price;
}

export function calculateCouponPricing(
  lines: CouponCartLine[],
  productBySlug: Map<string, ProductRecord>
): CouponPricing {
  return lines.reduce<CouponPricing>((totals, line) => {
    const product = productBySlug.get(line.slug);
    const price = product ? currentPrice(product) : NaN;
    if (!product || !Number.isFinite(price) || price <= 0) return totals;

    const lineTotal = price * line.quantity;
    totals.subtotal += lineTotal;
    if (isProductAlreadyPromoted(product)) {
      totals.excludedSubtotal += lineTotal;
      totals.excludedItemsCount += line.quantity;
    } else {
      totals.eligibleSubtotal += lineTotal;
    }
    return totals;
  }, { subtotal: 0, eligibleSubtotal: 0, excludedSubtotal: 0, excludedItemsCount: 0 });
}

export function calculateCouponDiscount(
  type: string,
  value: number,
  eligibleSubtotal: number
): number {
  if (!Number.isFinite(value) || value <= 0 || eligibleSubtotal <= 0) return 0;
  return type === "percent"
    ? Math.min(eligibleSubtotal, Math.round(eligibleSubtotal * value / 100))
    : Math.min(value, eligibleSubtotal);
}
