import test from 'node:test';
import assert from 'node:assert/strict';
import { bulkProductPatch, parseBulkInput, type BulkInput, type BulkProduct } from '../lib/product-bulk.ts';
import { colorSizeStockFromTags, sizeStockFromTags } from '../lib/product-inventory.ts';
import { colorPricesFromTags } from '../lib/product-variant-pricing.ts';
const product: BulkProduct = { id:'00000000-0000-0000-0000-000000000001', slug:'kayano', name:'ASICS GEL-KAYANO 32', active:true, category:'chaussures', price:200, original_price:null, stock:9, colors:['Black','White'], sizes:['44.5','45'], color_stock:{Black:2,White:7}, tags:['__vstock:["Black",{"44.5":2,"45":0}]','__vstock:["White",{"44.5":7,"45":0}]','__sstock:44.5:9','__sstock:45:0','__cprice:White:250:300'] };
const input = (action: BulkInput['action'], extra: Partial<BulkInput> = {}): BulkInput => ({ids:[product.id],action,confirmation:`${action}:1`,...extra});
test('bulk payload requires bounded unique IDs, an explicit action and matching confirmation', () => {
  assert.equal(parseBulkInput(input('archive')).action,'archive');
  for (const invalid of [null,{},input('delete',{confirmation:'publish:1'}),input('stock',{value:true as unknown as number}),input('stock',{value:1.5}),input('promotion',{value:100}),input('category',{value:'unknown'}),input('publish',{ids:[product.id,product.id]})]) assert.throws(()=>parseBulkInput(invalid));
});
test('decimal color-size adjustments preserve other variants and synchronize every inventory representation', () => {
  const patch = bulkProductPatch(product,input('stock',{value:3,color:'Black',size:'44.5'}));
  assert.equal(patch.stock,12);
  assert.deepEqual(patch.color_stock,{Black:5,White:7});
  assert.equal(colorSizeStockFromTags(patch.tags).Black['44.5'],5);
  assert.equal(colorSizeStockFromTags(patch.tags).Black['45'],0);
  assert.equal(colorSizeStockFromTags(patch.tags).White['44.5'],7);
  assert.equal(sizeStockFromTags(patch.tags)['44.5'],12);
  assert.equal(colorSizeStockFromTags(product.tags).Black['44.5'],2);
  for (const options of [{value:-3,color:'Black',size:'44.5'},{value:2,color:'Black',size:'46'},{value:2}]) assert.throws(()=>bulkProductPatch(product,input('stock',options)));
});
test('promotion applies to base and color prices without compounding on retry', () => {
  const patch=bulkProductPatch(product,input('promotion',{value:10}));
  assert.equal(patch.price,180); assert.equal(patch.original_price,200);
  assert.equal(colorPricesFromTags(patch.tags).White.price,270);
  assert.deepEqual(bulkProductPatch({...product,...patch} as BulkProduct,input('promotion',{value:10})),patch);
  assert.deepEqual(colorSizeStockFromTags(patch.tags),colorSizeStockFromTags(product.tags));
});
test('archive preserves stock and content; publish restores an archived product', () => {
  const patch=bulkProductPatch(product,input('archive'));
  assert.equal(patch.active,false); assert.ok((patch.tags as string[]).includes('__archived')); assert.ok(!('stock' in patch));
  const restored=bulkProductPatch({...product,...patch} as BulkProduct,input('publish'));
  assert.equal(restored.active,true); assert.ok(!(restored.tags as string[]).includes('__archived'));
});
