import test from "node:test";
import assert from "node:assert/strict";
import {
  isMobileAudience,
  isMobileNotificationCategory,
  preferenceAllowsCategory,
} from "../lib/mobile-campaign-policy.ts";

test("mobile campaign targeting accepts only supported segments", () => {
  assert.equal(isMobileAudience("vip"), true);
  assert.equal(isMobileAudience("active_buyers"), true);
  assert.equal(isMobileAudience("arbitrary_sql"), false);
});

test("marketing preferences block opted-out campaign categories", () => {
  assert.equal(preferenceAllowsCategory("promotions", { promotions: false }), false);
  assert.equal(preferenceAllowsCategory("new_products", { marketing_enabled: false }), false);
  assert.equal(preferenceAllowsCategory("service", { marketing_enabled: false }), true);
});

test("unknown notification categories are rejected", () => {
  assert.equal(isMobileNotificationCategory("loyalty"), true);
  assert.equal(isMobileNotificationCategory("unbounded"), false);
});
