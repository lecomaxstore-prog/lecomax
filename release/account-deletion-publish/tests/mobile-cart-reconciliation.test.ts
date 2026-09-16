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
  assert.equal(result.cart[0]?.color, "Gris");
});

test("updates product data and clamps quantity to current live stock", () => {
  const stale = product({ price: 799, stock: 8 });
  const fresh = product({ price: 849, stock: 2 });
  const result = reconcileCartProducts([line(stale, { quantity: 5 })], [fresh]);
  assert.equal(result.cart[0]?.quantity, 2);
  assert.equal(result.cart[0]?.product.price, 849);
  assert.equal(result.adjusted.length, 1);
});

test("edited decimal shoe sizes remove sold-out sizes and cap remaining stock", () => {
  const fresh = product({
    sizes: ['44', '44.5', '41'], stock: 1,
    tags: ['__guide:shoes', '__sstock:44:0', '__sstock:44.5:1', '__sstock:41:0'],
  });
  const result = reconcileCartProducts([
    line(fresh, { size: '44' }),
    line(fresh, { size: '44.5', quantity: 3 }),
    line(fresh, { size: '41' }),
  ], [fresh]);
  assert.deepEqual(result.removed.map(item => item.size), ['44', '41']);
  assert.equal(result.cart.length, 1);
  assert.equal(result.cart[0].size, '44.5');
  assert.equal(result.cart[0].quantity, 1);
});

test("refreshes preorder snapshots, selected prices and canonical variant identifiers", () => {
  const fresh=product({stock:0,preorder_enabled:true,preorder_estimated_at:'2026-11-01',colors:['Noir'],color_stock:{Noir:0},color_prices:{Noir:{price:99}}});
  const result=reconcileCartProducts([line(product(),{color:'NOIR',fulfillment_type:'STANDARD'})],[fresh]);
  assert.equal(result.cart[0].color,'Noir');
  assert.equal(result.cart[0].product.price,99);
  assert.equal(result.cart[0].fulfillment_type,'PREORDER');
  assert.equal(result.cart[0].preorder_estimated_at,'2026-11-01');
  assert.equal(result.adjusted.length,1);
  assert.equal(reconcileCartProducts(result.cart,[{...fresh,preorder_enabled:false}]).removed.length,1);
  const stocked=reconcileCartProducts(result.cart,[{...fresh,stock:3,color_stock:{Noir:3},preorder_enabled:false}]);
  assert.equal(stocked.cart[0].fulfillment_type,'STANDARD');
  assert.equal(stocked.cart[0].preorder_estimated_at,null);
});
