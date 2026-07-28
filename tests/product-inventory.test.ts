import assert from "node:assert/strict";
import test from "node:test";
import { sizeStockFromTags } from "../lib/product-inventory.ts";

test("size inventory tags preserve names and expose authoritative quantities", () => {
  assert.deepEqual(
    sizeStockFromTags(["featured", "__sstock:38:4", "__sstock:Taille: XL:2"]),
    { "38": 4, "Taille: XL": 2 },
  );
});

test("invalid size inventory tags are ignored", () => {
  assert.deepEqual(
    sizeStockFromTags(["__sstock:40:-1", "__sstock:41:not-a-number", null]),
    {},
  );
});
