const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { createRoot } = require('react-dom/client');
const { JSDOM } = require('jsdom');
const { load } = require('../scripts/inspect.cjs');

test('site screen connects page navigation, beginner curriculum, explanations and AI context', async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost' });
  const previous = { window: global.window, document: global.document, IS_REACT_ACT_ENVIRONMENT: global.IS_REACT_ACT_ENVIRONMENT };
  Object.assign(global, { window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true });
  const navigations = [];
  let onEvent;
  const box = ({ children }) => React.createElement('div', null, children);
  const ui = { Page: box, Card: box, Row: box, Label: box, Field: ({ value, onChangeText }) => React.createElement('textarea', { value, onChange: e => onChangeText(e.target.value) }), Button: ({ title, onPress, disabled }) => React.createElement('button', { onClick: onPress, disabled }, title) };
  const Scroll = React.forwardRef(({ children }, ref) => { React.useImperativeHandle(ref, () => ({ scrollTo() {} })); return box({ children }); });
  const project = require('../data/project.json');
  const dependencies = {
    'react-native': { View: box, Linking: { openURL: async () => {} }, ScrollView: Scroll, Modal: ({ visible, children }) => visible ? box({ children }) : null },
    'react-native-safe-area-context': { SafeAreaView: box },
    'expo-router': { router: { push: value => navigations.push(value) } },
    '../components/UI': ui,
    '../components/SitePreview': { __esModule: true, default: props => { onEvent = props.onEvent; return null; } },
    '../store/School': { useSchool: () => ({ state: { language: 'en', completed: [], notes: {} }, update: () => {}, t: (_fr, en) => en, colors: {} }) },
    '../services/content': { index: require('../data/index.json'), project, getSource: file => { const entry = project.find(p => p.path === file); return entry ? require('../data/source/' + entry.hash + '.json') : undefined; }, resolveImport: () => undefined },
    '../utils/site-learning': load('lecomax-learning-app/utils/site-learning.ts'),
    '../utils/site-preview': { previewHtml: () => '', sitePath: href => new URL(href, 'https://lecomax.com').pathname },
    '../data/site-pages.json': require('../data/site-pages.json'),
    '../data/site-source-map.json': require('../data/site-source-map.json'),
    '../utils/source-lesson': load('lecomax-learning-app/utils/source-lesson.ts'),
    './UI': ui,
    './CodeViewer': { CodeViewer: ({ code, start }) => React.createElement('pre', null, `${start}: ${code}`) },
  };
  const lessonExports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(require.resolve('../components/SiteElementLesson.tsx'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText, { exports: lessonExports, require: name => dependencies[name] || require(name) });
  dependencies['../components/SiteElementLesson'] = lessonExports;
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(require.resolve('../app/my-site.tsx'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText, { exports, require: name => dependencies[name] || require(name) });
  const root = createRoot(document.getElementById('root'));
  const click = async name => {
    const button = [...document.querySelectorAll('button')].find(element => element.textContent === name);
    assert(button, name); await React.act(() => button.click());
  };
  try {
    await React.act(() => root.render(React.createElement(exports.default)));
    await React.act(() => onEvent({ kind: 'navigate', href: 'https://lecomax.com/boutique' }));
    assert.match(document.body.textContent, /lecomax.com\/boutique/);
    await click('Previous page');
    await click('Zero to hero');
    assert.match(document.body.textContent, /8. Grow the site/);
    await React.act(() => onEvent({ kind: 'select', selection: { path: 'components/Header.tsx', tag: 'button', label: 'Menu', ariaLabel: 'Menu', line: 108, anchor: '' } }));
    assert.match(document.body.textContent, /setOpen/);
    await click('Real code');
    assert.match(document.body.textContent, /onClick=\{\(\) => setOpen/);
    await click('Your turn');
    await click('Continue with the AI teacher');
    assert.equal(navigations.at(-1).pathname, '/(tabs)/teacher');
    assert.equal(navigations.at(-1).params.file, 'components/Header.tsx');
    assert.match(navigations.at(-1).params.question, /Menu/);
    assert.match(navigations.at(-1).params.question, /setOpen/);
    assert.match(navigations.at(-1).params.question, /SHA256/);
    assert(navigations.at(-1).params.explain);
  } finally {
    await React.act(() => root.unmount());
    dom.window.close(); Object.assign(global, previous);
  }
});
