import test from 'node:test';
import assert from 'node:assert/strict';
import { categoryProductCounts, filterCategoryProducts, maximumProductDiscount } from '../lib/storefront-catalogue.ts';
import { selectPromotionProducts } from '../mobile/src/lib/store-promotions.ts';
import { shippingConfigFromSettings, shippingDeliveryTime } from '../lib/shipping-config.ts';

test('counts match category results after publication, removal and category changes, including an empty catalogue', () => {
  const products = [
    { category: 'homme', active: true }, { category: ' HOMME ', active: true },
    { category: 'femme', active: true }, { category: 'homme', active: false },
  ];
  const check = (rows: typeof products) => {
    const counts = categoryProductCounts(rows);
    for (const category of ['homme', 'femme', 'chaussures', 'accessoires']) {
      assert.equal(counts[category] ?? 0, filterCategoryProducts(rows, category).length);
    }
  };
  assert.equal(categoryProductCounts(products).homme, 2);
  check(products);
  products[0].category = 'accessoires'; check(products);
  products[1].active = false; check(products);
  products[3].active = true; check(products);
  products.splice(2, 1); check(products);
  check([]);
  assert.equal(filterCategoryProducts(products, 'missing').length, 0);
});

test('maximum savings use valid live prices, not expired campaign claims', () => {
  const products = [
    { id: 'sale', active: true, price: 50, original_price: 100 },
    { id: 'expired-selection', active: true, price: 100, original_price: 100 },
    { id: 'hidden', active: false, price: 1, original_price: 100 },
  ];
  const selected = selectPromotionProducts(products, [
    { active: true, expires_at: '2000-01-01', product_ids: ['expired-selection'] },
    { active: false, product_ids: ['expired-selection'] },
  ]);
  assert.equal(maximumProductDiscount(selected.map(p => ({ ...p, oldPrice: p.original_price }))), 50);
  assert.equal(maximumProductDiscount([{ price: 2, oldPrice: 3 }]), 33);
  assert.equal(maximumProductDiscount([{ price: 0, oldPrice: 100 }]), 100);
  for (const item of [{ price: -1, oldPrice: 100 }, { price: 10, oldPrice: 0 },
    { price: NaN, oldPrice: 100 }, { price: 1, oldPrice: Infinity }, { price: 200, oldPrice: 100 }]) {
    assert.equal(maximumProductDiscount([item]), 0);
  }
  assert.equal(maximumProductDiscount([]), 0);
});

test('structured delivery uses the same configured estimate and omits unsupported promises', () => {
  const config = shippingConfigFromSettings({ shipping_estimated_days: '3–7 jours ouvrables' });
  assert.equal(shippingDeliveryTime(config)?.transitTime.minValue, 3);
  assert.equal(shippingDeliveryTime(config)?.transitTime.maxValue, 7);
  assert.equal(shippingDeliveryTime({ ...config, estimatedDays: 'Sur rendez-vous' }), undefined);
  assert.equal(shippingDeliveryTime({ ...config, estimatedDays: '7–3 jours ouvrables' }), undefined);
});
