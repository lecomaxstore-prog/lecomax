import test from 'node:test';
import assert from 'node:assert/strict';
import { apiToCard } from '../lib/products.ts';
import { selectNewArrivals, selectStoreBestsellers } from '../lib/store-collections.ts';
import { DEFAULT_SHIPPING_CONFIG, freeShippingLabel } from '../lib/shipping-config.ts';
const card=(slug:string, extra:Record<string,unknown>={})=>apiToCard({slug,name:slug,category:'homme',price:100,...extra});
test('new arrivals preserve homepage ordering, include new publications and exclude hidden/restored products',()=>{
 const rows=[card('new',{created_at:'2026-10-01'}),card('lenovo-new',{created_at:'2026-10-01',featured:true}),card('hidden',{active:false,featured:true}),card('original',{featured:true}),card('old')];
 assert.deepEqual(selectNewArrivals(rows).map(p=>p.slug),['new','original']);
 assert.deepEqual(selectNewArrivals([card('old')]).map(p=>p.slug),['old']);
 assert.deepEqual(selectNewArrivals([]),[]);
});
test('bestseller collection follows homepage fallback and existing eligibility without inactive products',()=>{
 const rows=[card('one'),card('nike-shoe'),card('ps5'),card('genai'),card('hidden',{active:false})];
 assert.deepEqual(selectStoreBestsellers(rows).map(p=>p.slug),['one','genai']);
 assert.deepEqual(selectStoreBestsellers([{...card('preferred'),badge:'Bestseller'},card('other')]).map(p=>p.slug),['preferred']);
 assert.deepEqual(selectStoreBestsellers([]),[]);
});
test('shipping reassurance reflects configured threshold and disabled free delivery',()=>{
 assert.match(freeShippingLabel({...DEFAULT_SHIPPING_CONFIG,freeThreshold:750}),/750 MAD/);
 assert.equal(freeShippingLabel({...DEFAULT_SHIPPING_CONFIG,freeShippingEnabled:false}), 'Livraison 40 MAD');
 assert.equal(freeShippingLabel({...DEFAULT_SHIPPING_CONFIG,freeThreshold:0}), 'Livraison 40 MAD');
});
