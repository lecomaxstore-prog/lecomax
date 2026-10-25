const { test } = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const { load } = require('../scripts/inspect.cjs');
const { pcExplorerDocument } = load('lecomax-learning-app/utils/pc-photo-document.ts');
for (const language of ['en', 'fr', 'ar']) test(`zoom pan, bounds, click suppression and reset (${language})`, () => {
  const dom = new JSDOM(pcExplorerDocument(language), { runScripts: 'dangerously' });
  try {
    const w = dom.window, d = w.document, v = d.querySelector('.photo-viewport');
    for (const [key, value] of Object.entries({ clientWidth: 400, clientHeight: 500, scrollWidth: 800, scrollHeight: 1200 })) Object.defineProperty(v, key, { value });
    const pointer = (type, x, y, id = 1) => { const e = new w.MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y }); Object.defineProperty(e, 'pointerId', { value: id }); v.dispatchEvent(e); };
    d.getElementById('laptop').click();
    pointer('pointerdown', 200, 200); pointer('pointermove', 100, 100); pointer('pointerup', 100, 100);
    assert.equal(v.scrollLeft, 0); assert.equal(v.scrollTop, 0);
    d.getElementById('photo-zoom').click(); v.scrollLeft = 100; v.scrollTop = 150;
    pointer('pointerdown', 200, 200); pointer('pointermove', 120, 90, 2);
    assert.equal(v.scrollLeft, 100, 'ignore other pointers');
    pointer('pointermove', 120, 90); assert.equal(v.scrollLeft, 180); assert.equal(v.scrollTop, 260);
    pointer('pointermove', -2000, -2000); assert.equal(v.scrollLeft, 400); assert.equal(v.scrollTop, 700);
    pointer('pointerup', -2000, -2000); assert.equal(v.classList.contains('panning'), false);
    let clicks = 0; const photo = d.getElementById('interior-image'); photo.addEventListener('click', () => clicks++);
    photo.click(); assert.equal(clicks, 0, 'drag does not select a part');
    pointer('pointerdown', 100, 100); pointer('pointerup', 100, 100); photo.click(); assert.equal(clicks, 1, 'tap still works');
    v.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true })); assert.equal(v.scrollLeft, 340);
    pointer('pointerdown', 100, 100); pointer('pointermove', 130, 130); pointer('pointercancel', 130, 130); pointer('pointermove', 200, 200); assert.equal(v.scrollLeft, 310);
    d.getElementById('photo-fit').click(); assert.equal(v.scrollLeft, 0); assert.equal(v.scrollTop, 0); assert.equal(v.classList.contains('zoomed'), false);
  } finally { dom.window.close(); }
});
