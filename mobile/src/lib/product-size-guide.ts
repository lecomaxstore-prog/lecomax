import { normalizeShoeSize } from "./shoe-size-guide.ts";

export const PRODUCT_SIZE_GUIDE_PREFIX = "__sizeguide:";
export type ProductSizeGuide = {
  title: string;
  columns: [string, string, string, string];
  rows: [string, string, string, string][];
  note: string;
};

/** Add missing product sizes without overwriting any merchant measurements. */
export function addProductGuideSizes(guide: ProductSizeGuide, sizes: readonly string[]): ProductSizeGuide {
  const labels = new Set(guide.rows.map(row => normalizeShoeSize(row[0]).toUpperCase()));
  const rows = [...guide.rows];
  for (const size of sizes) {
    const label = normalizeShoeSize(size).toUpperCase();
    if (label && !labels.has(label) && rows.length < 50) {
      rows.push([size.trim(), "", "", ""]);
      labels.add(label);
    }
  }
  return { ...guide, rows };
}

export function productGuideRows(guide: ProductSizeGuide) {
  return guide.rows.map(([size, ...values]) => ({ size, values: values.map(value => value || "—") }));
}

/** A product table is exact merchant content: never infer or append measurements. */
export function validateProductSizeGuide(value: unknown): ProductSizeGuide | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const v = value as Record<string, unknown>;
  const text = (x: unknown, max: number) => typeof x === "string" && x.length <= max && !/[\u0000-\u001f]/.test(x);
  if (!text(v.title, 80) || !(v.title as string).trim() || !text(v.note, 500)) return null;
  if (!Array.isArray(v.columns) || v.columns.length !== 4 || v.columns.some(c => !text(c, 30) || !c.trim())) return null;
  if (!Array.isArray(v.rows) || !v.rows.length || v.rows.length > 50) return null;
  if (v.rows.some(row => !Array.isArray(row) || row.length !== 4 || row.some(cell => !text(cell, 60)) || !row[0].trim())) return null;
  const rows = (v.rows as string[][]).map(row => row.map(cell => cell.trim()) as ProductSizeGuide["rows"][number]);
  const labels = rows.map(row => normalizeShoeSize(row[0]).toUpperCase());
  if (new Set(labels).size !== labels.length) return null;
  return { title: (v.title as string).trim(), note: (v.note as string).trim(), columns: v.columns.map(c => c.trim()) as ProductSizeGuide["columns"], rows };
}

export function productSizeGuideFromTags(tags?: readonly string[] | null): ProductSizeGuide | null {
  const encoded = tags?.find(tag => tag.startsWith(PRODUCT_SIZE_GUIDE_PREFIX));
  if (!encoded || encoded.length > 20_000) return null;
  try { return validateProductSizeGuide(JSON.parse(encoded.slice(PRODUCT_SIZE_GUIDE_PREFIX.length))); }
  catch { return null; }
}

/** Saved atomically with the product, using the existing product metadata tags. */
export function withProductSizeGuide(tags: readonly string[], guide: ProductSizeGuide | null): string[] {
  const cleaned = tags.filter(tag => !tag.startsWith(PRODUCT_SIZE_GUIDE_PREFIX));
  if (!guide) return cleaned;
  const valid = validateProductSizeGuide(guide);
  if (!valid) throw new Error("Guide invalide : vérifiez le titre, les colonnes et les tailles (uniques, 50 lignes maximum).");
  const encoded = PRODUCT_SIZE_GUIDE_PREFIX + JSON.stringify(valid);
  if (encoded.length > 20_000) throw new Error("Le guide des tailles est trop volumineux.");
  return [...cleaned, encoded];
}
