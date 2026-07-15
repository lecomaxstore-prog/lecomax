import { spawn } from "node:child_process";
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const baseUrl = process.env.COURSE_BASE_URL ?? "http://127.0.0.1:3000";
const parsedBaseUrl = new URL(baseUrl);
assert(["127.0.0.1", "localhost"].includes(parsedBaseUrl.hostname), "The course smoke test only creates sessions for a local development server.");
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

async function createAdminToken() {
  const envText = await readFile(path.join(root, ".env.local"), "utf8").catch(() => "");
  const match = /^SUPABASE_SERVICE_ROLE_KEY=(.*)$/m.exec(envText);
  const secret = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? match?.[1] ?? "dev-only-fallback-not-for-production-please-set-env")
    .trim()
    .replace(/^['"]|['"]$/g, "");
  const payload = `${Date.now()}:academy-smoke@localhost`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = Array.from(new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(payload))))
    .map(byte => byte.toString(16).padStart(2, "0"))
    .join("");
  return Buffer.from(`${payload}.${signature}`).toString("base64url");
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
  const readiness = await fetch(`${baseUrl}/admin/how-it-was-built/`, { redirect: "manual" }).catch(error => {
    throw new Error(`The local Next.js server is not reachable at ${baseUrl}. Start it with npm run dev. ${error.message}`);
  });
  assert([200, 307, 308].includes(readiness.status), `Unexpected local server status before smoke test: ${readiness.status}`);
  const chromePath = await findChrome();
  const profile = await mkdtemp(path.join(os.tmpdir(), "lecomax-course-smoke-"));
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
    await browserClient.send("Browser.grantPermissions", {
      origin: new URL(baseUrl).origin,
      permissions: ["clipboardReadWrite", "clipboardSanitizedWrite"],
    });

    const pages = await fetch(`http://127.0.0.1:${port}/json/list`).then(response => response.json());
    const page = pages.find(item => item.type === "page");
    assert(page?.webSocketDebuggerUrl, "Chrome did not expose a page target.");
    pageClient = new CdpClient(page.webSocketDebuggerUrl);
    await pageClient.connect();
    await Promise.all([
      pageClient.send("Page.enable"),
      pageClient.send("Runtime.enable"),
      pageClient.send("Network.enable"),
    ]);
    await pageClient.send("Page.bringToFront");

    const token = await createAdminToken();
    const cookie = await pageClient.send("Network.setCookie", {
      name: "admin_session",
      value: token,
      url: baseUrl,
      path: "/",
      httpOnly: true,
      sameSite: "Strict",
    });
    assert(cookie.success, "The smoke-test admin cookie was rejected.");

    const manifest = JSON.parse(await readFile(path.join(root, "app", "admin", "how-it-was-built", "course", "generated", "manifest.json"), "utf8"));
    const module = manifest.modules.find(item => item.id === "nextjs-app-router") ?? manifest.modules[0];
    const frenchModule = JSON.parse(await readFile(path.join(root, "app", "admin", "how-it-was-built", "course", "content", "fr", module.id + ".json"), "utf8"));
    const directLesson = frenchModule.lessons.find(item => item.id === module.lessonIds[0]);
    const searchModule = manifest.modules.find(item => item.id === "typescript-contracts") ?? manifest.modules[1];
    const frenchSearchModule = JSON.parse(await readFile(path.join(root, "app", "admin", "how-it-was-built", "course", "content", "fr", searchModule.id + ".json"), "utf8"));
    const arabicSearchModule = JSON.parse(await readFile(path.join(root, "app", "admin", "how-it-was-built", "course", "content", "ar", searchModule.id + ".json"), "utf8"));
    const searchLesson = frenchSearchModule.lessons.find(item => item.id === searchModule.lessonIds[0]);
    const arabicSearchLesson = arabicSearchModule.lessons.find(item => item.id === searchModule.lessonIds[0]);
    const searchHash = `#academy/${searchModule.id}/${searchModule.lessonIds[0]}`;
    const expectedHash = `#academy/${module.id}/${module.lessonIds[0]}`;
    const targetUrl = `${baseUrl}/admin/how-it-was-built/${expectedHash}`;
    await setViewport(pageClient, 1440, 1000);
    await pageClient.send("Page.navigate", { url: targetUrl });
    await waitFor(pageClient, `document.querySelector('#academy-lesson-title')?.textContent?.trim() === ${JSON.stringify(directLesson.title)}`, "the exact deep-linked Academy lesson");

    const desktop = await evaluate(pageClient, `(() => {
      const reader = document.querySelector('#academy-reader-top');
      const visibleAsides = [...reader.querySelectorAll('aside')].filter(node => getComputedStyle(node).display !== 'none');
      return {
        hash: location.hash,
        title: document.querySelector('#academy-lesson-title')?.textContent?.trim(),
        moduleId: document.querySelector('[data-module-id]')?.dataset.moduleId,
        lessonId: document.querySelector('[data-lesson-id]')?.dataset.lessonId,
        direction: reader.getAttribute('dir'),
        computedDirection: getComputedStyle(reader).direction,
        codePanels: reader.querySelectorAll('[role="region"]').length,
        quizGroups: reader.querySelectorAll('#lesson-section-quiz [role="radiogroup"]').length,
        visibleAsides: visibleAsides.length,
        courseStorage: Object.fromEntries(Object.keys(localStorage).filter(key => /academy|course|lesson|progress/i.test(key)).map(key => [key, localStorage.getItem(key)])),
      };
    })()`);
    assert(desktop.hash === expectedHash, "The direct lesson hash was not preserved.");
    assert(desktop.title === directLesson.title && desktop.moduleId === module.id && desktop.lessonId === module.lessonIds[0], "The hash opened the wrong lesson.");
    assert(desktop.direction === "ltr" && desktop.computedDirection === "ltr", "French Academy should render left-to-right.");
    assert(desktop.codePanels >= 3, "The lesson does not expose its annotated examples and commands.");
    assert(desktop.quizGroups >= 3, "The lesson does not expose the complete quiz.");
    assert(desktop.visibleAsides >= 2, "Desktop module navigation or sticky lesson contents is hidden.");
    const initialCourseStorage = JSON.stringify(desktop.courseStorage);
    await evaluate(pageClient, `(() => {
      window.__academyStorageWrites = [];
      window.__academyCopiedText = null;
      window.__academyNativeClipboardResolved = false;
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function(key, value) {
        if (/academy|course|lesson|progress/i.test(String(key))) window.__academyStorageWrites.push([String(key), String(value)]);
        return original.call(this, key, value);
      };
      const nativeWriteText = navigator.clipboard.writeText.bind(navigator.clipboard);
      Object.defineProperty(navigator.clipboard, 'writeText', { configurable: true, value: async value => {
          window.__academyCopiedText = value;
          try {
            await nativeWriteText(value);
            window.__academyNativeClipboardResolved = true;
          } catch {
            window.__academyNativeClipboardResolved = false;
          }
        },
      });
      return true;
    })()`);

    const hiddenHintLabel = await evaluate(pageClient, "document.querySelector('#lesson-section-exercise button[aria-expanded=\"false\"]:not([aria-controls])')?.textContent?.trim()");
    await evaluate(pageClient, `(() => {
      document.querySelector('#lesson-section-exercise button[aria-expanded="false"]:not([aria-controls])')?.click();
      document.querySelector('#lesson-section-exercise button[aria-controls]')?.click();
      document.querySelector('#lesson-section-quiz [role="radio"]')?.click();
      document.querySelector('#academy-reader-top button[aria-label^="Copier:"]')?.click();
      return true;
    })()`);
    await waitFor(pageClient, "document.querySelector('#lesson-section-exercise button:not([aria-controls])[aria-expanded=\"true\"]')?.textContent?.trim() !== " + JSON.stringify(hiddenHintLabel), "the revealed exercise hint");
    await waitFor(pageClient, "Boolean(document.querySelector('#lesson-section-exercise [id$=\"-solution\"]'))", "the voluntarily revealed solution");
    await waitFor(pageClient, "document.querySelector('#lesson-section-quiz [role=\"radio\"]')?.getAttribute('aria-checked') === 'true'", "the quiz selection");
    await waitFor(pageClient, "Boolean(document.querySelector('#lesson-section-quiz [aria-live=\"polite\"]'))", "the quiz answer explanation");
    const expectedCopiedSource = directLesson.sections.flatMap(section => section.blocks).find(block => block.type === "code").code.source;
    const clipboardText = await evaluate(pageClient, "window.__academyCopiedText");
    assert(clipboardText === expectedCopiedSource, "The copied code does not match the annotated example.");

    await evaluate(pageClient, `(() => {
      const first = document.querySelector('#lesson-section-quiz [role="radio"]');
      first.focus();
      first.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      return true;
    })()`);
    await waitFor(pageClient, "document.querySelectorAll('#lesson-section-quiz [role=\"radio\"]')[1]?.getAttribute('aria-checked') === 'true' && document.activeElement === document.querySelectorAll('#lesson-section-quiz [role=\"radio\"]')[1]", "keyboard navigation inside the quiz radio group");

    await evaluate(pageClient, `(() => {
      const input = document.querySelector('#academy-search');
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, ${JSON.stringify(searchLesson.title)});
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.focus();
      return true;
    })()`);
    await waitFor(pageClient, "document.querySelectorAll('#academy-search-results [role=\"option\"]').length >= 1", "the keyboard search results");
    await evaluate(pageClient, `(() => {
      const input = document.querySelector('#academy-search');
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      return true;
    })()`);
    await waitFor(pageClient, "Boolean(document.querySelector('#academy-search-results [role=\"option\"][aria-selected=\"true\"]'))", "the active keyboard search option");
    await evaluate(pageClient, `document.querySelector('#academy-search').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))`);
    await waitFor(pageClient, `location.hash === ${JSON.stringify(searchHash)} && document.querySelector('#academy-lesson-title')?.textContent?.trim() === ${JSON.stringify(searchLesson.title)}`, "keyboard search navigation to the exact lesson");

    await evaluate(pageClient, `document.querySelector(${JSON.stringify('button[aria-label="العربية"]')})?.click()`);
    await waitFor(pageClient, `document.querySelector('#academy-reader-top') && getComputedStyle(document.querySelector('#academy-reader-top')).direction === 'rtl' && document.querySelector('#academy-lesson-title')?.textContent?.trim() === ${JSON.stringify(arabicSearchLesson.title)}`, "the exact Arabic lesson and computed RTL rendering");
    const arabic = await evaluate(pageClient, `({
      hash: location.hash,
      pageLanguage: document.querySelector('[lang="ar"]')?.getAttribute('lang'),
      title: document.querySelector('#academy-lesson-title')?.textContent ?? '',
      direction: document.querySelector('#academy-reader-top')?.getAttribute('dir'),
      computedDirection: getComputedStyle(document.querySelector('#academy-reader-top')).direction,
      moduleId: document.querySelector('[data-module-id]')?.dataset.moduleId,
      lessonId: document.querySelector('[data-lesson-id]')?.dataset.lessonId,
    })`);
    assert(arabic.hash === searchHash && arabic.moduleId === searchModule.id && arabic.lessonId === searchModule.lessonIds[0], "Changing language lost the open lesson.");
    assert(arabic.pageLanguage === "ar" && arabic.direction === "rtl" && arabic.computedDirection === "rtl", "Arabic language or direction metadata is missing.");
    assert(arabic.title.trim() === arabicSearchLesson.title, "The wrong Arabic lesson was loaded.");

    await setViewport(pageClient, 390, 844);
    const mobile = await evaluate(pageClient, `(() => {
      const reader = document.querySelector('#academy-reader-top');
      const isVisible = node => Boolean(node && node.getClientRects().length && getComputedStyle(node).visibility !== 'hidden');
      const selects = [...reader.querySelectorAll('select')].filter(isVisible);
      const details = reader.querySelector('details');
      const visibleAsides = [...reader.querySelectorAll('aside')].filter(isVisible);
      return {
        selects: selects.length,
        detailsVisible: isVisible(details),
        visibleAsides: visibleAsides.length,
        readerOverflow: reader.scrollWidth - reader.clientWidth,
        pageOverflow: document.documentElement.scrollWidth - innerWidth,
      };
    })()`);
    assert(mobile.selects >= 2, "Mobile module and lesson selectors are not visible.");
    assert(mobile.detailsVisible, "Mobile/tablet lesson contents is not available.");
    assert(mobile.visibleAsides === 0, "Desktop sidebars remain visible at 390px.");
    assert(mobile.readerOverflow <= 2 && mobile.pageOverflow <= 2, "Academy horizontally overflows at 390px.");

    await setViewport(pageClient, 768, 900);
    const tablet = await evaluate(pageClient, `(() => {
      const reader = document.querySelector('#academy-reader-top');
      const visible = node => Boolean(node && node.getClientRects().length);
      return { toc: visible(reader.querySelector('details')), selects: [...reader.querySelectorAll('select')].filter(visible).length, overflow: document.documentElement.scrollWidth - innerWidth };
    })()`);
    assert(tablet.toc && tablet.selects >= 2 && tablet.overflow <= 2, "Tablet Academy navigation or layout is invalid.");

    await setViewport(pageClient, 1440, 1000);
    const finalDesktop = await evaluate(pageClient, `(() => {
      const reader = document.querySelector('#academy-reader-top');
      const visible = node => Boolean(node && node.getClientRects().length);
      return { asides: [...reader.querySelectorAll('aside')].filter(visible).length, mobileToc: visible(reader.querySelector('details')), overflow: document.documentElement.scrollWidth - innerWidth };
    })()`);
    assert(finalDesktop.asides >= 2 && !finalDesktop.mobileToc && finalDesktop.overflow <= 2, "Desktop Academy navigation or layout is invalid.");

    await setViewport(pageClient, 390, 844);
    const mobileShell = await evaluate(pageClient, `(() => {
      const visible = node => Boolean(node && node.getClientRects().length && getComputedStyle(node).visibility !== 'hidden');
      const navigator = document.querySelector('#mobile-course-navigator');
      const courseHeader = document.querySelector('#course-page-header');
      const adminMain = document.querySelector('#admin-main');
      const controls = [...navigator.querySelectorAll('button, select')].filter(visible);
      const languageButtons = [...document.querySelectorAll('button[aria-pressed]')].filter(visible);
      return {
        navigatorVisible: visible(navigator),
        desktopTabsVisible: visible(document.querySelector('#course-desktop-tabs')),
        courseHeaderPosition: getComputedStyle(courseHeader).position,
        courseHeaderTop: courseHeader.getBoundingClientRect().top,
        adminMainTop: adminMain.getBoundingClientRect().top,
        selectedSection: document.querySelector('#course-section-select')?.value,
        controlHeights: controls.map(node => node.getBoundingClientRect().height),
        languageHeights: languageButtons.map(node => node.getBoundingClientRect().height),
        mainOverflow: document.querySelector('#admin-main')?.scrollWidth - document.querySelector('#admin-main')?.clientWidth,
      };
    })()`);
    assert(mobileShell.navigatorVisible && !mobileShell.desktopTabsVisible, "The professional mobile section navigator is not rendered correctly.");
    assert(mobileShell.courseHeaderPosition === "sticky", "The course page header should remain sticky while the content scrolls.");
    assert(Math.abs(mobileShell.courseHeaderTop - mobileShell.adminMainTop) <= 2, `The sticky course page header moved away from the top of the admin scroll area (${JSON.stringify(mobileShell)}).`);
    assert(mobileShell.selectedSection === "academy", "The mobile section navigator lost the active Academy section.");
    assert(mobileShell.controlHeights.length >= 3 && mobileShell.controlHeights.every(height => height >= 44), "A mobile course navigation control is smaller than 44px.");
    assert(mobileShell.languageHeights.length >= 3 && mobileShell.languageHeights.every(height => height >= 40), "A mobile language control is undersized.");
    assert((mobileShell.mainOverflow ?? 0) <= 2, "The course shell horizontally overflows the admin viewport at 390px.");

    if (process.env.COURSE_SCREENSHOT) {
      const screenshotPath = path.resolve(root, process.env.COURSE_SCREENSHOT);
      assert(screenshotPath.startsWith(root + path.sep), "COURSE_SCREENSHOT must stay inside the project workspace.");
      await mkdir(path.dirname(screenshotPath), { recursive: true });
      const screenshot = await pageClient.send("Page.captureScreenshot", { format: "png", fromSurface: true });
      await writeFile(screenshotPath, Buffer.from(screenshot.data, "base64"));
    }

    await evaluate(pageClient, `(() => {
      const select = document.querySelector('#course-section-select');
      Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(select, 'search');
      select.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    })()`);
    await waitFor(pageClient, `document.querySelector('#course-section-select')?.value === 'search' && !document.querySelector('#academy-reader-top') && !location.hash.startsWith('#academy/')`, "mobile section selection and Academy hash cleanup");
    await evaluate(pageClient, `document.querySelector('#mobile-course-navigator button:not([disabled])')?.click()`);
    await waitFor(pageClient, `(() => {
      const panel = document.querySelector('#course-tab-panel')?.getBoundingClientRect();
      const main = document.querySelector('#admin-main')?.getBoundingClientRect();
      return document.querySelector('#course-section-select')?.value === 'pages' && panel && main && panel.top >= main.top && panel.top < main.bottom;
    })()`, "mobile previous-section navigation and panel reveal");

    const mobilePanel = await evaluate(pageClient, `(() => {
      const panel = document.querySelector('#course-tab-panel').getBoundingClientRect();
      const main = document.querySelector('#admin-main').getBoundingClientRect();
      return { top: panel.top, mainTop: main.top, mainBottom: main.bottom, overflow: document.querySelector('#admin-main').scrollWidth - document.querySelector('#admin-main').clientWidth };
    })()`);
    assert(mobilePanel.top >= mobilePanel.mainTop && mobilePanel.top < mobilePanel.mainBottom && mobilePanel.overflow <= 2, "Mobile section navigation did not reveal a non-overflowing tab panel.");

    const exceptions = pageClient.events.filter(event => event.method === "Runtime.exceptionThrown");
    assert(exceptions.length === 0, "The browser reported an uncaught runtime exception.");
    const storageAudit = await evaluate(pageClient, `({
      current: JSON.stringify(Object.fromEntries(Object.keys(localStorage).filter(key => /academy|course|lesson|progress/i.test(key)).map(key => [key, localStorage.getItem(key)]))),
      writes: window.__academyStorageWrites ?? [],
    })`);
    assert(storageAudit.current === initialCourseStorage && storageAudit.writes.length === 0, "Interactions persisted Academy course or progress state in localStorage.");

    console.log("Academy browser smoke test passed: deep link, language retention, RTL, copy, quiz, hints, solution, keyboard-ready controls, 390px, tablet, and desktop.");
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

await main();
