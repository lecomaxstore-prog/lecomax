import { useState } from "react";
import { productImageFallbacks } from "@/data/product-image-fallbacks";
import { imageUrl } from "@/lib/format";
import type { Product } from "@/types/commerce";

export function useProductImage(product: Pick<Product, "id" | "thumbnail" | "images">) {
  const urls = [...new Set([product.thumbnail, ...(product.images ?? [])]
    .filter((uri): uri is string => Boolean(uri?.trim())).map((uri) => imageUrl(uri.trim())))];
  const candidates: (string | number)[] = urls.flatMap((uri) => {
    // Only use a bundled original for this exact photo, never another product.
    let pathname = "";
    try { pathname = decodeURI(new URL(uri).pathname); } catch { /* Remote source remains usable. */ }
    const local = productImageFallbacks[pathname];
    return local === undefined ? [uri] : [uri, local];
  });
  const identity = JSON.stringify([product.id, ...urls]);
  const [failure, setFailure] = useState({ identity, index: 0 });
  const index = failure.identity === identity ? failure.index : 0;
  const source = candidates[index];
  const onError = () => setFailure((previous) => {
    const current = previous.identity === identity ? previous.index : 0;
    // Ignore repeated errors emitted for a source we already moved past.
    return current === index ? { identity, index: index + 1 } : previous;
  });
  return { source, imageFailed: source === undefined, onError };
}
