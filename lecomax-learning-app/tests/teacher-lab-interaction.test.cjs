const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { JSDOM } = require('jsdom');
const React = require('react');
const { createRoot } = require('react-dom/client');

test('lab requires review, displays real response and explains the exact executed code', async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost:8081' });
  const saved = { window: global.window, document: global.document, IS_REACT_ACT_ENVIRONMENT: global.IS_REACT_ACT_ENVIRONMENT };
  Object.assign(global, { window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true });
  const box = ({ children }) => React.createElement('div', null, children);
  let requests = 0, explained = '', closed = false;
  const dependencies = {
    'expo-router': { router: { push: () => {} } },
    'react-native': { Platform: { OS: 'ios' }, View: box, TextInput: ({ value, onChangeText, editable }) => React.createElement('textarea', { value, disabled: !editable, onChange: e => onChangeText(e.target.value) }) },
    './PhonePythonLab': { PhonePythonLab: () => { throw new Error('Android-only component'); } },
    './MobilePythonWorkspace': { MobilePythonWorkspace: () => { throw new Error('Android-only workspace'); } },
    '../store/School': { useSchool: () => ({ t: (_fr, en) => en, colors: {} }) },
    '../services/auth': { API: 'http://127.0.0.1:3002', auth: { token: async () => 'test-access' } },
    './UI': { Label: box, Row: box, Button: ({ title, disabled, onPress }) => React.createElement('button', { disabled, onClick: onPress }, title) },
    './TeacherUI': { TeacherSheet: ({ visible, children }) => visible ? React.createElement('div', null, children) : null },
    '../constants/design': { fonts: { code: 'monospace' } },
  };
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(require.resolve('../components/TeacherLab.tsx'), 'utf8'), { compilerOptions: { esModuleInterop: true, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText, {
    exports, require: name => dependencies[name] || require(name), AbortController, setTimeout, clearTimeout,
    fetch: async (_url, options) => { requests++; const input = JSON.parse(options.body); if (input.runtime === 'python') assert.match(input.code, /for item in cart:/); else assert.equal(input.code, 'console.log(7)'); assert.match(options.headers.Authorization, /test-access/); return { ok: true, json: async () => ({ stdout: input.runtime === 'python' ? 'Total: 190 MAD\n' : '7\n', stderr: '', exitCode: 0, durationMs: 22, timedOut: false, cancelled: false, truncated: false }) }; },
  });
  const root = createRoot(document.getElementById('root'));
  const button = text => [...document.querySelectorAll('button')].find(el => el.textContent === text);
  try {
    await React.act(async () => root.render(React.createElement(exports.TeacherLab, { visible: true, seed: { runtime: 'javascript', code: 'console.log(7)' }, onClose: () => { closed = true; }, onExplain: p => { explained = p; } })));
    assert.equal(requests, 0); assert.equal(button('Run code').disabled, true);
    await React.act(async () => button('I reviewed this code and its effects').click());
    await React.act(async () => button('Run code').click());
    assert.equal(requests, 1); assert.match(document.body.textContent, /Actual result.*22 ms/); assert.match(document.body.textContent, /7/);
    await React.act(async () => button('Explain the result and why').click());
    assert.match(explained, /console.log\(7\)/); assert.match(explained, /stdout/); assert.equal(closed, true);
    assert.equal(exports.labRuntime('tsx'), null); assert.equal(exports.labRuntime('ps1'), 'powershell');
    for (const language of ['python', 'python3', 'py']) assert.equal(exports.labRuntime(language), 'python');
    await React.act(async () => button('Python 3').click());
    assert.equal(button('Run code').disabled, true); assert.equal(requests, 1);
    await React.act(async () => button('I reviewed this code and its effects').click());
    await React.act(async () => button('Run code').click());
    assert.equal(requests, 2); assert.match(document.body.textContent, /Total: 190 MAD/);
    await React.act(async () => button('Explain the result and why').click());
    assert.match(explained, /```python/); assert.match(explained, /for item in cart:/);
  } finally { await React.act(async () => root.unmount()); dom.window.close(); Object.assign(global, saved); }
});

test('lab route never executes without local access, owner auth and valid input', async () => {
  for (const scenario of ['remote', 'guest', 'invalid', 'valid']) {
    let executions = 0;
    const modules = {
      'next/server': {},
      '@/lib/learning-mobile-auth': { mobileOwner: async () => scenario === 'guest' ? null : 'owner', mobileJson: (body, status = 200) => ({ body, status }) },
      '@/lib/request-body': { readJsonLimited: async () => ({ runtime: 'javascript', code: 'console.log(1)' }) },
      '@/lib/teacher-lab': { labAllowed: () => scenario !== 'remote', labInput: input => scenario === 'invalid' ? null : input, executeLab: async () => { executions++; return { stdout: '1' }; } },
    };
    const exports = {};
    const source = fs.readFileSync(require.resolve('../../app/api/learning-mobile/lab/route.ts'), 'utf8');
    vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports, require: name => modules[name], Error });
    const result = await exports.POST({ url: 'http://127.0.0.1:3002', headers: new Headers({ origin: 'http://localhost:8081' }) });
    assert.equal(result.status, { remote: 403, guest: 401, invalid: 400, valid: 200 }[scenario]);
    assert.equal(executions, scenario === 'valid' ? 1 : 0);
  }
});
