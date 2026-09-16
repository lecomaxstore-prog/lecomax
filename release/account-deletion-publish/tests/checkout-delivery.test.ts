import assert from "node:assert/strict";
import test from "node:test";
import { calculateCheckoutTotal } from "../lib/checkout-total.ts";
import {
  calculateShipping,
  DEFAULT_SHIPPING_CONFIG,
  effectiveFreeShippingMinimum,
  qualifiesForFreeShipping,
} from "../lib/shipping-config.ts";

const fallback = {
  cost: 35,
  freeThreshold: 500,
  estimatedDays: "2–5 jours",
};

test("standard delivery defaults to 40 MAD and retains free delivery", () => {
  assert.equal(calculateShipping(300, DEFAULT_SHIPPING_CONFIG), 40);
  assert.equal(calculateShipping(500, DEFAULT_SHIPPING_CONFIG), 0);
  assert.equal(calculateCheckoutTotal({ subtotal: 300, shipping: calculateShipping(300, DEFAULT_SHIPPING_CONFIG) }), 340);
});

test("delivery calculation charges the configured rate below the threshold", () => {
  assert.equal(calculateShipping(200, fallback), 35);
});

test("delivery becomes free at the displayed threshold with its courtesy margin", () => {
  assert.equal(effectiveFreeShippingMinimum(500), 499);
  assert.equal(qualifiesForFreeShipping(499, 500), true);
  assert.equal(calculateShipping(499, fallback), 0);
});

test("server checkout total includes delivery and payment fee once", () => {
  assert.equal(
    calculateCheckoutTotal({
      subtotal: 500,
      shipping: 35,
      paymentFee: 10,
      discount: 50,
    }),
    495,
  );
});

test("discounts cannot make the final total negative", () => {
  assert.equal(
    calculateCheckoutTotal({
      subtotal: 100,
      shipping: 0,
      discount: 500,
    }),
    0,
  );
  assert.throws(
    () => calculateCheckoutTotal({ subtotal: -1, shipping: 0 }),
    /CHECKOUT_TOTAL_INPUT_INVALID/,
  );
});
