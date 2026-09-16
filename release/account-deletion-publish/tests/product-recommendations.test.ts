import assert from "node:assert/strict";
import test from "node:test";
import { rankSimilarProducts } from "../lib/product-recommendations.ts";
import type { CardProduct } from "../lib/products.ts";

const product = (slug: string, name: string, category = "accessoires"): CardProduct => ({
  slug, name, category, price: 199, image: "/test.jpg", colors: [], sizes: [], stock: 5,
});

test("recommendations never mix backpacks with waist bags", () => {
  const current = product("backpack", "Sac à dos voyage antivol extensible");
  const candidates = [
    product("backpack-2", "Sac à dos ordinateur imperméable"),
    product("waist", "Sac banane polyvalent"),
    product("watch", "Montre connectée sport"),
  ];
  assert.deepEqual(rankSimilarProducts(current, candidates).map((item) => item.slug), ["backpack-2"]);
});

test("category alone is not enough to recommend a future product", () => {
  const current = product("unique-a", "Organisateur premium pour bureau");
  const unrelated = product("unique-b", "Support téléphone magnétique");
  assert.deepEqual(rankSimilarProducts(current, [unrelated]), []);
});
