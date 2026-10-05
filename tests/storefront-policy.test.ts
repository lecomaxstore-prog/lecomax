import test from 'node:test';
import assert from 'node:assert/strict';
import {filterCategoryProducts} from '../lib/storefront-catalogue.ts';
import {DEFAULT_SHIPPING_CONFIG,shippingConfigFromSettings,shippingDeliveryTime} from '../lib/shipping-config.ts';
test('category results exclude other categories and inactive products',()=>{
 const rows=[{category:'homme'},{category:' HOMME '},{category:'femme'},{category:'homme',active:false}];
 assert.equal(filterCategoryProducts(rows,'homme').length,2);
 assert.equal(filterCategoryProducts(rows,'femme').length,1);
 assert.equal(filterCategoryProducts(rows,'all').length,3);
});
test('legacy delivery settings cannot override published delivery or structured data',()=>{
 for(const value of [undefined,'24-48h','2-5 jours ouvrables','1 jour']) {
  const config=shippingConfigFromSettings({shipping_estimated_days:value});
  assert.equal(config.estimatedDays,DEFAULT_SHIPPING_CONFIG.estimatedDays);
  assert.equal(shippingDeliveryTime(config)?.transitTime.minValue,3);
  assert.equal(shippingDeliveryTime(config)?.transitTime.maxValue,5);
 }
});
