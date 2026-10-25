const { test } = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const { ts } = require('../scripts/inspect.cjs');
const source = require('node:fs').readFileSync(require('node:path').join(__dirname, '../utils/site-preview.ts'), 'utf8');
const sandbox = { exports: {}, URL };
require('node:vm').runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, sandbox);
const { previewHtml, readSiteEvent, sitePath } = sandbox.exports;
const wait = () => new Promise(resolve => setTimeout(resolve, 460));

function fixture() {
  const messages = [];
  const dom = new JSDOM(previewHtml('<html><head></head><body><section data-source-file="components/Header.tsx"><a href="https://lecomax.com/boutique"><span>Shop</span></a><button>Cart</button><form><input></form></section></body></html>', '', 'app/page.tsx'), {
    runScripts: 'dangerously', url: 'https://lecomax.com',
    beforeParse(window) { window.ReactNativeWebView = { postMessage: value => messages.push(JSON.parse(value)) }; },
  });
  return { dom, messages, click: () => dom.window.document.querySelector('span').click() };
}
test('one tap explains the actual element and its source region', async () => {
  const f = fixture();
  try {
    f.click(); await wait();
    assert.equal(f.messages.length, 1);
    assert.equal(f.messages[0].kind, 'select');
    assert.equal(f.messages[0].selection.path, 'components/Header.tsx');
    assert.equal(f.messages[0].selection.tag, 'a');
    assert.equal(f.messages[0].selection.label, 'Shop');
  } finally { f.dom.window.close(); }
});
test('double tap navigates once without opening an explanation', async () => {
  const f = fixture();
  try {
    f.click(); f.click();
    f.dom.window.document.querySelector('span').dispatchEvent(new f.dom.window.MouseEvent('dblclick', { bubbles: true }));
    await wait();
    assert.equal(f.messages.length, 1);
    assert.equal(f.messages[0].kind, 'navigate');
    assert.equal(sitePath(f.messages[0].href), '/boutique');
  } finally { f.dom.window.close(); }
});
test('learning forms cannot submit and bridge data is bounded', () => {
  const f = fixture();
  try {
    const event = new f.dom.window.Event('submit', { bubbles: true, cancelable: true });
    f.dom.window.document.querySelector('form').dispatchEvent(event);
    assert(event.defaultPrevented);
    assert.equal(readSiteEvent({ channel: 'lecomax-learning', kind: 'select', selection: { path: 'app/../../.env' } }), undefined);
    for (const value of ['javascript:alert(1)', 'https://example.com', '//evil.example', 'https://x:y@lecomax.com/']) assert.equal(sitePath(value), undefined);
  } finally { f.dom.window.close(); }
});
test('public captures contain no active scripts, handlers or customer forms', () => {
  const capture = require('../data/site-pages.json');
  assert(Object.keys(capture.pages).length >= 10);
  for (const [path, page] of Object.entries(capture.pages)) {
    assert.equal(sitePath(path), path);
    assert(!/<script\b|\son(?:click|load|error|submit)=|<iframe\b/i.test(page.html), path);
    assert(!/\s(?:action|formaction)=/i.test(page.html), path);
  }
});
test('captured categories remain visible without storefront scroll effects', () => {
  const dom = new JSDOM(previewHtml('<html><head></head><body><div data-source-file="components/CategoryTiles.tsx" style="opacity:0;transform:translateY(18px)">Categories</div></body></html>', '', 'app/page.tsx'), { runScripts: 'dangerously' });
  try { assert.equal(dom.window.document.querySelector('div').style.opacity, '1'); }
  finally { dom.window.close(); }
});
