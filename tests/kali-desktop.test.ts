import test from 'node:test';
import assert from 'node:assert/strict';
import { WebSocket } from 'ws';
import { startDesktop, stopDesktop, consumeDesktopTicket, shutdownDesktop } from '../lib/kali-desktop.ts';
import { labAllowed, labBindHost } from '../lib/teacher-lab.ts';
import { wifiLabUrl } from '../lecomax-learning-app/utils/wifi-lab.ts';
import { DESECBCipher } from '../lecomax-learning-app/node_modules/@novnc/novnc/core/crypto/des.js';

async function verifyFrame(url: string, origin: string, password: string) {
  const ws = new WebSocket(url, { origin });
  let buffered = Buffer.alloc(0);
  let wake = () => {};
  let failure: Error | undefined;
  ws.on('message', data => { buffered = Buffer.concat([buffered, Buffer.from(data as Buffer)]); wake(); });
  ws.on('error', error => { failure = error; wake(); });
  const take = async (size: number) => {
    const deadline = Date.now() + 15000;
    while (buffered.length < size) {
      if (failure) throw failure;
      if (Date.now() > deadline) throw new Error('Desktop protocol timed out');
      await new Promise<void>(resolve => { const timer = setTimeout(resolve, 100); wake = () => { clearTimeout(timer); resolve(); }; });
    }
    const result = buffered.subarray(0, size); buffered = buffered.subarray(size); return result;
  };
  try {
    assert.equal((await take(12)).toString(), 'RFB 003.008\n');
    ws.send(Buffer.from('RFB 003.008\n'));
    const count = (await take(1))[0];
    const security = await take(count);
    assert.deepEqual([...security], [2]); // VNC authentication only; no unauthenticated fallback.
    ws.send(Buffer.from([2]));
    const cipher = DESECBCipher.importKey([...password].map(c => c.charCodeAt(0)));
    ws.send(cipher.encrypt({}, await take(16)));
    assert.equal((await take(4)).readUInt32BE(), 0, 'VNC password authenticates');
    ws.send(Buffer.from([1]));
    const init = await take(24);
    assert.ok(init.readUInt16BE(0) > 0 && init.readUInt16BE(2) > 0);
    assert.match((await take(init.readUInt32BE(20))).toString(), /Lecomax Kali/);
    // Request an actual 16x16 framebuffer rectangle with raw encoding.
    ws.send(Buffer.from([2, 0, 0, 1, 0, 0, 0, 0]));
    ws.send(Buffer.from([3, 0, 0, 0, 0, 0, 0, 16, 0, 16]));
    const update = await take(4);
    assert.equal(update[0], 0);
    assert.ok(update.readUInt16BE(2) > 0);
    const rectangle = await take(12);
    assert.equal(rectangle.readInt32BE(8), 0);
    const pixels = await take(rectangle.readUInt16BE(4) * rectangle.readUInt16BE(6) * init[4] / 8);
    assert.ok(pixels.length > 0, 'Live desktop pixels received');
  } finally { ws.close(); }
}

test('Wi-Fi access accepts only the configured private host and app origin', () => {
  const env = { NODE_ENV: 'development', LECOMAX_LOCAL_TERMINAL: '1', LECOMAX_LAB_HOST: '192.168.1.11' } as NodeJS.ProcessEnv;
  assert.equal(labAllowed('http://192.168.1.11:3002', 'http://192.168.1.11:8081', env), true);
  assert.equal(labAllowed('http://192.168.1.11:3002', 'http://192.168.1.12:8081', env), false);
  assert.equal(labAllowed('http://192.168.1.12:3002', 'http://192.168.1.11:8081', env), false);
  assert.equal(labAllowed('http://192.168.1.11:3002', 'http://192.168.1.11:8081', { ...env, NODE_ENV: 'production' }), false);
  assert.equal(labBindHost({ ...env, LECOMAX_LAB_HOST: '8.8.8.8' }), '127.0.0.1');
  assert.equal(wifiLabUrl('192.168.1.11'), 'http://192.168.1.11:8081');
  assert.equal(wifiLabUrl('192.168.1.11:8081'), 'http://192.168.1.11:8081');
  for (const input of ['http://example.com:8081', 'http://192.168.999.1:8081', 'http://192.168.1.1:8081@evil.com', 'file:///tmp', 'http://192.168.1.1:8081/path']) assert.equal(wifiLabUrl(input), null);
});

test('desktop denies disabled and nonlocal access', async () => {
  const previous = process.env.LECOMAX_LOCAL_TERMINAL;
  delete process.env.LECOMAX_LOCAL_TERMINAL;
  await assert.rejects(startDesktop('owner', 'http://localhost:8081'), /LOCAL_LAB_ONLY/);
  process.env.LECOMAX_LOCAL_TERMINAL = '1';
  await assert.rejects(startDesktop('owner', 'https://example.com'), /LOCAL_LAB_ONLY/);
  if (previous === undefined) delete process.env.LECOMAX_LOCAL_TERMINAL; else process.env.LECOMAX_LOCAL_TERMINAL = previous;
});

test('real Kali desktop has single-use origin-bound tickets and a protected RFB connection', { skip: process.env.LECOMAX_TEST_DESKTOP !== '1', timeout: 90000 }, async () => {
  process.env.LECOMAX_LOCAL_TERMINAL = '1';
  const origin = 'http://localhost:8081';
  try {
    const session = await startDesktop('desktop-test-owner', origin);
    assert.equal(session.password.length, 8);
    assert.equal(consumeDesktopTicket(session.ticket, 'https://example.com'), null);
    assert.equal(consumeDesktopTicket(session.ticket, origin, Date.now() + 61000), null);
    await assert.rejects(stopDesktop('other-owner', session.id), /DESKTOP_NOT_FOUND/);
    await assert.rejects(startDesktop('other-owner', origin), /DESKTOP_BUSY/);
    await verifyFrame(`ws://127.0.0.1:${session.port}/desktop?ticket=${session.ticket}`, origin, session.password);
    assert.equal(consumeDesktopTicket(session.ticket, origin), null);
    await new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(`ws://127.0.0.1:${session.port}/desktop?ticket=${session.ticket}`, { origin });
      ws.on('open', () => { ws.close(); reject(new Error('Replayed ticket accepted')); });
      ws.on('unexpected-response', (_req, res) => { assert.equal(res.statusCode, 403); res.resume(); resolve(); });
      ws.on('error', reject);
    });
    await stopDesktop('desktop-test-owner', session.id);
    await assert.rejects(stopDesktop('desktop-test-owner', session.id), /DESKTOP_NOT_FOUND/);
  } finally { await shutdownDesktop(); }
});
