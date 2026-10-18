import { createServer } from 'node:http';
import { connect } from 'node:net';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export function privateIPv4(ip) {
  const p = ip.split('.').map(Number);
  return /^\d+\.\d+\.\d+\.\d+$/.test(ip) && p.every(n => n >= 0 && n <= 255) &&
    (p[0] === 10 || p[0] === 192 && p[1] === 168 || p[0] === 172 && p[1] >= 16 && p[1] <= 31 || p[0] === 100 && p[1] >= 64 && p[1] <= 127);
}
const equal = (a, b) => typeof a === 'string' && typeof b === 'string' && Buffer.byteLength(a) === Buffer.byteLength(b) && timingSafeEqual(Buffer.from(a), Buffer.from(b));

export function createPcServer({ host, port = 6081, vncPort = 5908, code, password, stopToken, onStop = () => {}, onSession = () => {}, pairingLifetime = 10 * 60 * 1000, lifetime = 4 * 60 * 60 * 1000 }) {
  if (!privateIPv4(host) && host !== '127.0.0.1') throw new Error('Private IPv4 required');
  if (!/^[a-f0-9]{12}$/.test(code)) throw new Error('Pairing code must have 48 bits of randomness');
  const sessions = new Map();
  const pairingExpiresAt = Date.now() + pairingLifetime;
  let bytesSent = 0;
  const sockets = new Set();
  const attempts = [];
  const origin = `http://${host}:${port}`;
  const cookie = req => (req.headers.cookie || '').split(';').map(s => s.trim()).find(s => s.startsWith('pc_session='))?.slice(11);
  const authorized = req => {
    const id = cookie(req), expiry = sessions.get(id);
    if (!expiry || Date.now() > expiry) { sessions.delete(id); return false; }
    return true;
  };
  const allowed = req => req.headers.host === `${host}:${port}` &&
    (privateIPv4(req.socket.remoteAddress?.replace(/^::ffff:/, '') || '') || req.socket.remoteAddress === '127.0.0.1');
  const reply = (res, status, body, type = 'text/plain') => {
    res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer', 'X-Frame-Options': 'DENY',
      'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; frame-ancestors 'none'; form-action 'self'" });
    res.end(body);
  };
  const server = createServer(async (req, res) => {
    try {
      if (!allowed(req)) return reply(res, 403, 'Local PC address required');
      const url = new URL(req.url, origin);
      if (req.method === 'POST' && url.pathname === '/stop' && equal(req.headers['x-stop-token'], stopToken)) {
        reply(res, 200, 'Sharing stopped'); setImmediate(onStop); return;
      }
      if (req.method === 'POST' && req.headers.origin !== origin) return reply(res, 403, 'Wrong origin');
      if (req.method === 'POST' && url.pathname === '/pair') {
        const now = Date.now();
        if (now >= pairingExpiresAt) return reply(res, 410, 'Pairing code expired. Stop and restart My PC to generate a new code.');
        while (attempts[0] < now - 60000) attempts.shift();
        if (attempts.length >= 10) return reply(res, 429, 'Too many attempts. Wait one minute.');
        attempts.push(now);
        let body = '';
        for await (const chunk of req) { body += chunk; if (body.length > 1024) return reply(res, 413, 'Request too large'); }
        const provided = new URLSearchParams(body).get('code')?.replace(/[\s-]/g, '').toLowerCase();
        if (!equal(provided, code)) return reply(res, 403, 'Incorrect pairing code');
        // One paired browser at a time; re-pairing revokes the previous connection.
        sessions.clear(); for (const close of sockets) close();
        bytesSent = 0;
        const token = randomBytes(32).toString('hex'); sessions.set(token, now + lifetime);
        res.setHeader('Set-Cookie', `pc_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${Math.floor(lifetime / 1000)}`);
        return reply(res, 200, 'Paired');
      }
      if (req.method === 'POST' && url.pathname === '/disconnect') {
        if (!authorized(req)) return reply(res, 401, 'Pair first');
        sessions.delete(cookie(req)); for (const close of sockets) close();
        res.setHeader('Set-Cookie', 'pc_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');
        return reply(res, 200, 'Disconnected');
      }
      if (req.method !== 'GET') return reply(res, 405, 'Method not allowed');
      if (url.pathname === '/health') return authorized(req) ? reply(res, 200, JSON.stringify({ bytesSent }), 'application/json') : reply(res, 401, 'Pair first');
      if (url.pathname === '/session') return authorized(req) ? reply(res, 200, JSON.stringify({ password }), 'application/json') : reply(res, 401, 'Pair first');
      if (['/', '/client.js', '/input.mjs'].includes(url.pathname)) {
        return reply(res, 200, await readFile(path.join(root, 'scripts/pc-remote', url.pathname === '/' ? 'index.html' : url.pathname.slice(1))), url.pathname === '/' ? 'text/html; charset=utf-8' : 'text/javascript');
      }
      if (url.pathname.startsWith('/novnc/') && authorized(req)) {
        const relative = decodeURIComponent(url.pathname.slice(7));
        if (!/^(core|vendor)\/[a-zA-Z0-9_./-]+\.js$/.test(relative) || relative.split('/').includes('..')) return reply(res, 404, 'Not found');
        return reply(res, 200, await readFile(path.join(root, 'lecomax-learning-app/node_modules/@novnc/novnc', relative)), 'text/javascript');
      }
      reply(res, 404, 'Not found');
    } catch { if (!res.headersSent) reply(res, 500, 'PC connection unavailable'); else res.end(); }
  });
  const wss = new WebSocketServer({ noServer: true, maxPayload: 1024 * 1024, perMessageDeflate: false });
  server.on('upgrade', (req, socket, head) => {
    if (!allowed(req) || req.url !== '/desktop' || req.headers.origin !== origin || !authorized(req)) {
      socket.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n'); return;
    }
    wss.handleUpgrade(req, socket, head, ws => {
      const upstream = connect(vncPort, '127.0.0.1');
      const expiry = setTimeout(() => close(), Math.max(1, sessions.get(cookie(req)) - Date.now()));
      let closed = false;
      const close = () => { if (closed) return; closed = true; clearTimeout(expiry); upstream.destroy(); ws.terminate(); sockets.delete(close); onSession(sockets.size); };
      sockets.add(close);
      onSession(sockets.size);
      ws.on('message', (data, binary) => {
        if (!binary || upstream.writableLength > 4 * 1024 * 1024) return close();
        upstream.write(data);
      });
      upstream.on('data', data => { if (ws.bufferedAmount > 8 * 1024 * 1024) return close(); if (ws.readyState === ws.OPEN) { bytesSent += data.length; ws.send(data); } });
      ws.on('close', close); ws.on('error', close); upstream.on('error', close); upstream.on('close', close);
    });
  });
  server.requestTimeout = 10000;
  server.headersTimeout = 10000;
  return { server, close: () => { sessions.clear(); for (const close of sockets) close(); wss.close(); server.close(); server.closeAllConnections(); } };
}
