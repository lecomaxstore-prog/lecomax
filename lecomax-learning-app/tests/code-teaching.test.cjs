const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { createRoot } = require('react-dom/client');
const { JSDOM } = require('jsdom');
function evaluate(file, deps) {
  const output = ts.transpileModule(fs.readFileSync(require.resolve(file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const exports = {};
  vm.runInNewContext(output, { exports, require(name) { if (name in deps) return deps[name]; if (name === 'react' || name === 'react/jsx-runtime') return require(name); throw Error(name); } });
  return exports;
}

test('environment walkthrough switches platform, explains commands and reveals troubleshooting', async () => {
  const dom = new JSDOM('<div id="root"></div>');
  const previous = { window: global.window, document: global.document, IS_REACT_ACT_ENVIRONMENT: global.IS_REACT_ACT_ENVIRONMENT };
  Object.assign(global, { window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true });
  const box = ({ children }) => React.createElement('div', null, children);
  const root = createRoot(document.getElementById('root'));
  const steps = require('../data/python-environment-guide.json');
  const { PythonEnvironmentGuide } = evaluate('../components/PythonEnvironmentGuide.tsx', {
    'react-native': { View: box, Linking: { openURL: async () => {} } },
    '../data/python-environment-guide.json': steps,
    '../store/School': { useSchool: () => ({ state: { language: 'en' }, t: (_fr, en) => en, colors: {} }) },
    './UI': { Card: box, Label: box, Row: box, Button: ({ title, onPress, disabled }) => React.createElement('button', { onClick: onPress, disabled }, title) },
    './CodeViewer': { CodeViewer: ({ code }) => React.createElement('pre', null, code) },
  });
  const click = async title => { const b = [...document.querySelectorAll('button')].find(b => b.textContent === title); assert(b, title); await React.act(async () => { b.click(); await Promise.resolve(); }); };
  try {
    await React.act(() => root.render(React.createElement(PythonEnvironmentGuide)));
    assert.equal(document.querySelector('pre').textContent, 'py --version');
    await click('Next step');
    assert.equal(document.querySelector('pre').textContent, 'py -m venv .venv');
    await click('I don’t see this result');
    assert(document.body.textContent.includes(steps[1].help[1]));
    await click('macOS / Linux');
    assert.equal(document.querySelector('pre').textContent, 'python3 -m venv .venv');
    await click('Next step');
    assert.equal(document.querySelector('pre').textContent, steps[2].unix);
    await click('Windows');
    assert.equal(document.querySelector('pre').textContent, steps[2].windows);
    assert(document.body.textContent.includes('What each part means'));
    await click('Next step');
    assert.equal(document.querySelector('pre').textContent, steps[3].windows);
    assert(document.body.textContent.includes('FastAPI OK'));
    assert(![...document.querySelectorAll('button')].some(b => b.textContent === 'Next step'));
  } finally { await React.act(() => root.unmount()); dom.window.close(); Object.assign(global, previous); }
});

test('code viewer fits to screen, copies exact text and reads en-dash annotation ranges', async () => {
  const dom = new JSDOM('<div id="root"></div>');
  const previous = { window: global.window, document: global.document, IS_REACT_ACT_ENVIRONMENT: global.IS_REACT_ACT_ENVIRONMENT };
  Object.assign(global, { window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true });
  const root = createRoot(document.getElementById('root'));
  const box = ({ children }) => React.createElement('div', null, children);
  let copied = null;
  const { CodeViewer } = evaluate('../components/CodeViewer.tsx', {
    'react-native': { View: box, ScrollView: ({ children }) => React.createElement('div', { 'data-scroll': 'true' }, children), Text: ({ children, onPress, accessibilityLabel }) => React.createElement('span', { onClick: onPress, 'aria-label': accessibilityLabel }, children) },
    'expo-clipboard': { setStringAsync: async text => { copied = text; } },
    './UI': { Label: box, Row: box, Button: ({ title, onPress }) => React.createElement('button', { onClick: onPress }, title) },
    '../store/School': { useSchool: () => ({ state: { language: 'en', codeBookmarks: [] }, update() {}, t: (_fr, en) => en, colors: {} }) },
    '../utils/progress': { toggle: () => [] },
    '../services/source-guide': { explainSourceLine: () => ({ meaning: 'Fallback explanation' }) },
    'expo-router': { useLocalSearchParams: () => ({ id: 'demo' }) },
    '../constants/design': { fonts: {}, radius: {}, space: {} },
    '../utils/highlight': evaluate('../utils/highlight.ts', {}),
    './RunOutcome': { RunOutcome: () => null },
  });
  const code = 'first line\nsecond line';
  const click = async title => { const b = [...document.querySelectorAll('button')].find(b => b.textContent === title); assert(b, title); await React.act(async () => { b.click(); await Promise.resolve(); }); };
  try {
    await React.act(() => root.render(React.createElement(CodeViewer, { code, filename: 'Terminal · Windows', annotations: [{ lines: '1–2', label: 'Authored explanation' }] })));
    assert.equal(document.querySelector('[data-scroll]'), null);
    await click('Copy');
    assert.equal(copied, code);
    assert(document.body.textContent.includes('Copied ✓'));
    await React.act(() => document.querySelector('[aria-label="Explain line 2: second line"]').click());
    assert(document.body.textContent.includes('Authored explanation'));
    await click('Show original lines');
    assert(document.querySelector('[data-scroll]'));
    await click('Fit to my screen');
    assert.equal(document.querySelector('[data-scroll]'), null);
  } finally { await React.act(() => root.unmount()); dom.window.close(); Object.assign(global, previous); }
});


test('execution examples distinguish Markdown from execution and pass source context to teacher', async () => {
  const dom = new JSDOM('<div id="root"></div>');
  const previous = { window: global.window, document: global.document, IS_REACT_ACT_ENVIRONMENT: global.IS_REACT_ACT_ENVIRONMENT };
  Object.assign(global, { window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true });
  const root = createRoot(document.getElementById('root'));
  const box = ({ children }) => React.createElement('div', null, children);
  let navigation;
  const { RunOutcome } = evaluate('../components/RunOutcome.tsx', {
    'react-native': { View: box, Text: box },
    'expo-router': { router: { push: value => { navigation = value; } } },
    './UI': { Label: box, Button: ({ title, onPress }) => React.createElement('button', { onClick: onPress }, title) },
    '../store/School': { useSchool: () => ({ t: (_fr, en) => en, colors: {} }) },
    '../services/content': { getSource: file => file === 'README.md' ? { content: '# My project' } : undefined },
    '../constants/design': { fonts: {} },
  });
  const click = async title => { const button = [...document.querySelectorAll('button')].find(b => b.textContent === title); assert(button); await React.act(() => button.click()); };
  try {
    await React.act(() => root.render(React.createElement(RunOutcome, { filename: 'README.md', code: '# snippet' })));
    await click('What happens if I run this?');
    assert(document.body.textContent.includes('not a program'));
    assert(document.body.textContent.includes('# My project'));
    await click('Explain two practical examples');
    assert.equal(navigation.params.file, 'README.md');
    assert(navigation.params.question.includes('Do not claim to have run'));
    await React.act(() => root.render(React.createElement(RunOutcome, { key: 'json', filename: 'sample.json', code: '{"quantity":2}' })));
    await click('What happens if I run this?');
    assert(document.body.textContent.includes('JSON parsing succeeded'));
    assert(document.body.textContent.includes('quantity'));
    await React.act(() => root.render(React.createElement(RunOutcome, { key: 'invalid', filename: 'sample.json', code: '{' })));
    await click('What happens if I run this?');
    assert(document.body.textContent.includes('Incomplete or invalid JSON'));
  } finally { await React.act(() => root.unmount()); dom.window.close(); Object.assign(global, previous); }
});
