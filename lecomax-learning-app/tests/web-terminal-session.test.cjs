const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { JSDOM } = require('jsdom');
const React = require('react');
const { createRoot } = require('react-dom/client');

test('web terminal starts directly, supports controls, refits on return and recovers after failure', async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost' });
  const saved = { window: global.window, document: global.document, IS_REACT_ACT_ENVIRONMENT: global.IS_REACT_ACT_ENVIRONMENT };
  Object.assign(global, { window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true });
  const requests = [], pumps = [], terms = [];
  let fits = 0, failStart = false, explained = '';
  class Terminal {
    cols = 80; rows = 24; buffer = { active: { length: 1, getLine: () => ({ translateToString: () => 'PS> 42' }) } };
    constructor() { terms.push(this); }
    loadAddon() {} open() {} focus() {} dispose() { this.disposed = true; }
    onData(fn) { this.input = fn; return { dispose() {} }; }
    getSelection() { return 'selected output'; } write(text) { this.output = text; } writeln() {}
  }
  Object.defineProperties(dom.window.HTMLElement.prototype, { clientWidth: { get: () => 480 }, clientHeight: { get: () => 500 } });
  const dependencies = {
    '@xterm/xterm': { Terminal }, '@xterm/addon-fit': { FitAddon: class { fit() { fits++; } } }, '@xterm/xterm/css/xterm.css': {},
    '../services/auth': { API: 'http://localhost', auth: { token: async () => 'test-token' } },
    '../store/School': { useSchool: () => ({ t: (_fr, en) => en, rtl: true }) },
    '../utils/terminal-pump': { createTerminalPump: options => {
      const pump = { options, writes: [], start() {}, stop() { this.stopped = true; }, wake() { this.woken = true; }, write(data) { this.writes.push(data); } }; pumps.push(pump); return pump;
    } },
  };
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(require.resolve('../components/WebTerminalSession.tsx'), 'utf8'), { compilerOptions: { esModuleInterop: true, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText, {
    exports, require: name => dependencies[name] || require(name), document, AbortSignal, Error,
    ResizeObserver: class { observe() {} disconnect() {} },
    fetch: async (_url, options) => { const body = JSON.parse(options.body); requests.push(body); return { ok: !failStart || body.action !== 'start', json: async () => body.action === 'start' ? failStart ? { error: 'LOCAL_LAB_ONLY' } : { id: 'test-session', cwd: 'C:\\lab' } : { output: '42', cursor: 2, exited: false } }; },
  });
  const root = createRoot(document.getElementById('root'));
  const render = active => root.render(React.createElement(exports.WebTerminalSession, { runtime: 'powershell', active, onExplain: value => { explained = value; } }));
  const button = text => [...document.querySelectorAll('button')].find(el => el.textContent.includes(text));
  try {
    await React.act(async () => render(true));
    assert.deepEqual(requests.map(r => r.action), ['start']);
    assert.match(document.body.textContent, /Connected/); assert.equal(document.querySelector('section').dir, 'rtl');
    await React.act(async () => { button('Ctrl+C').click(); button('Enter').click(); button('Ask teacher').click(); });
    assert.deepEqual(pumps[0].writes, ['\x03', '\r']); assert.match(explained, /selected output/);
    const before = fits;
    await React.act(async () => render(false)); await React.act(async () => render(true));
    assert.ok(fits > before); assert.equal(pumps[0].woken, true);
    await React.act(async () => pumps[0].options.fail(Error('NETWORK')));
    assert.match(document.body.textContent, /Connection lost/); assert.equal(button('Enter').disabled, true);
    failStart = true;
    await React.act(async () => button('Restart').click());
    assert.equal(pumps[0].stopped, true); assert.equal(terms[0].disposed, true);
    assert.match(document.body.textContent, /local learning server/); assert.match(document.body.textContent, /Unable to connect/);
    assert.ok(requests.some(r => r.action === 'stop'));
    failStart = false; await React.act(async () => button('Restart').click());
    assert.match(document.body.textContent, /Connected/);
    await React.act(async () => pumps.at(-1).options.read('hello'));
    assert.equal(requests.at(-1).data, 'hello'); assert.equal(terms.at(-1).output, '42');
  } finally { await React.act(async () => root.unmount()); dom.window.close(); Object.assign(global, saved); }
});
