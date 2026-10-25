const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createServer } = require('node:http');
const { mkdtempSync, mkdirSync, writeFileSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const { once } = require('node:events');
const { managedOrigin, apiReady, ensureLocalApi } = require('../scripts/local-api.cjs');

test('only the configured loopback development API can be started automatically', () => {
  assert.equal(managedOrigin('http://127.0.0.1:3002'), 'http://127.0.0.1:3002');
  assert.equal(managedOrigin('http://localhost:3002/'), 'http://localhost:3002');
  for (const value of [undefined, 'https://lecomax.com', 'http://192.168.1.1:3002',
    'http://localhost:3003', 'http://localhost:3002/other', 'http://user:pass@localhost:3002']) {
    assert.equal(managedOrigin(value), null);
  }
});

test('readiness rejects unavailable servers, HTML, wrong endpoints and backend errors', async () => {
  let status = 401, body = JSON.stringify({ error: 'UNAUTHORIZED' });
  const server = createServer((req, res) => {
    assert.equal(req.url, '/api/learning-mobile/auth/sessions');
    res.writeHead(status); res.end(body);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  try {
    assert.equal(await apiReady(origin), true);
    for (const code of [200, 404, 503]) { status = code; assert.equal(await apiReady(origin), false); }
    status = 401; body = '<html>wrong service</html>';
    assert.equal(await apiReady(origin), false);
  } finally { await new Promise(resolve => server.close(resolve)); }
  assert.equal(await apiReady(origin), false);
});

test('launcher starts the missing API, reuses it, and reports its exit', { timeout: 20000 }, async () => {
  const root = mkdtempSync(path.join(tmpdir(), 'learn-api-test-'));
  mkdirSync(path.join(root, 'scripts'));
  writeFileSync(path.join(root, 'scripts/check-learning-owner.mjs'), 'process.exit(0);');
  const reservation = createServer();
  await new Promise(resolve => reservation.listen(0, '127.0.0.1', resolve));
  const port = reservation.address().port;
  await new Promise(resolve => reservation.close(resolve));
  writeFileSync(path.join(root, 'scripts/start-notification-api.mjs'), `
    import { createServer } from 'node:http';
    createServer((req,res) => { res.writeHead(401); res.end(JSON.stringify({error:'UNAUTHORIZED'})); }).listen(${port}, '127.0.0.1');
  `);
  const origin = `http://127.0.0.1:${port}`;
  let child, exited = false;
  try {
    child = await ensureLocalApi(origin, { root, env: process.env, onExit: () => { exited = true; } });
    assert.ok(child?.pid);
    assert.equal(await apiReady(origin), true);
    assert.equal(await ensureLocalApi(origin, { root, env: process.env }), null);
    const exit = once(child, 'exit'); child.kill(); await exit;
    assert.equal(exited, true);
    assert.equal(await apiReady(origin), false);
    writeFileSync(path.join(root, 'scripts/check-learning-owner.mjs'), 'process.exit(1);');
    await assert.rejects(ensureLocalApi(origin, { root, env: process.env }), /Login database unavailable/);
  } finally {
    if (child && child.exitCode === null && child.signalCode === null) {
      const exit = once(child, 'exit'); child.kill(); await exit;
    }
    rmSync(root, { recursive: true, force: true });
  }
});
