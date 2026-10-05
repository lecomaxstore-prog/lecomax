import test from "node:test";
import assert from "node:assert/strict";
import { assistantShippingFacts } from "../lib/assistant-shipping-facts.ts";
import type { ShippingZoneRule } from "../lib/shipping-zones.ts";
import { DEFAULT_SHIPPING_CONFIG } from "../lib/shipping-config.ts";

const settings = { currency: "MAD", shipping_cost: "40", free_shipping_enabled: "true", free_shipping_threshold: "500", shipping_estimated_days: "1 à 5 jours" };
const zones: ShippingZoneRule[] = [
  { id: "city", name: "Casablanca", cities: ["Casablanca"], standard_rate: 25, free_threshold: 300, estimated_days: "1 à 2 jours", sort_order: 0, active: true },
  { id: "rest", name: "Other cities", cities: [], standard_rate: 99, free_threshold: 450, estimated_days: "3 à 5 jours", sort_order: 1, active: true },
];

test("assistant uses checkout national rules instead of stale catch-all zone values", () => {
  const facts = assistantShippingFacts(settings, zones);
  assert.deepEqual(facts.national, { price: 40, freeThreshold: 500, estimatedDays: DEFAULT_SHIPPING_CONFIG.estimatedDays });
  assert.deepEqual(facts.cities[0], { city: "Casablanca", price: 25, freeThreshold: 300, estimatedDays: DEFAULT_SHIPPING_CONFIG.estimatedDays });
});

test("disabled free shipping cannot leak zone thresholds into assistant facts", () => {
  const facts = assistantShippingFacts({ ...settings, free_shipping_enabled: "false" }, zones);
  assert.equal(facts.freeShippingEnabled, false);
  assert.equal(facts.national.freeThreshold, 0);
  assert.equal(facts.cities[0].freeThreshold, 0);
});

test("inactive zones are omitted and null thresholds inherit national configuration", () => {
  const facts = assistantShippingFacts(settings, [{ ...zones[0], free_threshold: null }, { ...zones[0], id: "inactive", cities: ["Rabat"], active: false }]);
  assert.equal(facts.cities.length, 1);
  assert.equal(facts.cities[0].freeThreshold, 500);
});
