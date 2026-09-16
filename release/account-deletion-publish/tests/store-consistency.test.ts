import test from 'node:test';
import assert from 'node:assert/strict';
import { validateStoreSettings } from '../lib/store-settings.ts';
import { shippingConfigFromSettings } from '../lib/shipping-config.ts';
import { resolveShippingQuote, cleanShippingZonePayload } from '../lib/shipping-zones.ts';
import { asStock, SHOE_SIZE_VALUES } from '../lib/product-inventory.ts';

test('global free shipping switch overrides a city free-shipping threshold', () => {
  const zone = {id:'rabat', name:'Rabat', cities:['Rabat'], standard_rate:45, free_threshold:100, estimated_days:'3 jours', sort_order:0, active:true};
  const settings = {shipping_cost:'40',free_shipping_threshold:'500',free_shipping_enabled:'false'};
  assert.equal(resolveShippingQuote('Rabat', 600, [zone], shippingConfigFromSettings(settings)).cost,45);
  assert.equal(resolveShippingQuote('', 600, [zone], shippingConfigFromSettings(settings)).cost,40);
  settings.free_shipping_enabled='true';
  assert.equal(resolveShippingQuote('Rabat', 600, [zone], shippingConfigFromSettings(settings)).cost,0);
});

test('financial settings and shipping zones reject coercible and imprecise values', () => {
  for (const value of [null,true,false,'', ' ', -1, NaN, Infinity, 1.001]) {
    assert.ok(validateStoreSettings({shipping_cost:value}));
    assert.ok(cleanShippingZonePayload({standard_rate:value},true).error);
  }
  assert.equal(validateStoreSettings({shipping_cost:'45.50'}),null);
  assert.ok(validateStoreSettings({checkout_minimum_order:100,checkout_maximum_order:50}));
});

test('inventory accepts half-size labels and rejects non-numeric stock', () => {
  assert.ok(SHOE_SIZE_VALUES.includes('44.5'));
  for (const value of [null, true, false, '', ' ', {}, 1.5, -1]) assert.equal(asStock(value),null);
  assert.equal(asStock('4'),4);
});
