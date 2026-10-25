const {test}=require('node:test');
const assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const {load}=require('../scripts/inspect.cjs');
const {pcExplorerDocument}=load('lecomax-learning-app/utils/pc-photo-document.ts');
const {pcLearningIds}=load('lecomax-learning-app/utils/pc-learning.ts');
const {laptopChipTopics}=load('lecomax-learning-app/data/laptop-chip-topics.ts');
const {layerLabels}=load('lecomax-learning-app/utils/pc-layer-explorer.ts');
test('branded chip examples have intact localized text and preserve the packaged asset',()=>{
 const fs=require('node:fs'),path=require('node:path');
 for(const topic of laptopChipTopics)for(const lang of ['en','fr','ar'])for(const value of Object.values(topic).filter(v=>typeof v==='object')){
  assert.doesNotMatch(value[lang], /\?{2,}|\uFFFD/);
  if(lang==='ar')assert.match(value[lang], /[\u0600-\u06ff]/);
 }
 assert.match(laptopChipTopics[0].name.en,/Intel Core/);
 assert.match(laptopChipTopics[1].name.en,/NVIDIA/);
 for(const value of Object.values(layerLabels('ar')))assert.doesNotMatch(value,/\?{2,}|\uFFFD/);
 const root=path.join(__dirname,'..');
 const embedded=JSON.parse(fs.readFileSync(path.join(root,'data/laptop-revealed.json'),'utf8'));
 assert.equal(embedded,'data:image/jpeg;base64,'+fs.readFileSync(path.join(root,'assets/computer-lab/laptop-intel-nvidia-v3.jpg')).toString('base64'));
});
for(const lang of ['en','fr','ar']) test(`realistic chip reveal, inspect and restore (${lang})`,()=>{
 const dom=new JSDOM(pcExplorerDocument(lang),{runScripts:'dangerously',beforeParse(w){w.HTMLDialogElement.prototype.showModal=function(){this.open=true};w.HTMLDialogElement.prototype.close=function(){this.open=false}}});
 try{
  const d=dom.window.document,b=id=>d.getElementById(id);
  assert.equal(b('reveal-chips').hidden,true);
  b('laptop').click();assert.equal(b('reveal-chips').hidden,false);b('reveal-chips').click();
  const tile=d.querySelector('[data-removed="cooler"]');assert.ok(tile.classList.contains('layer-photo'));assert.ok(tile.querySelector('img').src.startsWith('data:image/jpeg;base64,'));
  for(const id of ['cpu','gpu']){d.querySelector(`[data-revealed="${id}"]`).click();assert.equal(b('piece-dialog').open,true);assert.match(b('piece-title').textContent,new RegExp(id,'i'));assert.equal(d.querySelector('.piece-photo').hidden,false);assert.equal(b('piece-image').src,tile.querySelector('img').src);assert.equal(b('piece-remove').disabled,true);b('piece-close').click()}
  b('reveal-chips').click();assert.equal(d.querySelector('[data-removed="cooler"]'),null);
  b('part-picker').value='gpu';b('part-picker').dispatchEvent(new dom.window.Event('change'));assert.ok(d.querySelector('[data-revealed="gpu"]'));
  b('learned').click();assert.equal(b('learned').disabled,true);assert.deepEqual(Array.from(pcLearningIds('["laptop:gpu"]')),['laptop:gpu']);
  b('layer-reset').click();assert.equal(d.querySelector('[data-removed="cooler"]'),null);assert.equal(b('part-picker').value,'cooler');
  b('desktop').click();assert.equal(b('reveal-chips').hidden,true);
 }finally{dom.window.close()}
});
