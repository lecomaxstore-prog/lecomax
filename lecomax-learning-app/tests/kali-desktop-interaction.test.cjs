const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { JSDOM } = require('jsdom');
const React = require('react');
const { createRoot } = require('react-dom/client');

async function fixture(fetch) {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost:8081' });
  const previous = { window: global.window, document: global.document, IS_REACT_ACT_ENVIRONMENT: global.IS_REACT_ACT_ENVIRONMENT };
  Object.assign(global, { window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true });
  const clients = [];
  class RFB extends dom.window.EventTarget {
    constructor(_target, url) { super(); this.url = url; clients.push(this); }
    focus() {}
    keys = [];
    sendKey(key, code) { this.lastKey = { key, code }; this.keys.push(this.lastKey); }
    disconnect() { this.closed = true; }
  }
  const box = ({ children }) => React.createElement('div', null, children);
  const dependencies = {
    'react-native': { View: box },
    '@novnc/novnc': { __esModule: true, default: RFB },
    '../services/auth': { auth: { token: async () => 'test-owner-token' }, API: 'http://127.0.0.1:3002' },
    '../store/School': { useSchool: () => ({ t: (_fr, en) => en }) },
    './UI': { Label: box, Row: box, Button: ({ title, onPress, disabled }) => React.createElement('button', { onClick: onPress, disabled }, title) },
  };
  const exports = {};
  const source = fs.readFileSync(require.resolve('../components/KaliDesktop.web.tsx'), 'utf8');
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { esModuleInterop: true, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText,
    { exports, require: name => dependencies[name] || require(name), fetch, AbortSignal, URL, URLSearchParams, console });
  const root = createRoot(document.getElementById('root'));
  return { dom, clients, root, Component: exports.KaliDesktop, cleanup: async () => { await React.act(() => root.unmount()); dom.window.close(); Object.assign(global, previous); } };
}

test('desktop connects, reports a disconnect, and stops the old session before reconnecting', async () => {
  const actions = [];
  let count = 0;
  const f = await fixture(async (_url, options) => {
    const body = JSON.parse(options.body); actions.push(body);
    return { ok: true, json: async () => body.action === 'start' ? { id: String(++count), ticket: 'test-ticket', password: 'testpass', port: 3003 } : { stopped: true } };
  });
  try {
    await React.act(async () => f.root.render(React.createElement(f.Component)));
    assert.equal(f.clients.length, 1);
    assert.match(f.clients[0].url, /^ws:\/\/127\.0\.0\.1:3003\/desktop\?ticket=test-ticket$/);
    await React.act(() => f.clients[0].dispatchEvent(new f.dom.window.Event('connect')));
    assert.match(document.body.textContent, /Kali desktop connected/);
    await React.act(() => [...document.querySelectorAll('button')].find(b => b.textContent === 'Enter').click());
    assert.deepEqual(f.clients[0].lastKey, { key: 0xff0d, code: 'Enter' });
    for (const [title, key, code] of [['Tab', 0xff09, 'Tab'], ['Esc', 0xff1b, 'Escape']]) {
      await React.act(() => [...document.querySelectorAll('button')].find(b => b.textContent === title).click());
      assert.deepEqual(f.clients[0].lastKey, { key, code });
    }
    const input = document.querySelector('input');
    const typeButton = () => [...document.querySelectorAll('button')].find(b => b.textContent === 'Type text');
    assert.equal(typeButton().disabled, true);
    // Invoke the controlled input handler: jsdom has no phone software keyboard.
    const propsKey = Object.keys(input).find(key => key.startsWith('__reactProps$'));
    await React.act(() => input[propsKey].onChange({ target: { value: 'Aéش😀' } }));
    await React.act(() => typeButton().click());
    assert.deepEqual(f.clients[0].keys.slice(-4), [
      { key: 65, code: '' }, { key: 233, code: '' },
      { key: 0x01000634, code: '' }, { key: 0x0101f600, code: '' },
    ]);
    assert.equal(input.value, '');
    assert.equal(typeButton().disabled, true);
    await React.act(() => f.clients[0].dispatchEvent(new f.dom.window.Event('disconnect')));
    assert.match(document.body.textContent, /Desktop disconnected/);
    assert.equal([...document.querySelectorAll('button')].find(b => b.textContent === 'Enter').disabled, true);
    await React.act(async () => [...document.querySelectorAll('button')].find(b => b.textContent === 'Reconnect').click());
    assert.deepEqual(actions.map(a => a.action), ['start', 'stop', 'start']);
    assert.equal(f.clients[0].closed, true);
  } finally { await f.cleanup(); }
  assert.equal(actions.at(-1).action, 'stop');
});

test('closing while the desktop starts stops the late session without connecting', async () => {
  let finish;
  const actions = [];
  const f = await fixture(async (_url, options) => {
    const body = JSON.parse(options.body); actions.push(body);
    if (body.action === 'start') return await new Promise(resolve => { finish = () => resolve({ ok: true, json: async () => ({ id: 'late', ticket: 'late', password: 'testpass', port: 3003 }) }); });
    return { ok: true, json: async () => ({ stopped: true }) };
  });
  try {
    await React.act(async () => f.root.render(React.createElement(f.Component)));
    await React.act(() => f.root.render(null));
    await React.act(async () => finish());
    assert.equal(f.clients.length, 0);
    assert.deepEqual(actions, [{ action: 'start' }, { action: 'stop', id: 'late' }]);
  } finally { await f.cleanup(); }
});
