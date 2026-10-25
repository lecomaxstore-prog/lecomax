const { test } = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const { load } = require('../scripts/inspect.cjs');
const { starterWebFiles, previewDocument, validWebFiles } = load('lecomax-learning-app/utils/web-studio.ts');
test('preview renders the real page and runs button interaction with console output', () => {
  const logs = [];
  const dom = new JSDOM(previewDocument(starterWebFiles), { runScripts: 'dangerously', beforeParse(window) { window.console.log = (...values) => logs.push(values); } });
  try {
    assert.equal(dom.window.document.querySelector('#total').textContent, 'Total: 0 MAD');
    dom.window.document.querySelector('#add').click();
    dom.window.document.querySelector('#add').click();
    assert.equal(dom.window.document.querySelector('#total').textContent, 'Total: 160 MAD');
    assert.equal(logs.at(-1)[1], 160);
    const policy = dom.window.document.querySelector('meta[http-equiv="Content-Security-Policy"]').content;
    assert.match(policy, /connect-src 'none'/); assert.match(policy, /default-src 'none'/);
  } finally { dom.window.close(); }
});
test('workspace file validation rejects arbitrary paths and oversized content', () => {
  assert(validWebFiles(starterWebFiles));
  for (const input of [null, {}, { ...starterWebFiles, '../outside': 'x' }, { ...starterWebFiles, html: 'a'.repeat(20001) }, { ...starterWebFiles, css: 42 }]) assert.equal(validWebFiles(input), false);
});
