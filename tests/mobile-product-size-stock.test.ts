import assert from "node:assert/strict";
import test from "node:test";
import { availableSizesForColor, selectedInventory } from "../mobile/src/lib/purchasability.ts";
import { catalogAvailability } from "../mobile/src/lib/catalog-availability.ts";

const product = {
  stock: 3, colors: ["Jaune", "Bleu", "Gris"], sizes: ["44", "45", "42", "43"],
  color_stock: { Jaune: 1, Bleu: 1, Gris: 1 },
  tags: [
    '__vstock:["Jaune",{"42":0,"43":0,"44":0,"45":1}]',
    '__vstock:["Bleu",{"42":0,"43":0,"44":1,"45":0}]',
    '__vstock:["Gris",{"42":0,"43":0,"44":1,"45":0}]',
  ],
};

test("Baasploa selects a stocked size for each color instead of another color's size", () => {
  for (const [color, size] of [["Jaune", "45"], ["Bleu", "44"], ["Gris", "44"]]) {
    const sizes = availableSizesForColor(product, color);
    assert.deepEqual(sizes, [size]);
    assert.equal(selectedInventory(product, color, sizes[0]), 1);
  }
});

test("sold-out sizes stay unavailable unless preorders are enabled", () => {
  assert.deepEqual(availableSizesForColor({ ...product, stock: 0 }, "Jaune"), []);
  assert.deepEqual(availableSizesForColor({ ...product, preorder_enabled: true }, "Jaune"), product.sizes);
  assert.deepEqual(availableSizesForColor({ ...product, preorder_enabled: true }, "Unknown"), []);
  assert.deepEqual(availableSizesForColor({ ...product, out_of_stock_sizes: ["45"] }, "Jaune"), []);
});

test("API contract and both clients expose only 45 for yellow, even when 44 exists in other colors", () => {
  const contract = catalogAvailability(product);
  assert.deepEqual(contract.color_sizes, { Jaune: ["45"], Bleu: ["44"], Gris: ["44"] });
  assert.deepEqual(contract.out_of_stock_sizes, ["42", "43"]);
  assert.equal(contract.purchasable, true);
  const apiProduct = { ...product, ...contract };
  for (const color of product.colors) {
    assert.deepEqual(availableSizesForColor(apiProduct, color), contract.color_sizes[color]);
  }
  assert.deepEqual(catalogAvailability(apiProduct), contract, "Normalization is stable on repeat API reads");
});

test("API contract reflects stock edits, hidden products, and color pricing", () => {
  const empty = catalogAvailability({ ...product, stock: 0 });
  assert.equal(empty.purchasable, false);
  assert.deepEqual(empty.color_sizes.Jaune, []);
  assert.equal(catalogAvailability({ ...product, active: false }).purchasable, false);
  const changed = catalogAvailability({ ...product, tags: [...product.tags, '__cprice:Jaune:179:349'] });
  assert.deepEqual(changed.color_prices.Jaune, { price: 179, originalPrice: 349 });
  const preorder = catalogAvailability({ ...product, stock: 0, preorder_enabled: true });
  assert.equal(preorder.purchasable, true);
  assert.deepEqual(preorder.color_sizes.Jaune, product.sizes);
});

test("legacy explicit stock restrictions stay unavailable", () => {
  const legacy = { stock: 2, colors: ["Noir", "Blanc"], sizes: ["M", "L"], tags: ["__oos:Noir", "__sstock:L:2"] };
  const result = catalogAvailability(legacy);
  assert.deepEqual(result.out_of_stock_colors, ["Noir"]);
  assert.deepEqual(result.color_sizes, { Noir: [], Blanc: ["L"] });
});
