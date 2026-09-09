import test from 'node:test';
import assert from 'node:assert/strict';
import {productDuplicate} from '../lib/product-duplicate.ts';
import {colorSizeStockFromTags} from '../lib/product-inventory.ts';
test('product copies preserve content and decimal variants, never identifiers or sellable stock',()=>{
  const source={id:'old',name:'Kayano',slug:'kayano',sku:'SKU-OLD',barcode:'old-code',active:true,featured:true,price:1490,category:'chaussures',stock:4,colors:['Black'],sizes:['44.5'],images:['/shoe.webp'],preorder_enabled:true,tags:['__guide:shoes','__vstock:["Black",{"44.5":4}]','__cprice:Black:1490:1600','__sku:old']};
  const copy=productDuplicate(source,'1234abcd');
  assert.equal(copy.active,false);assert.equal(copy.stock,0);assert.equal(copy.preorder_enabled,false);
  assert.equal(copy.slug,'kayano-copie-1234abcd');assert.ok(!('id' in copy));assert.ok(!('sku' in copy));assert.ok(!('barcode' in copy));
  assert.deepEqual(copy.images,source.images);assert.deepEqual(copy.sizes,['44.5']);
  assert.equal(colorSizeStockFromTags(copy.tags).Black['44.5'],0);
  assert.equal(colorSizeStockFromTags(source.tags).Black['44.5'],4);
  assert.notEqual(productDuplicate(source,'abcdef12').slug,copy.slug);
});
