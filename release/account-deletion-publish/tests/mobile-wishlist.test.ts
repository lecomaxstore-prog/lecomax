import assert from "node:assert/strict";
import test from "node:test";
import {
  availableColors,
  defaultWishlistVariant,
  filterWishlistProducts,
  isWishlistVariantAvailable,
  mergeWishlistEntries,
  sortWishlistProducts,
  splitWishlistEntries,
} from "../mobile/src/lib/wishlist-utils.ts";
import type { Product } from "../mobile/src/types/commerce.ts";

function product(overrides: Partial<Product> = {}): Product {
  return {
    id: "p-1",
    slug: "chausson-1",
    name: "Chaussons L’ECOMAX",
    category: "Femme",
    price: 100,
    original_price: null,
    description: null,
    images: ["/product.webp"],
    stock: 5,
    active: true,
    created_at: "2026-07-01T00:00:00.000Z",
    rating: 4,
    review_count: 2,
    ...overrides,
  };
}

test("guest and account favourites merge without duplicates", () => {
  assert.deepEqual(
    mergeWishlistEntries(["chausson-1", "sac-1"], ["sac-1", "chaussure-1"]),
    ["chausson-1", "sac-1", "chaussure-1"],
  );
});

test("wishlist split exposes removed catalogue entries", () => {
  const result = splitWishlistEntries(["p-1", "removed-product"], [product()]);
  assert.deepEqual(
    result.available.map((item) => item.id),
    ["p-1"],
  );
  assert.deepEqual(result.removed, ["removed-product"]);
});

test("stock filter preserves all products until enabled", () => {
  const items = [product(), product({ id: "p-2", slug: "p-2", stock: 0 })];
  assert.equal(filterWishlistProducts(items, false).length, 2);
  assert.deepEqual(
    filterWishlistProducts(items, true).map((item) => item.id),
    ["p-1"],
  );
});

test("all supported wishlist sorting modes are deterministic", () => {
  const cheap = product({
    id: "cheap",
    slug: "cheap",
    price: 60,
    rating: 3,
    created_at: "2026-07-20T00:00:00.000Z",
  });
  const premium = product({
    id: "premium",
    slug: "premium",
    price: 180,
    rating: 5,
    created_at: "2026-06-20T00:00:00.000Z",
  });
  assert.equal(
    sortWishlistProducts([premium, cheap], "price-asc")[0].id,
    "cheap",
  );
  assert.equal(
    sortWishlistProducts([premium, cheap], "price-desc")[0].id,
    "premium",
  );
  assert.equal(sortWishlistProducts([premium, cheap], "newest")[0].id, "cheap");
  assert.equal(
    sortWishlistProducts([cheap, premium], "rating")[0].id,
    "premium",
  );
  assert.equal(
    sortWishlistProducts([premium, cheap], "recommended", [
      "cheap",
      "premium",
    ])[0].id,
    "cheap",
  );
});

test("variant defaults skip unavailable colours and prevent invalid cart adds", () => {
  const item = product({
    colors: ["Blanc", "Noir"],
    color_stock: { Blanc: 0, Noir: 3 },
    out_of_stock_colors: ["Blanc"],
    sizes: ["37", "38"],
    out_of_stock_sizes: ["37"],
  });
  assert.deepEqual(availableColors(item), ["Noir"]);
  assert.deepEqual(defaultWishlistVariant(item), {
    color: "Noir",
    size: "38",
  });
  assert.equal(
    isWishlistVariantAvailable(item, { color: "Blanc", size: "38" }),
    false,
  );
  assert.equal(
    isWishlistVariantAvailable(item, { color: "Noir", size: "38" }),
    true,
  );
});

test("empty favourites remain a valid stable state", () => {
  assert.deepEqual(splitWishlistEntries([], [product()]), {
    available: [],
    removed: [],
  });
});
