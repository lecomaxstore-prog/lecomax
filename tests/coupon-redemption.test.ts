import assert from "node:assert/strict";
import test from "node:test";
import { couponStateAfterUse } from "../lib/coupon-redemption.ts";

test("one-use coupons expire immediately after redemption", () => {
  assert.deepEqual(couponStateAfterUse(0, 1), {
    usedCount: 1,
    active: false,
  });
});

test("multi-use coupons remain active until their final redemption", () => {
  assert.deepEqual(couponStateAfterUse(2, 4), {
    usedCount: 3,
    active: true,
  });
  assert.deepEqual(couponStateAfterUse(3, 4), {
    usedCount: 4,
    active: false,
  });
});

test("unlimited coupons remain active after redemption", () => {
  assert.deepEqual(couponStateAfterUse(12, null), {
    usedCount: 13,
    active: true,
  });
});
