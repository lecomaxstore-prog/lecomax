import assert from "node:assert/strict";
import test from "node:test";
import {
  cleanSizeStock,
  cleanColorSizeStock,
  colorSizeStockFromTags,
  colorSizeStockTotal,
  colorTotalsFromColorSizeStock,
  sizeStockFromTags,
  sizeStockTotal,
  syncSizeInventoryTags,
  sizeTotalsFromColorSizeStock,
  syncColorSizeStockTags,
  sortProductSizes,
} from "../lib/product-inventory.ts";

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

test("size inventory keeps zero-stock sizes so the storefront can disable them", () => {
  const tags = syncSizeInventoryTags(
    ["running", "__guide:clothing", "__sstock:S:9"],
    "shoes",
    { "38": 2, "39": 0 },
  );

  assert.deepEqual(tags, ["running", "__guide:shoes", "__sstock:38:2", "__sstock:39:0"]);
  assert.deepEqual(sizeStockFromTags(tags), { "38": 2, "39": 0 });
});

test("size stock validation accepts non-negative integers and totals them", () => {
  const stock = cleanSizeStock({ S: 3, M: 0, L: 2 });
  assert.deepEqual(stock, { S: 3, M: 0, L: 2 });
  assert.equal(sizeStockTotal(stock!), 5);
  assert.equal(cleanSizeStock({ S: -1 }), null);
  assert.equal(cleanSizeStock({ S: 1.5 }), null);
});

test("color and size combination stock round-trips and derives both totals", () => {
  const matrix = cleanColorSizeStock({ Jaune: { "44": 0, "45": 1 }, Bleu: { "44": 2, "45": 0 } });
  assert.ok(matrix);
  assert.equal(colorSizeStockTotal(matrix), 3);
  assert.deepEqual(colorTotalsFromColorSizeStock(matrix), { Jaune: 1, Bleu: 2 });
  assert.deepEqual(sizeTotalsFromColorSizeStock(matrix), { "44": 2, "45": 1 });
  assert.deepEqual(colorSizeStockFromTags(syncColorSizeStockTags(["running"], matrix)), matrix);
});

test("customer sizes are ordered from smallest to largest without mutating input", () => {
  const shoes = ["44", "45", "42", "43"];
  assert.deepEqual(sortProductSizes(shoes), ["42", "43", "44", "45"]);
  assert.deepEqual(shoes, ["44", "45", "42", "43"]);
  assert.deepEqual(sortProductSizes(["XL", "S", "XXL", "M", "XS", "L"]), ["XS", "S", "M", "L", "XL", "XXL"]);
});
