import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateCouponDiscount,
  calculateCouponPricing,
  isProductAlreadyPromoted,
} from "../lib/coupon-pricing.ts";

test("discounted products are not coupon eligible", () => {
  const products = new Map<string, Record<string, unknown>>([
    ["full-price", { price: 200, original_price: null }],
    ["sale", { price: 80, original_price: 100 }],
  ]);

  const pricing = calculateCouponPricing([
    { slug: "full-price", quantity: 2 },
    { slug: "sale", quantity: 3 },
  ], products);

  assert.deepEqual(pricing, {
    subtotal: 640,
    eligibleSubtotal: 400,
    excludedSubtotal: 240,
    excludedItemsCount: 3,
  });
  assert.equal(calculateCouponDiscount("percent", 10, pricing.eligibleSubtotal), 40);
});

test("legacy oldPrice promotions remain excluded", () => {
  assert.equal(isProductAlreadyPromoted({ price: 69, oldPrice: 89 }), true);
  assert.equal(isProductAlreadyPromoted({ price: 89, oldPrice: 89 }), false);
});

test("fixed coupons never exceed the eligible subtotal", () => {
  assert.equal(calculateCouponDiscount("fixed", 500, 120), 120);
});

test("percentage calculations use integer MAD rounding", () => {
  assert.equal(calculateCouponDiscount("percent", 10, 69), 7);
});

test("invalid products and values never create a discount", () => {
  const pricing = calculateCouponPricing(
    [{ slug: "missing", quantity: 1 }],
    new Map(),
  );
  assert.equal(pricing.subtotal, 0);
  assert.equal(calculateCouponDiscount("percent", Number.NaN, 100), 0);
  assert.equal(calculateCouponDiscount("percent", -10, 100), 0);
});
