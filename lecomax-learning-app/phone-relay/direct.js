'use strict';
const byId = id => document.getElementById(id);
let token = '', generation = 0, approved = false, viewOnly = true, frameUrl, start, pausedAt = 0;
if (window.ReactNativeWebView) document.body.classList.add('embedded');
let translations = {};
const status = text => { byId('status').textContent = translations[text] || text; };
window.lecomaxConfigure = config => {
  if (!config || typeof config !== 'object') return;
  translations = config.messages || {};
  document.documentElement.lang = config.language || 'en';
  document.documentElement.dir = config.language === 'ar' ? 'rtl' : 'ltr';
  for (const [action, label] of Object.entries(config.navigation || {})) {
    const button = document.querySelector(`[data-action="${action}"]`);
    if (button) button.textContent = label;
  }
  status(byId('status').textContent);
};
const notifyApp = () => window.ReactNativeWebView?.postMessage(JSON.stringify({ type: 'phone-session', token }));
async function request(path, method = 'GET', headers = {}) {
  const response = await fetch(path, { method, headers: { Authorization: `Bearer ${token}`, ...headers }, cache: 'no-store', signal: AbortSignal.timeout(8000) });
  if (!response.ok) {
    const error = Error('Session ended. Start sharing again on your other phone.');
    error.ended = response.status === 401 || response.status === 403;
    throw error;
  }
  return response;
}
function clearFrame() {
  byId('screen').removeAttribute('src');
  if (frameUrl) URL.revokeObjectURL(frameUrl);
  frameUrl = undefined;
}
function stop(text = 'Disconnected. Start a new session on the sharing phone.') {
  if (token) void fetch('/stop', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, keepalive: true }).catch(() => {});
  document.body.classList.remove('session');
  generation++; token = ''; approved = false; start = undefined; clearFrame();
  notifyApp();
  pausedAt = 0;
  byId('controls').hidden = true; byId('stop').disabled = true; byId('connect').disabled = false; status(text);
}
async function poll(id) {
  if (id !== generation || !token || pausedAt || document.hidden) return;
  try {
    const result = await (await request('/status')).json();
    if (id !== generation || pausedAt || document.hidden) return;
   
    approved = result.approved === true;
    viewOnly = result.viewOnly === true;
    document.body.classList.toggle('session', approved);
    byId('controls').hidden = !approved || viewOnly;
    status(approved ? (viewOnly ? 'Connected · View only' : 'Connected · Tap or swipe to control') : 'Stay here. On your OTHER phone, open ACADEMY and approve this connection.');
    if (approved) {
      const frame = await request('/frame');
      const blob = frame.status === 204 ? null : await frame.blob();
      if (id !== generation || pausedAt || document.hidden) return;
      if (blob) {
        const previous = frameUrl;
        frameUrl = URL.createObjectURL(blob); byId('screen').src = frameUrl;
        if (previous) URL.revokeObjectURL(previous);
      } else clearFrame();
    }
    setTimeout(() => void poll(id), 500);
  } catch (error) {
    if (id !== generation || pausedAt || document.hidden) return;
    clearFrame(); approved = false; byId('controls').hidden = true;
    if (error.ended) { stop(error.message); return; }
    status('Connection interrupted · Reconnecting automatically. Keep Tailscale connected.');
    setTimeout(() => void poll(id), 1500);
  }
}
byId('pair').addEventListener('submit', async event => {
  event.preventDefault();
  if (byId('connect').disabled) return;
  const code = byId('code').value.trim().toLowerCase();
  if (!/^[a-f0-9]{32}$/.test(code)) { status('Paste the complete pairing code from the sharing phone.'); return; }
  const id = ++generation;
  byId('connect').disabled = true; status('Connecting to your phone…');
  try {
    const attempt = Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join('');
    let response, result;
    for (let retry = 0; retry < 3; retry++) {
      if (id !== generation) return;
      try {
        response = await fetch('/join', { method: 'POST', headers: { 'X-Pairing-Code': code, 'X-Pairing-Request': attempt }, signal: AbortSignal.timeout(8000) });
        if (response.ok) result = await response.json();
        break;
      } catch (error) {
        if (retry === 2) throw error;
        status('Connection interrupted · Retrying your scan…');
        await new Promise(resolve => setTimeout(resolve, 750));
      }
    }
    if (id !== generation) return;
    if (!response.ok) throw Error('Code expired, incorrect, or already used. Start a new session on the sharing phone.');
    if (id !== generation) return;
    token = result.token; byId('code').value = ''; byId('stop').disabled = false;
    notifyApp();
    if (document.hidden) { pause(); return; }
    void poll(id);
  } catch (error) { if (id === generation) stop(error.message); }
});
byId('stop').onclick = () => stop();
function control(message) {
  const id = generation;
  if (!viewOnly && approved && token && !pausedAt && !document.hidden) void request('/control', 'POST', { 'X-Control': JSON.stringify(message) }).catch(error => {
    if (id === generation && error.ended) stop(error.message);
  });
}
document.querySelectorAll('[data-action]').forEach(button => { button.onclick = () => control({ action: button.dataset.action }); });
const screen = byId('screen');
function point(event) { const r = screen.getBoundingClientRect(); return { x: Math.max(0, Math.min(1, (event.clientX-r.left)/r.width)), y: Math.max(0, Math.min(1, (event.clientY-r.top)/r.height)) }; }
screen.onpointerdown = event => { if (viewOnly || !approved || !screen.naturalWidth || !event.isPrimary || event.button !== 0) return; start = { ...point(event), time: performance.now(), id: event.pointerId, width: screen.naturalWidth, height: screen.naturalHeight }; screen.setPointerCapture(event.pointerId); };
screen.onpointerup = event => {
  if (!start || start.id !== event.pointerId) return;
  if (start.width !== screen.naturalWidth || start.height !== screen.naturalHeight) { start = undefined; return; }
  const end = point(event);
  control({ action: 'gesture', frameWidth: start.width, frameHeight: start.height, x: start.x, y: start.y, toX: end.x, toY: end.y, duration: Math.max(40, Math.min(1500, Math.round(performance.now()-start.time))) }); start = undefined;
};
screen.onpointercancel = () => { start = undefined; };
function pause() {
  if (!token || pausedAt) return;
  pausedAt = Date.now(); generation++; approved = false; start = undefined; clearFrame();
  byId('controls').hidden = true;
  // Invalidate late status/frame responses before sending pause. No media or input while hidden.
  void fetch('/pause', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, keepalive: true }).catch(() => {});
  status('Paused · Your approved session stays available until you disconnect.');
}
function resume() {
  if (!token || !pausedAt) return;
  pausedAt = 0;
  void poll(++generation);
}
window.lecomaxPause = pause;
window.lecomaxResume = resume;
window.addEventListener('pagehide', pause);
window.addEventListener('pageshow', resume);
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); else resume(); });
// The app hands a scanned code to this page in memory, never in a URL or storage.
window.lecomaxPairCode = code => {
  if (token || byId('connect').disabled || typeof code !== 'string' || !/^[a-f0-9]{32}$/.test(code)) return;
  byId('code').value = code;
  byId('pair').requestSubmit();
};
// Only the same-origin native viewer hands this token back after a WebView reload.
// Keep it in memory: never add tokens to URLs, logs or browser storage.
window.lecomaxRestoreSession = saved => {
  if (token || typeof saved !== 'string' || !/^[a-f0-9]{32}$/.test(saved)) return;
  token = saved; pausedAt = 0; byId('connect').disabled = true; byId('stop').disabled = false;
  if (document.hidden) { pause(); return; }
  void poll(++generation);
};
window.ReactNativeWebView?.postMessage('lecomax-phone-ready');
