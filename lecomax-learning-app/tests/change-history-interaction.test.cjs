const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { JSDOM } = require('jsdom');
const React = require('react');
const { createRoot } = require('react-dom/client');
const { load } = require('../scripts/inspect.cjs');
const history = load('lecomax-learning-app/utils/change-history.ts');

test('visible summary expands, collapses, shows statuses, opens preview/history and retries archive', async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost' });
  const saved = { window: global.window, document: global.document, IS_REACT_ACT_ENVIRONMENT: global.IS_REACT_ACT_ENVIRONMENT };
  Object.assign(global, { window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true });
  const report = { id: 'test-report', createdAt: '2026-10-09T12:00:00.000Z', title: 'Persistent visual history', summary: 'Keep every change', status: 'needs-testing', pages: ['Home dashboard'], components: ['ChangesMade'], files: ['components/ChangeHistory.tsx'], changes: [{ kind: 'fixed', detail: 'Preserve original reports' }], validation: [{ name: 'Device test', result: 'not-run', detail: 'Pending native QA' }], preview: { path: '/change-history', label: 'Open current app', verifiedAt: '2026-10-09T12:00:00.000Z' } };
  const navigations = [];
  let retries = 0;
  const state = { reports: [report], error: false, saved: true, retry: () => retries++ };
  let language = 'en';
  const box = ({ children }) => React.createElement('div', null, children);
  const label = ({ children, style, numberOfLines }) => React.createElement('span', { style: { textAlign: style?.textAlign, direction: style?.writingDirection }, 'data-lines': numberOfLines }, children);
  const dependencies = {
    'react-native': { View: box, Pressable: ({ children, onPress, accessibilityState, accessibilityLabel }) => React.createElement('button', { onClick: onPress, 'aria-expanded': accessibilityState?.expanded, 'aria-label': accessibilityLabel }, children) },
    '@expo/vector-icons/Ionicons': { __esModule: true, default: () => null },
    'expo-router': { router: { push: route => navigations.push(route) } },
    '../components/UI': { Label: label, Row: box, Button: ({ title, onPress }) => React.createElement('button', { onClick: onPress }, title) },
    '../store/School': { useSchool: () => ({ t: (_fr, en, ar) => language === 'ar' ? ar : en, colors: {}, state: { language }, rtl: language === 'ar' }) },
    '../store/ChangeHistory': { useChangeHistory: () => state },
    '../utils/change-history': history,
  };
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(require.resolve('../components/ChangeHistory.tsx'), 'utf8'), { compilerOptions: { esModuleInterop: true, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText, { exports, require: name => dependencies[name] || require(name) });
  const root = createRoot(document.getElementById('root'));
  const click = async text => {
    const button = [...document.querySelectorAll('button')].find(b => b.textContent === text);
    assert(button, text);
    await React.act(() => button.click());
  };
  try {
    await React.act(() => root.render(React.createElement(exports.ChangesMade)));
    assert.doesNotMatch(document.body.textContent, /components\/ChangeHistory.tsx/);
    assert.equal(document.querySelector('[aria-expanded]').getAttribute('aria-expanded'), 'false');
    await click('View full details');
    assert.match(document.body.textContent, /components\/ChangeHistory.tsx/);
    assert.match(document.body.textContent, /Needs testing/);
    assert.match(document.body.textContent, /Europe\/Paris/);
    assert.match(document.body.textContent, /Home dashboard/);
    assert.match(document.body.textContent, /Pending native QA/);
    await click('Hide details');
    assert.doesNotMatch(document.body.textContent, /components\/ChangeHistory.tsx/);
    assert.equal(document.querySelector('[aria-expanded]').getAttribute('aria-expanded'), 'false');
    await click('View full details');
    assert.equal(document.querySelector('[aria-expanded]').getAttribute('aria-expanded'), 'true');
    await click('Open current app');
    await click('Change History');
    assert.deepEqual(navigations, ['/change-history', '/change-history']);
    assert.match(document.body.textContent, /Current app, not a historical snapshot/);
    state.error = true;
    await React.act(() => root.render(React.createElement(exports.ChangesMade)));
    await click('Retry archive');
    assert.equal(retries, 1);
    language = 'ar';
    await React.act(() => root.render(React.createElement(exports.ChangesMade, { key: 'arabic' })));
    assert.match(document.body.textContent, /التغييرات المنفّذة/);
    const title = [...document.querySelectorAll('span')].find(el => el.textContent === report.title);
    assert.equal(title.style.direction, 'ltr');
    assert.equal(title.dataset.lines, '2');
    assert.doesNotMatch(document.body.textContent, /components\/ChangeHistory.tsx/);
    await click('عرض التفاصيل الكاملة');
    assert.match(document.body.textContent, /components\/ChangeHistory.tsx/);
    language = 'en';
    for (const [status, label] of [['successful', 'Successful'], ['failed', 'Failed']]) {
      await React.act(() => root.render(React.createElement(exports.ChangeReportCard, { report: { ...report, status } })));
      assert.match(document.body.textContent, new RegExp(label));
    }
  } finally {
    await React.act(() => root.unmount());
    dom.window.close();
    Object.assign(global, saved);
  }
});


test('provider retries a storage failure and restores archived reports after remount', async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost' });
  const saved = { window: global.window, document: global.document, IS_REACT_ACT_ENVIRONMENT: global.IS_REACT_ACT_ENVIRONMENT };
  Object.assign(global, { window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true });
  const bundled = require('../data/change-history.json');
  const older = { ...bundled[0], id: 'device-only-old-report' };
  let raw = history.serializeHistory([older]);
  let fail = true;
  const storage = { getItem: async () => { if (fail) throw Error('Storage unavailable'); return raw; }, setItem: async (_key, value) => { raw = value; } };
  const dependencies = { '@react-native-async-storage/async-storage': { __esModule: true, default: storage }, '../data/change-history.json': bundled, '../utils/change-history': history };
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(require.resolve('../store/ChangeHistory.tsx'), 'utf8'), { compilerOptions: { esModuleInterop: true, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText, { exports, require: name => dependencies[name] || require(name) });
  let latest;
  const Consumer = () => { latest = exports.useChangeHistory(); return React.createElement('div', null, latest.reports.length); };
  const root = createRoot(document.getElementById('root'));
  const render = () => React.createElement(exports.ChangeHistoryProvider, null, React.createElement(Consumer));
  try {
    await React.act(async () => { root.render(render()); });
    assert.equal(latest.error, true);
    assert.equal(latest.reports.length, bundled.length);
    fail = false;
    await React.act(async () => { latest.retry(); });
    assert.equal(latest.error, false);
    assert.equal(latest.saved, true);
    assert.equal(latest.reports.length, bundled.length + 1);
    await React.act(() => root.render(null));
    await React.act(async () => { root.render(render()); });
    assert.equal(latest.saved, true);
    assert.equal(latest.reports.length, bundled.length + 1);
    assert.equal(history.readArchive(raw).length, bundled.length + 1);
  } finally {
    await React.act(() => root.unmount());
    dom.window.close();
    Object.assign(global, saved);
  }
});
