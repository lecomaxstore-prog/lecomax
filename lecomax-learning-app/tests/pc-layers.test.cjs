const {test}=require('node:test');
const assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const {load}=require('../scripts/inspect.cjs');
const {pcExplorerDocument}=load('lecomax-learning-app/utils/pc-photo-document.ts');

for(const lang of ['en','fr','ar']) test(`remove, inspect hidden layer, teach and restore (${lang})`,()=>{
  const messages=[];
  const dom=new JSDOM(pcExplorerDocument(lang),{runScripts:'dangerously',beforeParse(w){
    w.parent.postMessage=value=>messages.push(JSON.parse(value));
    w.HTMLDialogElement.prototype.showModal=function(){this.open=true};
    w.HTMLDialogElement.prototype.close=function(){this.open=false};
  }});
  try{
    const d=dom.window.document,button=id=>d.getElementById(id);
    assert.equal(messages[0].type,'ready');
    button('laptop').click();
    function pick(id){const picker=button('part-picker');picker.value=id;picker.dispatchEvent(new dom.window.Event('change'))}
    pick('battery');button('layer-remove').click();
    assert.equal(d.querySelectorAll('[data-removed]').length,1);
    assert.ok(d.querySelector('[data-removed="battery"] img'), 'battery removal shows the illustrated empty bay');
    d.querySelector('[data-revealed="cables"]').click();
    assert.equal(button('piece-dialog').open,true);
    assert.equal(button('piece-title').textContent,button('title').textContent);
    d.querySelector('#piece-dialog [data-teacher="example"]').click();
    assert.deepEqual(messages.at(-1),{type:'ask-pc-teacher',device:'laptop',id:'cables',intent:'example'});
    button('piece-remove').click();
    assert.equal(button('piece-dialog').open,false);
    assert.equal(d.querySelectorAll('[data-removed]').length,2);
    pick('cooler');button('layer-remove').click();d.querySelector('[data-revealed="cpu"]').click();
    assert.equal(button('piece-remove').disabled,true,'soldered/hidden CPU is not removable');
    button('piece-close').click();
    button('desktop').click();assert.equal(d.querySelectorAll('[data-removed]').length,0);
    button('laptop').click();assert.equal(d.querySelectorAll('[data-removed]').length,3);
    button('layer-tray').querySelector('button').click();assert.equal(d.querySelector('[data-removed="battery"]'),null);
    button('layer-reset').click();assert.equal(d.querySelectorAll('[data-removed]').length,0);
    assert.equal(button('layer-reset').disabled,true);
    pick('battery');button('layer-remove').click();button('layer-remove').click();assert.equal(d.querySelectorAll('[data-removed]').length,0);
  }finally{dom.window.close()}
});
