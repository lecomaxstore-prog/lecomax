export const MAX_STOCK = 1_000_000;

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
