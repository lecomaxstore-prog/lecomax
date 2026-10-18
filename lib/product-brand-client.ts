import { validateBrand, type ProductBrand } from "../mobile/src/lib/product-brands";

let cached: ProductBrand[] | undefined;
let expiresAt = 0;
let pending: Promise<ProductBrand[]> | undefined;

/** All visible product cards share one registry request. Failed requests can retry. */
export function loadProductBrands(): Promise<ProductBrand[]> {
  if (cached && Date.now() < expiresAt) return Promise.resolve(cached);
  if (pending) return pending;
  pending = fetch("/api/products/brands", { cache: "no-store" })
    .then(async response => {
      if (!response.ok) throw new Error("Brand registry unavailable");
      const rows: unknown = await response.json();
      if (!Array.isArray(rows)) throw new Error("Invalid brand registry");
      cached = rows.flatMap(row => {
        const brand = validateBrand(row);
        return brand ? [brand] : [];
      });
      expiresAt = Date.now() + 30_000;
      return cached;
    }).finally(() => { pending = undefined; });
  return pending;
}
