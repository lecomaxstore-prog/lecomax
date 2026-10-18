const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const cancel = id => { if (typeof clearTimeout === 'function') clearTimeout(id); };
function mapPoint(x, y, rect, width, height) {
  if (!width || !height || !rect.width || !rect.height || x < rect.left || y < rect.top || x > rect.left + rect.width || y > rect.top + rect.height) return null;
  return { x: clamp(Math.floor((x - rect.left) * width / rect.width), 0, width - 1), y: clamp(Math.floor((y - rect.top) * height / rect.height), 0, height - 1) };
}
function relativePoint(point, dx, dy, sensitivity, width, height) {
  return { x: clamp(point.x + dx * sensitivity, 0, Math.max(0, width - 1)), y: clamp(point.y + dy * sensitivity, 0, Math.max(0, height - 1)) };
}
function pointer(rfb, point, mask) {
  if (!rfb || rfb._rfbConnectionState !== 'connected' || rfb.viewOnly) return;
  rfb.constructor.messages.pointerEvent(rfb._sock, clamp(Math.round(point.x), 0, rfb._fbWidth - 1), clamp(Math.round(point.y), 0, rfb._fbHeight - 1), mask);
}
let rfb, connected = false, generation = 0, reconnectTimer, connectTimer, hideTimer, attempts = 0, stopped = false;
let mode = 'direct', zoom = 1, panX = 0, panY = 0, panning = false, held = false, point = { x: 0, y: 0 };
let gesture, holdTimer, multi, metricsTimer, measuring = false;
const touches = new Map(), modifiers = new Map();
const el = id => document.getElementById(id);
const status = text => { el('status').textContent = text; };
const bridge = type => window.ReactNativeWebView?.postMessage(JSON.stringify({ type }));
const canvas = () => el('screen').querySelector('canvas');
const dimensions = () => ({ width: rfb?._fbWidth || 0, height: rfb?._fbHeight || 0 });
async function request(url, options = {}) {
  if (typeof AbortController === 'undefined' || typeof clearTimeout === 'undefined') return fetch(url, { credentials: 'same-origin', ...options });
  const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 8000);
  try { return await fetch(url, { credentials: 'same-origin', ...options, signal: controller.signal }); }
  finally { cancel(timeout); }
}
function reveal() {
  if (!document.body?.classList) return;
  document.body.classList.remove('quiet'); cancel(hideTimer);
  hideTimer = setTimeout(() => {
    if (connected && el('keys').style.display !== 'block' && el('panel').style.display !== 'block') document.body.classList.add('quiet');
  }, 4500);
}
function transform() {
  const bounds = el('viewport').getBoundingClientRect();
  panX = clamp(panX, -bounds.width * (zoom - 1) / 2, bounds.width * (zoom - 1) / 2);
  panY = clamp(panY, -bounds.height * (zoom - 1) / 2, bounds.height * (zoom - 1) / 2);
  el('screen').style.transform = 'translate(' + panX + 'px,' + panY + 'px) scale(' + zoom + ')';
  drawCursor();
}
function drawCursor() {
  const node = canvas(), rect = node?.getBoundingClientRect ? node.getBoundingClientRect() : null, size = dimensions();
  el('cursor').style.display = connected && el('show-cursor').checked ? 'block' : 'none';
  if (!rect || !size.width) return;
  el('cursor').style.left = rect.left + point.x / size.width * rect.width + 'px';
  el('cursor').style.top = rect.top + point.y / size.height * rect.height + 'px';
}
function send(mask = held ? 1 : 0) { pointer(rfb, point, mask); drawCursor(); }
function click(button = 1) { send(button); send(held ? 1 : 0); }
function release() {
  cancel(holdTimer); touches.clear(); gesture = null; multi = null;
  held = false; send(0); el('drag').setAttribute?.('aria-pressed', 'false');
  for (const [key, button] of modifiers) { rfb?.sendKey(key, undefined, false); button.setAttribute('aria-pressed', 'false'); }
  modifiers.clear();
}
function key(keysym) {
  rfb?.sendKey(keysym);
  for (const [key, button] of modifiers) { rfb?.sendKey(key, undefined, false); button.setAttribute('aria-pressed', 'false'); }
  modifiers.clear();
}
function applyQuality(latency = 0) {
  if (!rfb) return;
  const preset = el('quality').value;
  const quality = preset === 'auto' ? (latency > 250 ? 2 : latency > 100 ? 5 : 7) : ({ performance: 2, balanced: 6, high: 9 })[preset];
  rfb.qualityLevel = quality; rfb.compressionLevel = quality < 4 ? 7 : 3;
}
function showSession(active) {
  el('pair').style.display = active ? 'none' : 'grid';
  el('viewport').style.display = active ? 'block' : 'none';
  el('toolbar').style.display = 'none';
  el('quick-controls').style.display = active ? 'flex' : 'none';
  el('status').style.display = active ? 'none' : 'block';
  if (!active) { el('keys').style.display = el('panel').style.display = 'none'; if (document.body?.classList) document.body.classList.remove('quiet'); }
}
async function measure() {
  if (!connected || measuring || document.hidden) return;
  measuring = true;
  const start = performance.now();
  try {
    const response = await request('/health');
    if (!response.ok) throw Error('Session expired. Pair again.');
    const info = await response.json(), latency = Math.round(performance.now() - start);
    const size = dimensions();
    el('stats').textContent = size.width + ' ÃƒÆ’Ã¢â‚¬â€ ' + size.height + ' Ãƒâ€šÃ‚Â· Gateway RTT ' + latency + ' ms Ãƒâ€šÃ‚Â· ' + Math.round(info.bytesSent / 1024) + ' KiB sent this session. RTT is not display latency; FPS unavailable.';
    applyQuality(latency);
  } catch { status('Connection interrupted. If the desktop is frozen, use Reconnect.'); reveal(); }
  finally { measuring = false; }
}
function scheduleReconnect() {
  if (stopped || document.hidden) return;
  if (attempts >= 3) { showSession(false); el('error').textContent = 'PC unavailable. Check Tailscale, keep Windows awake and restart sharing if needed.'; return; }
  const delay = Math.min(8000, 1000 * 2 ** attempts++);
  status('Connection lost. Reconnecting (' + attempts + '/3)ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦'); reveal();
  reconnectTimer = setTimeout(() => connectDesktop(true).catch(error => { status(error.message); scheduleReconnect(); }), delay);
}
async function connectDesktop(required = false) {
  cancel(reconnectTimer); cancel(connectTimer);
  const current = ++generation;
  connected = false; release(); rfb?.disconnect(); rfb = null;
  const response = await request('/session');
  if (current !== generation || stopped) return;
  if (!response.ok) {
    showSession(false);
    if (required) throw new Error('Pairing session was not saved or expired. Restart sharing and enter the current code.');
    return;
  }
  const { password } = await response.json();
  const { default: RFB } = await import('/novnc/core/rfb.js');
  if (current !== generation || stopped) return;
  showSession(true); status('Connecting to WindowsÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦');
  rfb = new RFB(el('screen'), (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/desktop', { credentials: { password } });
  rfb.scaleViewport = true; rfb.resizeSession = false; rfb.clipViewport = false; rfb.focusOnClick = false; rfb.showDotCursor = true;
  applyQuality();
  connectTimer = setTimeout(() => { if (current === generation && !connected) rfb?.disconnect(); }, 15000);
  rfb.addEventListener('connect', () => {
    if (current !== generation) return;
    cancel(connectTimer); connected = true; attempts = 0;
    const size = dimensions(); point = { x: size.width / 2, y: size.height / 2 };
    status('Live Windows Ãƒâ€šÃ‚Â· ' + (location.hostname.startsWith('100.') ? 'Tailscale address ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â VPN required' : 'Private network'));
    el('status').style.display = 'none';
    bridge('connected'); reveal(); transform(); void measure();
  });
  rfb.addEventListener('desktopname', event => { if (current === generation) status(event.detail.name + ' Ãƒâ€šÃ‚Â· Connected'); });
  rfb.addEventListener('clipboard', event => { if (el('clipboard-enabled').checked) el('clipboard').value = event.detail.text.slice(0, 65536); });
  rfb.addEventListener('disconnect', () => {
    if (current !== generation) return;
    cancel(connectTimer); connected = false; release(); bridge('disconnected');
    if (!stopped) scheduleReconnect();
  });
  rfb.addEventListener('securityfailure', () => {
    if (current !== generation) return;
    stopped = true; showSession(false); el('error').textContent = 'Windows authentication failed. Stop all sharing helpers, then start one helper and pair with its new code.';
  });
}
el('pair').addEventListener('submit', async event => {
  event.preventDefault(); el('error').textContent = '';
  const button = el('pair').querySelector('button'); button.disabled = true; button.textContent = 'ConnectingÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦'; el('code').blur();
  try {
    const response = await request('/pair', { method: 'POST', body: new URLSearchParams({ code: el('code').value }) });
    if (!response.ok) throw new Error(await response.text());
    el('code').value = ''; stopped = false; attempts = 0; await connectDesktop(true);
  } catch (error) { el('error').textContent = error.message || 'PC unavailable. Check Tailscale and the Windows helper.'; }
  finally { button.disabled = false; button.textContent = 'Connect Ãƒâ€šÃ‚Â· ÃƒËœÃ‚Â§ÃƒËœÃ‚ÂªÃƒËœÃ‚ÂµÃƒËœÃ‚Â§Ãƒâ„¢Ã¢â‚¬Å¾'; }
});
el('disconnect').onclick = async () => {
  stopped = true; ++generation; cancel(reconnectTimer); cancel(connectTimer); release(); rfb?.disconnect(); connected = false;
  showSession(false); status('Disconnected'); bridge('exit');
  try { await request('/disconnect', { method: 'POST' }); } catch { status('Desktop closed. PC session expires automatically; Stop My PC revokes it immediately.'); }
};
el('reconnect').onclick = () => { stopped = false; attempts = 0; void connectDesktop(true).catch(error => { status(error.message); showSession(false); el('error').textContent = error.message; }); };
el('reveal').onclick = () => {
  const open = el('toolbar').style.display !== 'none';
  el('toolbar').style.display = open ? 'none' : 'flex';
  if (!open) { document.body.classList.remove('quiet'); reveal(); }
};
el('quick-close').onclick = () => el('disconnect').click();
el('toolbar').addEventListener('pointerdown', reveal);
el('keyboard').onclick = () => { el('keys').style.display = 'block'; el('panel').style.display = 'none'; reveal(); rfb?.blur(); el('typing').focus(); };
el('close-keys').onclick = () => { el('typing').blur(); el('keys').style.display = 'none'; release(); reveal(); };
function typeText(event) {
  if (event?.isComposing) return;
  for (const char of el('typing').value) { const cp = char.codePointAt(0); key(cp <= 255 ? cp : 0x01000000 | cp); }
  el('typing').value = '';
}
el('typing').addEventListener('input', typeText);
el('typing').addEventListener('compositionend', typeText);
el('typing').addEventListener('keydown', event => {
  const keys = { Enter: 0xff0d, Backspace: 0xff08, Tab: 0xff09, Escape: 0xff1b, Delete: 0xffff };
  if (!event.isComposing && keys[event.key]) { event.preventDefault(); key(keys[event.key]); }
});
el('typing').addEventListener('beforeinput', event => {
  if (event.inputType === 'deleteContentBackward') { event.preventDefault(); key(0xff08); }
});
if (document.createElement) for (const [label, keysym] of [['Ctrl', 0xffe3], ['Alt', 0xffe9], ['Shift', 0xffe1], ['Win', 0xffeb]]) {
  const button = document.createElement('button'); button.textContent = label; button.setAttribute('aria-pressed', 'false');
  button.onclick = () => { const down = !modifiers.has(keysym); rfb?.sendKey(keysym, undefined, down); if (down) modifiers.set(keysym, button); else modifiers.delete(keysym); button.setAttribute('aria-pressed', String(down)); };
  el('modifiers').append(button);
}
if (document.createElement) for (const [label, keysym] of [['Enter',0xff0d],['ÃƒÂ¢Ã…â€™Ã‚Â«',0xff08],['Esc',0xff1b],['Tab',0xff09],['Del',0xffff],['ÃƒÂ¢Ã¢â‚¬Â Ã‚Â',0xff51],['ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬Ëœ',0xff52],['ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢',0xff53],['ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬Å“',0xff54], ...Array.from({ length: 12 }, (_, i) => ['F' + (i + 1), 0xffbe + i])]) {
  const button = document.createElement('button'); button.textContent = label; button.onclick = () => key(keysym); el('special').append(button);
}
if (document.createElement) for (const letter of ['c','v','a','s']) {
  const button = document.createElement('button'); button.textContent = 'Ctrl+' + letter.toUpperCase();
  button.onclick = () => { release(); rfb?.sendKey(0xffe3, undefined, true); rfb?.sendKey(letter.charCodeAt(0)); rfb?.sendKey(0xffe3, undefined, false); }; el('special').append(button);
}
el('mode').onclick = () => { release(); mode = mode === 'direct' ? 'touchpad' : 'direct'; el('mode').textContent = mode === 'direct' ? 'Direct touch' : 'Touchpad'; el('buttons').style.display = mode === 'touchpad' || el('mouse-buttons').checked ? 'flex' : 'none'; };
el('fit').onclick = () => { zoom = 1; panX = panY = 0; transform(); };
el('zoom').onclick = () => { zoom = zoom >= 3 ? 1 : zoom + .5; transform(); };
el('pan').onclick = () => { release(); panning = !panning; el('pan').setAttribute?.('aria-pressed', String(panning)); };
el('fullscreen').onclick = async () => {
  if (window.ReactNativeWebView) { bridge('fullscreen'); return; }
  try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); }
  catch { status('Fullscreen is unavailable here. Rotate the phone for a wider desktop.'); }
};
el('settings').onclick = () => { el('panel').style.display = 'block'; el('keys').style.display = 'none'; release(); reveal(); void measure(); };
el('close-settings').onclick = () => { el('panel').style.display = 'none'; reveal(); };
el('quality').onchange = () => applyQuality();
el('mouse-buttons').onchange = () => { el('buttons').style.display = el('mouse-buttons').checked || mode === 'touchpad' ? 'flex' : 'none'; };
el('show-cursor').onchange = () => { if (rfb) rfb.showDotCursor = el('show-cursor').checked; drawCursor(); };
el('clipboard-enabled').onchange = () => { if (!el('clipboard-enabled').checked) el('clipboard').value = ''; };
el('send-clipboard').onclick = () => {
  if (!el('clipboard-enabled').checked) { status('Enable clipboard text first.'); return; }
  rfb?.clipboardPasteFrom(el('clipboard').value.slice(0, 65536)); status('Clipboard sent. Use Ctrl+V in Windows.');
};
el('left').onclick = () => click(1); el('right').onclick = () => click(4);
el('drag').onclick = () => { held = !held; send(); el('drag').setAttribute?.('aria-pressed', String(held)); };
const touch = el('touch');
const distance = values => Math.hypot(values[0].x - values[1].x, values[0].y - values[1].y);
const center = values => ({ x: (values[0].x + values[1].x) / 2, y: (values[0].y + values[1].y) / 2 });
touch.addEventListener('pointerdown', event => {
  if (!connected) return;
  event.preventDefault(); touch.setPointerCapture(event.pointerId);
  touches.set(event.pointerId, { x: event.clientX, y: event.clientY });
  cancel(holdTimer);
  if (touches.size === 1) {
    if (event.clientX < 16 || event.clientY < 16) reveal();
    const node = canvas(), rect = node?.getBoundingClientRect ? node.getBoundingClientRect() : null, size = dimensions();
    const mapped = rect && mapPoint(event.clientX, event.clientY, rect, size.width, size.height);
    gesture = { x: event.clientX, y: event.clientY, lastX: event.clientX, lastY: event.clientY, moved: false, consumed: false, valid: mode === 'touchpad' || !!mapped };
    if (mode === 'direct' && mapped) { point = mapped; send(); }
    holdTimer = setTimeout(() => { if (gesture && !gesture.moved && gesture.valid && !panning) { click(4); gesture.consumed = true; } }, 550);
  } else if (touches.size === 2) {
    send(0); held = false; el('drag').setAttribute?.('aria-pressed','false');
    const values = [...touches.values()]; multi = { distance: distance(values), center: center(values), zoom, moved: false, intent: null, started: performance.now() };
    if (gesture) gesture.consumed = true;
  }
});
touch.addEventListener('pointermove', event => {
  if (!touches.has(event.pointerId)) return;
  event.preventDefault(); touches.set(event.pointerId, { x: event.clientX, y: event.clientY });
  if (touches.size === 2 && multi) {
    const values = [...touches.values()], mid = center(values), gap = distance(values);
    if (!multi.intent) {
      if (Math.abs(gap - multi.distance) > 14) multi.intent = 'zoom';
      else if (Math.hypot(mid.x - multi.center.x, mid.y - multi.center.y) > 12) multi.intent = 'scroll';
    }
    if (multi.intent) multi.moved = true;
    if (multi.intent === 'zoom') { zoom = clamp(multi.zoom * gap / Math.max(1, multi.distance), 1, 4); transform(); }
    if (multi.intent === 'scroll' && Math.abs(mid.y - multi.center.y) > 12) { click(mid.y < multi.center.y ? 16 : 8); multi.center = mid; }
    return;
  }
  if (touches.size !== 1 || !gesture || gesture.consumed || !gesture.valid) return;
  const dx = event.clientX - gesture.lastX, dy = event.clientY - gesture.lastY;
  const moved = Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) > 6;
  if (moved) { cancel(holdTimer); gesture.moved = true; }
  if (panning) { panX += dx; panY += dy; transform(); }
  else if (mode === 'touchpad') {
    const size = dimensions(); point = relativePoint(point, dx, dy, Number(el('sensitivity').value), size.width, size.height); send();
  } else if (gesture.moved) {
    const node = canvas(), rect = node?.getBoundingClientRect ? node.getBoundingClientRect() : null, size = dimensions();
    const mapped = rect && mapPoint(event.clientX, event.clientY, rect, size.width, size.height);
    if (mapped) { point = mapped; send(1); }
  }
  gesture.lastX = event.clientX; gesture.lastY = event.clientY;
});
function endTouch(event) {
  cancel(holdTimer);
  if (!touches.has(event.pointerId)) return;
  const cancelled = event.type === 'pointercancel' || event.type === 'lostpointercapture';
  touches.delete(event.pointerId);
  if (!touches.size) {
    if (!cancelled && multi && !multi.moved && performance.now() - multi.started < 350) click(4);
    else if (!cancelled && !multi && gesture?.valid && !gesture.moved && !gesture.consumed && !panning) click();
    send(held ? 1 : 0); gesture = null; multi = null;
  }
  if (cancelled) release();
}
for (const name of ['pointerup','pointercancel','lostpointercapture']) touch.addEventListener(name, endTouch);
touch.addEventListener('contextmenu', event => event.preventDefault());
if (typeof window !== 'undefined') window.addEventListener('resize', () => { release(); panX = panY = 0; requestAnimationFrame(transform); });
if (typeof window !== 'undefined') window.visualViewport?.addEventListener('resize', () => {
  document.body.style.height = window.visualViewport.height + 'px';
  document.documentElement.style.height = window.visualViewport.height + 'px';
  release(); requestAnimationFrame(transform);
});
if (typeof window !== 'undefined') window.addEventListener('blur', release);
if (typeof document !== 'undefined' && document.addEventListener) document.addEventListener('visibilitychange', () => {
  if (document.hidden) { stopped = true; ++generation; cancel(reconnectTimer); cancel(connectTimer); release(); rfb?.disconnect(); connected = false; showSession(false); status('Paused for privacy. Reconnect to continue.'); }
});
if (typeof window !== 'undefined') window.addEventListener('pagehide', () => { stopped = true; ++generation; release(); rfb?.disconnect(); clearInterval(metricsTimer); cancel(hideTimer); cancel(reconnectTimer); cancel(connectTimer); });
if (typeof window !== 'undefined') { metricsTimer = setInterval(() => void measure(), 10000); connectDesktop().catch(() => status('Connection unavailable. Start sharing on the PC.')); }
