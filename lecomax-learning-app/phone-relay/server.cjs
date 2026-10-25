/* global Buffer, __dirname */
const http = require('node:http');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { WebSocketServer, WebSocket } = require('ws');
const { createInternetRelay } = require('./internet.cjs');

const MAX_FRAME = 512 * 1024;
const send = (ws, value) => { if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(value)); };
const same = (a, b) => typeof a === 'string' && /^[a-f0-9]{64}$/i.test(a) && crypto.timingSafeEqual(Buffer.from(a.toLowerCase()), Buffer.from(b.toLowerCase()));
const unit = value => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1;
function validControl(m) {
  if (m.type !== 'control') return false;
  if (['back', 'home', 'recents'].includes(m.action)) return true;
  return m.action === 'gesture' && [m.x, m.y, m.toX, m.toY].every(unit) &&
    Number.isInteger(m.duration) && m.duration >= 40 && m.duration <= 1500;
}

// TLS terminates at the reverse proxy. Never expose this HTTP listener publicly.
function createRelay({ accessKey, sessionMs = 4 * 60 * 60 * 1000, pairingMs = 10 * 60 * 1000, now = Date.now } = {}) {
  if (!/^[a-f0-9]{64}$/i.test(accessKey || '')) throw Error('PHONE_RELAY_KEY must be 32 random bytes encoded as 64 hex characters.');
  const sessions = new Map();
  const addresses = new Map();
  const internet = createInternetRelay({ accessKey, now, pairingMs, sessionMs });
  const server = http.createServer((req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Content-Security-Policy', "default-src 'none'; script-src 'self'; style-src 'self'; img-src blob:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
    if (internet.handle(req, res)) return;
    const assets = { '/': ['viewer.html', 'text/html; charset=utf-8'], '/viewer.js': ['viewer.js', 'text/javascript'], '/viewer.css': ['viewer.css', 'text/css'] };
    if (Object.hasOwn(assets, req.url) && req.method === 'GET') {
      const [file, type] = assets[req.url];
      res.writeHead(200, { 'Content-Type': type });
      res.end(fs.readFileSync(path.join(__dirname, file))); return;
    }
    res.writeHead(req.url === '/health' ? 200 : 404, { 'Content-Type': 'application/json' });
    res.end(req.url === '/health' ? '{"ok":true}' : '{"error":"not_found"}');
  });
  const wss = new WebSocketServer({ noServer: true, maxPayload: MAX_FRAME, perMessageDeflate: false });
  server.on('upgrade', (req, socket, head) => {
    if (internet.upgrade(req, socket, head)) return;
    const address = req.socket.remoteAddress;
    if (req.url !== '/phone' || wss.clients.size >= 64 || (addresses.get(address) || 0) >= 32) {
      socket.destroy(); return;
    }
    wss.handleUpgrade(req, socket, head, ws => {
      addresses.set(address, (addresses.get(address) || 0) + 1);
      ws.once('close', () => { const count = (addresses.get(address) || 1) - 1; if (count) addresses.set(address, count); else addresses.delete(address); });
      wss.emit('connection', ws);
    });
  });
  function end(session, reason) {
    if (!sessions.delete(session.code)) return;
    for (const ws of [session.host, session.viewer]) {
      send(ws, { type: 'ended', reason });
      ws?.close(1000, 'Session ended');
    }
  }
  wss.on('connection', ws => {
    ws.alive = true;
    ws.on('pong', () => { ws.alive = true; });
    let role, session, count = 0, bucket = now();
    const authTimeout = setTimeout(() => ws.close(1008, 'Pairing required'), 10000);
    ws.on('error', () => {});
    ws.on('message', (data, binary) => {
      const time = now();
      if (time - bucket >= 1000) { count = 0; bucket = time; }
      if (++count > 30) { ws.close(1008, 'Rate limit'); return; }
      if (session && (time >= session.expires || (!session.approved && time >= session.pairExpires))) { end(session, 'expired'); return; }
      if (binary) {
        if (role !== 'host' || !session?.approved) { ws.close(1008, 'Not sharing'); return; }
        if (data.length < 4 || data[0] !== 0xff || data[1] !== 0xd8) { ws.close(1008, 'Invalid image'); return; }
        if (session.viewer?.readyState === WebSocket.OPEN && session.viewer.bufferedAmount < MAX_FRAME) session.viewer.send(data, { binary: true });
        return;
      }
      if (data.length > 4096) { ws.close(1008, 'Message too large'); return; }
      let m;
      try { m = JSON.parse(data.toString()); } catch { ws.close(1008, 'Invalid message'); return; }
      if (!m || typeof m !== 'object') { ws.close(1008, 'Invalid message'); return; }
      if (!role) {
        if (m.type === 'host' && same(m.key, accessKey) && sessions.size < 16) {
          role = 'host';
          const code = crypto.randomBytes(16).toString('hex');
          session = { code, host: ws, viewer: null, approved: false, expires: time + sessionMs, pairExpires: time + pairingMs };
          sessions.set(code, session);
          clearTimeout(authTimeout);
          send(ws, { type: 'created', code, expires: session.expires });
        } else if (m.type === 'join' && typeof m.code === 'string' && /^[a-f0-9]{32}$/.test(m.code)) {
          const found = sessions.get(m.code);
          if (!found || found.viewer || time >= found.pairExpires || time >= found.expires) { ws.close(1008, 'Pairing unavailable'); return; }
          role = 'viewer'; session = found; session.viewer = ws;
          clearTimeout(authTimeout);
          send(ws, { type: 'waiting' });
          send(session.host, { type: 'request' });
        } else { ws.close(1008, 'Pairing unavailable'); }
        return;
      }
      if (m.type === 'stop') { end(session, 'stopped'); return; }
      if (role === 'host' && m.type === 'approve' && session.viewer && !session.approved) {
        session.approved = true;
        send(session.viewer, { type: 'connected' }); send(ws, { type: 'connected' });
      } else if (role === 'viewer' && session.approved && validControl(m)) {
        send(session.host, { type: 'control', action: m.action, x: m.x, y: m.y, toX: m.toX, toY: m.toY, duration: m.duration });
      }
    });
    ws.on('close', () => {
      clearTimeout(authTimeout);
      if (session) end(session, 'disconnected');
    });
  });
  const timer = setInterval(() => {
    for (const session of sessions.values()) if (now() >= session.expires || (!session.approved && now() >= session.pairExpires)) end(session, 'expired');
    for (const ws of wss.clients) { if (!ws.alive) ws.terminate(); else { ws.alive = false; ws.ping(); } }
  }, 15000);
  timer.unref();
  return {
    server,
    close: async () => {
      await internet.close();
      clearInterval(timer);
      for (const ws of wss.clients) ws.terminate();
      await new Promise(resolve => wss.close(resolve));
      await new Promise(resolve => server.close(resolve));
    },
  };
}
if (require.main === module) {
  const relay = createRelay({ accessKey: process.env.PHONE_RELAY_KEY });
  relay.server.listen(Number(process.env.PORT || 8091), process.env.BIND_HOST || '127.0.0.1', () => console.log('Phone relay listening; pair through your HTTPS reverse proxy.'));
  for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => void relay.close().then(() => process.exit(0)));
}
module.exports = { createRelay, validControl };
