const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { createRoot } = require('react-dom/client');
const { JSDOM } = require('jsdom');

test('My PC pairs only after connect, restricts navigation and disconnects on background', async () => {
  const dom = new JSDOM('<div id="root"></div>');
  const saved = { window: global.window, document: global.document, IS_REACT_ACT_ENVIRONMENT: global.IS_REACT_ACT_ENVIRONMENT };
  Object.assign(global, { window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true });
  let input, web, background, savedAddress, removed = false;
  const box = ({ children }) => React.createElement('div', null, children);
  const urlExports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(require.resolve('../utils/pc-remote.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports: urlExports, URL });
  const deps = {
    'react-native': { View: box, ScrollView: box, TextInput: props => { input = props; return React.createElement('input', { value: props.value, readOnly: true }); }, AppState: { addEventListener: (_name, callback) => { background = callback; return { remove: () => { removed = true; } }; } } },
    'react-native-webview': { WebView: props => { web = props; return React.createElement('div', { id: 'webview' }); } },
    '@react-native-async-storage/async-storage': { getItem: async () => null, setItem: async (_key, value) => { savedAddress = value; } },
    '../store/School': { useSchool: () => ({ t: (_fr, en) => en, colors: {} }) },
    './UI': { Label: box, Button: ({ title, onPress }) => React.createElement('button', { onClick: onPress }, title) },
    '../utils/pc-remote': urlExports,
  };
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(require.resolve('../components/PcDesktop.tsx'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX } }).outputText, { exports, require: name => deps[name] || require(name) });
  const root = createRoot(document.getElementById('root'));
  const click = () => document.querySelector('button').click();
  try {
    await React.act(async () => root.render(React.createElement(exports.PcDesktop)));
    assert.equal(document.querySelector('#webview'), null);
    await React.act(async () => input.onChangeText('http://evil.example'));
    await React.act(async () => click());
    assert.equal(document.querySelector('#webview'), null);
    await React.act(async () => input.onChangeText('192.168.1.11'));
    await React.act(async () => click());
    assert.ok(document.querySelector('#webview'));
    assert.equal(savedAddress, 'http://192.168.1.11:6081');
    assert.equal(web.incognito, true); assert.equal(web.allowFileAccess, false);
    assert.equal(web.onShouldStartLoadWithRequest({ url: 'https://evil.example' }), false);
    assert.equal(web.onShouldStartLoadWithRequest({ url: 'http://192.168.1.11:6081.evil.example/' }), false);
    assert.equal(web.onShouldStartLoadWithRequest({ url: 'http://192.168.1.11:6081/' }), true);
    await React.act(async () => background('background'));
    assert.equal(document.querySelector('#webview'), null);
    await React.act(async () => click());
    assert.ok(document.querySelector('#webview'));
    await React.act(async () => click());
    assert.equal(document.querySelector('#webview'), null);
    await React.act(async () => input.onChangeText('100.100.20.30'));
    await React.act(async () => click());
    assert.equal(web.source.uri, 'http://100.100.20.30:6081/');
    assert.equal(savedAddress, 'http://100.100.20.30:6081');
    assert.equal(web.onShouldStartLoadWithRequest({ url: 'http://100.100.20.31:6081/' }), false);
  } finally { await React.act(async () => root.unmount()); assert.equal(removed, true); dom.window.close(); Object.assign(global, saved); }
});
