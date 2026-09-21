import "server-only";

import { createHash } from "node:crypto";
import { unstable_cache } from "next/cache";
import type { ProductShareData } from "./product-share";

/** Only artwork fields belong in the key; a stock change from 10 to 9 is invisible. */
export function productOgSnapshot(product: ProductShareData): ProductShareData {
  return {
    slug: product.slug, name: product.name, description: "", category: product.category,
    price: product.price, oldPrice: product.oldPrice, discount: product.discount,
    stock: product.stock === 0 ? 0 : 1, image: product.image, imageUrl: product.imageUrl,
  };
}

const renderCached = unstable_cache(async (snapshot: string) => {
  // No Sharp/Satori/Resvg work on a persistent-cache hit. Cache the FINAL PNG.
  const { renderProductOgImage } = await import("./product-og-renderer");
  const response = await renderProductOgImage(JSON.parse(snapshot));
  return Buffer.from(await response.arrayBuffer()).toString("base64");
}, ["product-og-png-v1"], { revalidate: 86400 });

// Coalesce cold requests inside a Fluid instance; never retain failed promises.
const pending = new Map<string, Promise<string>>();
export async function getProductOgPng(product: ProductShareData): Promise<Buffer> {
  const snapshot = JSON.stringify(productOgSnapshot(product));
  const key = createHash("sha256").update(snapshot).digest("hex");
  let work = pending.get(key);
  if (!work) {
    work = renderCached(snapshot).finally(() => { pending.delete(key); });
    pending.set(key, work);
  }
  return Buffer.from(await work, "base64");
}
