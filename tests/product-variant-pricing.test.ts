import assert from "node:assert/strict";
import test from "node:test";
import { colorPricesFromTags, colorPriceTags } from "../lib/product-variant-pricing.ts";

test("color variant prices round-trip safely", () => {
  const prices = { "Noir / Doré": { price: 79, originalPrice: 99 }, Gris: { price: 69 } };
  assert.deepEqual(colorPricesFromTags(colorPriceTags(prices)), prices);
});

test("malformed internal pricing tags are ignored", () => {
  assert.deepEqual(colorPricesFromTags(["__cprice:%ZZ:69:", "public-tag"]), {});
});
