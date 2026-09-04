export const MAX_STOCK = 1_000_000;
export const CLOTHING_SIZE_VALUES = ["XS", "S", "M", "L", "XL", "XXL", "3XL"] as const;
export const SHOE_SIZE_VALUES = ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46"] as const;
export type ProductSizeGuideType = "none" | "clothing" | "shoes" | "custom";
export type ColorSizeStock = Record<string, Record<string, number>>;

const CLOTHING_SIZE_ORDER = new Map<string, number>(
  CLOTHING_SIZE_VALUES.map((size, index) => [size, index]),
);
const SIZE_COLLATOR = new Intl.Collator("fr", { numeric: true, sensitivity: "base" });

/** Returns a new customer-facing size list ordered from smallest to largest. */
export function sortProductSizes(sizes: readonly string[]) {
  return [...new Set(sizes)].sort((first, second) => {
    const firstClothingIndex = CLOTHING_SIZE_ORDER.get(first.toUpperCase());
    const secondClothingIndex = CLOTHING_SIZE_ORDER.get(second.toUpperCase());
    if (firstClothingIndex !== undefined && secondClothingIndex !== undefined) {
      return firstClothingIndex - secondClothingIndex;
    }
    if (firstClothingIndex !== undefined) return -1;
    if (secondClothingIndex !== undefined) return 1;

    const firstNumber = /^\d+(?:[.,]\d+)?$/.test(first) ? Number(first.replace(",", ".")) : null;
    const secondNumber = /^\d+(?:[.,]\d+)?$/.test(second) ? Number(second.replace(",", ".")) : null;
    if (firstNumber !== null && secondNumber !== null) return firstNumber - secondNumber;
    if (firstNumber !== null) return -1;
    if (secondNumber !== null) return 1;
    return SIZE_COLLATOR.compare(first, second);
  });
}

export function asStock(value: unknown): number | null {
  const stock = Number(value);
  return Number.isInteger(stock) && stock >= 0 && stock <= MAX_STOCK ? stock : null;
}

export function cleanColorStock(value: unknown): Record<string, number> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const cleaned: Record<string, number> = {};
  for (const [rawColor, rawStock] of Object.entries(value as Record<string, unknown>)) {
    const color = rawColor.trim().slice(0, 80);
    const stock = asStock(rawStock);
    if (!color || stock === null) return null;
    cleaned[color] = stock;
  }
  return cleaned;
}

export function colorStockTotal(colorStock: Record<string, number>) {
  return Object.values(colorStock).reduce((sum, value) => sum + value, 0);
}

export function cleanSizeStock(value: unknown): Record<string, number> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const cleaned: Record<string, number> = {};
  for (const [rawSize, rawStock] of Object.entries(value as Record<string, unknown>)) {
    const size = rawSize.trim().slice(0, 40);
    const stock = asStock(rawStock);
    if (!size || stock === null) return null;
    cleaned[size] = stock;
  }
  return cleaned;
}

export function sizeStockTotal(sizeStock: Record<string, number>) {
  return Object.values(sizeStock).reduce((sum, value) => sum + value, 0);
}

export function cleanColorSizeStock(value: unknown): ColorSizeStock | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const cleaned: ColorSizeStock = {};
  const colorEntries = Object.entries(value as Record<string, unknown>);
  if (colorEntries.length > 40) return null;
  for (const [rawColor, rawSizes] of colorEntries) {
    const color = rawColor.trim().slice(0, 80);
    const sizes = cleanSizeStock(rawSizes);
    if (!color || !sizes || Object.keys(sizes).length > 100) return null;
    cleaned[color] = sizes;
  }
  return cleaned;
}

export function colorSizeStockTotal(stock: ColorSizeStock) {
  return Object.values(stock).reduce((total, sizes) => total + sizeStockTotal(sizes), 0);
}

export function colorTotalsFromColorSizeStock(stock: ColorSizeStock) {
  return Object.fromEntries(Object.entries(stock).map(([color, sizes]) => [color, sizeStockTotal(sizes)]));
}

export function sizeTotalsFromColorSizeStock(stock: ColorSizeStock) {
  const totals: Record<string, number> = {};
  for (const sizes of Object.values(stock)) {
    for (const [size, quantity] of Object.entries(sizes)) totals[size] = (totals[size] ?? 0) + quantity;
  }
  return totals;
}

export function colorSizeStockFromTags(value: unknown): ColorSizeStock {
  if (!Array.isArray(value)) return {};
  const stock: ColorSizeStock = {};
  for (const tag of value) {
    if (typeof tag !== "string" || !tag.startsWith("__vstock:")) continue;
    try {
      const parsed = JSON.parse(tag.slice("__vstock:".length));
      if (!Array.isArray(parsed) || parsed.length !== 2 || typeof parsed[0] !== "string") continue;
      const row = cleanSizeStock(parsed[1]);
      if (parsed[0].trim() && row) stock[parsed[0].trim()] = row;
    } catch { /* ignore malformed legacy/internal tags */ }
  }
  return stock;
}

export function syncColorSizeStockTags(tags: string[], stock?: ColorSizeStock) {
  const regularTags = tags.filter((tag) => !tag.startsWith("__vstock:"));
  if (!stock) return regularTags;
  for (const [color, sizes] of Object.entries(stock)) {
    regularTags.push(`__vstock:${JSON.stringify([color, sizes])}`);
  }
  return regularTags;
}

export function syncSizeInventoryTags(
  tags: string[],
  guideType: ProductSizeGuideType,
  sizeStock?: Record<string, number>,
) {
  const regularTags = tags.filter(
    (tag) => !tag.startsWith("__guide:") && !tag.startsWith("__sstock:"),
  );
  if (guideType !== "none") regularTags.push(`__guide:${guideType}`);
  if (sizeStock) {
    for (const [size, quantity] of Object.entries(sizeStock)) {
      regularTags.push(`__sstock:${size}:${quantity}`);
    }
  }
  return regularTags;
}

/**
 * Reconcile an existing per-color inventory to a new requested total.
 * Existing quantities are preserved where possible. Added units go to the
 * first configured color; removals are taken from the last configured color.
 */
export function reconcileColorStock(
  current: Record<string, number>,
  configuredColors: string[],
  requestedTotal: number,
) {
  const existingKeys = Object.keys(current);
  if (existingKeys.length === 0) return null;

  const orderedColors = [...new Set([
    ...configuredColors.map((color) => color.trim()).filter(Boolean),
    ...existingKeys,
  ])];
  const next = Object.fromEntries(orderedColors.map((color) => [color, asStock(current[color]) ?? 0]));
  let difference = requestedTotal - colorStockTotal(next);

  if (difference > 0) {
    next[orderedColors[0]] += difference;
  } else if (difference < 0) {
    let remaining = Math.abs(difference);
    for (const color of [...orderedColors].reverse()) {
      const removed = Math.min(next[color], remaining);
      next[color] -= removed;
      remaining -= removed;
      if (remaining === 0) break;
    }
  }

  return next;
}

export function syncOutOfStockTags(
  tags: string[],
  colorStock: Record<string, number> | null,
) {
  const regularTags = tags.filter((tag) => !tag.startsWith("__oos:"));
  if (!colorStock || Object.keys(colorStock).length === 0) return regularTags;
  const unavailableTags = Object.entries(colorStock)
    .filter(([, stock]) => stock <= 0)
    .map(([color]) => `__oos:${color}`);
  return [...regularTags, ...unavailableTags];
}

export function sizeStockFromTags(value: unknown): Record<string, number> {
  if (!Array.isArray(value)) return {};
  const stock: Record<string, number> = {};
  for (const rawTag of value) {
    if (typeof rawTag !== "string" || !rawTag.startsWith("__sstock:")) continue;
    const parts = rawTag.slice("__sstock:".length).split(":");
    const quantity = asStock(parts.pop());
    const size = parts.join(":").trim();
    if (size && quantity !== null) stock[size] = quantity;
  }
  return stock;
}

export function resolveProductAvailability(input: {
  stock: number | null;
  colors: string[];
  colorStock: Record<string, number> | null;
  fallbackOutOfStockColors?: string[];
}) {
  const { stock, colors, colorStock, fallbackOutOfStockColors = [] } = input;
  if (stock !== null && stock <= 0) {
    return { inStock: false, outOfStockColors: [...colors] };
  }

  const entries = Object.entries(colorStock ?? {});
  const hasPositiveVariant = entries.some(([, quantity]) => quantity > 0);
  if (hasPositiveVariant) {
    return {
      inStock: true,
      outOfStockColors: colors.filter((color) => (colorStock?.[color] ?? 0) <= 0),
    };
  }

  // A positive total with all-zero legacy variants means the total was
  // replenished before variant synchronization existed. Keep it purchasable.
  if (stock !== null && stock > 0 && entries.length > 0) {
    return { inStock: true, outOfStockColors: [] };
  }

  return {
    inStock: stock === null || stock > 0,
    outOfStockColors: [...new Set(fallbackOutOfStockColors)],
  };
}
