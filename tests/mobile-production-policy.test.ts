import assert from "node:assert/strict";
import test from "node:test";
import {
  isPublicPersistedQuery,
  QUERY_CACHE_BUSTER,
} from "../mobile/src/lib/persistence-policy.ts";
import {
  isTabletWidth,
  productCardWidth,
  productGridColumns,
  responsiveContentWidth,
} from "../mobile/src/lib/responsive.ts";

test("only non-sensitive public catalogue queries are persisted", () => {
  for (const key of [
    ["products"],
    ["categories"],
    ["promotions"],
    ["settings"],
    ["recommendations", "wishlist"],
    ["banners"],
    ["reviews", "product-slug"],
  ]) {
    assert.equal(isPublicPersistedQuery(key), true);
  }

  for (const key of [
    ["customer-orders"],
    ["profile"],
    ["addresses"],
    ["session"],
    [],
  ]) {
    assert.equal(isPublicPersistedQuery(key), false);
  }
  assert.match(QUERY_CACHE_BUSTER, /^public-catalog-/);
});

test("responsive viewport preserves phones and uses tablet space safely", () => {
  assert.equal(isTabletWidth(599), false);
  assert.equal(isTabletWidth(600), true);
  assert.equal(responsiveContentWidth(390), 390);
  assert.equal(responsiveContentWidth(768), 736);
  assert.equal(responsiveContentWidth(1366), 960);
  assert.equal(responsiveContentWidth(Number.NaN), 320);
});

test("product grids scale from phone to large tablet layouts", () => {
  assert.equal(productGridColumns(390), 2);
  assert.equal(productGridColumns(736), 3);
  assert.equal(productGridColumns(960), 4);
  assert.equal(productCardWidth(2), "48.6%");
  assert.equal(productCardWidth(3), "31.8%");
  assert.equal(productCardWidth(4), "23.6%");
});
