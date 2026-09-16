import { completeShoeGuide, normalizeShoeSize } from "./shoe-size-guide.ts";

export type SizeGuideData = {
  shoes?: { eu: string; us: string; uk: string; cm: string }[];
  clothing?: { label: string; fr: string; poitrine: string; taille: string }[];
};

export const normalizeSize = (size: string) => normalizeShoeSize(size).toUpperCase();

export function usesClothingSizes(sizes: string[]) {
  return sizes.some((size) => /^(?:X{0,4}[SL]|M|[2-6]XL)$/i.test(size.trim()));
}

export function sizeGuideRows(data: SizeGuideData, clothing: boolean, sizes: string[]) {
  const rows = clothing
    ? (data.clothing ?? []).map((row) => ({ size: row.label, values: [row.fr, row.poitrine, row.taille] }))
    : completeShoeGuide(data.shoes ?? [], sizes).map((row) => ({ size: row.eu, values: [row.us, row.uk, row.cm] }));
  // Keep product sizes selectable even when the merchant has no measurements for them.
  for (const size of sizes) {
    if (!rows.some((row) => normalizeSize(row.size) === normalizeSize(size))) {
      rows.push({ size, values: ["—", "—", "—"] });
    }
  }
  return rows;
}
