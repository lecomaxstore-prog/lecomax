import { spawn } from "node:child_process";
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const baseUrl = process.env.AUDIT_BASE_URL ?? "http://127.0.0.1:3102";
const parsedBaseUrl = new URL(baseUrl);
assert(["127.0.0.1", "localhost"].includes(parsedBaseUrl.hostname), "The storefront smoke test requires a local development server.");
const WebSocketClient = globalThis.WebSocket ?? (await import("ws").then(module => module.WebSocket));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ].filter(Boolean);
  for (const candidate of candidates) {
    if (await access(candidate).then(() => true).catch(() => false)) return candidate;
  }
  throw new Error("Chrome was not found. Set CHROME_PATH to run the Academy browser smoke test.");
}

async function waitForDevToolsFile(profile, timeoutMs = 15_000) {
  const filename = path.join(profile, "DevToolsActivePort");
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const content = await readFile(filename, "utf8").catch(() => "");
    if (content.trim()) return content.trim().split(/\r?\n/);
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error("Chrome DevTools did not become ready.");
}

class CdpClient {
  constructor(url) {
    this.url = url;
    this.nextId = 1;
    this.pending = new Map();
    this.events = [];
  }

  async connect() {
    this.socket = new WebSocketClient(this.url);
    await new Promise((resolve, reject) => {
      this.socket.addEventListener("open", resolve, { once: true });
      this.socket.addEventListener("error", reject, { once: true });
    });
    this.socket.addEventListener("message", event => {
      const message = JSON.parse(event.data);
      if (!message.id) {
        this.events.push(message);
        return;
      }
      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);
      if (message.error) pending.reject(new Error(message.error.message));
      else pending.resolve(message.result);
    });
    const rejectPending = reason => {
      for (const pending of this.pending.values()) pending.reject(new Error(reason));
      this.pending.clear();
    };
    this.socket.addEventListener("close", () => rejectPending("Chrome closed the DevTools connection."));
    this.socket.addEventListener("error", () => rejectPending("Chrome reported a DevTools WebSocket error."));
  }

  send(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`CDP command timed out: ${method}`));
      }, 15_000);
      this.pending.set(id, {
        resolve: result => { clearTimeout(timer); resolve(result); },
        reject: error => { clearTimeout(timer); reject(error); },
      });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    this.socket?.close();
  }
}

async function evaluate(client, expression) {
  const response = await client.send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (response.exceptionDetails) {
    throw new Error(response.exceptionDetails.exception?.description ?? response.exceptionDetails.text ?? "Browser evaluation failed");
  }
  return response.result.value;
}

async function waitFor(client, expression, description, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await evaluate(client, expression).catch(() => false)) return;
    await new Promise(resolve => setTimeout(resolve, 150));
  }
  throw new Error("Timed out while waiting for " + description);
}

async function setViewport(client, width, height) {
  await client.send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width < 600,
  });
  await new Promise(resolve => setTimeout(resolve, 250));
}

async function main() {
  const { selectedInventory } = await import('../mobile/src/lib/purchasability.ts');
  const products = await fetch(baseUrl + '/api/products?active=true').then(r => r.json());
  assert(Array.isArray(products) && products.length, 'Real catalogue required');
  let chosen;
  for (const product of products) {
    for (const color of product.colors?.length ? product.colors : ['']) {
      for (const size of product.sizes?.length ? product.sizes : ['']) {
        if (selectedInventory(product, color, size) > 0) { chosen = { product, color, size }; break; }
      }
      if (chosen) break;
    }
    if (chosen) break;
  }
  assert(chosen, 'A stocked real product is required');
  const profile = await mkdtemp(path.join(os.tmpdir(), 'lecomax-audit-'));
  const chrome = spawn(await findChrome(), ['--headless=new', '--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--no-first-run', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], {stdio:'ignore', windowsHide:true});
  let client;
  const report = [];
  try {
    const [port] = await waitForDevToolsFile(profile);
    const tabs = await fetch(`http://127.0.0.1:${port}/json/list`).then(r => r.json());
    client = new CdpClient(tabs.find(tab => tab.type === 'page').webSocketDebuggerUrl);
    await client.connect();
    await client.send('Page.enable'); await client.send('Runtime.enable');
    await client.send('Page.addScriptToEvaluateOnNewDocument', {source: `window.__auditErrors=[]; addEventListener('error', e=>window.__auditErrors.push(e.message)); addEventListener('unhandledrejection', e=>window.__auditErrors.push(String(e.reason)));`});
    await client.send('Page.navigate', {url: baseUrl + '/produit/' + chosen.product.slug + '/'});
    await waitFor(client, 'document.readyState !== "loading" && document.querySelector("h1")', 'real product page', 60000);
    await new Promise(r => setTimeout(r, 2500));
    await evaluate(client, `([...document.querySelectorAll('button')].find(b => /^refuser$/i.test(b.textContent.trim())))?.click()`);
    if (chosen.color) await evaluate(client, `[...document.querySelectorAll('button')].find(b=>b.getAttribute('aria-label') === ${JSON.stringify(chosen.color)})?.click()`);
    if (chosen.size) await evaluate(client, `([...document.querySelectorAll('button')].find(b => b.textContent.trim() === ${JSON.stringify(chosen.size)} && !b.disabled))?.click()`);
    await evaluate(client, `([...document.querySelectorAll('button')].find(b => /Ajouter au panier/i.test(b.textContent) && !b.disabled))?.click()`);
    await waitFor(client, `JSON.parse(localStorage.getItem('lecomax_cart_v2') || '[]').length > 0`, 'product added through its real UI');
    const before = await evaluate(client, "localStorage.getItem('lecomax_cart_v2')");
    await client.send('Page.reload');
    await waitFor(client, 'document.readyState !== "loading" && document.querySelector("h1")', 'product reload');
    assert(await evaluate(client, "localStorage.getItem('lecomax_cart_v2')") === before, 'Cart must survive refresh');
    const routes = ['/', '/boutique/', '/produit/' + chosen.product.slug + '/', '/panier/', '/checkout/', '/ecomedia/', '/ecoclub/', '/nous-contacter/', '/boutiques/'];
    for (const route of routes) {
      await client.send('Page.navigate', {url: baseUrl + route});
      await waitFor(client, 'document.readyState !== "loading" && document.body.innerText.length > 100', route, 60000);
      await new Promise(r => setTimeout(r, 1200));
      for (const width of [320,360,375,390,412,430,768,1440]) {
        await setViewport(client, width, 900);
        const result = await evaluate(client, `(() => ({overflow:document.documentElement.scrollWidth-innerWidth, errors:window.__auditErrors, title:document.title, offenders:[...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0 && getComputedStyle(e).position!=='fixed' && r.right>innerWidth+3 && r.left>=0}).slice(0,6).map(e=>({tag:e.tagName,cls:e.className,text:e.textContent?.slice(0,50)}))}))()`);
        report.push({route,width,...result});
        if (width === 390 && ['/checkout/','/panier/','/'].includes(route)) {
          await mkdir(path.join(root,'out','storefront-audit'),{recursive:true});
          const shot=await client.send('Page.captureScreenshot',{format:'png',fromSurface:true});
          await writeFile(path.join(root,'out','storefront-audit',route === '/' ? 'home.png' : route.replaceAll('/','')+'.png'),Buffer.from(shot.data,'base64'));
        }
      }
      console.log('Checked',route);
      if (route === '/') {
        assert(await evaluate(client, "!performance.getEntriesByType('resource').some(r=>r.name.includes('/menu%20category/'))"), 'Hidden menu images must not download');
      }
      if (route === '/checkout/') {
        await setViewport(client,390,400);
        const focused = await evaluate(client, `(()=>{const input=document.querySelector('input[type="tel"]');if(!input)return false;input.focus();input.scrollIntoView({block:'center',behavior:'instant'});const r=input.getBoundingClientRect();return document.activeElement===input&&r.top>=0&&r.bottom<=innerHeight;})()`);
        assert(focused, 'Checkout phone field must remain reachable in a reduced-height viewport');
      }
    }
    await mkdir(path.join(root,'out','storefront-audit'),{recursive:true});
    await writeFile(path.join(root,'out','storefront-audit','report.json'),JSON.stringify(report,null,2));
    const failures=report.filter(row=>row.overflow>2 || row.errors?.length);
    console.log(JSON.stringify({checks:report.length,failures},null,2));
    assert(!failures.length,'Responsive or browser error checks failed');
  } finally {
    client?.close(); chrome.kill();
    if(path.resolve(profile).startsWith(path.resolve(os.tmpdir())+path.sep)) await rm(profile,{recursive:true,force:true,maxRetries:4,retryDelay:150}).catch(()=>{});
  }
}
await main();
