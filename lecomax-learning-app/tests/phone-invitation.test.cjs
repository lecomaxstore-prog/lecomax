const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { createRoot } = require('react-dom/client');
const { JSDOM } = require('jsdom');
function load(file, dependencies = {}, globals = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(require.resolve(file), 'utf8'), { compilerOptions: { jsx: ts.JsxEmit.React, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText;
  vm.runInNewContext(code, { exports, URL, URLSearchParams, setTimeout, clearTimeout, setInterval, clearInterval, AbortController, ...globals,
    require: id => { assert.ok(dependencies[id], id); return dependencies[id]; } });
  return exports;
}
const invitation = load('../utils/phone-invitation.ts');
const pairing = load('../utils/phone-pairing.ts');
const payload = 'http://100.80.1.2:8093|' + 'b'.repeat(64);
test('invitation accepts only canonical private addresses and a 256-bit token', () => {
  const link = invitation.phoneInvitationLink(payload);
  assert.equal(new URLSearchParams(new URL(link).hash.slice(1)).get('invite'), payload);
  assert.equal(new URL(link).search, '');
  assert.equal(invitation.phoneInvitationPayload(link), payload);
  assert.equal(invitation.phoneInvitationPayload(invitation.phoneInvitationAppLink(payload)), payload);
  for (const invalid of [link.replace('lecomax.com','lecomax.com.evil.example'), link.replace('https:','http:'), link.replace('/phone-invite.html','/other'), link+'&invite=duplicate', link.replace('#invite=', '?invite='), 'javascript:alert(1)', invitation.phoneInvitationAppLink(payload)+'&next=evil']) {
    assert.equal(invitation.phoneInvitationPayload(invalid), null);
  }
  assert.equal(invitation.parsePhoneInvitation(payload).origin, 'http://100.80.1.2:8093');
  for (const input of [undefined, [payload], payload+'|extra', payload.replace(':8093', ':8092'), payload.replace('100.80', '192.168'), payload.replace('http:', 'https:'), payload.replace(':8093', ':8093/path'), payload.slice(0,-1), payload.replace('100.80.1.2', 'user@100.80.1.2')]) {
    assert.equal(invitation.parsePhoneInvitation(input), null);
  }
});
const flush = () => new Promise(resolve => setImmediate(resolve));
test('main phone shares an invitation and hands the accepted device to the embedded viewer', async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost' });
  const oldWindow = global.window, oldDocument = global.document;
  global.window = dom.window; global.document = dom.window.document;
  let pair = '', finished = 0, cancelled = 0, failWhatsApp = false, enterLink;
  const polls = [], connected = [], shared = [], params = [];
  const box = ({ children }) => React.createElement('div', null, children);
  const { PhoneInvitation } = load('../components/PhoneInvitation.tsx', {
    react: React, 'react-native': { NativeModules: { PhoneRemote: {
      createInvitation: async () => payload, startViewOnly() { throw Error('Viewer must never capture'); },
      invitationStatus: async () => ({ expired: false, pair }),
      finishInvitation() { finished++; }, cancelInvitation() { cancelled++; },
    } }, Platform: { OS: 'android' }, TextInput: ({ onChangeText }) => { enterLink = onChangeText; return null; }, Linking: { openURL: async value => { if (failWhatsApp) throw Error('Not installed'); shared.push({ whatsapp: value }); } }, Share: { share: async value => shared.push(value) }, View: box },
    'expo-clipboard': {}, 'expo-router': { router: { setParams(value) { params.push(value); } } },
    './UI': { Card: box, Label: box, Button: ({ title, onPress, disabled }) => React.createElement('button', { onClick: onPress, disabled }, title) },
    '../store/School': { useSchool: () => ({ t: (_fr,en) => en, colors: { muted: '#777', text: '#111' } }) },
    '../utils/phone-invitation': invitation, '../utils/phone-pairing': pairing,
  }, { setInterval: fn => { polls.push(fn); return 1; }, clearInterval() {} });
  const root = createRoot(dom.window.document.getElementById('root'));
  const click = async title => {
    const button = [...dom.window.document.querySelectorAll('button')].find(b => b.textContent === title);
    assert.ok(button, title); button.click(); for (let i=0;i<6;i++) await flush();
  };
  try {
    root.render(React.createElement(PhoneInvitation, { blocked: false, onOpen() {}, onConnect: value => connected.push(value) }));
    for (let i=0;i<6;i++) await flush();
    enterLink('https://evil.example/phone-invite.html'); for (let i=0;i<3;i++) await flush();
    await click('Review invitation'); assert.equal(params.length,0);
    enterLink(invitation.phoneInvitationLink(payload)); for (let i=0;i<3;i++) await flush();
    await click('Review invitation'); assert.equal(params[0].invite,payload);
    await click('Create viewing invitation'); await click('Share link');
    assert.ok(shared[0].message.endsWith(invitation.phoneInvitationLink(payload)));
    await click('Send through WhatsApp');
    assert.equal(new URL(shared[1].whatsapp).searchParams.get('text'), shared[0].message);
    failWhatsApp = true; await click('Send through WhatsApp'); assert.equal(shared[2].message,shared[0].message);
    assert.equal(connected.length, 0);
    pair = 'http://100.80.1.3:8092|'+'a'.repeat(32);
    await polls.at(-1)(); for (let i=0;i<6;i++) await flush();
    assert.equal(connected.length, 1); assert.equal(connected[0].origin, 'http://100.80.1.3:8092');
    assert.equal(finished, 1); assert.equal(cancelled, 0);
  } finally { root.unmount(); await flush(); await flush(); dom.window.close(); global.window=oldWindow; global.document=oldDocument; }
  assert.equal(cancelled, 0, 'Keep receiver alive briefly so a dropped acceptance response can retry');
});
test('opening an invitation requires explicit approval before capture and delivers once approved', async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost' });
  const oldWindow = global.window, oldDocument = global.document;
  global.window = dom.window; global.document = dom.window.document;
  let captures = 0, stops = 0, starts = false; const calls = [], opens = [];
  const remote = {
    createInvitation: async () => payload, cancelInvitation() {}, finishInvitation() {},
    status: async () => ({ state: starts ? 'waiting' : 'idle', directUrl: 'http://100.80.1.3:8092', tailscaleIp: '100.80.1.3', viewOnly: starts }),
    startViewOnly: async () => { captures++; starts = true; },
    allowQrConnection: async () => 'a'.repeat(32), stop: () => { stops++; },
  };
  const box = ({ children }) => React.createElement('div', null, children);
  const { PhoneInvitation } = load('../components/PhoneInvitation.tsx', {
    react: React, 'react-native': { NativeModules: { PhoneRemote: remote }, Platform: { OS: 'android' }, TextInput: () => null, Linking: {}, Share: {}, View: box },
    'expo-clipboard': {}, 'expo-router': { router: { setParams() {} } },
    './UI': { Card: box, Label: box, Button: ({ title, onPress, disabled }) => React.createElement('button', { onClick: onPress, disabled }, title) },
    '../store/School': { useSchool: () => ({ t: (_fr,en) => en, colors: { muted: '#777', text: '#111' } }) },
    '../utils/phone-invitation': invitation, '../utils/phone-pairing': pairing,
  }, { fetch: async (url, options) => { calls.push({ url, options }); return { ok: true }; } });
  const root = createRoot(dom.window.document.getElementById('root'));
  try {
    root.render(React.createElement(PhoneInvitation, { incoming: payload, blocked: false, onOpen: value => opens.push(value), onConnect() {} }));
    for (let i=0;i<6;i++) await flush();
    assert.equal(captures, 0); assert.equal(calls.length, 0);
    const button = [...dom.window.document.querySelectorAll('button')].find(b => b.textContent === 'Approve view-only sharing');
    assert.ok(button); button.click();
    for (let i=0;i<8;i++) await flush();
    assert.equal(captures, 1); assert.equal(calls.length, 1);
    assert.equal(calls[0].url, 'http://100.80.1.2:8093/accept');
    assert.equal(calls[0].options.headers.Authorization, 'Bearer '+'b'.repeat(64));
    assert.equal(calls[0].options.headers['X-Pairing-Code'], 'a'.repeat(32));
    assert.match(dom.window.document.body.textContent, /View-only sharing is ready/);
    [...dom.window.document.querySelectorAll('button')].find(b => b.textContent === 'Stop sharing').click();
    await flush(); assert.equal(stops, 1); assert.equal(opens.at(-1), false);
  } finally { root.unmount(); await flush(); await flush(); dom.window.close(); global.window=oldWindow; global.document=oldDocument; }
});
