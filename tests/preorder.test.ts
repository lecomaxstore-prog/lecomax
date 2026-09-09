import assert from 'node:assert/strict';
import test from 'node:test';
import { getPurchasability, selectedInventory, preorderSnapshot } from '../mobile/src/lib/purchasability.ts';

test('preorder decision uses physical stock, requested quantity and explicit opt-in',()=>{
  for(const enabled of [true,false]) assert.equal(getPurchasability(5,enabled),'STANDARD');
  assert.equal(getPurchasability(0,true),'PREORDER');
  assert.equal(getPurchasability(0,false),'OUT_OF_STOCK');
  assert.equal(getPurchasability(2,true,4),'PREORDER');
  for(const qty of [0,-1,1.5,21,NaN]) assert.equal(getPurchasability(5,true,qty),'OUT_OF_STOCK');
});
test('selected combination is authoritative, and missing variants are invalid',()=>{
  const p={stock:5,colors:['Black'],sizes:['M','L'],color_stock:{Black:5},tags:['__vstock:["Black",{"M":5,"L":0}]']};
  assert.equal(selectedInventory(p,'Black','M'),5);
  assert.equal(selectedInventory(p,'Black','L'),0);
  assert.equal(selectedInventory(p,'Black','XL'),-1);
  assert.equal(selectedInventory(p,undefined,'L'),-1);
  assert.equal(preorderSnapshot({preorder_enabled:true},-1).fulfillment_type,'STANDARD');
});
test('order snapshot is independent of later product edits',()=>{
  const p={preorder_enabled:true,preorder_message:'October'};
  const snapshot=preorderSnapshot(p,0);
  p.preorder_enabled=false;p.preorder_message='November';
  assert.equal(snapshot.fulfillment_type,'PREORDER');assert.equal(snapshot.preorder_message,'October');
  assert.equal(preorderSnapshot(p,3).preorder_message,null);
});

test('all requested stock and quantity combinations have consistent fulfillment',()=>{
  for (const enabled of [true,false]) for (const [stock,quantity] of [[1,1],[1,2],[0,5]]) {
    assert.equal(getPurchasability(stock,enabled,quantity),stock>=quantity?'STANDARD':enabled?'PREORDER':'OUT_OF_STOCK');
  }
  assert.equal(getPurchasability(-1,true),'OUT_OF_STOCK');
});

test('invented selections and malformed inventory cannot become preorders',()=>{
  assert.equal(selectedInventory({stock:5},'fake'),-1);
  assert.equal(selectedInventory({stock:5},undefined,'fake'),-1);
  const base={stock:5,colors:['Black'],sizes:['M']};
  for(const value of ['NaN', '-1', '1.5']) {
    assert.equal(selectedInventory({...base,tags:[`__sstock:M:${value}`]},'Black','M'),-1);
  }
});
