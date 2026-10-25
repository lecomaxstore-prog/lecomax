const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { createRoot } = require('react-dom/client');
const { JSDOM } = require('jsdom');

test('embedded viewer resumes saved sessions after leaving and only disconnects explicitly', async () => {
  const dom = new JSDOM('<div id="root"></div>');
  const saved = { window: global.window, document: global.document, IS_REACT_ACT_ENVIRONMENT: global.IS_REACT_ACT_ENVIRONMENT };
  Object.assign(global, { window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true });
  let props, appState, back, closed = 0, removed = 0;
  const injected = [];
  let retryTimer, failDisconnect = false;
  const sessions = new Map([['http://100.80.1.2:8092', 'e'.repeat(32)]]);
  const box = ({ children }) => React.createElement('div', null, children);
  const dependencies = {
    react: React,
    'expo-router': { Stack: { Screen: () => null } },
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) },
    'react-native': { ScrollView: box, View: box, AppState: { currentState: 'active', addEventListener: (_, fn) => { appState = fn; return { remove: () => removed++ }; } }, BackHandler: { addEventListener: (_, fn) => { back = fn; return { remove: () => removed++ }; } } },
    'react-native-webview': { WebView: React.forwardRef((p, ref) => { props = p; React.useImperativeHandle(ref, () => ({ injectJavaScript: js => injected.push(js) })); return React.createElement('div', { 'data-webview': p.source.uri }); }) },
    './UI': { Label: box, Button: ({ title, onPress }) => React.createElement('button', { onClick: onPress }, title) },
    '../store/School': { useSchool: () => ({ colors: {}, t: (_, en) => en }) },
    '../utils/phone-session': { readPhoneSession: async origin => sessions.get(origin) || '', savePhoneSession: async (origin, token) => { if (token) sessions.set(origin, token); else sessions.delete(origin); } },
  };
  const code = ts.transpileModule(fs.readFileSync(require.resolve('../components/PhoneViewer.tsx'), 'utf8'), { compilerOptions: { jsx: ts.JsxEmit.React, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, AbortController, setTimeout, clearTimeout, setInterval: fn => { retryTimer = fn; return 1; }, clearInterval: () => {}, fetch: async () => { if (failDisconnect) throw Error("offline"); return { ok: true, status: 200 }; }, require: id => { assert.ok(dependencies[id], id); return dependencies[id]; } });
  const root = createRoot(dom.window.document.getElementById('root'));
  try {
    await React.act(async () => root.render(React.createElement(exports.PhoneViewer, { origin: 'http://100.80.1.2:8092', pairingCode: 'c'.repeat(32), onClose: () => closed++ })));
    assert.equal(props.source.uri, 'http://100.80.1.2:8092/');
    assert.equal(dom.window.document.body.textContent.includes('OTHER phone'), false);
    await React.act(async () => [...dom.window.document.querySelectorAll('button')].find(b => b.textContent === 'Help').click());
    assert.match(dom.window.document.body.textContent, /OTHER phone.*until you stop sharing/);
    assert.equal(props.onShouldStartLoadWithRequest({ url: props.source.uri }), true);
    for (const url of ['https://evil.example/', 'file:///sdcard/a', 'http://100.80.1.2:8092.evil.example/', 'intent://a']) assert.equal(props.onShouldStartLoadWithRequest({ url }), false);
    assert.equal(props.allowFileAccess, false);
    assert.equal(props.incognito, true);
    props.onMessage({ nativeEvent: { url: 'https://evil.example/', data: 'lecomax-phone-ready' } });
    assert.equal(injected.length, 0);
    props.onMessage({ nativeEvent: { url: props.source.uri, data: 'lecomax-phone-ready' } });
    props.onMessage({ nativeEvent: { url: props.source.uri, data: 'lecomax-phone-ready' } });
    assert.equal(injected.filter(js => js.includes('lecomaxPairCode')).length, 1);
    assert.ok(injected.find(js => js.includes('lecomaxPairCode')).includes('c'.repeat(32)));
    props.onMessage({ nativeEvent: { url: props.source.uri, data: JSON.stringify({ type: 'phone-session', token: 'a'.repeat(32) }) } });
    props.onMessage({ nativeEvent: { url: 'https://evil.example/', data: JSON.stringify({ type: 'phone-session', token: 'b'.repeat(32) }) } });
    await React.act(async () => props.onRenderProcessGone());
    assert.match(dom.window.document.body.textContent, /Retry connection/);
    await React.act(async () => retryTimer());
    assert.equal(dom.window.document.body.textContent.includes('Retry connection'), false, 'foreground viewer retries unreachable host automatically');
    await React.act(async () => props.onError());
    await React.act(async () => [...dom.window.document.querySelectorAll('button')].find(b => b.textContent === 'Retry connection').click());
    props.onMessage({ nativeEvent: { url: props.source.uri, data: 'lecomax-phone-ready' } });
    assert.match(injected.at(-1), /lecomaxRestoreSession/);
    assert.ok(injected.at(-1).includes('a'.repeat(32)));
    assert.ok(!injected.at(-1).includes('b'.repeat(32)));
    assert.equal(sessions.get('http://100.80.1.2:8092'), 'a'.repeat(32));
    appState('active'); assert.equal(closed, 0);
    assert.equal(back(), true); assert.equal(closed, 1); assert.match(injected.at(-1), /lecomaxPause/);
    assert.equal(sessions.get('http://100.80.1.2:8092'), 'a'.repeat(32));
    await React.act(async () => root.render(null));
    await React.act(async () => root.render(React.createElement(exports.PhoneViewer, { origin: 'http://100.80.1.2:8092', onClose: () => closed++ })));
    await React.act(async () => props.onMessage({ nativeEvent: { url: props.source.uri, data: 'lecomax-phone-ready' } }));
    assert.match(injected.at(-1), /lecomaxRestoreSession/);
    assert.ok(injected.at(-1).includes('a'.repeat(32)));
    appState('background'); assert.equal(closed, 1); assert.match(injected.at(-1), /lecomaxPause/);
    appState('active'); assert.equal(closed, 1); assert.match(injected.at(-1), /lecomaxResume/);
    await props.onMessage({ nativeEvent: { url: props.source.uri, data: JSON.stringify({ type: 'phone-session', token: '' }) } });
    assert.equal(sessions.size, 0, 'host revocation removes the saved session');
    await props.onMessage({ nativeEvent: { url: props.source.uri, data: JSON.stringify({ type: 'phone-session', token: 'a'.repeat(32) }) } });
    failDisconnect = true;
    await React.act(async () => [...dom.window.document.querySelectorAll('button')].find(b => b.textContent === 'Disconnect phone').click());
    assert.equal(closed, 1);
    assert.equal(sessions.size, 1);
    assert.match(dom.window.document.body.textContent, /Disconnect was not confirmed/);
    failDisconnect = false;
    await React.act(async () => [...dom.window.document.querySelectorAll('button')].find(b => b.textContent === 'Disconnect phone').click());
    assert.equal(closed, 2); assert.match(injected.at(-1), /getElementById\('stop'\)/);
    assert.equal(sessions.size, 0);
    await props.onMessage({ nativeEvent: { url: props.source.uri, data: JSON.stringify({ type: 'phone-session', token: 'a'.repeat(32) }) } });
    assert.equal(sessions.size, 0, 'late bridge messages cannot restore a disconnected session');
    await React.act(async () => props.onError());
    assert.match(dom.window.document.body.textContent, /Unable to connect/);
    assert.ok(dom.window.document.querySelector('[data-webview]'));
  } finally { await React.act(async () => root.unmount()); assert.equal(removed, 4); dom.window.close(); Object.assign(global, saved); }
});
