import "server-only";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { SITE_URL } from "@/lib/seo";

const INDEXNOW_KEY = process.env.INDEXNOW_KEY ?? "d724dd3eb875908a4448cca481e61afd";

export type DiscoverableProduct = {
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
  revalidatePath("/", "layout");
  revalidatePath("/boutique");
  revalidatePath("/nouveautes");
  revalidatePath("/bestsellers");
  revalidatePath("/promotions");
  revalidatePath("/sitemap.xml");
  revalidatePath("/api/feed/products.xml");

  const products = [change.current, change.previous].filter(Boolean) as DiscoverableProduct[];
  for (const product of products) {
    if (product.slug) revalidatePath(productPath(product.slug));
    if (product.category) revalidatePath(`/${encodeURIComponent(product.category)}`);
  }
}

function urlsChanged(change: ProductDiscoveryChange): string[] {
  const urls = new Set<string>();
  const current = change.current;
  const previous = change.previous;

  // A current, public product should be discovered or refreshed.
  if (current?.active && current.slug) urls.add(productUrl(current.slug));

  // A removed, deactivated or renamed URL should be revisited and dropped.
  if (
    previous?.active &&
    previous.slug &&
    (!current?.active || current.slug !== previous.slug)
  ) {
    urls.add(productUrl(previous.slug));
  }

  return [...urls];
}

export async function submitIndexNow(urls: string[]): Promise<{ ok: boolean; status: number }> {
  const canonicalUrls = [...new Set(urls)].flatMap((value) => {
    try {
      const url = new URL(value, SITE_URL);
      return url.protocol === "https:" && url.hostname === "lecomax.com" ? [url.toString()] : [];
    } catch {
      return [];
    }
  }).slice(0, 10_000);

  if (canonicalUrls.length === 0) return { ok: false, status: 400 };

  const response = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host: "lecomax.com",
      key: INDEXNOW_KEY,
      keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
      urlList: canonicalUrls,
    }),
    cache: "no-store",
  });

  return { ok: response.ok, status: response.status };
}

/** Refresh every catalogue discovery surface and notify IndexNow after the response. */
export function publishProductDiscovery(change: ProductDiscoveryChange) {
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
