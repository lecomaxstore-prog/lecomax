const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { createRoot } = require('react-dom/client');
const { JSDOM } = require('jsdom');

test('phone page defaults to direct sharing, starts without relay credentials and switches to viewer', async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost' });
  const previous = { window: global.window, document: global.document, IS_REACT_ACT_ENVIRONMENT: global.IS_REACT_ACT_ENVIRONMENT };
  Object.assign(global, { window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true });
  const calls = [], opened = [];
  let leaveScreen, poll, rememberedSession = '';
  let savedAddress = 'http://100.80.1.2:8092';
  const stored = [];
  const pairing = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(require.resolve('../utils/phone-pairing.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports: pairing, URL });
  let currentStatus = { state: 'idle', code: '', inputEnabled: true, directSupported: true, tailscaleIp: '100.80.1.2' };
  let params = {};
  const clearedParams = [];
  let scannedOrigin = 'http://100.80.1.3:8092';
  const box = ({ children }) => React.createElement('div', null, children);
  let qrCancelled = 0;
  const remote = { allowQrConnection: async () => 'b'.repeat(32), cancelQrConnection: () => qrCancelled++, status: async () => currentStatus, start: async (...args) => calls.push(args), openInputSettings() {}, stop() {}, approve() {} };
  const dependencies = {
    'expo-router': { Stack: { Screen: () => null }, useLocalSearchParams: () => params, router: { setParams(value) { clearedParams.push(value); params = {}; } }, useFocusEffect: callback => React.useEffect(() => { const cleanup = callback(); if (!leaveScreen) leaveScreen = cleanup; return cleanup; }, []) },
    '../utils/phone-session': { readPhoneSession: async () => rememberedSession },
    '../utils/phone-pairing': pairing,
    '../components/PhoneInvitation': { PhoneInvitation: () => null },
    '../components/PhonePairingScanner': { PhonePairingScanner: ({ onPair }) => React.createElement('button', { onClick: () => onPair({ origin: scannedOrigin, code: 'd'.repeat(32) }) }, 'Simulate valid QR') },
    'react-native-qrcode-svg': { __esModule: true, default: ({ value }) => React.createElement('div', { 'data-qr': value }) },
    '../components/PhoneViewer': { PhoneViewer: ({ origin, pairingCode, onClose }) => React.createElement('section', { 'data-viewer': origin, 'data-code': pairingCode }, React.createElement('button', { onClick: onClose }, 'Disconnect phone')) },
    react: React,
    'react-native': { useWindowDimensions: () => ({width: 320, height: 720}), Linking: { openURL: async url => opened.push(url) }, NativeModules: { PhoneRemote: remote }, Platform: { OS: 'android' }, ScrollView: box, View: box, TextInput: ({ value, onChangeText, accessibilityLabel }) => React.createElement('input', { value, onChange: e => onChangeText(e.target.value), 'aria-label': accessibilityLabel }) },
    '../components/UI': { Card: box, Label: box, Button: ({ title, onPress }) => React.createElement('button', { onClick: onPress }, title) },
    '../store/School': { useSchool: () => ({ colors: {}, rtl: false, t: (_fr, en) => en }) },
    'expo-clipboard': { setStringAsync: async () => {} },
    '@react-native-async-storage/async-storage': { __esModule: true, default: { getItem: async () => savedAddress, setItem: async (...args) => stored.push(args) } },
  };
  const code = ts.transpileModule(fs.readFileSync(require.resolve('../app/phone.tsx'), 'utf8'), { compilerOptions: { jsx: ts.JsxEmit.React, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, require: name => { if (!dependencies[name]) throw Error(name); return dependencies[name]; }, URL, setInterval: fn => { poll = fn; return 1; }, clearInterval() {} });
  const root = createRoot(dom.window.document.getElementById('root'));
  const click = async text => { const button = [...dom.window.document.querySelectorAll('button')].find(b => b.textContent === text); assert.ok(button, text); await React.act(async () => button.click()); };
  try {
    await React.act(async () => root.render(React.createElement(exports.default)));
    assert.match(dom.window.document.body.textContent, /Direct Tailscale connection/);
    assert.equal(dom.window.document.querySelector('[aria-label="Private relay access key"]'), null);
    await click('Start screen sharing');
    assert.deepEqual(JSON.parse(JSON.stringify(calls)), [['tailscale', '']]);
    currentStatus = { ...currentStatus, state: 'waiting', directUrl: 'http://100.80.1.2:8092', code: 'a'.repeat(32) };
    await React.act(async () => poll());
    assert.equal(dom.window.document.querySelector('[data-qr]'), null);
    await click('Allow QR connection');
    const qr = dom.window.document.querySelector('[data-qr]').dataset.qr;
    assert.equal(pairing.parsePhonePairingQr(qr).code, 'b'.repeat(32));
    await click('Hide and cancel QR');
    assert.equal(qrCancelled, 1);
    assert.equal(dom.window.document.querySelector('[data-qr]'), null);
    await click('Allow QR connection');
    currentStatus = { ...currentStatus, state: 'approval' }; await React.act(async () => poll());
    assert.equal(dom.window.document.querySelector('[data-qr]'), null);
    currentStatus = { ...currentStatus, state: 'idle', code: '', directUrl: '' }; await React.act(async () => poll());
    await click('Scan a phone');
    await click('Simulate valid QR');
    assert.equal(dom.window.document.querySelector('[data-viewer]').dataset.viewer, 'http://100.80.1.3:8092');
    await click('Disconnect phone');
    scannedOrigin = 'http://100.80.1.2:8092';
    await click('Scan a phone'); await click('Simulate valid QR');
    assert.equal(dom.window.document.querySelector('[data-viewer]'), null);
    assert.match(dom.window.document.body.textContent, /Scan the other phone, not this phone/);
    scannedOrigin = 'http://100.80.1.3:8092';
    await click('View another phone');
    await click('Open connection');
    assert.deepEqual(opened, []);
    assert.equal(dom.window.document.querySelector('[data-viewer]').dataset.viewer, 'http://100.80.1.3:8092');
    await click('Disconnect phone');
    assert.match(dom.window.document.body.textContent, /Mode: view another phone/);
    await click('Open connection');
    await React.act(async () => leaveScreen());
    assert.equal(dom.window.document.querySelector('[data-viewer]'), null);
    await click('Scan the second phone');
    await click('Simulate valid QR');
    assert.equal(dom.window.document.querySelector('[data-viewer]').dataset.viewer, 'http://100.80.1.3:8092');
    assert.equal(dom.window.document.querySelector('[data-viewer]').dataset.code, 'd'.repeat(32));
    assert.equal(JSON.stringify(stored).includes('d'.repeat(32)), false);
    await click('Disconnect phone');
    params = { pair: 'http://100.80.1.4:8092|' + 'e'.repeat(32) };
    await React.act(async () => root.render(React.createElement(exports.default)));
    assert.equal(dom.window.document.querySelector('[data-viewer]').dataset.viewer, 'http://100.80.1.4:8092');
    assert.equal(dom.window.document.querySelector('[data-viewer]').dataset.code, 'e'.repeat(32));
    assert.ok(clearedParams.length);
    assert.equal(JSON.stringify(stored).includes('e'.repeat(32)), false);
    await click('Disconnect phone');
    await click('Share this phone');
    await click('Advanced: use a relay');
    assert.ok(dom.window.document.querySelector('[aria-label="Private relay access key"]'));
    await React.act(async () => root.render(null));
    rememberedSession = 'f'.repeat(32); savedAddress = 'http://100.80.1.3:8092';
    await React.act(async () => root.render(React.createElement(exports.default)));
    assert.equal(dom.window.document.querySelector('[data-viewer]').dataset.viewer, savedAddress, 'cold page mount reopens the saved connection');
    assert.equal(dom.window.document.querySelector('[data-viewer]').dataset.code, '', 'resumption does not require a pairing code');
  } finally { await React.act(async () => root.unmount()); dom.window.close(); Object.assign(global, previous); }
});
