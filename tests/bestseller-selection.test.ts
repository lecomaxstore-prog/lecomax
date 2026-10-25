import test from 'node:test';
import assert from 'node:assert/strict';
import { BESTSELLER_SLUGS, isBestsellerEligible, selectBestsellers } from '../lib/bestseller-eligibility.ts';
const requested = BESTSELLER_SLUGS.map((slug) => ({ slug, name: slug, price: 149 }));
test('selects only the four requested products in owner order regardless of input order', () => {
  const catalogue = [{slug:'adidas-jacket',name:'Veste adidas',price:299}, ...requested.toReversed(), {slug:'genai-other',name:'GENAI other',price:99}];
  assert.deepEqual(selectBestsellers(catalogue), requested);
  assert.equal(isBestsellerEligible(catalogue[0]), false);
});
test('does not duplicate products or backfill unavailable entries', () => {
  assert.deepEqual(selectBestsellers([requested[2],requested[0],requested[0]]), [requested[0],requested[2]]);
  assert.deepEqual(selectBestsellers([]), []);
  assert.equal(selectBestsellers(requested)[0], requested[0]);
});
