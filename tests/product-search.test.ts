import assert from "node:assert/strict";
import test from "node:test";
import { rankProducts, type SearchableProduct } from "../lib/product-search.ts";

const products: SearchableProduct[] = [
  {
    slug: "sac-voyage-noir",
    name: "Sac à dos de voyage",
    brand: "L'ecomax",
    category: "Accessoires",
    colors: ["Noir"],
    tags: ["bagage", "cabine"],
    description: "Sac antivol extensible",
    price: 849,
    stock: 2,
  },
  {
    slug: "chaussons-gris",
    name: "Chaussons fourrés pour femme",
    category: "Chaussures",
    colors: ["Gris"],
    price: 89,
    stock: 1,
  },
  {
    slug: "ecouteurs",
    name: "Écouteurs sans fil",
    category: "Audio",
    price: 199,
    stock: 3,
  },
];

test("product search ignores accents and ranks exact product words", () => {
  assert.equal(rankProducts(products, "ecouteurs")[0]?.slug, "ecouteurs");
});

test("product search tolerates a useful typo", () => {
  assert.equal(rankProducts(products, "backpak")[0]?.slug, "sac-voyage-noir");
});

test("product search indexes product variant colors", () => {
  assert.ok(rankProducts(products, "gris").some((product) => product.slug === "chaussons-gris"));
});

test("product search requires every word in a multi-word query", () => {
  assert.equal(rankProducts(products, "sac femme").length, 0);
});
