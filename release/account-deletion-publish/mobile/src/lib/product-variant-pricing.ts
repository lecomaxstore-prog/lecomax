export type ColorPrice = { price: number; originalPrice?: number };

const PREFIX = "__cprice:";

export function colorPricesFromTags(tags: unknown): Record<string, ColorPrice> {
  if (!Array.isArray(tags)) return {};
  const result: Record<string, ColorPrice> = {};
  for (const value of tags) {
    if (typeof value !== "string" || !value.startsWith(PREFIX)) continue;
    const [encodedColor, rawPrice, rawOriginal] = value.slice(PREFIX.length).split(":");
    let color = "";
    try {
      color = decodeURIComponent(encodedColor ?? "").trim();
    } catch {
      continue;
    }
    const price = Number(rawPrice);
    const originalPrice = Number(rawOriginal);
    if (!color || !Number.isFinite(price) || price < 0) continue;
    result[color] = {
      price,
      ...(Number.isFinite(originalPrice) && originalPrice > price ? { originalPrice } : {}),
    };
  }
  return result;
}

export function colorPriceTags(prices: Record<string, ColorPrice>) {
  return Object.entries(prices)
    .filter(([, value]) => Number.isFinite(value.price) && value.price >= 0)
    .map(([color, value]) => `${PREFIX}${encodeURIComponent(color)}:${value.price}:${value.originalPrice ?? ""}`);
}

export function publicProductTags(tags: string[]) {
  return tags.filter((tag) => !tag.startsWith(PREFIX));
}
