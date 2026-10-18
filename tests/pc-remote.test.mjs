import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:net';
import { get } from 'node:http';
import { WebSocket } from 'ws';
import { createPcServer } from '../scripts/pc-remote-server.mjs';

test('PC bridge gates credentials and VNC by pairing, origin, host and session revocation', async () => {
  const upstream = createServer(socket => { socket.write('RFB 003.008\n'); socket.on('data', bytes => socket.write(bytes)); });
  await new Promise(resolve => upstream.listen(0, '127.0.0.1', resolve));
  const port = 16081;
  const base = `http://127.0.0.1:${port}`;
  const bridge = createPcServer({ host: '127.0.0.1', port, vncPort: upstream.address().port, code: '012345abcdef', password: 'testpass', stopToken: 'secret' });
  await new Promise(resolve => bridge.server.listen(port, '127.0.0.1', resolve));
  let socket;
  try {
    assert.equal((await fetch(base + '/session')).status, 401);
    assert.equal(await new Promise(resolve => get(base + '/', { headers: { Host: 'evil.invalid' } }, res => { res.resume(); resolve(res.statusCode); })), 403);
    assert.equal((await fetch(base + '/pair', { method: 'POST', body: 'code=012345abcdef' })).status, 403);
    assert.equal((await fetch(base + '/pair', { method: 'POST', headers: { Origin: base }, body: 'code=wrong' })).status, 403);
    const pair = () => fetch(base + '/pair', { method: 'POST', headers: { Origin: base }, body: 'code=0123-45ab-cdef' });
    const response = await pair(); assert.equal(response.status, 200);
    const cookie = response.headers.get('set-cookie').split(';')[0];
    const auth = { Cookie: cookie, Origin: base };
    assert.deepEqual(await (await fetch(base + '/session', { headers: auth })).json(), { password: 'testpass' });
    await new Promise((resolve, reject) => {
      const bad = new WebSocket(base.replace('http:', 'ws:') + '/desktop', { headers: { Cookie: cookie, Origin: 'http://evil.invalid' } });
      bad.on('open', () => { bad.terminate(); reject(Error('Wrong-origin WebSocket accepted')); });
      bad.on('error', () => resolve());
    });
    socket = new WebSocket(base.replace('http:', 'ws:') + '/desktop', { headers: auth });
    assert.equal(await new Promise((resolve, reject) => { socket.once('message', bytes => resolve(bytes.toString())); socket.once('error', reject); }), 'RFB 003.008\n');
    assert.equal((await fetch(base + '/disconnect', { method: 'POST', headers: { Origin: base } })).status, 401);
    const closed = new Promise(resolve => socket.once('close', resolve));
    await pair(); await closed;
    assert.equal((await fetch(base + '/session', { headers: auth })).status, 401);
    assert.equal((await fetch(base + '/novnc/%2e%2e/package.json', { headers: auth })).status, 404);
  } finally { socket?.terminate(); bridge.close(); await new Promise(resolve => upstream.close(resolve)); }
});

test('PC bridge expires sessions, rate-limits guessing, and protects the stop command', async () => {
  const port = 16082, base = `http://127.0.0.1:${port}`;
  let stopped = false;
  const bridge = createPcServer({ host: '127.0.0.1', port, code: '012345abcdef', password: 'testpass', stopToken: 'secret-stop', lifetime: 30, onStop: () => { stopped = true; } });
  await new Promise(resolve => bridge.server.listen(port, '127.0.0.1', resolve));
  try {
    const post = (route, body, extra = {}) => fetch(base + route, { method: 'POST', headers: { Origin: base, ...extra }, body });
    assert.equal((await post('/stop', '')).status, 405);
    assert.equal(stopped, false);
    const response = await post('/pair', 'code=012345abcdef');
    const cookie = response.headers.get('set-cookie').split(';')[0];
    await new Promise(resolve => setTimeout(resolve, 60));
    assert.equal((await fetch(base + '/session', { headers: { Cookie: cookie } })).status, 401);
    for (let i = 0; i < 9; i++) assert.equal((await post('/pair', 'code=wrong')).status, 403);
    assert.equal((await post('/pair', 'code=012345abcdef')).status, 429);
    assert.equal((await post('/stop', '', { 'x-stop-token': 'secret-stop' })).status, 200);
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(stopped, true);
  } finally { bridge.close(); }
});
