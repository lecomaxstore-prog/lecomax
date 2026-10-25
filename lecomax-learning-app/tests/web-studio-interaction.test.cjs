const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { createRoot } = require('react-dom/client');
const { JSDOM } = require('jsdom');
const { load } = require('../scripts/inspect.cjs');
test('editor tabs, preview isolation, explanation and VS Code export work together', async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost:8081' });
  const previous = { window: global.window, document: global.document, IS_REACT_ACT_ENVIRONMENT: global.IS_REACT_ACT_ENVIRONMENT };
  Object.assign(global, { window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true });
  const box = ({ children }) => React.createElement('div', null, children);
  const school = { colors: {}, t: (_fr, en) => en };
  let submitted, explanation;
  const dependencies = {
    './UI': { Label: box, Row: box, Button: ({ title, onPress, disabled }) => React.createElement('button', { onClick: onPress, disabled }, title) },
    './TeacherUI': { TeacherSheet: ({ children, visible }) => visible ? React.createElement('div', null, children) : null },
    '../store/School': { useSchool: () => school },
    '../services/auth': { API: 'http://127.0.0.1:3002', auth: { token: async () => 'test-token' } },
    '../utils/web-studio': load('lecomax-learning-app/utils/web-studio.ts'),
  };
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(require.resolve('../components/TeacherWebStudio.web.tsx'), 'utf8'), { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText, {
    exports, require: name => dependencies[name] || require(name), window: dom.window, localStorage: dom.window.localStorage,
    setTimeout, clearTimeout, AbortController, requestAnimationFrame: fn => fn(),
    fetch: async (_url, options) => { submitted = JSON.parse(options.body); return { ok: true, json: async () => ({ directory: 'C:/practice/project', vscodeUrl: 'vscode://file/C:/practice/project' }) }; },
  });
  const root = createRoot(document.getElementById('root'));
  const click = async title => React.act(async () => [...document.querySelectorAll('button')].find(button => button.textContent === title).click());
  try {
    await React.act(async () => root.render(React.createElement(exports.TeacherWebStudio, { visible: true, onClose: () => {}, onExplain: value => { explanation = value; } })));
    assert.equal(document.querySelector('iframe').getAttribute('sandbox'), 'allow-scripts');
    assert.match(document.querySelector('textarea').value, /<main>/);
    await click('style.css'); assert.match(document.querySelector('textarea').value, /font-family/);
    await click('script.js'); assert.match(document.querySelector('textarea').value, /addEventListener/);
    await click('Save a copy for VS Code'); assert.match(submitted.html, /<main>/);
    assert.equal(document.querySelector('a').getAttribute('href'), 'vscode://file/C:/practice/project');
    await click('Explain this page'); assert.match(explanation, /addEventListener/);
  } finally { await React.act(async () => root.unmount()); dom.window.close(); Object.assign(global, previous); }
});
