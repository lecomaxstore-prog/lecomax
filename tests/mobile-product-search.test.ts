import assert from "node:assert/strict";
import test from "node:test";
import { buildProductSearchIndex, searchProductIndex } from "../mobile/src/lib/product-search.ts";

const products = [
  { slug: "nike-blue", name: "Nike Air T-Shirt", category: "Homme", colors: ["Bleu"], description: "Coton respirant", sku: "NK-123", barcode: "1234567890123" },
  { slug: "bag", name: "Sac à dos de voyage", colors: ["Noir"], description: "Compression sous vide et fermeture antivol" },
  { slug: "slippers", name: "Chaussons fourrés pour femme", colors: ["Gris"] },
  { slug: "audio", name: "Écouteurs sans fil", brand: "GENAI", description: "Stéréo Bluetooth" },
  { slug: "shoes", name: "Baskets de running", category: "Homme", colors: ["Noir"] },
  { slug: "watch", name: "Montre connectée", tags: ["__internal:secret"] },
  { slug: "inactive", name: "Produit caché", active: false },
];
const index = buildProductSearchIndex(products);
const results = (query: string) => searchProductIndex(index, query).map(({ slug }) => slug);

test("search ignores accents, punctuation and word order across fields", () => {
  assert.deepEqual(results("bleu nike"), ["nike-blue"]);
  assert.deepEqual(results("ECOUTEURS"), ["audio"]);
  assert.deepEqual(results("t shirt bleu"), ["nike-blue"]);
});
test("search understands conversational text and multiword synonyms", () => {
  assert.deepEqual(results("je cherche un backpack noir pour voyage"), ["bag"]);
  assert.deepEqual(results("please show me blue tshirt"), ["nike-blue"]);
  assert.deepEqual(results("wireless earbuds"), ["audio"]);
});
test("search tolerates misspellings and transposed letters", () => {
  assert.deepEqual(results("backpak noir"), ["bag"]);
  assert.deepEqual(results("nkie"), ["nike-blue"]);
  assert.deepEqual(results("snekaers black"), ["shoes"]);
  assert.deepEqual(results("ecoutuer"), ["audio"]);
});
test("search supports common Arabic product, color and gender terms", () => {
  assert.deepEqual(results("بغيت حذاء اسود رجال"), ["shoes"]);
  assert.deepEqual(results("سماعات"), ["audio"]);
});
test("search finds descriptive details, partial words and exact identifiers", () => {
  assert.deepEqual(results("compression antivol"), ["bag"]);
  assert.deepEqual(results("respir"), ["nike-blue"]);
  assert.deepEqual(results("NK-123"), ["nike-blue"]);
  assert.deepEqual(results("1234567890123"), ["nike-blue"]);
  assert.deepEqual(results("montre"), ["watch"]);
});
test("search excludes unrelated matches and keeps every meaningful constraint", () => {
  assert.deepEqual(results("sac femme"), []);
  assert.deepEqual(results("refrigerateur"), []);
  assert.deepEqual(results("!!!"), products.filter((p) => p.active !== false).map((p) => p.slug));
  assert.deepEqual(results("je cherche"), []);
  assert.deepEqual(results("secret"), []);
  assert.deepEqual(results("produit cache"), []);
});
test("search ranks exact matches ahead of descriptive mentions", () => {
  const ranked = searchProductIndex(buildProductSearchIndex([
    { slug: "mention", name: "Sac", description: "Transport de baskets" },
    { slug: "exact", name: "Baskets" },
  ]), "baskets");
  assert.equal(ranked[0].slug, "exact");
});
test("search returns all matches without mutating the catalog", () => {
  const many = Array.from({ length: 35 }, (_, i) => ({ slug: `p-${i}`, name: "Polo bleu" }));
  assert.equal(searchProductIndex(buildProductSearchIndex(many), "polo").length, 35);
  assert.equal(many[0].slug, "p-0");
});
