import test from 'node:test';
import assert from 'node:assert/strict';
import { parseProductPaste } from '../lib/product-paste.ts';

test('French ChatGPT labels and multiline descriptions map exactly', () => {
  const result = parseProductPaste('**Nom du produit :** Sac de sport\n**Description :** Sac 30 litres.\nPoche pour chaussures.\n\nBandoulière réglable.\nPrix : 249,90 MAD\nStock : 3\nTags : sport, sac');
  assert.deepEqual(result.fields, { name: 'Sac de sport', description: 'Sac 30 litres.\nPoche pour chaussures.\n\nBandoulière réglable.', price: '249.9', stock: '3', tags: 'sport, sac' });
});
test('JSON imports zero stock, tags array and supported fields only', () => {
  const result = parseProductPaste('```json\n'+JSON.stringify({name:'Sac',brand:'Exemple',price:150,stock:0,tags:['sport','sac'],original_price:200,weight:0.5,active:true})+'\n```');
  assert.equal(result.fields.stock, '0'); assert.equal(result.fields.tags,'sport, sac');
  assert.equal(result.fields.original_price, '200'); assert.equal(result.fields.weight,'0.5');
  assert.equal(Object.hasOwn(result.fields,'active'),false); assert.equal(result.warnings.length,1);
});
test('simple markdown tables and headings are supported', () => {
  const result = parseProductPaste('| Champ | Valeur |\n|---|---|\n| Nom | Sac |\n| Prix | 1 249,50 DH |\n| Catégorie | Accessoires |');
  assert.equal(result.fields.name,'Sac'); assert.equal(result.fields.price,'1249.5'); assert.equal(result.fields.category,'accessoires');
  assert.equal(parseProductPaste('### Description\nUn sac pratique.\nStock : 2').fields.description,'Un sac pratique.');
});
test('ambiguous units and unknown fields are reported without inventing values', () => {
  const result = parseProductPaste('Nom : Sac\nPrix : 20 USD\nStock : 2.5\nPoids : 500 g\nCatégorie : sport\nCouleurs : Noir');
  assert.deepEqual(result.fields,{name:'Sac'}); assert.equal(result.warnings.length,5);
});
test('rejects invalid JSON, unlabeled prose, HTML and internal inventory tags', () => {
  for(const text of ['{invalid}', 'Un beau sac pour le sport', 'a'.repeat(20001)]) assert.throws(()=>parseProductPaste(text));
  const result = parseProductPaste('Nom : Sac\nDescription : <script>alert(1)</script>\nTags : __sstock:M:999');
  assert.deepEqual(result.fields,{name:'Sac'}); assert.equal(result.warnings.length,2);
});
test('omitted fields remain absent and no empty values erase existing form data', () => {
  assert.deepEqual(parseProductPaste('Nom : Sac\nMarque :\nDescription :').fields,{name:'Sac'});
});
test('stock quantities with an explicit unit normalize without guessing', () => {
  assert.equal(parseProductPaste('Stock : 3 unités en stock').fields.stock,'3');
  assert.equal(parseProductPaste('Stock : 0 articles').fields.stock,'0');
});
