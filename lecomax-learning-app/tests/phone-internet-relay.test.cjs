const { test } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { WebSocket } = require('node:module').createRequire(require.resolve('../phone-relay/package.json'))('ws');
const { createRelay } = require('../phone-relay/server.cjs');
const key = 'a'.repeat(64);
async function fixture(t, options = {}) {
  const relay = createRelay({ accessKey: key, ...options });
  relay.server.listen(0, '127.0.0.1'); await once(relay.server, 'listening');
  t.after(() => relay.close());
  const origin = `http://127.0.0.1:${relay.server.address().port}`;
  const create = async (headers = {}) => fetch(origin + '/invitations', { method: 'POST', headers: { Authorization: `Bearer ${key}`, ...headers } });
  const socket = async (message) => {
    const ws = new WebSocket(origin.replace('http:', 'ws:') + '/internet-phone');
    await once(ws, 'open');
    const reply = once(ws, 'message'); ws.send(JSON.stringify(message));
    const [data] = await reply; return { ws, message: JSON.parse(data.toString()) };
  };
  return { origin, create, socket };
}
test('only backend key creates invitations; assets and expiry are bounded', async t => {
  let time = 1000;
  const f = await fixture(t, { now: () => time });
  assert.equal((await f.create({ Authorization: 'Bearer wrong' })).status, 403);
  assert.equal((await f.create({ Origin: 'https://evil.example' })).status, 403);
  const s = await (await f.create()).json();
  assert.equal(s.expiresAt, 601000);
  assert.notEqual(s.shareToken, s.viewerToken);
  for (const path of ['/health', '/internet-viewer', '/internet-viewer.js', '/viewer.css']) {
    const response = await fetch(f.origin + path); assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'no-store');
  }
  time = s.expiresAt;
  const ws = new WebSocket(f.origin.replace('http:', 'ws:') + '/internet-phone');
  await once(ws, 'open'); const closed = once(ws, 'close');
  ws.send(JSON.stringify({ type: 'publish', id: s.id, token: s.shareToken }));
  assert.equal((await closed)[0], 1008);
});
test('approved publisher delivers frames, cannot be reused, and viewer cannot control', async t => {
  const f = await fixture(t), s = await (await f.create()).json();
  const viewer = await f.socket({ type: 'watch', id: s.id, token: s.viewerToken });
  assert.equal(viewer.message.type, 'waiting');
  const connected = once(viewer.ws, 'message');
  const host = await f.socket({ type: 'publish', id: s.id, token: s.shareToken });
  assert.equal(host.message.type, 'connected'); await connected;
  const jpeg = Buffer.from([255, 216, 255, 217]);
  const received = once(viewer.ws, 'message'); host.ws.send(jpeg);
  assert.deepEqual((await received)[0], jpeg);
  const duplicate = new WebSocket(f.origin.replace('http:', 'ws:') + '/internet-phone');
  await once(duplicate, 'open'); const rejected = once(duplicate, 'close');
  duplicate.send(JSON.stringify({ type: 'publish', id: s.id, token: s.shareToken }));
  assert.equal((await rejected)[0], 1008);
  let forwarded = false; host.ws.on('message', () => { forwarded = true; });
  const denied = once(viewer.ws, 'close'); viewer.ws.send(JSON.stringify({ type: 'control', action: 'home' }));
  assert.equal((await denied)[0], 1008); assert.equal(forwarded, false);
  const rejoined = await f.socket({ type: 'watch', id: s.id, token: s.viewerToken });
  assert.equal(rejoined.message.type, 'connected');
  const stopped = once(host.ws, 'message');
  const stop = await fetch(`${f.origin}/invitations/${s.id}/stop`, { method: 'POST', headers: { Authorization: `Bearer ${s.viewerToken}` } });
  assert.equal(stop.status, 200); assert.equal(JSON.parse((await stopped)[0]).type, 'ended');
});
test('wrong role credentials and unauthorized stop are rejected; capture loss revokes session', async t => {
  const f = await fixture(t), s = await (await f.create()).json();
  const wrong = new WebSocket(f.origin.replace('http:', 'ws:') + '/internet-phone');
  await once(wrong, 'open'); const rejected = once(wrong, 'close');
  wrong.send(JSON.stringify({ type: 'watch', id: s.id, token: s.shareToken }));
  assert.equal((await rejected)[0], 1008);
  assert.equal((await fetch(`${f.origin}/invitations/${s.id}/stop`, { method: 'POST', headers: { Authorization: `Bearer ${s.shareToken}` } })).status, 403);
  const host = await f.socket({ type: 'publish', id: s.id, token: s.shareToken });
  const viewer = await f.socket({ type: 'watch', id: s.id, token: s.viewerToken });
  const ended = once(viewer.ws, 'message'); host.ws.close();
  assert.equal(JSON.parse((await ended)[0]).reason, 'capture-ended');
  assert.equal((await fetch(`${f.origin}/invitations/${s.id}/stop`, { method: 'POST', headers: { Authorization: `Bearer ${s.viewerToken}` } })).status, 410);
});
