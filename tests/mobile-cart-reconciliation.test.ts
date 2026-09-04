import assert from "node:assert/strict";
import test from "node:test";
import { reconcileCartProducts } from "../mobile/src/lib/cart-reconciliation.ts";
import type { CartLine, Product } from "../mobile/src/types/commerce.ts";

function product(overrides: Partial<Product> = {}): Product {
  return {
    id: "bag-1",
    slug: "travel-bag",
    name: "Sac de voyage",
    category: "Accessoires",
    price: 849,
    original_price: null,
    description: null,
    images: [],
    stock: 1,
    active: true,
    created_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function line(item: Product, overrides: Partial<CartLine> = {}): CartLine {
  return { product: item, quantity: 1, ...overrides };
}

test("removes products no longer returned by the active catalogue", () => {
  const stale = line(product());
  const result = reconcileCartProducts([stale], []);
  assert.deepEqual(result.cart, []);
  assert.deepEqual(result.removed, [stale]);
});

test("removes the unavailable selected color without hiding an available color", () => {
  const fresh = product({
    stock: 1,
    colors: ["Noir", "Gris"],
    color_stock: { Noir: 0, Gris: 1 },
    out_of_stock_colors: ["Noir"],
  });
  const black = line(fresh, { color: "noir" });
  const gray = line(fresh, { color: "GRIS" });
  const result = reconcileCartProducts([black, gray], [fresh]);
  assert.equal(result.removed.length, 1);
  assert.equal(result.removed[0]?.color, "noir");
  assert.equal(result.cart[0]?.color, "GRIS");
});

test("updates product data and clamps quantity to current live stock", () => {
  const stale = product({ price: 799, stock: 8 });
  const fresh = product({ price: 849, stock: 2 });
  const result = reconcileCartProducts([line(stale, { quantity: 5 })], [fresh]);
  assert.equal(result.cart[0]?.quantity, 2);
  assert.equal(result.cart[0]?.product.price, 849);
  assert.equal(result.adjusted.length, 1);
});
