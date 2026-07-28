export function colorPricesFromTags(tags: unknown) {
  const result: Record<string, { price: number; originalPrice?: number }> = {};
  if (!Array.isArray(tags)) return result;
  for (const value of tags) {
    if (typeof value !== "string" || !value.startsWith("__cprice:")) continue;
    const [encodedColor, rawPrice, rawOriginal] = value.slice(9).split(":");
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
