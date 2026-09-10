import { spawn } from "node:child_process";
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const baseUrl = process.env.ADMIN_DASHBOARD_BASE_URL ?? "http://127.0.0.1:3000";
const parsedBaseUrl = new URL(baseUrl);
assert(["127.0.0.1", "localhost"].includes(parsedBaseUrl.hostname), "The dashboard smoke test only creates sessions for a local server.");
const WebSocketClient = globalThis.WebSocket ?? (await import("ws").then(module => module.WebSocket));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function readEnvValue(text, name) {
  const match = new RegExp(`^${name}=(.*)$`, "m").exec(text);
  return match?.[1]?.trim().replace(/^['"]|['"]$/g, "");
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
  throw new Error("Chrome was not found. Set CHROME_PATH to run the dashboard browser smoke test.");
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

async function createAdminToken() {
  const envText = await readFile(path.join(root, ".env.local"), "utf8").catch(() => "");
  const secret = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? readEnvValue(envText, "SUPABASE_SERVICE_ROLE_KEY") ?? "dev-only-fallback-not-for-production-please-set-env").trim();
  const email = (process.env.ADMIN_EMAIL ?? readEnvValue(envText, "ADMIN_EMAIL") ?? "contact@lecomax.com").trim();
  const payload = `${Date.now()}:${email}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = Array.from(new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(payload))))
    .map(byte => byte.toString(16).padStart(2, "0"))
    .join("");
  return { token: Buffer.from(`${payload}.${signature}`).toString("base64url"), email };
}

function dateKey(daysAgo) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

function fixture(days) {
  const daily = Array.from({ length: days }, (_, index) => {
    const reverseIndex = days - 1 - index;
    const orders = (index * 3 + 2) % 8;
    return { date: dateKey(reverseIndex), orders, orderValue: orders * (375 + (index % 4) * 90) };
  });
  return {
    stats: {
      products: 1248,
      orders: 642,
      orderValue: 9876543,
      pending: 14,
      confirmed: 8,
      shipped: 21,
      delivered: 570,
      cancelled: 29,
      lowStock: 7,
    },
    period: {
      days,
      orders: daily.reduce((sum, item) => sum + item.orders, 0),
      orderValue: daily.reduce((sum, item) => sum + item.orderValue, 0),
      daily,
    },
    recentOrders: [
      { id: "order-1", orderNumber: "ECO-984321", customerName: "Mohammed Ben Abdellah", total: 1234567, status: "pending", createdAt: new Date().toISOString() },
      { id: "order-2", orderNumber: "ECO-984320", customerName: "Sara El Mansouri", total: 895, status: "confirmed", createdAt: new Date(Date.now() - 3_600_000).toISOString() },
      { id: "order-3", orderNumber: "ECO-984319", customerName: "Youssef Alaoui", total: 1240, status: "shipped", createdAt: new Date(Date.now() - 7_200_000).toISOString() },
      { id: "order-4", orderNumber: "ECO-984318", customerName: "Amal Tazi", total: 560, status: "delivered", createdAt: new Date(Date.now() - 86_400_000).toISOString() },
      { id: "order-5", orderNumber: "ECO-984317", customerName: "Nadia Berrada", total: 430, status: "cancelled", createdAt: new Date(Date.now() - 172_800_000).toISOString() },
      { id: "order-6", orderNumber: "ECO-984316", customerName: "Rachid Idrissi", total: 2100, status: "delivered", createdAt: new Date(Date.now() - 259_200_000).toISOString() },
    ],
    permissions: null,
    generatedAt: new Date().toISOString(),
  };
}

async function evaluate(client, expression) {
  const response = await client.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.exception?.description ?? response.exceptionDetails.text ?? "Browser evaluation failed");
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
  await client.send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 600 });
  await new Promise(resolve => setTimeout(resolve, 300));
}

async function saveScreenshot(client, directory, name) {
  if (!directory) return;
  const targetDirectory = path.resolve(directory);
  const allowedRoots = [path.resolve(root) + path.sep, path.resolve(os.tmpdir()) + path.sep];
  assert(allowedRoots.some(allowed => targetDirectory.startsWith(allowed)), "Screenshot directory must be inside the project or temporary directory.");
  await mkdir(targetDirectory, { recursive: true });
  const screenshot = await client.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  await writeFile(path.join(targetDirectory, name), Buffer.from(screenshot.data, "base64"));
}

async function main() {
  const readiness = await fetch(`${baseUrl}/admin/dashboard`, { redirect: "manual" }).catch(error => {
    throw new Error(`The local Next.js server is not reachable at ${baseUrl}. Start it with npm run dev. ${error.message}`);
  });
  assert([200, 307, 308].includes(readiness.status), `Unexpected local server status before smoke test: ${readiness.status}`);

  const chromePath = await findChrome();
  const profile = await mkdtemp(path.join(os.tmpdir(), "lecomax-dashboard-smoke-"));
  const chrome = spawn(chromePath, [
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

  let browserClient;
  let pageClient;
  try {
    const [port, browserPath] = await waitForDevToolsFile(profile);
    browserClient = new CdpClient(`ws://127.0.0.1:${port}${browserPath}`);
    await browserClient.connect();
    const pages = await fetch(`http://127.0.0.1:${port}/json/list`).then(response => response.json());
    const page = pages.find(item => item.type === "page");
    assert(page?.webSocketDebuggerUrl, "Chrome did not expose a page target.");
    pageClient = new CdpClient(page.webSocketDebuggerUrl);
    await pageClient.connect();
    await Promise.all([pageClient.send("Page.enable"), pageClient.send("Runtime.enable"), pageClient.send("Network.enable")]);

    const { token, email } = await createAdminToken();
    if (process.env.ADMIN_DASHBOARD_LIVE_API === "1") {
      const liveResponse = await fetch(`${baseUrl}/api/admin/dashboard?days=7`, {
        headers: { Cookie: `admin_session=${token}` },
        cache: "no-store",
      });
      assert(liveResponse.ok, `The live protected dashboard endpoint returned HTTP ${liveResponse.status}.`);
      const livePayload = await liveResponse.json();
      assert(
        livePayload?.stats && livePayload?.period?.days === 7 && Array.isArray(livePayload?.period?.daily) && Array.isArray(livePayload?.recentOrders),
        "The live protected dashboard endpoint returned an invalid contract.",
      );
    }
    const cookie = await pageClient.send("Network.setCookie", { name: "admin_session", value: token, url: baseUrl, path: "/", httpOnly: true, sameSite: "Strict" });
    assert(cookie.success, "The dashboard smoke-test admin cookie was rejected.");

    const fixtures = { 7: fixture(7), 30: fixture(30) };
    await pageClient.send("Page.addScriptToEvaluateOnNewDocument", {
      source: `(() => {
        const fixtures = ${JSON.stringify(fixtures)};
        const ownerEmail = ${JSON.stringify(email)};
        const originalFetch = window.fetch.bind(window);
        window.fetch = (input, init) => {
          const raw = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
          const url = new URL(raw, location.origin);
          const json = value => Promise.resolve(new Response(JSON.stringify(value), { status: 200, headers: { 'Content-Type': 'application/json' } }));
          if (url.pathname === '/api/admin/dashboard') return json(fixtures[url.searchParams.get('days') === '30' ? 30 : 7]);
          if (url.pathname === '/api/admin/auth/verify') return json({ ok: true, email: ownerEmail });
          if (url.pathname === '/api/admin/staff/permissions') return json({ isStaff: false, permissions: [] });
          if (url.pathname === '/api/products' && location.search.includes('id=smoke-edit')) return json([{ id: 'smoke-edit', name: 'Produit test', slug: 'produit-test', category: 'chaussures', price: 100, stock: 1, images: [], sizes: [], tags: [], active: true, details: {} }]);
          if (['/api/orders', '/api/products', '/api/messages', '/api/admin/approvals'].includes(url.pathname)) return json([]);
          return originalFetch(input, init);
        };
      })();`,
    });

    await setViewport(pageClient, 390, 844);
    await pageClient.send("Page.navigate", { url: `${baseUrl}/admin/dashboard` });
    try {
      await waitFor(pageClient, `Boolean(document.querySelector('.admin-dashboard-heading h1') && document.querySelector('[aria-label="Indicateurs principaux"]'))`, "the populated mobile dashboard", 15_000);
    } catch (error) {
      const diagnostics = await evaluate(pageClient, `({ url: location.href, title: document.title, text: document.body?.innerText?.slice(0, 1200), html: document.documentElement?.outerHTML?.slice(0, 500) })`).catch(() => null);
      const runtimeErrors = pageClient.events.filter(event => event.method === "Runtime.exceptionThrown").slice(-3);
      throw new Error(`${error instanceof Error ? error.message : String(error)}\nDiagnostics: ${JSON.stringify({ diagnostics, runtimeErrors })}`);
    }
    await waitFor(pageClient, `document.querySelector('[aria-label="Navigation admin mobile"]')?.querySelectorAll('a,button').length === 5`, "the five mobile management controls");

    const mobile = await evaluate(pageClient, `(() => {
      const visible = node => Boolean(node && node.getClientRects().length && getComputedStyle(node).visibility !== 'hidden');
      const main = document.querySelector('#admin-main');
      const priorities = document.querySelector('#attention-title')?.closest('section');
      const metrics = document.querySelector('[aria-label="Indicateurs principaux"]');
      const recent = document.querySelector('#recent-orders-title')?.closest('section');
      const quickActions = document.querySelector('#quick-actions-title')?.closest('section');
      const analytics = document.querySelector('#dashboard-analytics-panels');
      const cards = [...metrics.children];
      const nav = document.querySelector('[aria-label="Navigation admin mobile"]');
      const originalWindowScroll = window.scrollY;
      window.scrollTo(0, 1000);
      const documentCanScroll = window.scrollY !== originalWindowScroll;
      window.scrollTo(0, originalWindowScroll);
      return {
        pageOverflow: document.documentElement.scrollWidth - innerWidth,
        mainOverflow: main.scrollWidth - main.clientWidth,
        documentScroll: document.documentElement.scrollHeight - innerHeight,
        documentCanScroll,
        internalScroll: main.scrollHeight > main.clientHeight,
        layout: {
          html: [document.documentElement.clientHeight, document.documentElement.scrollHeight, getComputedStyle(document.documentElement).overflowY],
          body: [document.body.clientHeight, document.body.scrollHeight, getComputedStyle(document.body).display, getComputedStyle(document.body).overflowY],
          rootMain: (() => { const node = document.querySelector('body > div > main, body > main'); return node ? [node.clientHeight, node.scrollHeight, getComputedStyle(node).minHeight, getComputedStyle(node).overflowY] : null; })(),
          shell: (() => { const node = document.querySelector('#admin-main')?.parentElement?.parentElement; return node ? [node.clientHeight, node.scrollHeight, getComputedStyle(node).height, getComputedStyle(node).overflowY] : null; })(),
          adminMain: [main.clientHeight, main.scrollHeight, getComputedStyle(main).minHeight, getComputedStyle(main).overflowY],
        },
        cardsOverflow: cards.map(card => {
          const value = card.querySelector('[data-metric-value]');
          return value ? value.scrollWidth - value.clientWidth : 0;
        }),
        order: [priorities, metrics, recent].map(node => node.getBoundingClientRect().top),
        navLabels: [...nav.querySelectorAll('a,button')].map(node => node.textContent.trim()),
        navVisible: visible(nav),
        analyticsVisible: visible(analytics),
        touchTargets: [...nav.querySelectorAll('a,button')].map(node => Math.round(node.getBoundingClientRect().height)),
        actionCount: quickActions?.querySelectorAll('a').length ?? 0,
        recentCount: document.querySelectorAll('#recent-orders-title').length && recent.querySelectorAll('a').length,
      };
    })()`);
    assert(mobile.pageOverflow <= 2 && mobile.mainOverflow <= 2, "The admin dashboard horizontally overflows at 390px.");
    assert(!mobile.documentCanScroll && mobile.internalScroll, `The mobile admin shell does not use its intended internal scroll container: ${JSON.stringify({ documentCanScroll: mobile.documentCanScroll, documentScroll: mobile.documentScroll, internalScroll: mobile.internalScroll, layout: mobile.layout })}`);
    assert(mobile.cardsOverflow.every(value => value <= 2), `A KPI card overflows on mobile: ${JSON.stringify(mobile.cardsOverflow)}`);
    assert(mobile.order[0] < mobile.order[1] && mobile.order[1] < mobile.order[2], "Mobile priorities, KPIs, and recent orders are in the wrong order.");
    assert(mobile.navVisible && ["Accueil", "Produits", "Clients", "Plus"].every(label => mobile.navLabels.join("|").includes(label)), "The mobile navigation is missing management labels.");
    assert(mobile.touchTargets.every(height => height >= 44), "A bottom-navigation target is smaller than 44px.");
    assert(!mobile.analyticsVisible, "Detailed analytics should start collapsed on mobile.");
    assert(mobile.actionCount >= 4 && mobile.recentCount >= 6, "Quick actions or recent orders are missing on mobile.");

    await evaluate(pageClient, `document.querySelector('[aria-controls="dashboard-analytics-panels"]')?.click()`);
    await waitFor(pageClient, `document.querySelector('[aria-controls="dashboard-analytics-panels"]')?.getAttribute('aria-expanded') === 'true' && document.querySelector('#dashboard-analytics-panels')?.getClientRects().length`, "expanded mobile analytics");
    await saveScreenshot(pageClient, process.env.ADMIN_DASHBOARD_SCREENSHOT_DIR, "dashboard-mobile-390.png");

    await evaluate(pageClient, `(() => {
      const menu = document.querySelector('[aria-label="Navigation admin mobile"] button[aria-controls="admin-sidebar"]');
      menu.focus();
      menu.click();
      return true;
    })()`);
    await new Promise(resolve => setTimeout(resolve, 600));
    const drawerFocus = await evaluate(pageClient, `(() => {
      const sidebar = document.querySelector('#admin-sidebar');
      const menu = document.querySelector('[aria-label="Navigation admin mobile"] button[aria-controls="admin-sidebar"]');
      return { ariaHidden: sidebar?.getAttribute('aria-hidden'), expanded: menu?.getAttribute('aria-expanded'), activeId: document.activeElement?.id, activeLabel: document.activeElement?.getAttribute?.('aria-label'), focusInside: sidebar?.contains(document.activeElement) };
    })()`);
    assert(drawerFocus.ariaHidden === "false" && drawerFocus.focusInside, `The accessible mobile drawer did not open or receive focus: ${JSON.stringify(drawerFocus)}`);
    const openDrawer = await evaluate(pageClient, `({ bodyOverflow: getComputedStyle(document.body).overflow, expanded: document.querySelector('[aria-label="Navigation admin mobile"] button[aria-controls="admin-sidebar"]')?.getAttribute('aria-expanded') })`);
    assert(openDrawer.bodyOverflow === "hidden" && openDrawer.expanded === "true", "The open drawer did not lock the page or expose its state.");
    await evaluate(pageClient, `document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))`);
    await waitFor(pageClient, `document.querySelector('#admin-sidebar')?.getAttribute('aria-hidden') === 'true' && document.activeElement === document.querySelector('[aria-label="Navigation admin mobile"] button[aria-controls="admin-sidebar"]')`, "Escape close and focus return");

    await evaluate(pageClient, `document.querySelector('[aria-label="Période d’analyse"] button:last-child')?.click()`);
    await waitFor(pageClient, `document.querySelector('[aria-label="Période d’analyse"] button:last-child')?.getAttribute('aria-pressed') === 'true' && document.body.textContent.includes('30 derniers jours')`, "the 30-day dashboard refresh");

    await setViewport(pageClient, 768, 900);
    const tablet = await evaluate(pageClient, `({ overflow: document.documentElement.scrollWidth - innerWidth, nav: Boolean(document.querySelector('[aria-label="Navigation admin mobile"]')?.getClientRects().length), main: document.querySelector('#admin-main').scrollWidth - document.querySelector('#admin-main').clientWidth })`);
    assert(tablet.overflow <= 2 && tablet.main <= 2 && tablet.nav, "The tablet dashboard layout is invalid.");

    await setViewport(pageClient, 1440, 1000);
    await waitFor(pageClient, `document.querySelector('#admin-sidebar')?.getAttribute('aria-hidden') === 'false'`, "the desktop sidebar");
    const desktop = await evaluate(pageClient, `(() => {
      const visible = node => Boolean(node && node.getClientRects().length);
      return {
        overflow: document.documentElement.scrollWidth - innerWidth,
        mainOverflow: document.querySelector('#admin-main').scrollWidth - document.querySelector('#admin-main').clientWidth,
        sidebar: visible(document.querySelector('#admin-sidebar')),
        bottomNav: visible(document.querySelector('[aria-label="Navigation admin mobile"]')),
        analytics: visible(document.querySelector('#dashboard-analytics-panels')),
      };
    })()`);
    assert(desktop.overflow <= 2 && desktop.mainOverflow <= 2 && desktop.sidebar && !desktop.bottomNav && desktop.analytics, "The desktop dashboard regression check failed.");
    await saveScreenshot(pageClient, process.env.ADMIN_DASHBOARD_SCREENSHOT_DIR, "dashboard-desktop-1440.png");

    // Exercise the editor without submitting or writing any products.
    await setViewport(pageClient, 390, 844);
    await pageClient.send("Page.navigate", { url: `${baseUrl}/admin/products?new=1` });
    await waitFor(pageClient, `Boolean(document.querySelector('#product-information'))`, "the product editor", 20_000);
    for (const width of [320, 390, 768]) {
      await setViewport(pageClient, width, 844);
      const editor = await evaluate(pageClient, `(() => {
        const main = document.querySelector('#admin-main');
        const actions = document.querySelector('.admin-editor-actions').getBoundingClientRect();
        const nav = document.querySelector('.admin-bottom-nav').getBoundingClientRect();
        return {
          overflow: main.scrollWidth - main.clientWidth,
          heading: getComputedStyle(document.querySelector('.admin-editor-heading')).position,
          barGap: nav.top - actions.bottom,
          touchTargets: [...document.querySelectorAll('.admin-editor-actions button')].map(el => el.getBoundingClientRect().height),
        };
      })()`);
      assert(editor.overflow <= 2, `Product editor overflows at ${width}px.`);
      assert(editor.heading === "static", `Product editor heading overlays fields at ${width}px.`);
      assert(Math.abs(editor.barGap) <= 2, `Product save bar and navigation are misaligned at ${width}px.`);
      assert(editor.touchTargets.every(height => height >= 44), "Editor actions are too small.");
    }
    await setViewport(pageClient, 390, 844);
    await evaluate(pageClient, `document.querySelector('.admin-editor-progress nav button:last-child').click()`);
    await waitFor(pageClient, `document.querySelector('#product-variants').open`, "expanded variant section");
    await evaluate(pageClient, `[...document.querySelectorAll('#product-variants button')].find(button => button.textContent.trim() === 'Chaussures').click()`);
    await waitFor(pageClient, `[...document.querySelectorAll('#product-variants button')].some(button => button.textContent.trim() === '44')`, "shoe sizes");
    await evaluate(pageClient, `[...document.querySelectorAll('#product-variants button')].find(button => button.textContent.trim() === '44').click()`);
    await waitFor(pageClient, `Boolean(document.getElementById('size-stock-44'))`, "size stock field");
    await evaluate(pageClient, `document.getElementById('size-stock-44').parentElement.lastElementChild.click()`);
    await waitFor(pageClient, `document.getElementById('size-stock-44').value === '1'`, "stock increment");
    for (const width of [320, 390, 518, 768, 1440]) {
      await setViewport(pageClient, width, 900);
      const stock = await evaluate(pageClient, `(() => {
        const input = document.getElementById('size-stock-44');
        const controls = input.parentElement;
        return {
          width: input.getBoundingClientRect().width,
          overflow: controls.scrollWidth - controls.clientWidth,
          buttons: [...controls.querySelectorAll('button')].map(button => button.getBoundingClientRect().width),
          value: input.value,
        };
      })()`);
      assert(stock.width >= 48 && stock.overflow <= 2 && stock.value === '1', `Stock quantity is clipped at ${width}px: ${JSON.stringify(stock)}`);
      assert(stock.buttons.every(width => width >= 44), `Stock buttons are too small at ${width}px.`);
    }
    await evaluate(pageClient, `document.getElementById('size-stock-44').parentElement.firstElementChild.click()`);
    await waitFor(pageClient, `document.getElementById('size-stock-44').value === '0'`, "stock decrement");
    await evaluate(pageClient, `document.getElementById('size-stock-44').parentElement.firstElementChild.click()`);
    assert(await evaluate(pageClient, `document.getElementById('size-stock-44').value === '0'`), "Stock must stay nonnegative.");
    await setViewport(pageClient, 390, 844);
    await evaluate(pageClient, `document.querySelector('#admin-main').scrollTo({top: 0, behavior: 'instant'})`);
    await saveScreenshot(pageClient, process.env.ADMIN_DASHBOARD_SCREENSHOT_DIR, "product-editor-mobile-390.png");

    await setViewport(pageClient, 1440, 1000);
    const desktopEditor = await evaluate(pageClient, `(() => {
      const main = document.querySelector('#admin-main');
      const importInput = document.querySelector('.admin-editor-import input');
      return { overflow: main.scrollWidth - main.clientWidth, importVisible: importInput.getBoundingClientRect().height > 0, actionsHidden: getComputedStyle(document.querySelector('.admin-editor-actions')).display === 'none' };
    })()`);
    assert(desktopEditor.overflow <= 2 && desktopEditor.importVisible && desktopEditor.actionsHidden, "Desktop product editor layout regressed.");

    await pageClient.send("Page.navigate", { url: `${baseUrl}/admin/products?id=smoke-edit` });
    await waitFor(pageClient, `Boolean(document.querySelector('#product-size-inventory'))`, "edit product details");
    await evaluate(pageClient, `document.querySelector('#product-size-inventory').closest('details').open = true`);
    for (const width of [320, 390, 518, 768, 1440]) {
      await setViewport(pageClient, width, 900);
      assert(await evaluate(pageClient, `document.querySelector('#product-size-inventory button').getBoundingClientRect().height >= ${width < 1024 ? 44 : 24}`), `Add detail is hidden or too small at ${width}px.`);
    }
    await setViewport(pageClient, 390, 844);
    await evaluate(pageClient, `document.querySelector('#product-size-inventory button').click()`);
    await waitFor(pageClient, `document.querySelectorAll('#product-size-inventory input').length === 2`, "added detail fields");
    await evaluate(pageClient, `(() => {
      const fields = [...document.querySelectorAll('#product-size-inventory input')];
      fields.forEach((field, index) => {
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(field, index ? 'Coton' : 'Matière');
        field.dispatchEvent(new Event('input', { bubbles: true }));
      });
    })()`);
    assert(await evaluate(pageClient, `(() => {
      const fields = [...document.querySelectorAll('#product-size-inventory input')];
      return fields[0].value === 'Matière' && fields[1].value === 'Coton' && fields.every(field => field.getBoundingClientRect().width >= 100);
    })()`), "Product detail fields must remain editable and readable.");
    await evaluate(pageClient, `document.querySelector('#product-size-inventory button[aria-label]').click()`);
    await waitFor(pageClient, `document.querySelectorAll('#product-size-inventory input').length === 0`, "removed detail");

    for (const width of [320, 518]) {
      await setViewport(pageClient, width, 740);
      await evaluate(pageClient, `document.querySelector('button[aria-label="Activer les notifications admin"], button[aria-label="Notifications admin activées"]').click()`);
      await waitFor(pageClient, `Boolean(document.querySelector('dialog:modal #admin-push-title'))`, "top-layer admin notification dialog");
      const alertPanel = await evaluate(pageClient, `(() => {
        const dialog = document.querySelector('dialog:modal');
        const bounds = dialog.getBoundingClientRect();
        dialog.scrollTop = dialog.scrollHeight;
        const actions = [...dialog.querySelectorAll('button')].filter(button => !button.hasAttribute('aria-label'));
        const action = actions[0];
        const rect = action.getBoundingClientRect();
        return { fits: bounds.left >= 0 && bounds.right <= innerWidth && bounds.top >= 0 && bounds.bottom <= innerHeight,
          overflow: dialog.scrollWidth - dialog.clientWidth,
          reachable: action.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2)) };
      })()`);
      assert(alertPanel.fits && alertPanel.overflow <= 2 && alertPanel.reachable, `Admin alerts are covered or clipped at ${width}px: ${JSON.stringify(alertPanel)}`);
      await saveScreenshot(pageClient, process.env.ADMIN_DASHBOARD_SCREENSHOT_DIR, `admin-alerts-${width}.png`);
      await evaluate(pageClient, `document.querySelector('dialog:modal button[aria-label="Fermer les alertes admin"]').click()`);
      await waitFor(pageClient, `!document.querySelector('dialog:modal')`, "closed notification dialog");
    }
    const exceptions = pageClient.events.filter(event => event.method === "Runtime.exceptionThrown");
    assert(exceptions.length === 0, "The browser reported an uncaught dashboard runtime exception.");
    console.log("Admin browser smoke test passed: dashboard, drawer, tablet, desktop, and product editor at 320/390/768px with aligned actions and working section shortcuts.");
  } finally {
    pageClient?.close();
    browserClient?.close();
    chrome.kill();
    const safeTempRoot = path.resolve(os.tmpdir()) + path.sep;
    if (path.resolve(profile).startsWith(safeTempRoot)) {
      await rm(profile, { recursive: true, force: true, maxRetries: 4, retryDelay: 150 }).catch(() => undefined);
    }
  }
}

export { CdpClient, createAdminToken, evaluate, waitFor, setViewport, saveScreenshot, findChrome, waitForDevToolsFile };
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
