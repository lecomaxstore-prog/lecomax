import test from "node:test";
import assert from "node:assert";
import { filterByConstraints, rankAssistantProducts, type CatalogProduct } from "../lib/assistant-retrieval.ts";

const mockProducts: CatalogProduct[] = [
  { slug: "shoe-1", name: "Nike Air Max", brand: "Nike", category: "chaussures", price: 1500, stock: 10, colors: ["Noir", "Blanc"], description: "Very comfortable running shoe" },
  { slug: "shoe-2", name: "Asics Gel", brand: "Asics", category: "chaussures", price: 1100, stock: 5, colors: ["Rouge"], description: "Lightweight and durable walking shoe" },
  { slug: "shoe-3", name: "Puma Suede", brand: "Puma", category: "chaussures", price: 800, stock: 0, colors: ["Bleu"], description: "Classic lifestyle sneaker" }
];

test('assistant checks live JSON inventory for decimal size combinations', () => {
  const product: CatalogProduct = {slug:'half-size',name:'Shoe',price:1490,stock:7,colors:['Black','White'],sizes:['44','44.5'],tags:['__vstock:["Black",{"44":3,"44.5":0}]','__vstock:["White",{"44":0,"44.5":4}]']};
  assert.equal(filterByConstraints([product],{sizes:['44.5'],colors:['Black']}).length,0);
  assert.equal(filterByConstraints([product],{sizes:['44.5'],colors:['White']}).length,1);
  assert.equal(filterByConstraints([product],{sizes:['45']}).length,0);
});

test("Assistant Retrieval & Ranking", async (t) => {
  await t.test("Filters by budget correctly", () => {
    const filtered = filterByConstraints(mockProducts, { budgetMax: 1200 });
    assert.strictEqual(filtered.length, 1);
    assert.strictEqual(filtered[0].slug, "shoe-2"); // shoe-3 is out of stock so it gets filtered out by stock logic
  });

  await t.test("Filters out out-of-stock items", () => {
    const filtered = filterByConstraints(mockProducts, { category: "chaussures" });
    assert.strictEqual(filtered.length, 2);
    assert.ok(!filtered.some(p => p.slug === "shoe-3"));
  });

  await t.test("Ranks matching priorities higher", () => {
    const ranked = rankAssistantProducts(mockProducts, "running", { priorities: ["comfortable"] });
    assert.ok(ranked.length > 0 && ranked.length <= 3);
    assert.strictEqual(ranked[0].productSlug, "shoe-1"); // Matches 'comfortable'
  });
});
