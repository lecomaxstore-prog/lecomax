const CLOTHING_SIZE_ORDER = new Map<string, number>(
  ["XS", "S", "M", "L", "XL", "XXL", "3XL"].map((size, index) => [size, index]),
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
