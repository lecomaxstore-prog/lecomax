import test from "node:test";
import assert from "node:assert/strict";
import { productShareCopy } from "../lib/product-share-copy.ts";

test("social copy keeps the product identity and factual price without duplicating the SEO title", () => {
  const copy = productShareCopy({ name: "Veste adidas Manchester United 2019/2020 – Presentation Jacket Rouge AON", price: 299, stock: 3 });
  assert.equal(copy.title, "Veste adidas Manchester United 2019/2020 | L’ECOMAX");
  assert.match(copy.description, /299 MAD · Disponible/);
  assert.ok(productShareCopy({ name: 'A'.repeat(150), price: 10 }).name.length <= 72);
});
test("social copy distinguishes sold out, preorder and unknown availability", () => {
  assert.match(productShareCopy({ name: 'Veste', price: 299, stock: 0 }).description, /épuisé/);
  assert.match(productShareCopy({ name: 'Veste', price: 299, stock: 0, preorderEnabled: true }).description, /précommande/);
  assert.match(productShareCopy({ name: 'Veste', price: 299 }).description, /Disponibilité sur la fiche/);
});
