import assert from "node:assert/strict";
import test from "node:test";
import { realSimilarProducts } from "../mobile/src/lib/product-similarity.ts";
import { rankSimilarProducts } from "../lib/product-recommendations.ts";
import type { Product } from "../mobile/src/types/commerce.ts";

const product = (id: string, name: string, description = "") => ({
  id, slug: id, name, description, category: "homme", active: true, stock: 5,
  price: 199, original_price: null, images: [], created_at: "", image: "", colors: [], sizes: [],
});

for (const [name, recommend] of [
  ["mobile", (current: ReturnType<typeof product>, items: ReturnType<typeof product>[]) => realSimilarProducts(current, items)],
  ["website", (current: ReturnType<typeof product>, items: ReturnType<typeof product>[]) => rankSimilarProducts(current, items)],
] as const) {
  test(`${name}: running T-shirts recommend T-shirts, not shoes or shirts`, () => {
    const current = product("tee", "T-shirt running homme", "À porter avec des baskets de course et une veste.");
    const items = [product("shoes", "Baskets de running homme"), product("shirt", "Chemise homme"), product("hoodie", "Sweatshirt homme"), product("tee-2", "Tshirt coton homme")];
    assert.deepEqual(recommend(current, items).map((item) => item.slug), ["tee-2"]);
  });
  test(`${name}: shoes ignore clothing mentioned in descriptions`, () => {
    const current = product("shoe", "Baskets de running", "Associez ces baskets à un T-shirt et un pantalon.");
    assert.deepEqual(recommend(current, [product("tee", "T-shirt running"), product("shoe-2", "Chaussures de sport")]).map((item) => item.slug), ["shoe-2"]);
  });
  test(`${name}: no unrelated fallback or sold-out recommendations`, () => {
    const current = product("tee", "T-shirt homme");
    assert.deepEqual(recommend(current, [current, { ...product("tee-2", "Tee-shirt homme"), stock: 0 }, product("shoe", "Baskets homme")]), []);
  });
}

test("mobile excludes inactive products", () => {
  assert.deepEqual(realSimilarProducts(product("tee", "T-shirt"), [{ ...product("tee-2", "T-shirt coton"), active: false } as Product]), []);
});
