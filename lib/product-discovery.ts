import "server-only";

import { revalidatePath, revalidateTag } from "next/cache";
import { after } from "next/server";
import { SITE_URL } from "@/lib/seo";
import { deliverProductNotification } from "@/lib/product-notification";
import { publishOfferNotification } from "@/lib/offer-notification";
import { sendIndexNow } from "./indexnow.mjs";

export type DiscoverableProduct = {
  id?: string;
  slug: string;
  category?: string | null;
  active?: boolean | null;
};

type ProductDiscoveryChange = {
  current?: DiscoverableProduct | null;
  previous?: DiscoverableProduct | null;
};

function productPath(slug: string): string {
  return `/produit/${encodeURIComponent(slug)}`;
}

function productUrl(slug: string): string {
  return `${SITE_URL}${productPath(slug)}/`;
}

function refreshPublicCatalogue(change: ProductDiscoveryChange) {
  revalidateTag("storefront-products");
  revalidatePath("/", "page");
  revalidatePath("/boutique");
  revalidatePath("/nouveautes");
  revalidatePath("/bestsellers");
  revalidatePath("/promotions");
  revalidatePath("/sitemap.xml");
  revalidatePath("/api/feed/products.xml");
  revalidatePath("/merchant-feed.xml");

  const products = [change.current, change.previous].filter(Boolean) as DiscoverableProduct[];
  for (const product of products) {
    if (product.slug) {
      revalidatePath(productPath(product.slug));
      revalidatePath(`/api/og/product/${encodeURIComponent(product.slug)}`);
    }
    if (product.category) revalidatePath(`/${encodeURIComponent(product.category)}`);
  }
}

function urlsChanged(change: ProductDiscoveryChange): string[] {
  const urls = new Set<string>([
    `${SITE_URL}/`,
    `${SITE_URL}/boutique/`,
    `${SITE_URL}/nouveautes/`,
  ]);
  const current = change.current;
  const previous = change.previous;

  // A current, public product should be discovered or refreshed.
  if (current?.active && current.slug) urls.add(productUrl(current.slug));
  if (current?.active && current.category) {
    urls.add(`${SITE_URL}/${encodeURIComponent(current.category)}/`);
  }

  // A removed, deactivated or renamed URL should be revisited and dropped.
  if (
    previous?.active &&
    previous.slug &&
    (!current?.active || current.slug !== previous.slug)
  ) {
    urls.add(productUrl(previous.slug));
  }
  if (previous?.category) {
    urls.add(`${SITE_URL}/${encodeURIComponent(previous.category)}/`);
  }

  return [...urls];
}

export async function submitIndexNow(urls: string[]): Promise<{ ok: boolean; status: number }> {
  return sendIndexNow(urls);
}

/** Refresh every catalogue discovery surface and notify IndexNow after the response. */
export function publishProductDiscovery(change: ProductDiscoveryChange) {
  if (change.current?.id && change.current.active && change.previous?.active) {
    publishOfferNotification(change.current.id, "product");
  }
  if (change.current?.id && change.current.active && !change.previous?.active) {
    const productId = change.current.id;
    after(async () => {
      try { await deliverProductNotification(productId); }
      catch (error) { console.error("New product notification failed", error); }
    });
  }
  refreshPublicCatalogue(change);
  const urls = urlsChanged(change);
  if (urls.length === 0) return;

  after(async () => {
    try {
      const result = await submitIndexNow(urls);
      if (!result.ok) console.error("IndexNow rejected product URLs", result.status);
    } catch (error) {
      // Product publishing must succeed even if the external discovery service is unavailable.
      console.error("IndexNow product notification failed", error);
    }
  });
}
