import { spawn } from "node:child_process";
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const baseUrl = process.env.AUDIT_BASE_URL ?? "https://lecomax.com";
const parsedBaseUrl = new URL(baseUrl);
assert(["127.0.0.1", "localhost", "lecomax.com", "www.lecomax.com"].includes(parsedBaseUrl.hostname), "The storefront smoke test requires a local development server.");
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
  throw new Error("Timed out while waiting for " + description + ": " + JSON.stringify(await evaluate(client, "({url:location.href,title:document.title,text:document.body?.innerText.slice(0,350)})")));
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
  const profile=await mkdtemp(path.join(os.tmpdir(),'lecomax-performance-'));
  const chrome=spawn(await findChrome(),['--headless=new','--no-sandbox','--disable-gpu','--remote-debugging-port=0',`--user-data-dir=${profile}`,'about:blank'],{stdio:'ignore',windowsHide:true});
  let client;
  const results=[];
  try {
    const [port]=await waitForDevToolsFile(profile);
    const tabs=await fetch(`http://127.0.0.1:${port}/json/list`).then(r=>r.json());
    client=new CdpClient(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await client.connect();
    await client.send('Page.enable');await client.send('Runtime.enable');
    await client.send('Page.addScriptToEvaluateOnNewDocument',{source:`window.__metrics={lcp:0,cls:0};new PerformanceObserver(list=>{for(const e of list.getEntries())window.__metrics.lcp=e.startTime;}).observe({type:'largest-contentful-paint',buffered:true});new PerformanceObserver(list=>{for(const e of list.getEntries())if(!e.hadRecentInput)window.__metrics.cls+=e.value;}).observe({type:'layout-shift',buffered:true});`});
    for(const width of [390,1440]) {
      await setViewport(client,width,900);
      await client.send('Page.navigate',{url:baseUrl+'/'});
      await waitFor(client,'document.readyState !== "loading" && document.querySelector("h1")','homepage',60000);
      await new Promise(r=>setTimeout(r,7000));
      results.push(await evaluate(client,`(()=>{const n=performance.getEntriesByType('navigation')[0];const resources=performance.getEntriesByType('resource');return {url:location.href,width:innerWidth,lcpMs:window.__metrics.lcp,cls:window.__metrics.cls,ttfbMs:n.responseStart-n.requestStart,resources:resources.length,transferBytes:resources.reduce((sum,r)=>sum+r.transferSize,0),largest:resources.sort((a,b)=>b.transferSize-a.transferSize).slice(0,8).map(r=>({url:r.name,bytes:r.transferSize}))};})()`));
    }
    await mkdir(path.join(root,'out','storefront-audit'),{recursive:true});
    await writeFile(path.join(root,'out','storefront-audit','performance.json'),JSON.stringify({note:'Unthrottled headless Chrome lab samples, not field Core Web Vitals or an INP measurement.',results},null,2));
    console.log(JSON.stringify(results,null,2));
  }finally{client?.close();chrome.kill();if(path.resolve(profile).startsWith(path.resolve(os.tmpdir())+path.sep))await rm(profile,{recursive:true,force:true,maxRetries:4,retryDelay:150}).catch(()=>{});}
}
await main();
