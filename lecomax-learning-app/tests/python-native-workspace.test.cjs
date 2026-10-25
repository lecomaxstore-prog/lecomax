const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { JSDOM } = require('jsdom');
const { createRoot } = require('react-dom/client');
const { load } = require('../scripts/inspect.cjs');

test('native workspace preserves immediate drafts, retries storage and exposes offline Android from the menu', async () => {
  const dom = new JSDOM('<div id="root"></div>');
  const saved = { window: global.window, document: global.document, IS_REACT_ACT_ENVIRONMENT: global.IS_REACT_ACT_ENVIRONMENT };
  Object.assign(global, { window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true });
  const school = React.createContext(null), box = ({ children }) => React.createElement('div', null, children);
  let bridge, progress, setReady, retries = 0, closed = 0, offline = false;
  const injections = [], copies = [];
  const dependencies = {
    'react-native': { Platform: { OS: 'android' }, View: box, Modal: box, KeyboardAvoidingView: box },
    'react-native-safe-area-context': { SafeAreaView: box },
    'react-native-webview': { WebView: React.forwardRef((props, ref) => { bridge = props; React.useImperativeHandle(ref, () => ({ injectJavaScript: script => injections.push(script) })); return null; }) },
    'expo-clipboard': { setStringAsync: async value => { copies.push(value); } },
    './PhonePythonLab': { PhonePythonLab: () => { offline = true; return null; } },
    './UI': { Label: box, Button: ({ title, onPress }) => React.createElement('button', { onClick: onPress }, title) },
    '../store/School': { useSchool: () => React.useContext(school) },
    '../data/python-mobile-workspace.json': '/*PYTHON_SEED*/',
    '../utils/python-mobile-bridge': load('lecomax-learning-app/utils/python-mobile-bridge.ts'),
  };
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(require.resolve('../components/MobilePythonWorkspace.tsx'), 'utf8'), { compilerOptions: { esModuleInterop: true, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText, { exports, require: name => dependencies[name] || require(name) });
  function Provider() {
    const [state, update] = React.useState({ drafts: { other: 'keep', 'python-script:saved': 'original' }, answers: {}, theme: 'dark', language: 'en', level: 1 });
    const [ready, changeReady] = React.useState(false); progress = state; setReady = changeReady;
    return React.createElement(school.Provider, { value: { state, update, ready, error: ready ? '' : 'Storage unavailable', retry: () => retries++, colors: { bg: '#111' }, t: (_fr, en) => en } }, React.createElement(exports.MobilePythonWorkspace, { visible: true, seed: { runtime: 'python', code: '' }, onClose: () => closed++, onExplain() {} }));
  }
  const root = createRoot(document.getElementById('root'));
  const message = value => React.act(async () => bridge.onMessage({ nativeEvent: { data: JSON.stringify(value) } }));
  try {
    await React.act(async () => root.render(React.createElement(Provider)));
    assert.match(document.body.textContent, /Storage unavailable/);
    await React.act(async () => document.querySelector('button').click()); assert.equal(retries, 1);
    await React.act(async () => setReady(true));
    await message({ type: 'ready' }); assert(injections.some(script => script.includes('"offlineAndroid":true')));
    await message({ type: 'clipboard', id: 1, text: 'Python output\n40.0' });
    assert.equal(copies[0], 'Python output\n40.0');
    assert(injections.some(script => script.includes('"clipboard-result","id":1,"ok":true')));
    await message({ type: 'clipboard', id: 2, text: 'x'.repeat(50001) });
    assert.equal(copies.length, 1);
    await message({ type: 'draft', key: 'python-studio:draft', code: 'last keystroke' });
    assert.equal(progress.drafts['python-studio:draft'], 'last keystroke');
    assert.equal(progress.drafts.other, 'keep'); assert.equal(progress.drafts['python-script:saved'], 'original');
    await message({ type: 'progress', drafts: { 'python-studio:draft': 'older debounced snapshot', 'python-script:saved': 'original' }, answers: {} });
    assert.equal(progress.drafts['python-studio:draft'], 'last keystroke');
    await message({ type: 'progress', drafts: { 'python-studio:draft': 'last keystroke', 'python-script:saved': 'original' }, answers: {} });
    await message({ type: 'draft', key: 'python-script:saved', code: 'overwrite' });
    assert.equal(progress.drafts['python-script:saved'], 'original'); assert.match(document.body.textContent, /Invalid Python draft/);
    await message({ type: 'retry-storage' }); assert.equal(retries, 2);
    await message({ type: 'close' }); assert.equal(closed, 1);
    await message({ type: 'offline' }); assert.equal(offline, true);
  } finally { await React.act(async () => root.unmount()); dom.window.close(); Object.assign(global, saved); }
});
