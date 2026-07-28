import { spawn } from "node:child_process";
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const baseUrl = process.env.MOBILE_BASE_URL ?? "http://127.0.0.1:8082";
const outputDirectory = path.resolve(process.cwd(), "out", "mobile-responsive-audit");
const WebSocketClient = globalThis.WebSocket ?? (await import("ws").then((module) => module.WebSocket));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function findChrome() {
  for (const candidate of [
    process.env.CHROME_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
  ].filter(Boolean)) {
    if (await access(candidate).then(() => true).catch(() => false)) return candidate;
  }
  throw new Error("Chrome was not found.");
}

async function waitForDevTools(profile) {
  const filename = path.join(profile, "DevToolsActivePort");
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    const value = await readFile(filename, "utf8").catch(() => "");
    if (value.trim()) return value.trim().split(/\r?\n/);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("Chrome DevTools did not become ready.");
}

class CdpClient {
  constructor(url) {
    this.url = url;
    this.nextId = 1;
    this.pending = new Map();
  }
  async connect() {
    this.socket = new WebSocketClient(this.url);
    await new Promise((resolve, reject) => {
      this.socket.addEventListener("open", resolve, { once: true });
      this.socket.addEventListener("error", reject, { once: true });
    });
    this.socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (!message.id) return;
      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);
      message.error ? pending.reject(new Error(message.error.message)) : pending.resolve(message.result);
    });
  }
  send(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }
  close() { this.socket?.close(); }
}

async function evaluate(client, expression) {
  const response = await client.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.text ?? "Browser evaluation failed");
  return response.result.value;
}

async function waitFor(client, expression, label) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (await evaluate(client, expression).catch(() => false)) return;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error(`Timed out waiting for ${label}.`);
}

async function screenshot(client, name) {
  const image = await client.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  await writeFile(path.join(outputDirectory, name), Buffer.from(image.data, "base64"));
}

async function main() {
  const response = await fetch(baseUrl);
  assert(response.ok, `Mobile web server returned HTTP ${response.status}.`);
  await mkdir(outputDirectory, { recursive: true });
  const profile = await mkdtemp(path.join(os.tmpdir(), "lecomax-mobile-smoke-"));
  const chrome = spawn(await findChrome(), [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--no-first-run",
    "--no-default-browser-check",
    "--remote-debugging-port=0",
    `--user-data-dir=${profile}`,
    "about:blank",
  ], { stdio: "ignore", windowsHide: true });

  let browser;
  let page;
  try {
    const [port, browserPath] = await waitForDevTools(profile);
    browser = new CdpClient(`ws://127.0.0.1:${port}${browserPath}`);
    await browser.connect();
    const targets = await fetch(`http://127.0.0.1:${port}/json/list`).then((value) => value.json());
    const target = targets.find((item) => item.type === "page");
    page = new CdpClient(target.webSocketDebuggerUrl);
    await page.connect();
    await Promise.all([page.send("Page.enable"), page.send("Runtime.enable")]);
    await page.send("Page.addScriptToEvaluateOnNewDocument", {
      source: `localStorage.setItem('lecomax:onboarding:complete', 'complete');`,
    });

    const results = [];
    for (const viewport of [
      { name: "phone-390", width: 390, height: 844, columns: 2, tablet: false },
      { name: "ipad-768", width: 768, height: 1024, columns: 3, tablet: true },
      { name: "ipad-pro-landscape", width: 1366, height: 900, columns: 4, tablet: true },
    ]) {
      await page.send("Emulation.setDeviceMetricsOverride", {
        width: viewport.width,
        height: viewport.height,
        deviceScaleFactor: 1,
        mobile: !viewport.tablet,
      });
      await page.send("Page.navigate", { url: `${baseUrl}/catalog` });
      await waitFor(page, `document.body?.innerText?.includes('LECOMAX SHOP')`, `${viewport.name} catalogue`);
      await new Promise((resolve) => setTimeout(resolve, 800));
      const metrics = await evaluate(page, `(() => {
        const tabs = [...document.querySelectorAll('[role="tab"]')].map(node => node.getBoundingClientRect());
        const productButtons = [...document.querySelectorAll('[role="button"]')].filter(node => /MAD|DH|EN STOCK|ÉPUISÉ/.test(node.innerText || '')).map(node => node.getBoundingClientRect());
        const uniqueProductX = [...new Set(productButtons.map(rect => Math.round(rect.x)))];
        return {
          horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
          tabCount: tabs.length,
          verticalTabs: tabs.length > 1 && Math.max(...tabs.map(rect => rect.y)) - Math.min(...tabs.map(rect => rect.y)) > 100,
          productColumns: uniqueProductX.length,
          bodyText: document.body.innerText.slice(0, 200),
        };
      })()`);
      assert(!metrics.horizontalOverflow, `${viewport.name} has horizontal overflow.`);
      assert(metrics.tabCount === 5, `${viewport.name} did not render five primary tabs.`);
      assert(metrics.verticalTabs === viewport.tablet, `${viewport.name} navigation orientation is incorrect.`);
      assert(metrics.productColumns >= viewport.columns, `${viewport.name} rendered ${metrics.productColumns} product columns; expected ${viewport.columns}.`);
      await screenshot(page, `${viewport.name}.png`);
      results.push({ ...viewport, ...metrics });
    }
    console.log(JSON.stringify({ ok: true, results, screenshots: outputDirectory }, null, 2));
  } finally {
    page?.close();
    browser?.close();
    chrome.kill();
    await new Promise((resolve) => setTimeout(resolve, 500));
    await rm(profile, { recursive: true, force: true }).catch(() => {});
  }
}

await main();
