import { apiRequest } from "@/lib/api-client";
import {
  mergeWishlistEntries,
  type WishlistVariant,
} from "@/lib/wishlist-utils";
import type { Product } from "@/types/commerce";

type WishlistResponse = {
  slugs: string[];
  variants?: Record<string, WishlistVariant>;
};

function toSlugs(entries: string[], products: Product[]) {
  const byId = new Map(products.map((product) => [product.id, product.slug]));
  const knownSlugs = new Set(products.map((product) => product.slug));
  return [
    ...new Set(
      entries
        .map((entry) => byId.get(entry) ?? (knownSlugs.has(entry) ? entry : ""))
        .filter(Boolean),
    ),
  ];
}

function toIds(slugs: string[], products: Product[]) {
  const bySlug = new Map(products.map((product) => [product.slug, product.id]));
  return slugs
    .map((slug) => bySlug.get(slug))
    .filter((id): id is string => Boolean(id));
}

function variantsToSlugs(
  selections: Record<string, WishlistVariant>,
  products: Product[],
) {
  const byId = new Map(products.map((product) => [product.id, product.slug]));
  return Object.fromEntries(
    Object.entries(selections)
      .map(([entry, selection]) => [byId.get(entry) ?? entry, selection])
      .filter(([slug]) => Boolean(slug)),
  );
}

function variantsToIds(
  variants: Record<string, WishlistVariant> | undefined,
  products: Product[],
) {
  const bySlug = new Map(products.map((product) => [product.slug, product.id]));
  return Object.fromEntries(
    Object.entries(variants ?? {})
      .map(([slug, selection]) => [bySlug.get(slug), selection])
      .filter((entry): entry is [string, WishlistVariant] => Boolean(entry[0])),
  );
}

export async function mergeAccountWishlist(
  localEntries: string[],
  localSelections: Record<string, WishlistVariant>,
  products: Product[],
) {
  const remote = await apiRequest<WishlistResponse>("/api/wishlist", {
    authenticated: true,
  });
  const merged = mergeWishlistEntries(
    remote.slugs,
    toSlugs(localEntries, products),
  );
  const variants = {
    ...(remote.variants ?? {}),
    ...variantsToSlugs(localSelections, products),
  };
  const saved = await apiRequest<WishlistResponse>("/api/wishlist", {
    method: "POST",
    authenticated: true,
    body: JSON.stringify({ action: "replace", slugs: merged, variants }),
  });
  return {
    ids: toIds(saved.slugs, products),
    selections: variantsToIds(saved.variants, products),
  };
}

export async function replaceAccountWishlist(
  localEntries: string[],
  localSelections: Record<string, WishlistVariant>,
  products: Product[],
) {
  const saved = await apiRequest<WishlistResponse>("/api/wishlist", {
    method: "POST",
    authenticated: true,
    body: JSON.stringify({
      action: "replace",
      slugs: toSlugs(localEntries, products),
      variants: variantsToSlugs(localSelections, products),
    }),
  });
  return {
    ids: toIds(saved.slugs, products),
    selections: variantsToIds(saved.variants, products),
  };
}
