import { spawn } from 'node:child_process';
import { randomBytes, randomUUID } from 'node:crypto';
import { createServer, type Server } from 'node:http';
import { connect, type Socket } from 'node:net';
import { WebSocketServer } from 'ws';
import { labAllowed, labBindHost, privateLabAddress } from './teacher-lab.ts';

type Session = { id: string; owner: string; password: string; display: number; folder: string; touched: number; created: number };
type Ticket = { session: string; origin: string; expires: number };
type State = { session?: Session; starting: boolean; tickets: Map<string, Ticket>; sockets: Set<() => void>; server?: Server; timer?: ReturnType<typeof setInterval> };
const shared = globalThis as typeof globalThis & { lecomaxDesktop?: State };
const state: State = shared.lecomaxDesktop ??= { starting: false, tickets: new Map(), sockets: new Set() };
const PORT = 3003;

function shell(script: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn('wsl.exe', ['-d', 'kali-linux', '--exec', 'bash', '-s'], { windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] });
    let output = '';
    const timer = setTimeout(() => { child.kill(); reject(new Error('DESKTOP_START_TIMEOUT')); }, 40000);
    child.stdout.on('data', chunk => { output = (output + chunk).slice(-6000); });
    child.stderr.on('data', chunk => { output = (output + chunk).slice(-6000); });
    child.on('error', () => { clearTimeout(timer); reject(new Error('DESKTOP_UNAVAILABLE')); });
    child.on('close', code => { clearTimeout(timer); code === 0 ? resolve(output) : reject(new Error('DESKTOP_START_FAILED', { cause: output })); });
    child.stdin.on('error', () => {});
    child.stdin.end(script);
  });
}

export function consumeDesktopTicket(ticket: string, origin: string, now = Date.now()) {
  const grant = state.tickets.get(ticket);
  if (!grant || grant.expires < now || grant.origin !== origin || grant.session !== state.session?.id) return null;
  state.tickets.delete(ticket);
  return state.session;
}

async function ensureBridge() {
  if (state.server?.listening) return;
  const server = createServer((_req, res) => { res.writeHead(404); res.end(); });
  const wss = new WebSocketServer({ noServer: true, maxPayload: 2 * 1024 * 1024, perMessageDeflate: false });
  server.on('upgrade', (req, socket, head) => {
    let url: URL;
    try { url = new URL(req.url || '', 'http://127.0.0.1:3003'); } catch { socket.destroy(); return; }
    const origin = req.headers.origin || '';
    const validHost = /^(localhost|127\.0\.0\.1):3003$/.test(req.headers.host || '') || req.headers.host === `${labBindHost()}:3003`;
    const remote = ((socket as Socket).remoteAddress || '').replace(/^::ffff:/, '');
    const local = remote === '127.0.0.1' || labBindHost() !== '127.0.0.1' && privateLabAddress(remote);
    const session = local && validHost && url.pathname === '/desktop' && labAllowed('http://127.0.0.1:3003', origin)
      ? consumeDesktopTicket(url.searchParams.get('ticket') || '', origin) : null;
    if (!session) { socket.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n'); return; }
    wss.handleUpgrade(req, socket, head, ws => {
      const upstream = connect({ host: '127.0.0.1', port: 5900 + session.display });
      const close = () => { upstream.destroy(); ws.terminate(); state.sockets.delete(close); };
      state.sockets.add(close);
      ws.on('message', (data, binary) => {
        if (!binary || upstream.writableLength > 4 * 1024 * 1024) { close(); return; }
        session.touched = Date.now();
        upstream.write(data as Buffer);
      });
      upstream.on('data', data => {
        if (ws.bufferedAmount > 8 * 1024 * 1024) { close(); return; }
        if (ws.readyState === ws.OPEN) ws.send(data);
      });
      ws.on('error', close); ws.on('close', close);
      upstream.on('error', close); upstream.on('close', close);
    });
  });
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(PORT, labBindHost(), () => { server.removeListener('error', reject); resolve(); });
  });
  state.server = server;
  server.unref();
}

async function cleanSession(session: Session) {
  // Paths and display are generated here, never accepted from a request.
  await shell(`tigervncserver -kill :${session.display} >/dev/null 2>&1 || true\nrm -f '${session.folder}/passwd' '${session.folder}/startup'\nrmdir '${session.folder}' 2>/dev/null || true\n`);
}

export async function stopDesktop(owner: string, id: string) {
  const session = state.session;
  if (!session || session.owner !== owner || session.id !== id) throw new Error('DESKTOP_NOT_FOUND');
  state.session = undefined;
  state.tickets.clear();
  for (const close of [...state.sockets]) close();
  await cleanSession(session);
}

export async function startDesktop(owner: string, origin: string) {
  if (!labAllowed('http://127.0.0.1:3002', origin) || process.platform !== 'win32') throw new Error('LOCAL_LAB_ONLY');
  if (state.starting) throw new Error('DESKTOP_BUSY');
  if (state.session && state.session.owner !== owner) throw new Error('DESKTOP_BUSY');
  state.starting = true;
  try {
    await ensureBridge();
    if (!state.session) {
      const id = randomUUID();
      const session: Session = { id, owner, password: randomBytes(6).toString('base64'), display: 30 + randomBytes(2).readUInt16BE() % 900, folder: `/tmp/lecomax-desktop-${id}`, touched: Date.now(), created: Date.now() };
      try {
        await shell(`set -eu
umask 077
command -v tigervncserver >/dev/null
command -v startxfce4 >/dev/null
# Match Win-KeX's WSLg read-only X11 socket mount preparation.
if ! test -w /tmp/.X11-unix; then mount -o remount,rw /tmp/.X11-unix; fi
chmod 1777 /tmp/.X11-unix
mkdir '${session.folder}'
printf '%s\\n' '${session.password}' | tigervncpasswd -f > '${session.folder}/passwd'
cat > '${session.folder}/startup' <<'STARTUP'
#!/bin/sh
unset SESSION_MANAGER DBUS_SESSION_BUS_ADDRESS WAYLAND_DISPLAY
exec dbus-run-session -- startxfce4
STARTUP
chmod 700 '${session.folder}/startup'
tigervncserver :${session.display} -localhost yes -SecurityTypes VncAuth -PasswordFile '${session.folder}/passwd' -geometry 1440x900 -depth 24 -MaxDisconnectionTime 120 -MaxConnectionTime 14400 -IdleTimeout 900 -desktop 'Lecomax Kali' -xstartup '${session.folder}/startup'
`);
      } catch (error) { await cleanSession(session).catch(() => {}); throw error; }
      state.session = session;
    }
    const session = state.session;
    session.touched = Date.now();
    for (const [key, grant] of state.tickets) if (grant.expires < Date.now() || grant.session === session.id) state.tickets.delete(key);
    const ticket = randomBytes(32).toString('hex');
    state.tickets.set(ticket, { session: session.id, origin, expires: Date.now() + 60000 });
    if (!state.timer) {
      state.timer = setInterval(() => {
        const current = state.session;
        if (current && (Date.now() - current.touched > 15 * 60000 || Date.now() - current.created > 4 * 3600000)) void stopDesktop(current.owner, current.id).catch(() => {});
        for (const [key, grant] of state.tickets) if (grant.expires < Date.now()) state.tickets.delete(key);
      }, 30000);
      state.timer.unref();
    }
    return { id: session.id, password: session.password, ticket, port: PORT };
  } finally { state.starting = false; }
}

export async function shutdownDesktop() {
  if (state.session) await stopDesktop(state.session.owner, state.session.id);
  if (state.timer) clearInterval(state.timer);
  state.timer = undefined;
  await new Promise<void>(resolve => state.server ? state.server.close(() => resolve()) : resolve());
  state.server = undefined;
}
