// Protocol-only runtime check: no screen capture or keyboard/mouse input.
import { readFileSync } from 'node:fs';
import { createDecipheriv } from 'node:crypto';
import { WebSocket } from 'ws';
import { DESECBCipher } from '../lecomax-learning-app/node_modules/@novnc/novnc/core/crypto/des.js';
const state = JSON.parse(readFileSync(new URL('../.pc-remote/session.json', import.meta.url)));
const ini = readFileSync(new URL('../.pc-remote/ultravnc/x64/ultravnc.ini', import.meta.url), 'utf8');
const fixed = Buffer.from([23, 82, 107, 6, 35, 78, 88, 7].map(n => parseInt(n.toString(2).padStart(8, '0').split('').reverse().join(''), 2)));
const cipher = createDecipheriv('des-ede3', Buffer.concat([fixed, fixed, fixed]), null); cipher.setAutoPadding(false);
const password = Buffer.concat([cipher.update(Buffer.from(ini.match(/^passwd=([a-f0-9]+)/mi)[1].slice(0, 16), 'hex')), cipher.final()]).toString();
const response = await fetch(state.url + '/pair', { method: 'POST', headers: { Origin: state.url }, body: new URLSearchParams({ code: state.code }) });
if (!response.ok) throw new Error('Pair failed: ' + response.status);
const cookie = response.headers.get('set-cookie').split(';')[0];
const socket = new WebSocket(state.url.replace('http:', 'ws:') + '/desktop', { headers: { Origin: state.url, Cookie: cookie } });
let buffer = Buffer.alloc(0), pending;
socket.on('message', data => { buffer = Buffer.concat([buffer, data]); pending?.(); });
const take = length => new Promise((resolve, reject) => {
  const timer = setTimeout(() => { pending = undefined; reject(new Error('VNC read timeout')); }, 10000);
  pending = () => { if (buffer.length >= length) { const bytes = buffer.subarray(0, length); buffer = buffer.subarray(length); pending = undefined; clearTimeout(timer); resolve(bytes); } }; pending();
});
try {
  const version = (await take(12)).toString();
  if (!version.startsWith('RFB ')) throw new Error('Invalid VNC banner');
  socket.send(Buffer.from('RFB 003.008\n'));
  const count = (await take(1))[0];
  if (!count) { const length = (await take(4)).readUInt32BE(); throw new Error('VNC refused: ' + (length < 2000 ? (await take(length)).toString() : 'unknown')); }
  const types = await take(count);
  if (!types.includes(2)) throw new Error('VNC password authentication unavailable: ' + [...types]);
  socket.send(Buffer.from([2]));
  const challenge = await take(16);
  socket.send(DESECBCipher.importKey(Buffer.from(password)).encrypt({}, challenge));
  if ((await take(4)).readUInt32BE() !== 0) throw new Error('VNC authentication failed');
  socket.send(Buffer.from([1]));
  const header = await take(24);
  const width = header.readUInt16BE(0), height = header.readUInt16BE(2), nameLength = header.readUInt32BE(20);
  if (!width || !height || nameLength > 10000) throw new Error('Invalid Windows framebuffer metadata');
  await take(nameLength);
  console.log(JSON.stringify({ pairing: 'passed', websocket: 'passed', vncAuthentication: 'passed', windowsDesktop: { width, height }, visualCheck: 'not-run', inputCheck: 'not-run' }));
} finally { socket.terminate(); await fetch(state.url + '/disconnect', { method: 'POST', headers: { Cookie: cookie, Origin: state.url } }); }
