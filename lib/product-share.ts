import "server-only";

import { getDbProductRaw } from "./db-server";

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
  preorderEnabled?: boolean;
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
 * Social previews use the same current product as the website and app.
 */
export async function getProductShareData(slug: string): Promise<ProductShareData | null> {
  const databaseProduct = await getDbProductRaw(slug);

  if (!databaseProduct || !databaseProduct.active) return null;

  const name = databaseProduct.name;
  const price = databaseProduct.price;
  const oldPrice = databaseProduct.original_price ?? undefined;
  const image = databaseProduct.images?.find(Boolean) || "";
  const stock = databaseProduct.stock;
  const discount = oldPrice && oldPrice > price ? Math.round((1 - price / oldPrice) * 100) : undefined;

  return {
    slug,
    name,
    description: databaseProduct.description ?? "",
    category: databaseProduct.category,
    brand: databaseProduct.brand ?? undefined,
    price,
    oldPrice,
    stock,
    preorderEnabled: databaseProduct.preorder_enabled === true,
    image,
    imageUrl: absoluteImageUrl(image),
    discount,
  };
}
