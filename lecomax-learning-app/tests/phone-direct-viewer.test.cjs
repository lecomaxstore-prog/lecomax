const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM } = require('jsdom');

function viewer() {
  const dom = new JSDOM(fs.readFileSync(require.resolve('../phone-relay/direct.html'), 'utf8'), { url: 'http://100.80.1.2:8092', runScripts: 'outside-only', pretendToBeVisual: true });
  const calls = [], timers = [];
  let approved = false, failed = false, controlStatus = 200, loseJoin = false, viewOnly = false;
  dom.window.AbortSignal.timeout = () => undefined;
  dom.window.URL.createObjectURL = () => 'blob:frame';
  dom.window.URL.revokeObjectURL = () => {};
  dom.window.setTimeout = fn => { timers.push(fn); };
  dom.window.fetch = async (path, options) => {
    calls.push({ path, options });
    if (path === '/join' && loseJoin) { loseJoin = false; throw new TypeError('Reply lost'); }
    if (path === '/control') return { ok: controlStatus === 200, status: controlStatus };
    if (failed === 'network') throw new TypeError('Network unavailable');
    return { ok: !failed, status: failed ? 403 : 200, json: async () => path === '/join' ? { token: 'private-session' } : { approved, viewOnly }, blob: async () => new dom.window.Blob(['frame']) };
  };
  dom.window.eval(fs.readFileSync(require.resolve('../phone-relay/direct.js'), 'utf8'));
  return { dom, calls, timers, viewOnly: () => { viewOnly = true; }, loseJoin: () => { loseJoin = true; }, controlStatus: value => { controlStatus = value; }, approve: () => { approved = true; }, fail: (value = true) => { failed = value; } };
}
const flush = () => new Promise(resolve => setImmediate(resolve));
test('view-only session displays frames but hides navigation and sends no controls', async () => {
  const v = viewer();
  try {
    v.viewOnly(); v.approve(); await join(v);
    const d = v.dom.window.document;
    assert.equal(d.getElementById('controls').hidden, true);
    assert.equal(d.getElementById('status').textContent, 'Connected · View only');
    assert.equal(d.getElementById('screen').getAttribute('src'), 'blob:frame');
    d.querySelector('[data-action="home"]').click();
    const screen = d.getElementById('screen');
    Object.defineProperty(screen, 'naturalWidth', { value: 400 });
    screen.onpointerdown({ isPrimary: true, button: 0 });
    screen.onpointerup({ pointerId: 1 });
    await flush();
    assert.equal(v.calls.some(c => c.path === '/control'), false);
  } finally { v.dom.window.close(); }
});
test('gestures use displayed frame coordinates and discard a mid-gesture rotation', async () => {
  const v = viewer();
  try {
    v.approve(); await join(v);
    const screen = v.dom.window.document.getElementById('screen');
    let width = 432, height = 960;
    Object.defineProperties(screen, { naturalWidth: { get: () => width }, naturalHeight: { get: () => height } });
    screen.getBoundingClientRect = () => ({ left: 40, top: 20, width: 216, height: 480 });
    screen.setPointerCapture = () => {};
    const event = { isPrimary: true, button: 0, pointerId: 1, clientX: 148, clientY: 260 };
    screen.onpointerdown(event); screen.onpointerup(event); await flush();
    const input = JSON.parse(v.calls.find(call => call.path === '/control').options.headers['X-Control']);
    assert.equal(input.x, .5); assert.equal(input.y, .5);
    assert.equal(input.frameWidth, 432); assert.equal(input.frameHeight, 960);
    const before = v.calls.filter(call => call.path === '/control').length;
    screen.onpointerdown(event); width = 960; height = 432; screen.onpointerup(event); await flush();
    assert.equal(v.calls.filter(call => call.path === '/control').length, before);
  } finally { v.dom.window.close(); }
});
async function join(v) {
  v.dom.window.document.getElementById('code').value = 'a'.repeat(32);
  v.dom.window.document.getElementById('pair').dispatchEvent(new v.dom.window.Event('submit', { cancelable: true }));
  await flush();
}
test('direct viewer waits for owner approval, authenticates frames/controls, and clears on disconnect', async () => {
  const v = viewer(), d = v.dom.window.document;
  try {
    await join(v);
    assert.equal(d.getElementById('code').value, '');
    assert.equal(d.getElementById('controls').hidden, true);
    assert.equal(v.calls.some(c => c.path === '/frame'), false);
    assert.equal(v.calls[0].options.headers['X-Pairing-Code'], 'a'.repeat(32));
    v.approve(); v.timers.shift()(); await flush();
    assert.equal(d.getElementById('controls').hidden, false);
    assert.equal(d.getElementById('screen').getAttribute('src'), 'blob:frame');
    d.querySelector('[data-action="home"]').click(); await flush();
    const control = v.calls.find(c => c.path === '/control');
    assert.equal(control.options.headers.Authorization, 'Bearer private-session');
    assert.equal(JSON.parse(control.options.headers['X-Control']).action, 'home');
    d.getElementById('stop').click();
    assert.equal(d.getElementById('screen').hasAttribute('src'), false);
    assert.equal(d.getElementById('controls').hidden, true);
    assert.equal(v.calls.at(-1).path, '/stop');
    const before = v.calls.length; v.timers.shift()(); await flush();
    assert.equal(v.calls.length, before);
  } finally { v.dom.window.close(); }
});
test('expired session clears the image and requires a new session', async () => {
  const v = viewer(), d = v.dom.window.document;
  try {
    v.approve(); await join(v); v.fail(); v.timers.shift()(); await flush();
    assert.equal(d.getElementById('screen').hasAttribute('src'), false);
    assert.equal(d.getElementById('connect').disabled, false);
    assert.match(d.getElementById('status').textContent, /Session ended/);
  } finally { v.dom.window.close(); }
});
test('hiding for a day and returning pauses and resumes the same authenticated session', async () => {
  const v = viewer();
  try {
    await join(v);
    Object.defineProperty(v.dom.window.document, 'hidden', { value: true, configurable: true });
    v.dom.window.document.dispatchEvent(new v.dom.window.Event('visibilitychange'));
    assert.equal(v.calls.at(-1).path, '/pause');
    assert.equal(v.dom.window.document.getElementById('controls').hidden, true);
    const now = v.dom.window.Date.now();
    v.dom.window.Date.now = () => now + 24 * 60 * 60 * 1000;
    Object.defineProperty(v.dom.window.document, 'hidden', { value: false, configurable: true });
    v.dom.window.document.dispatchEvent(new v.dom.window.Event('visibilitychange'));
    await flush();
    assert.equal(v.calls.at(-1).path, '/status');
    assert.equal(v.calls.filter(c => c.path === '/join').length, 1);
    assert.equal(v.calls.some(c => c.path === '/stop'), false);
  } finally { v.dom.window.close(); }
});

test('temporary network failure automatically recovers using the existing token', async () => {
  const v = viewer(), d = v.dom.window.document;
  try {
    v.approve(); await join(v); v.fail('network'); v.timers.shift()(); await flush();
    assert.equal(d.getElementById('screen').hasAttribute('src'), false);
    assert.equal(d.getElementById('controls').hidden, true);
    assert.equal(d.getElementById('connect').disabled, true);
    assert.match(d.getElementById('status').textContent, /Reconnecting automatically/);
    const now = v.dom.window.Date.now();
    v.dom.window.Date.now = () => now + 24 * 60 * 60 * 1000;
    v.timers.shift()(); await flush();
    assert.equal(v.calls.some(c => c.path === '/stop'), false);
    v.fail(false); v.timers.shift()(); await flush();
    assert.equal(d.getElementById('screen').getAttribute('src'), 'blob:frame');
    assert.equal(v.calls.filter(c => c.path === '/join').length, 1);
    assert.equal(v.calls.some(c => c.path === '/stop'), false);
  } finally { v.dom.window.close(); }
});

test('QR handoff joins once, clears code and still waits for sharing-phone approval', async () => {
  const v = viewer();
  try {
    v.dom.window.lecomaxPairCode('not-a-code'); assert.equal(v.calls.length, 0);
    v.dom.window.lecomaxPairCode('b'.repeat(32));
    v.dom.window.lecomaxPairCode('b'.repeat(32));
    await flush();
    assert.equal(v.calls.filter(c => c.path === '/join').length, 1);
    assert.equal(v.calls[0].options.headers['X-Pairing-Code'], 'b'.repeat(32));
    assert.equal(v.dom.window.document.getElementById('code').value, '');
    assert.equal(v.calls.some(c => c.path === '/frame' || c.path === '/control'), false);
    assert.equal(v.dom.window.location.search, '');
    assert.equal(v.dom.window.location.hash, '');
  } finally { v.dom.window.close(); }
});

test('rapid taps and temporary control unavailability do not disconnect the session', async () => {
  const v = viewer();
  try {
    v.approve(); await join(v);
    for (const code of [429, 409]) {
      v.controlStatus(code);
      v.dom.window.document.querySelector('[data-action="home"]').click(); await flush();
      assert.equal(v.calls.some(c => c.path === '/stop'), false);
      assert.equal(v.dom.window.document.getElementById('connect').disabled, true);
    }
  } finally { v.dom.window.close(); }
});

test('native in-memory token restoration resumes without consuming a pairing code', async () => {
  const v = viewer();
  try {
    v.dom.window.lecomaxRestoreSession('invalid'); assert.equal(v.calls.length, 0);
    v.approve(); v.dom.window.lecomaxRestoreSession('c'.repeat(32)); await flush();
    assert.equal(v.calls.filter(c => c.path === '/join').length, 0);
    assert.equal(v.calls[0].options.headers.Authorization, 'Bearer ' + 'c'.repeat(32));
    assert.equal(v.dom.window.document.getElementById('screen').getAttribute('src'), 'blob:frame');
    v.dom.window.document.getElementById('stop').click(); await flush();
    assert.equal(v.calls.at(-1).path, '/stop');
  } finally { v.dom.window.close(); }
});

test('lost join reply retries the same random attempt without asking for another scan', async () => {
  const v = viewer();
  try {
    v.loseJoin(); await join(v);
    assert.match(v.dom.window.document.getElementById('status').textContent, /Retrying your scan/);
    v.timers.shift()(); await flush();
    const joins = v.calls.filter(c => c.path === '/join');
    assert.equal(joins.length, 2);
    assert.match(joins[0].options.headers['X-Pairing-Request'], /^[a-f0-9]{32}$/);
    assert.equal(joins[0].options.headers['X-Pairing-Request'], joins[1].options.headers['X-Pairing-Request']);
    assert.equal(v.calls.some(c => c.path === '/stop'), false);
    assert.equal(v.dom.window.document.getElementById('code').value, '');
  } finally { v.dom.window.close(); }
});
