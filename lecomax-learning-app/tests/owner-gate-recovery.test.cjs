const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { createRoot } = require('react-dom/client');
const { JSDOM } = require('jsdom');

test('connection screen retries and returns to sign-in without exposing protected content', async () => {
  const dom = new JSDOM('<div id="root"></div>');
  const saved = { window: global.window, document: global.document, IS_REACT_ACT_ENVIRONMENT: global.IS_REACT_ACT_ENVIRONMENT };
  Object.assign(global, { window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true });
  let status = 'offline', retries = 0;
  const listeners = new Set();
  const auth = {
    subscribe: fn => { listeners.add(fn); return () => listeners.delete(fn); },
    snapshot: () => status,
    restore: async () => {},
    retry: async () => { retries++; throw Error('unavailable'); },
    invalidate: async () => { status = 'signedOut'; listeners.forEach(fn => fn()); },
  };
  const box = ({ children }) => React.createElement('div', null, children);
  const dependencies = {
    'expo-router': { usePathname: () => '/' },
    'react-native': { View: box, ActivityIndicator: () => null, Platform: { OS: 'web' }, AppState: { addEventListener: () => ({ remove() {} }) }, Keyboard: { dismiss() {} } },
    '@expo/vector-icons/Ionicons': { __esModule: true, default: () => null },
    '../components/UI': { Label: box, Button: ({ title, onPress, disabled }) => React.createElement('button', { onClick: onPress, disabled }, title) },
    './AuthLayout': { AuthLayout: box, AuthField: ({ label }) => React.createElement('input', { 'aria-label': label }) },
    '../store/School': { useSchool: () => ({ t: (_fr, en) => en, colors: {}, update() {} }) },
    '../services/auth': { auth, SessionError: class extends Error {} },
    '../components/PhonePythonLab': { PhonePythonLab: () => null },
  };
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(require.resolve('../features/OwnerGate.tsx'), 'utf8'), { compilerOptions: { esModuleInterop: true, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText, { exports, require: name => dependencies[name] || require(name), setInterval: () => 1, clearInterval() {} });
  const root = createRoot(document.getElementById('root'));
  const click = async title => {
    const button = [...document.querySelectorAll('button')].find(el => el.textContent === title);
    assert.ok(button, title);
    await React.act(() => button.click());
  };
  try {
    await React.act(() => root.render(React.createElement(exports.OwnerGate, null, 'PROTECTED')));
    assert.match(document.body.textContent, /Connection required/);
    await click('Retry');
    assert.equal(retries, 1);
    assert.match(document.body.textContent, /Connection required/);
    assert.doesNotMatch(document.body.textContent, /PROTECTED/);
    await click('Back to sign in');
    assert.ok(document.querySelector('input[aria-label="Email address"]'));
    assert.doesNotMatch(document.body.textContent, /Connection required|PROTECTED/);
  } finally {
    await React.act(() => root.unmount());
    dom.window.close();
    Object.assign(global, saved);
  }
});
