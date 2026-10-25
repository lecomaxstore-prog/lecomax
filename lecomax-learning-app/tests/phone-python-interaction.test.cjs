const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { JSDOM } = require('jsdom');
const React = require('react');
const { createRoot } = require('react-dom/client');

test('phone editor calls native Python, displays real result contract, and sends it to teacher', async () => {
  const dom = new JSDOM('<div id="root"></div>');
  const saved = { window: global.window, document: global.document, IS_REACT_ACT_ENVIRONMENT: global.IS_REACT_ACT_ENVIRONMENT };
  Object.assign(global, { window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true });
  const box = ({ children }) => React.createElement('div', null, children);
  let calls = 0, stops = 0, prompt = '', closed = false;
  const dependencies = {
    'react-native': { View: box, NativeModules: { PhonePython: {
      run: async (code, input) => { calls++; assert.equal(code, 'print(115)'); assert.equal(input, ''); return JSON.stringify({ stdout: '115\n', stderr: '', exitCode: 0, durationMs: 2, version: '3.14', timedOut: false, cancelled: false, truncated: false }); },
      stop: () => { stops++; },
    } }, TextInput: ({ value, onChangeText, editable }) => React.createElement('textarea', { value, disabled: !editable, onChange: e => onChangeText(e.target.value) }) },
    '../store/School': { useSchool: () => ({ t: (_fr, en) => en, colors: {} }) },
    './UI': { Label: box, Row: box, Button: ({ title, disabled, onPress }) => React.createElement('button', { disabled, onClick: onPress }, title) },
    './TeacherUI': { TeacherSheet: ({ visible, children }) => visible ? React.createElement('div', null, children) : null },
    '../constants/design': { fonts: { code: 'monospace' } },
  };
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(require.resolve('../components/PhonePythonLab.tsx'), 'utf8'), { compilerOptions: { esModuleInterop: true, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText, {
    exports, require: name => dependencies[name] || require(name),
    fetch: () => { throw new Error('Phone Python must not use a server'); },
  });
  const root = createRoot(document.getElementById('root'));
  const button = text => [...document.querySelectorAll('button')].find(el => el.textContent === text);
  try {
    await React.act(async () => root.render(React.createElement(exports.PhonePythonLab, { visible: true, seed: { runtime: 'python', code: 'print(115)' }, onClose: () => { closed = true; }, onExplain: p => { prompt = p; } })));
    assert.equal(calls, 0);
    await React.act(async () => button('Run Python').click());
    assert.equal(calls, 1);
    assert.match(document.body.textContent, /CPython 3.14/);
    assert.match(document.body.textContent, /115/);
    await React.act(async () => button('I don’t understand · Ask AI Teacher').click());
    assert.match(prompt, /print\(115\)/);
    assert.match(prompt, /Actual CPython result on Android/);
    assert.match(prompt, /115/);
    assert.equal(closed, true);
  } finally { await React.act(async () => root.unmount()); dom.window.close(); Object.assign(global, saved); }
  assert(stops > 0);
});
