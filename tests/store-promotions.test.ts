import test from 'node:test';
import assert from 'node:assert/strict';
import { isActivePromotion, selectPromotionProducts } from '../mobile/src/lib/store-promotions.ts';

const now = Date.parse('2026-09-10T12:00:00Z');
const products = [
  { id: 'selected', price: 100, original_price: null },
  { id: 'sale', price: 80, original_price: 100 },
  { id: 'regular', price: 100, original_price: 100, featured: true },
  { id: 'hidden', price: 50, original_price: 100, active: false },
];

test('both storefronts include dashboard selections and sale products without changing prices', () => {
  const result = selectPromotionProducts(products, [{ active: true, product_ids: ['selected', 'sale', 'hidden', 'deleted'] }], now);
  assert.deepEqual(result.map(p => p.id), ['selected', 'sale']);
  assert.equal(result[0].price, 100);
  assert.equal(result[1].price, 80);
});

test('removing or disabling a promotion removes its selection but preserves independent sale prices', () => {
  for (const promotions of [[], [{ active: false, product_ids: ['selected'] }]]) {
    assert.deepEqual(selectPromotionProducts(products, promotions, now).map(p => p.id), ['sale']);
  }
});

test('expired and invalid expiry dates cannot keep an offer active', () => {
  for (const expires_at of ['2026-09-09T12:00:00Z', '2026-09-10T12:00:00Z', 'invalid']) {
    assert.equal(isActivePromotion({ expires_at }, now), false);
    assert.deepEqual(selectPromotionProducts(products, [{ product_ids: ['selected'], expires_at }], now).map(p => p.id), ['sale']);
  }
  assert.equal(isActivePromotion({ expires_at: '2026-09-11T12:00:00Z' }, now), true);
  assert.equal(isActivePromotion({ expires_at: null }, now), true);
});
