const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { JSDOM } = require('jsdom');
const load = (file, dependencies = {}, globals = {}) => {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(require.resolve(file), 'utf8'), { compilerOptions: { jsx: ts.JsxEmit.React, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText, {
    exports, URL, setTimeout, clearTimeout, setInterval, clearInterval, ...globals, require: name => { assert.ok(dependencies[name], name); return dependencies[name]; },
  });
  return exports;
};
const invitation = load('../utils/phone-internet.ts');
const id = 'a'.repeat(32), token = 'b'.repeat(64), payload = `internet|${id}|${token}`;
test('internet invitation parsing rejects malformed credentials and keeps secrets in fragment', () => {
  assert.equal(invitation.parseInternetInvitation(payload).id, id);
  for (const invalid of [null, [payload], payload + '|extra', payload.slice(1), payload.replace(id, 'z'.repeat(32)), payload.toUpperCase()]) assert.equal(invitation.parseInternetInvitation(invalid), null);
  const url = new URL(invitation.internetInvitationLink(id, token));
  assert.equal(url.search, ''); assert.equal(new URLSearchParams(url.hash.slice(1)).get('invite'), payload);
});
test('backend invitation creation requires owner authentication and never returns the relay key', async () => {
  let owner = null, calls = 0, limited = null;
  const secret = 'c'.repeat(64);
  const { POST } = load('../../app/api/learning-mobile/phone-invitations/route.ts', {
    '@/lib/learning-mobile-auth': { mobileOwner: async () => owner, mobileJson: (body, status = 200) => ({ body, status }) },
    '@/lib/sensitive-rate-limit': { sensitiveRateLimit: async () => limited },
  }, { process: { env: { PHONE_RELAY_KEY: secret } }, AbortSignal, fetch: async (url, options) => {
    calls++; assert.equal(url, 'https://phone.lecomax.com/invitations');
    assert.equal(options.headers.Authorization, `Bearer ${secret}`);
    return { ok: true, json: async () => ({ id, shareToken: token, viewerToken: 'd'.repeat(64), expiresAt: Date.now() + 600000, secret }) };
  } });
  assert.equal((await POST({})).status, 401); assert.equal(calls, 0);
  owner = 'owner'; limited = { status: 429 };
  assert.equal((await POST({})).status, 429); assert.equal(calls, 0);
  limited = null; const result = await POST({});
  assert.equal(result.status, 200); assert.equal(calls, 1);
  assert.equal(result.body.shareToken, token); assert.equal(JSON.stringify(result).includes(secret), false);
});
test('recipient capture starts only on approval and Stop ends the owned session', async () => {
  const { createRoot } = require('react-dom/client');
  const dom = new JSDOM('<div id="root"></div>');
  const saved = { window: global.window, document: global.document, IS_REACT_ACT_ENVIRONMENT: global.IS_REACT_ACT_ENVIRONMENT };
  Object.assign(global, { window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true });
  let captures = 0, stops = 0, state = 'idle';
  const box = ({ children }) => React.createElement('div', null, children);
  const remote = { status: async () => ({ state }), startInternetShare: async (session, credential) => { assert.equal(session, id); assert.equal(credential, token); captures++; state = 'sharing'; }, stop: () => { stops++; state = 'idle'; } };
  const { default: PhoneShare } = load('../app/phone-share.tsx', {
    react: React, 'react-native': { ScrollView: box, NativeModules: { PhoneRemote: remote }, Platform: { OS: 'android' } },
    'expo-router': { Stack: { Screen: () => null }, useLocalSearchParams: () => ({ invite: payload }) },
    '../components/UI': { Card: box, Label: box, Button: ({ title, onPress, disabled }) => React.createElement('button', { onClick: onPress, disabled }, title) },
    '../store/School': { useSchool: () => ({ t: (_fr, en) => en, colors: {} }) },
    '../utils/phone-internet': invitation,
  });
  const root = createRoot(document.getElementById('root'));
  const click = async title => { const button = [...document.querySelectorAll('button')].find(b => b.textContent === title); assert.ok(button, title); await React.act(async () => button.click()); };
  try {
    await React.act(async () => root.render(React.createElement(PhoneShare)));
    assert.equal(captures, 0);
    await click('Decline / Cancel'); assert.equal(captures, 0); assert.equal(stops, 0);
    await React.act(async () => root.render(React.createElement(PhoneShare, { key: 'fresh' })));
    await click('Approve and share my screen'); assert.equal(captures, 1);
    assert.match(document.body.textContent, /Screen sharing is active/);
    await click('Stop sharing'); assert.equal(stops, 1);
  } finally { await React.act(async () => root.unmount()); dom.window.close(); Object.assign(global, saved); }
});
test('WhatsApp internet links open the guest consent route and retain legacy validation', () => {
  const html = fs.readFileSync(require.resolve('../../public/phone-invite.html'), 'utf8');
  const script = fs.readFileSync(require.resolve('../../public/phone-invite.js'), 'utf8');
  for (const valid of [true, false]) {
    const dom = new JSDOM(html, { url: invitation.internetInvitationLink(id, token) + (valid ? '' : '&invite=duplicate'), runScripts: 'outside-only' });
    try {
      dom.window.fetch = () => { throw Error('Must not transmit invitation'); };
      dom.window.eval(script); const d = dom.window.document;
      assert.equal(d.getElementById('actions').hidden, !valid);
      if (valid) {
        assert.match(d.getElementById('direct').href, /^lecomax-learn:\/\/phone-share\?invite=/);
        assert.match(d.body.textContent, /No account is needed/);
        for (const language of ['fr', 'ar', 'en']) {
          d.getElementById('language').value = language;
          d.getElementById('language').dispatchEvent(new dom.window.Event('change'));
          assert.equal(d.documentElement.lang, language);
          assert.equal(d.getElementById('actions').hidden, false);
        }
      }
    } finally { dom.window.close(); }
  }
});
test('logged-out access is limited to recipient screen, with owner viewing and creation gated', () => {
  let path = '/phone-share', status = 'anonymous';
  const box = ({ children }) => React.createElement('div', null, children);
  const { OwnerGate } = load('../features/OwnerGate.tsx', {
    react: React, 'react-native': { View: box, Platform: { OS: 'android' }, ActivityIndicator: box },
    'expo-router': { usePathname: () => path }, '@expo/vector-icons/Ionicons': box,
    '../components/UI': { Button: () => null, Label: box }, './AuthLayout': { AuthLayout: box, AuthField: () => null },
    '../store/School': { useSchool: () => ({ t: (_fr, en) => en, colors: {}, update() {} }) },
    '../services/auth': { auth: { subscribe: () => () => {}, snapshot: () => status }, SessionError: Error },
    '../components/PhonePythonLab': { PhonePythonLab: () => null },
  });
  const render = () => renderToStaticMarkup(React.createElement(OwnerGate, null, 'PROTECTED_CONTENT'));
  assert.match(render(), /PROTECTED_CONTENT/);
  for (path of ['/phone', '/phone-internet', '/', '/teacher', '/phone-share/other']) assert.doesNotMatch(render(), /PROTECTED_CONTENT/);
  status = 'authenticated'; path = '/phone-internet'; assert.match(render(), /PROTECTED_CONTENT/);
});
test('viewer keeps cancellation credentials when offline Stop is unconfirmed, then retries', async () => {
  const { createRoot } = require('react-dom/client');
  const dom = new JSDOM('<div id="root"></div>');
  const saved = { window: global.window, document: global.document, IS_REACT_ACT_ENVIRONMENT: global.IS_REACT_ACT_ENVIRONMENT };
  Object.assign(global, { window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true });
  let offline = true, stops = 0;
  const box = ({ children }) => React.createElement('div', null, children);
  const { PhoneInternetInvitation } = load('../components/PhoneInternetInvitation.tsx', {
    react: React, 'react-native': { View: box, TextInput: () => null, Platform: { OS: 'android' }, Linking: {}, Share: {} },
    'expo-router': { router: {} }, 'expo-clipboard': {},
    '../services/auth': { auth: { token: async () => 'owner-token' }, API: 'https://lecomax.com' },
    './UI': { Card: box, Label: box, Button: ({ title, onPress, disabled }) => React.createElement('button', { onClick: onPress, disabled }, title) },
    '../store/School': { useSchool: () => ({ t: (_fr, en) => en, colors: {} }) },
    '../utils/phone-internet': invitation,
    './InternetPhoneViewer': { InternetPhoneViewer: ({ onEnded }) => React.createElement('button', { onClick: onEnded }, 'Viewer stopped offline') },
  }, { AbortController, fetch: async (url, options) => {
    if (url.endsWith('/phone-invitations')) return { ok: true, json: async () => ({ id, shareToken: token, viewerToken: 'd'.repeat(64), expiresAt: Date.now() + 600000 }) };
    stops++; assert.equal(options.headers.Authorization, `Bearer ${'d'.repeat(64)}`);
    if (offline) throw Error('Offline'); return { ok: true, status: 200 };
  } });
  const root = createRoot(document.getElementById('root'));
  const click = async title => { const button = [...document.querySelectorAll('button')].find(b => b.textContent === title); assert.ok(button, title); await React.act(async () => button.click()); };
  try {
    await React.act(async () => root.render(React.createElement(PhoneInternetInvitation, { blocked: false })));
    await click('Create internet sharing link');
    await click('Viewer stopped offline');
    assert.match(document.body.textContent, /Stop not confirmed/);
    assert.doesNotMatch(document.body.textContent, /Sharing ended\./);
    offline = false; await click('Stop / Cancel link');
    assert.equal(stops, 2); assert.match(document.body.textContent, /Sharing ended\./);
  } finally { await React.act(async () => root.unmount()); dom.window.close(); Object.assign(global, saved); }
});
