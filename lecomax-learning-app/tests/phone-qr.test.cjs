const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { createRoot } = require('react-dom/client');
const { JSDOM } = require('jsdom');
function load(file, dependencies = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(require.resolve(file), 'utf8'), { compilerOptions: { jsx: ts.JsxEmit.React, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText;
  vm.runInNewContext(code, { exports, URL, require: id => { assert.ok(dependencies[id], id); return dependencies[id]; } });
  return exports;
}
const pairing = load('../utils/phone-pairing.ts');
const origin = 'http://100.80.1.2:8092', code = 'a'.repeat(32);
test('QR round trip accepts only a private phone address and one valid session code', () => {
  const qr = pairing.phonePairingQr(origin, code);
  assert.deepEqual(JSON.parse(JSON.stringify(pairing.parsePhonePairingQr(qr))), { origin, code });
  for (const address of ['https://example.com', 'http://192.168.1.2:8092', 'http://100.63.1.2:8092', 'http://100.128.1.2:8092', origin + '/', origin + '?x=1', origin + '#x', origin + '/evil', 'http://user@100.80.1.2:8092', 'http://100.80.1.2:80']) {
    assert.equal(pairing.phonePairingQr(address, code), null, address);
  }
  for (const value of [qr + '&pair=x', qr + '&extra=x', qr + '#x', qr.replace('lecomax-learn:', 'https:'), qr.replace('//phone?', '//evil?'), qr.replace('//phone?', '//phone/path?'), 'javascript:alert(1)', 'x'.repeat(1000)]) assert.equal(pairing.parsePhonePairingQr(value), null, value);
  for (const value of [null, [], `${origin}|bad`, `${origin}|${code}|extra`]) assert.equal(pairing.parsePhonePairingPayload(value), null);
});

test('scanner asks permission, rejects unrelated codes, stops in background and consumes one valid scan', async () => {
  const dom = new JSDOM('<div id="root"></div>');
  const previous = { window: global.window, document: global.document, IS_REACT_ACT_ENVIRONMENT: global.IS_REACT_ACT_ENVIRONMENT };
  Object.assign(global, { window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true });
  const box = ({ children }) => React.createElement('div', null, children);
  const pairs = []; let cameraProps, onState, onBack, requested = 0, closed = 0, settings = 0;
  let permission = { granted: false, canAskAgain: true };
  const appState = { currentState: 'active', addEventListener: (_, fn) => { onState = fn; return { remove() {} }; } };
  const mod = load('../components/PhonePairingScanner.tsx', {
    react: React,
    'react-native': { View: box, AppState: appState, BackHandler: { addEventListener: (_, fn) => { onBack = fn; return { remove() {} }; } }, Linking: { openSettings: async () => settings++ } },
    'expo-camera': { useCameraPermissions: () => [permission, async () => requested++, async () => permission], CameraView: props => { cameraProps = props; return React.createElement('div', { 'data-camera': true }); } },
    './UI': { Label: box, Button: ({ title, onPress }) => React.createElement('button', { onClick: onPress }, title) },
    '../store/School': { useSchool: () => ({ colors: {}, t: (_, en) => en }) },
    '../utils/phone-pairing': pairing,
  });
  const root = createRoot(dom.window.document.getElementById('root'));
  const render = () => React.act(async () => root.render(React.createElement(mod.PhonePairingScanner, { onPair: pair => pairs.push(pair), onClose: () => closed++ })));
  try {
    await render(); assert.equal(dom.window.document.querySelector('[data-camera]'), null);
    await React.act(async () => dom.window.document.querySelector('button').click()); assert.equal(requested, 1);
    permission = { granted: false, canAskAgain: false }; await render();
    await React.act(async () => dom.window.document.querySelector('button').click()); assert.equal(settings, 1);
    permission = { granted: true, canAskAgain: true }; await render();
    await React.act(async () => [...dom.window.document.querySelectorAll('button')].find(b => b.textContent === 'Turn flashlight on').click());
    assert.equal(cameraProps.enableTorch, true);
    await React.act(async () => cameraProps.onMountError());
    assert.match(dom.window.document.body.textContent, /Camera unavailable/);
    await React.act(async () => [...dom.window.document.querySelectorAll('button')].find(b => b.textContent === 'Retry camera').click());
    assert.doesNotMatch(dom.window.document.body.textContent, /Camera unavailable/);
    await React.act(async () => cameraProps.onBarcodeScanned({ data: 'https://example.com' }));
    assert.match(dom.window.document.body.textContent, /Scan the QR code shown inside/); assert.equal(pairs.length, 0);
    await React.act(async () => { appState.currentState = 'background'; onState('background'); });
    assert.equal(dom.window.document.querySelector('[data-camera]'), null);
    cameraProps.onBarcodeScanned({ data: pairing.phonePairingQr(origin, code) }); assert.equal(pairs.length, 0);
    await React.act(async () => { appState.currentState = 'active'; onState('active'); });
    await React.act(async () => { cameraProps.onBarcodeScanned({ data: pairing.phonePairingQr(origin, code) }); cameraProps.onBarcodeScanned({ data: pairing.phonePairingQr(origin, code) }); });
    assert.equal(pairs.length, 1); assert.equal(pairs[0].origin, origin); assert.equal(pairs[0].code, code);
    assert.equal(onBack(), true); assert.equal(closed, 1);
  } finally { await React.act(async () => root.unmount()); dom.window.close(); Object.assign(global, previous); }
});
