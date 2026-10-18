import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { networkInterfaces } from 'node:os';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { connect } from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createPcServer, privateIPv4 } from './pc-remote-server.mjs';
import { DESECBCipher } from '../lecomax-learning-app/node_modules/@novnc/novnc/core/crypto/des.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const folder = path.join(root, '.pc-remote');
const stateFile = path.join(folder, 'session.json');
if (process.argv.includes('--stop')) {
  if (!existsSync(stateFile)) { console.log('PC sharing is not running.'); process.exit(0); }
  const state = JSON.parse(readFileSync(stateFile, 'utf8'));
  try { const response = await fetch(state.url + '/stop', { method: 'POST', headers: { 'x-stop-token': state.stopToken }, signal: AbortSignal.timeout(3000) }); if (!response.ok) throw Error(); console.log('PC sharing stopped.'); }
  catch { console.error('PC helper is already stopped or unavailable.'); }
  process.exit(0);
}
if (process.platform !== 'win32') throw new Error('Windows is required.');
const addresses = Object.entries(networkInterfaces()).flatMap(([name, addresses]) => addresses.map(a => ({ ...a, name })))
  .filter(a => a.family === 'IPv4' && !a.internal && privateIPv4(a.address) && !/WSL|vEthernet|Virtual/i.test(a.name));
const host = process.argv.find(a => a.startsWith('--host='))?.slice(7) || addresses.find(a => /^100\./.test(a.address) && /tailscale/i.test(a.name))?.address || addresses[0]?.address;
if (!addresses.some(a => a.address === host)) throw new Error('Connect this PC to Wi-Fi or Tailscale first, or choose its private address with --host=.');
const binary = path.join(folder, 'ultravnc/x64/winvnc.exe');
if (!existsSync(binary)) throw new Error('Portable UltraVNC missing. See lecomax-learning-app/docs/my-pc.md.');
// All address bindings share one loopback VNC server and one credential file.
// Reject a second helper before changing the password used by the first.
const occupied = await new Promise(resolve => {
  const socket = connect(5908, '127.0.0.1');
  socket.setTimeout(1000);
  socket.once('connect', () => { socket.destroy(); resolve(true); });
  socket.once('error', () => resolve(false));
  socket.once('timeout', () => { socket.destroy(); resolve(true); });
});
if (occupied) throw new Error('PC sharing is already running. Stop the existing Start My PC window before starting another address.');
mkdirSync(folder, { recursive: true });
const code = randomBytes(6).toString('hex');
const password = randomBytes(6).toString('base64');
const stopToken = randomBytes(32).toString('hex');
const key = Uint8Array.from([23, 82, 107, 6, 35, 78, 88, 7]);
const encryptedBytes = Buffer.from(DESECBCipher.importKey(key).encrypt({}, Buffer.from(password)));
// Windows WritePrivateProfileStruct format appends the sum-of-bytes checksum.
const encrypted = (encryptedBytes.toString('hex') + (encryptedBytes.reduce((a, b) => a + b, 0) & 255).toString(16).padStart(2, '0')).toUpperCase();
const ini = `[admin]\nUseRegistry=0\nAuthRequired=1\nAllowLoopback=1\nLoopbackOnly=1\nSocketConnect=1\nHTTPConnect=0\nAutoPortSelect=0\nPortNumber=5908\nInputsEnabled=1\nLocalInputsDisabled=0\nFileTransferEnabled=0\nBlankMonitorEnabled=0\nRemoveWallpaper=0\nRemoveAero=0\nLockSetting=0\nQuerySetting=2\nQueryAccept=0\nIdleTimeout=900\nDisableTrayIcon=0\nAllowShutdown=1\nAllowProperties=0\nAllowEditClients=0\nMSLogonRequired=0\nNewMSLogon=0\nUseDSMPlugin=0\nprimary=1\nsecondary=0\n[ultravnc]\npasswd=${encrypted}\npasswd2=\n[poll]\nTurboMode=1\nPollFullScreen=1\nEnableDriver=0\nEnableHook=1\n`;
let child;
let closing = false;
const bridge = createPcServer({ host, code, password, stopToken, onStop: stop,
  onSession: count => console.log(`${new Date().toISOString()} · ${count ? 'REMOTE DESKTOP ACTIVE — phone can control Windows' : 'No remote desktop connected'} · Ctrl+C / Stop My PC stops sharing.`) });
function stop() { if (closing) return; closing = true; bridge.close(); child?.kill(); writeFileSync(stateFile, JSON.stringify({ stopped: true })); setTimeout(() => process.exit(0), 100).unref(); }
await new Promise((resolve, reject) => { bridge.server.once('error', reject); bridge.server.listen(6081, host, resolve); });
writeFileSync(path.join(path.dirname(binary), 'ultravnc.ini'), ini);
// Current UltraVNC otherwise migrates configuration into ProgramData.
writeFileSync(path.join(path.dirname(binary), 'ultravnc.portable'), 'LECOMAX local helper\n');
child = spawn(binary, ['-run'], { cwd: path.dirname(binary), windowsHide: true, stdio: 'ignore' });
child.once('error', stop); child.once('exit', stop);
process.on('SIGINT', stop); process.on('SIGTERM', stop);
const deadline = Date.now() + 15000;
let ready = false;
while (!ready && Date.now() < deadline) {
  ready = await new Promise(resolve => { const socket = connect(5908, '127.0.0.1'); socket.setTimeout(500); socket.once('data', data => { socket.destroy(); resolve(data.toString().startsWith('RFB ')); }); socket.once('error', () => resolve(false)); socket.once('timeout', () => { socket.destroy(); resolve(false); }); });
  if (!ready) await new Promise(resolve => setTimeout(resolve, 500));
}
if (!ready) { console.error('Windows screen sharing could not start.'); stop(); } else {
  const state = { url: `http://${host}:6081`, code, stopToken, startedAt: new Date().toISOString(), pid: process.pid };
  writeFileSync(stateFile, JSON.stringify(state, null, 2));
  writeFileSync(path.join(folder, 'CONNECT.txt'), `LECOMAX MY PC\nAddress: ${state.url}\nPairing code: ${code.match(/.{4}/g).join('-')}\n\nOn phone: My space > My PC\nUse the Tailscale address for access over 4G/5G, with Tailscale installed and signed in on both devices. Keep this PC awake.\nRun Stop My PC to stop sharing. Sharing expires after four hours.\n`);
  console.log(`My PC ready: ${state.url}\nPairing code: ${code.match(/.{4}/g).join('-')} (valid for 10 minutes)\nPress Ctrl+C to stop sharing. Maximum duration: four hours.`);
  setTimeout(stop, 4 * 60 * 60 * 1000);
}
