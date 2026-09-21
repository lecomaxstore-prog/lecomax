import assert from "node:assert/strict";
import test from "node:test";
import { apiToCard, isNewArrivalEligible, products } from "../lib/products.ts";

test("restored Lenovo products stay available without new-arrival badges", () => {
  const lenovo = products.filter(product => /lenovo/i.test(product.slug));
  assert.equal(lenovo.length, 3);
  for (const product of lenovo) {
    assert.equal(product.badge, undefined);
    assert.equal(isNewArrivalEligible(product), false);
    assert.equal(apiToCard({ ...product, featured: true, created_at: new Date().toISOString() }).badge, undefined);
  }
});

test("brand identification excludes Lenovo but preserves other featured arrivals", () => {
  const product = { slug: "wireless-earbuds", name: "Wireless earbuds", category: "accessoires", price: 99, featured: true };
  assert.equal(apiToCard({ ...product, brand: "LENOVO" }).badge, undefined);
  assert.equal(apiToCard({ ...product, brand: "GENAI" }).badge, "Nouveau");
  assert.equal(isNewArrivalEligible(product), true);
});
