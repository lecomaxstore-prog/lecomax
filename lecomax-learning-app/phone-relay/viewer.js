'use strict';
const byId = id => document.getElementById(id);
let socket, approved = false, frameUrl, start;
const status = text => { byId('status').textContent = text; };
function clearFrame() {
  byId('screen').removeAttribute('src');
  if (frameUrl) URL.revokeObjectURL(frameUrl);
  frameUrl = undefined; start = undefined;
}
function reset(text) {
  approved = false; clearFrame();
  byId('controls').hidden = true; byId('stop').disabled = true; byId('connect').disabled = false;
  status(text);
}
function stop(text = 'Disconnected. Pair again to reconnect.') {
  const previous = socket; socket = undefined;
  if (previous?.readyState === WebSocket.OPEN) previous.send(JSON.stringify({ type: 'stop' }));
  previous?.close(); reset(text);
}
byId('pair').addEventListener('submit', event => {
  event.preventDefault();
  if (location.protocol !== 'https:') { status('A hosted HTTPS relay is required.'); return; }
  const code = byId('code').value.trim().toLowerCase();
  if (!/^[a-f0-9]{32}$/.test(code)) { status('Enter the complete 32-character pairing code.'); return; }
  stop(); byId('connect').disabled = true; byId('stop').disabled = false;
  status('Connecting…');
  const ws = socket = new WebSocket(`wss://${location.host}/phone`);
  ws.binaryType = 'blob';
  ws.onopen = () => { if (socket === ws) { ws.send(JSON.stringify({ type: 'join', code })); byId('code').value = ''; } };
  ws.onmessage = event => {
    if (socket !== ws) return;
    if (typeof event.data !== 'string') {
      if (!approved) return;
      const old = frameUrl; frameUrl = URL.createObjectURL(event.data);
      byId('screen').src = frameUrl; if (old) URL.revokeObjectURL(old); return;
    }
    let message; try { message = JSON.parse(event.data); } catch { stop('Invalid relay response.'); return; }
    if (message.type === 'waiting') status('Waiting for approval on the sharing phone.');
    if (message.type === 'connected') { approved = true; byId('controls').hidden = false; status('Connected. The phone owner can stop sharing at any time.'); }
    if (message.type === 'ended') stop('Session ended. Create a new code on the sharing phone.');
  };
  ws.onclose = () => { if (socket === ws) { socket = undefined; reset('Connection closed. Check the code and start a new session.'); } };
  ws.onerror = () => { if (socket === ws) stop('Unable to connect to the relay.'); };
});
byId('stop').onclick = () => stop();
function control(message) { if (approved && socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: 'control', ...message })); }
document.querySelectorAll('[data-action]').forEach(button => { button.onclick = () => control({ action: button.dataset.action }); });
const screen = byId('screen');
function point(event) { const r = screen.getBoundingClientRect(); return { x: Math.max(0, Math.min(1, (event.clientX-r.left)/r.width)), y: Math.max(0, Math.min(1, (event.clientY-r.top)/r.height)) }; }
screen.onpointerdown = event => { if (!approved || !event.isPrimary || event.button !== 0) return; start = { ...point(event), time: performance.now(), id: event.pointerId }; screen.setPointerCapture(event.pointerId); };
screen.onpointerup = event => {
  if (!start || start.id !== event.pointerId) return;
  const end = point(event);
  control({ action: 'gesture', x: start.x, y: start.y, toX: end.x, toY: end.y, duration: Math.max(40, Math.min(1500, Math.round(performance.now()-start.time))) }); start = undefined;
};
screen.onpointercancel = () => { start = undefined; };
window.addEventListener('pagehide', () => stop());
document.addEventListener('visibilitychange', () => { if (document.hidden) stop('Disconnected when this page was hidden.'); });
