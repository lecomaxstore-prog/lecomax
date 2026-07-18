import "server-only";

import { getDbProductRaw } from "./db-server";
import { getProduct } from "./products";

export const PRODUCT_SHARE_SITE_URL = "https://lecomax.com";

export type ProductShareData = {
  slug: string;
  name: string;
  description: string;
  category: string;
  brand?: string;
  price: number;
  oldPrice?: number;
  stock?: number;
  image: string;
  imageUrl: string;
  discount?: number;
};

function absoluteImageUrl(image: string) {
  if (!image) return `${PRODUCT_SHARE_SITE_URL}/ecomax-hero-banner.jpg.png`;
  try {
    return new URL(image, PRODUCT_SHARE_SITE_URL).toString();
  } catch {
    return `${PRODUCT_SHARE_SITE_URL}/ecomax-hero-banner.jpg.png`;
  }
}

/**
 * Resolve the current product sharing data from the live database first while
 * retaining the richer static catalogue as a fallback. New database products
 * therefore receive complete social previews without any manual setup.
 */
export async function getProductShareData(slug: string): Promise<ProductShareData | null> {
  const catalogueProduct = getProduct(slug) ?? null;
  const databaseProduct = await getDbProductRaw(slug).catch(() => null);

  if (!catalogueProduct && !databaseProduct) return null;

  const name = databaseProduct?.name || catalogueProduct?.displayName || catalogueProduct?.name || "Produit L'ecomax";
  const price = typeof databaseProduct?.price === "number" ? databaseProduct.price : catalogueProduct?.price ?? 0;
  const oldPrice = typeof databaseProduct?.original_price === "number"
    ? databaseProduct.original_price
    : catalogueProduct?.oldPrice;
  const image = databaseProduct?.images?.find(Boolean) || catalogueProduct?.image || "";
  const stock = typeof databaseProduct?.stock === "number" ? databaseProduct.stock : catalogueProduct?.stock;
  const discount = oldPrice && oldPrice > price ? Math.round((1 - price / oldPrice) * 100) : undefined;

  return {
    slug,
    name,
    description: databaseProduct?.description || catalogueProduct?.description || "",
    category: databaseProduct?.category || catalogueProduct?.category || "produit",
    brand: databaseProduct?.brand || catalogueProduct?.brand,
    price,
    oldPrice,
    stock,
    image,
    imageUrl: absoluteImageUrl(image),
    discount,
  };
}

