import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { CdpClient, createAdminToken, evaluate, waitFor, setViewport, saveScreenshot, findChrome, waitForDevToolsFile } from './smoke-admin-dashboard-ui.mjs';

const base = 'http://127.0.0.1:3000';
const assert = (condition, message) => { if (!condition) throw Error(message); };
const { token, email } = await createAdminToken();
await fetch(`${base}/admin/messages`, { headers: { Cookie: `admin_session=${token}` } });
const profile = await mkdtemp(path.join(os.tmpdir(), 'lecomax-premium-'));
const chrome = spawn(await findChrome(), ['--headless=new', '--disable-gpu', '--no-sandbox', '--no-first-run', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore', windowsHide: true });
let client;
try {
  const [port] = await waitForDevToolsFile(profile, 60000);
  const tabs = await fetch(`http://127.0.0.1:${port}/json/list`).then(r => r.json());
  client = new CdpClient(tabs.find(p => p.type === 'page').webSocketDebuggerUrl);
  await client.connect();
  await Promise.all([client.send('Page.enable'), client.send('Runtime.enable'), client.send('Network.enable')]);
  await client.send('Network.setCookie', { name: 'admin_session', value: token, url: base, path: '/', httpOnly: true, sameSite: 'Strict' });
  await client.send('Page.addScriptToEvaluateOnNewDocument', { source: `(() => {
    const original = window.fetch.bind(window);
    window.__failMessages = true;
    window.fetch = (input, init) => {
      const url = new URL(typeof input === 'string' ? input : input.url, location.origin);
      const p = url.pathname.endsWith('/') ? url.pathname.slice(0,-1) : url.pathname;
      const json = (data, status = 200) => Promise.resolve(new Response(JSON.stringify(data), { status, headers: {'Content-Type':'application/json'} }));
      if (p === '/api/admin/auth/verify') return json({email:${JSON.stringify(email)}});
      if (p === '/api/admin/staff/permissions') return json({isStaff:false});
      if (p === '/api/admin/auth/session') return json({error:'Test failure'}, 503);
      if (p === '/api/messages') return window.__failMessages ? json({},503) : json([{id:'fixture',name:'QA Contact',email:'qa@example.test',subject:'Test message',message:'Fixture only',read:false,created_at:new Date().toISOString()}]);
      if (p === '/api/messages/fixture') return json({error:'Test failure'},503);
      if (p.startsWith('/api/') || url.hostname.endsWith('.supabase.co')) return json([]);
      return original(input, init);
    };
  })();` });
  await setViewport(client, 390, 844);
  await client.send('Page.navigate', { url: `${base}/admin/messages` });
  await waitFor(client, `document.body.textContent.includes('Impossible de charger les messages')`, 'load error');
  await evaluate(client, `window.__failMessages=false; [...document.querySelectorAll('button')].find(b=>b.textContent==='Recharger').click()`);
  await waitFor(client, `document.body.textContent.includes('QA Contact')`, 'retry success');
  await evaluate(client, `[...document.querySelectorAll('#admin-main button')].find(b=>b.textContent.includes('QA Contact')).click()`);
  await waitFor(client, `document.body.textContent.includes('Modification non confirmée')`, 'failed update feedback');
  assert(await evaluate(client, `document.querySelector('#admin-main').textContent.includes('Test message')`), 'Failed update removed message');
  await evaluate(client, `[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Recharger les messages')).click()`);
  await waitFor(client, `!document.body.textContent.includes('Modification non confirmée')`, 'reload recovery');
  await evaluate(client, `document.querySelector('.admin-topbar button[aria-controls="admin-sidebar"]').click()`);
  await waitFor(client, `document.querySelector('#admin-sidebar').getAttribute('aria-modal')==='true'`, 'drawer semantics');
  assert(await evaluate(client, `document.querySelector('#admin-main').closest('[inert]')!==null`), 'Drawer background is interactive');
  await evaluate(client, `document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))`);
  await waitFor(client, `!document.querySelector('#admin-main').closest('[inert]')`, 'drawer close');
  for (const width of [320,375,390,768,1440,1920,2560]) {
    await setViewport(client,width,900);
    assert(await evaluate(client, `document.documentElement.scrollWidth<=innerWidth+2 && document.querySelector('#admin-main').scrollWidth<=document.querySelector('#admin-main').clientWidth+2`), `Overflow at ${width}`);
  }
  await evaluate(client, `document.querySelector('.admin-drawer-footer button').click()`);
  await waitFor(client, `Boolean(document.querySelector('.admin-logout-error'))`, 'logout failure feedback');
  assert(await evaluate(client, `location.pathname.includes('/messages')`), 'Failed logout redirected');
  await saveScreenshot(client,'artifacts/admin-premium','messages-desktop.png');
  assert(!client.events.some(e=>e.method==='Runtime.exceptionThrown'), 'Browser runtime exception');
  console.log('PASS: message load/retry/update failure, logout failure, drawer inert/Escape, 320–2560px overflow, no runtime exceptions. API writes intercepted.');
} finally {
  client?.close(); chrome.kill();
  if (path.resolve(profile).startsWith(path.resolve(os.tmpdir()) + path.sep)) await rm(profile,{recursive:true,force:true,maxRetries:4,retryDelay:150}).catch(()=>{});
}
