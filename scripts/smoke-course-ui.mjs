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

async function createSessionToken(identity) {
  const envText = await readFile(path.join(root, ".env.local"), "utf8").catch(() => "");
  identity ??= (process.env.ADMIN_EMAIL ?? /^ADMIN_EMAIL=(.*)$/m.exec(envText)?.[1] ?? "contact@lecomax.com").trim().replace(/^['"]|['"]$/g, "").toLowerCase();
  const match = /^SUPABASE_SERVICE_ROLE_KEY=(.*)$/m.exec(envText);
  const secret = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? match?.[1] ?? "dev-only-fallback-not-for-production-please-set-env")
    .trim()
    .replace(/^['"]|['"]$/g, "");
  const payload = `${Date.now()}:${identity}`;
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

    const token = await createSessionToken();
    const cookie = await pageClient.send("Network.setCookie", {
      name: "admin_session",
      value: token,
      url: baseUrl,
      path: "/",
      httpOnly: true,
      sameSite: "Strict",
    });
    assert(cookie.success, "The smoke-test admin cookie was rejected.");
    const pinToken = await createSessionToken("how-built-pin@lecomax.local");
    const pinCookie = await pageClient.send("Network.setCookie", {
      name: "how_built_access",
      value: pinToken,
      url: `${baseUrl}/admin/how-it-was-built/`,
      path: "/",
      httpOnly: true,
      sameSite: "Strict",
    });
    assert(pinCookie.success, "The smoke-test course PIN cookie was rejected.");

    if (process.argv.includes("--tutor-only")) {
      await setViewport(pageClient, 390, 844);
      await pageClient.send("Page.navigate", { url: baseUrl + "/admin/how-it-was-built/#files/app%2Fpage.tsx?line=2" });
      await waitFor(pageClient, "!!document.querySelector('a[href^=\"#tutor?\"]')", "source-to-tutor link");
      await evaluate(pageClient, "document.querySelector('a[href^=\"#tutor?\"]').click()");
      await waitFor(pageClient, "document.querySelector('#tutor-source')?.value === 'app/page.tsx'", "selected source in tutor");
      assert(await evaluate(pageClient, "document.querySelector('#admin-main').scrollWidth - document.querySelector('#admin-main').clientWidth <= 2"), "Tutor overflows on mobile");
      const response = await evaluate(pageClient, `fetch('/api/admin/learning-assistant', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({lang:'en',replyLanguage:'en',sourcePath:'app/page.tsx',sourceLine:2,mode:'explain',messages:[{role:'user',content:'Explain the purpose of this file and one actual import. Cite its lines. Keep it short.'}]})}).then(async r => ({status:r.status, body:await r.json()}))`);
      assert(response.status === 200 && response.body.sources?.[0]?.path === "app/page.tsx", "Tutor source-backed response failed: " + JSON.stringify(response));
      console.log(JSON.stringify({tutor: "passed", reply:response.body.reply, sources:response.body.sources}));
      const screenshot = await pageClient.send("Page.captureScreenshot", {format:"png",fromSurface:true});
      await mkdir(path.join(root, ".source-library"),{recursive:true});
      await writeFile(path.join(root, ".source-library", "tutor-check.png"), Buffer.from(screenshot.data,"base64"));
      return;
    }
    if (process.argv.includes("--site-evidence-only")) {
      await setViewport(pageClient, 390, 844);
      await pageClient.send("Page.navigate", {url: baseUrl + "/admin/how-it-was-built/"});
      await waitFor(pageClient, "!!document.querySelector('iframe')?.contentDocument?.querySelector('header a[data-source-line]')", "live preview header");
      await waitFor(pageClient, "[...document.querySelectorAll('button')].find(b=>b.textContent==='En-t\u00eate')?.disabled === false", "preview inspector");
      assert(await evaluate(pageClient, "document.querySelector('iframe').getBoundingClientRect().top < innerHeight - 100"), "Preview is buried below the first screen");
      await evaluate(pageClient, "document.querySelector('iframe').contentDocument.querySelector('header a[data-source-line]').click()");
      try { await waitFor(pageClient, "!!document.querySelector('dialog[open] [role=tablist]')", "source explanation"); }
      catch (error) { console.log(await evaluate(pageClient, "({dialogs:[...document.querySelectorAll('dialog')].map(d=>({open:d.open,text:d.innerText})),url:location.href})")); throw error; }
      assert(await evaluate(pageClient, "document.querySelector('dialog[open]').textContent.includes('components/Header.tsx')"), "Incorrect clicked source file");
      await evaluate(pageClient, "document.querySelectorAll('dialog[open] [role=tab]')[2].click()");
      await waitFor(pageClient, "document.querySelector('dialog[open]').textContent.includes('app/api/categories/route.ts')", "real API reference");
      await evaluate(pageClient, "[...document.querySelectorAll('dialog[open] li')].find(li=>li.textContent.includes('app/api/categories/route.ts')).querySelectorAll('button')[1].click()");
      await waitFor(pageClient, "document.querySelector('dialog[open]').textContent.includes('categories') && !!document.querySelector('dialog[open] [role=tablist]')", "linked API source");
      assert(await evaluate(pageClient, "document.querySelector('dialog[open]').textContent.includes('app/api/categories/route.ts')"), "Related source did not open");
      await evaluate(pageClient, "[...document.querySelectorAll('dialog[open] button')].find(b=>b.textContent.includes('Revenir au fichier')).click()");
      await waitFor(pageClient, "document.querySelector('dialog[open] [role=tabpanel]')?.textContent.includes('components/Header.tsx')", "return to selected source");
      for (const width of [320,390,768,1440]) {
        await setViewport(pageClient,width,844);
        assert(await evaluate(pageClient,"(()=>{const d=document.querySelector('dialog[open]');return d.scrollWidth<=d.clientWidth+2 && d.getBoundingClientRect().width<=innerWidth})()"),"Lesson overflow at "+width);
      }
      await setViewport(pageClient,390,844);
      await evaluate(pageClient, "document.querySelectorAll('dialog[open] [role=tab]')[2].click()");
      await mkdir(path.join(root,'.source-library'),{recursive:true});
      const shot=await pageClient.send('Page.captureScreenshot',{format:'png'});
      await writeFile(path.join(root,'.source-library/source-evidence-mobile.png'),Buffer.from(shot.data,'base64'));
      console.log('Site evidence passed: visible preview, actual header source, API evidence, related file navigation, return and 320/390/768/1440px layouts.');
      return;
    }

    if (process.argv.includes("--backend-only")) {
      await setViewport(pageClient, 390, 844);
      await pageClient.send("Page.navigate", { url: baseUrl + "/admin/how-it-was-built/" });
      await waitFor(pageClient, "[...document.querySelectorAll('button')].some(b=>b.textContent === 'Les 3 guides')", "guide mode switch");
      await evaluate(pageClient, "[...document.querySelectorAll('button')].find(b=>b.textContent === 'Les 3 guides').click()");
      await waitFor(pageClient, "document.querySelectorAll('[data-backend-guides] button[aria-haspopup=dialog]').length === 3", "three guide cards on the default page");
      for (const width of [320, 390, 768, 1440]) {
        await setViewport(pageClient, width, 844);
        assert(await evaluate(pageClient, "document.querySelector('#admin-main').scrollWidth <= document.querySelector('#admin-main').clientWidth + 2"), "Page overflow at " + width);
        await evaluate(pageClient, "document.querySelector('[data-backend-guides] button[aria-haspopup=dialog]').click()");
        await waitFor(pageClient, "!!document.querySelector('[data-backend-guides] dialog[open]')", "reader");
        assert(await evaluate(pageClient, "(()=>{const d=document.querySelector('[data-backend-guides] dialog[open]'); return d.scrollWidth <= d.clientWidth + 2 && d.getBoundingClientRect().width <= innerWidth && d.querySelector('footer').getBoundingClientRect().bottom <= innerHeight + 2})()"), "Reader overflow at " + width);
        await evaluate(pageClient, "document.querySelector('[data-backend-guides] dialog[open] header button').click()");
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      await setViewport(pageClient, 390, 844);
      for (const language of ['English', 'العربية', 'Français']) {
        await evaluate(pageClient, 'document.querySelector(' + JSON.stringify('button[aria-label="' + language + '"]') + ').click()');
        for (let index=0; index<3; index++) {
          await evaluate(pageClient, "document.querySelectorAll('[data-backend-guides] button[aria-haspopup=dialog]')[" + index + "].click()");
          await waitFor(pageClient, "!!document.querySelector('[data-backend-guides] dialog[open] article')", "translated lesson");
          assert(await evaluate(pageClient, "document.querySelectorAll('[data-backend-guides] dialog[open] article section').length === 2"), "Missing learning steps");
          await evaluate(pageClient, "document.querySelector('[data-backend-guides] dialog[open] article button').click()");
          await evaluate(pageClient, "document.querySelector('[data-backend-guides] dialog[open] article details').open=true");
          await evaluate(pageClient, "document.querySelector('[data-backend-guides] dialog[open] footer > button').click()");
          assert(await evaluate(pageClient, "document.querySelector('#backend-lesson-picker').value === '1'"), "Next lesson failed");
          await evaluate(pageClient, "document.querySelector('[data-backend-guides] dialog[open] header button').click()");
        await new Promise(resolve => setTimeout(resolve, 100));
          await evaluate(pageClient, "localStorage.removeItem('lecomax-backend-reading-v1')");
        }
        await pageClient.send("Page.reload");
        await waitFor(pageClient, "[...document.querySelectorAll('button')].some(b=>b.textContent === 'Les 3 guides')", "guide mode switch");
      await evaluate(pageClient, "[...document.querySelectorAll('button')].find(b=>b.textContent === 'Les 3 guides').click()");
      await waitFor(pageClient, "document.querySelectorAll('[data-backend-guides] button[aria-haspopup=dialog]').length === 3", "reload");
      }
      await mkdir(path.join(root, '.source-library'), {recursive:true});
      const shot=await pageClient.send('Page.captureScreenshot', {format:'png'});
      await writeFile(path.join(root, '.source-library/backend-mobile.png'), Buffer.from(shot.data,'base64'));
      console.log("Backend guides browser checks passed: default page, 320/390/768/1440px, three guides, three languages, larger text, answers and next lesson.");
      return;
    }

    if (process.env.COURSE_SOURCE_ONLY === "1" || process.argv.includes("--source-only")) {
      await setViewport(pageClient, 390, 844);
      await pageClient.send("Page.navigate", { url: `${baseUrl}/admin/how-it-was-built/#files/app%2Fpage.tsx?line=2` });
      await waitFor(pageClient, `!!document.querySelector('[data-source-line="2"]')`, "actual source file");
      const expected = await readFile(path.join(root, "app/page.tsx"), "utf8");
      const content = await evaluate(pageClient, `fetch('/api/dev-docs/content?path=app/page.tsx').then(r => r.json())`);
      assert(content.content === expected, "The reader API differs from the saved project file.");
      await evaluate(pageClient, `document.querySelector('[data-source-line="4"]').click()`);
      await waitFor(pageClient, `document.querySelector('[data-explanation-kind]')?.dataset.explanationKind === 'import' && document.querySelector('#source-explanation')?.textContent.includes('Metadata')`, "clicked line explanation with the actual import name");
      assert(await evaluate(pageClient, `document.querySelector('[data-source-line="4"]').getAttribute('aria-pressed') === 'true' && location.hash.endsWith('line=4')`), "Clicked line was not selected and linked.");
      await evaluate(pageClient, `document.querySelector('[data-source-line="4"]').focus()`);
      await pageClient.send("Input.dispatchKeyEvent", { type: "keyDown", key: "ArrowDown", code: "ArrowDown", windowsVirtualKeyCode: 40 });
      await pageClient.send("Input.dispatchKeyEvent", { type: "keyUp", key: "ArrowDown", code: "ArrowDown", windowsVirtualKeyCode: 40 });
      await waitFor(pageClient, `document.activeElement?.dataset.sourceLine === '5' && document.querySelector('#source-explanation')?.textContent.includes('next/dynamic')`, "keyboard line navigation and updated explanation");
      assert(await evaluate(pageClient, `document.querySelector('#admin-main').scrollWidth - document.querySelector('#admin-main').clientWidth <= 2`), "Explanation panel overflows on mobile.");
      await evaluate(pageClient, `document.querySelector('button[aria-label="English"]').click()`);
      await waitFor(pageClient, `document.querySelector('#source-explanation')?.textContent.includes('Bring in an existing tool')`, "English explanation");
      await evaluate(pageClient, `document.querySelector('button[aria-label="العربية"]').click()`);
      await waitFor(pageClient, `document.querySelector('#source-explanation')?.textContent.includes('استيراد أداة موجودة') && getComputedStyle(document.querySelector('#source-explanation')).direction === 'rtl'`, "Arabic explanation and right-to-left layout");
      assert(await evaluate(pageClient, `document.querySelector('#admin-main').scrollWidth - document.querySelector('#admin-main').clientWidth <= 2`), "Arabic explanation overflows on mobile.");
      await evaluate(pageClient, `document.querySelector('#source-reader button[aria-controls="source-explanation"]:not([data-source-line])').click()`);
      await waitFor(pageClient, `!document.querySelector('#source-explanation') && !!document.querySelector('[data-source-line="5"]')`, "plain reading mode");
      await evaluate(pageClient, `document.querySelector('#source-reader button[aria-controls="source-explanation"]').click()`);
      await waitFor(pageClient, `!!document.querySelector('#source-explanation')`, "restored learning mode");
      await evaluate(pageClient, `document.querySelector('button[aria-label="Français"]').click(); document.querySelector('[data-source-line="5"]').click()`);
      await waitFor(pageClient, `document.querySelector('#source-explanation')?.textContent.includes('Récupérer un outil existant')`, "French explanation restored");
      const mobileGuide = await pageClient.send("Page.captureScreenshot", { format: "png", fromSurface: true });
      await mkdir(path.join(root, ".source-library"), { recursive: true });
      await writeFile(path.join(root, ".source-library", "guide-mobile.png"), Buffer.from(mobileGuide.data, "base64"));
      await evaluate(pageClient, `(() => { const input = document.querySelector('#source-query'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, 'package.json'); input.dispatchEvent(new Event('input', { bubbles: true })); })()`);
      await waitFor(pageClient, `Array.from(document.querySelectorAll('button')).some(b => b.textContent.trim() === 'package.json')`, "filename search");
      await evaluate(pageClient, `Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'package.json').click()`);
      await waitFor(pageClient, `document.querySelector('#source-reader h3')?.textContent === 'package.json' && Array.from(document.querySelectorAll('[data-source-line]')).some(node => node.textContent.includes('lecomax'))`, "selected file contents");
      await waitFor(pageClient, `document.querySelector('[data-explanation-kind]')?.dataset.explanationKind === 'data'`, "explanation resets to the new file format");
      await evaluate(pageClient, `document.querySelector('#source-reader h3').parentElement.querySelectorAll('button')[1].click()`);
      assert(await evaluate(pageClient, `JSON.parse(localStorage.getItem('lecomax-source-favourites-v1')).includes('package.json')`), "Favourite was not saved.");
      const search = await evaluate(pageClient, `fetch('/api/dev-docs/library?q=export%20default').then(r => r.json())`);
      assert(search.total > 0 && search.results.some(item => item.snippet.includes('export default')), "Full-text search failed.");
      assert(await evaluate(pageClient, `document.querySelector('#admin-main').scrollWidth - document.querySelector('#admin-main').clientWidth <= 2`), "Source library overflows on mobile.");
      await setViewport(pageClient, 1440, 1000);
      await evaluate(pageClient, `document.querySelector('[data-source-line="2"]').click()`);
      await waitFor(pageClient, `document.querySelector('#source-explanation')?.textContent.includes('La valeur « name »')`, "selected JSON property explanation");
      assert(pageClient.events.filter(event => event.method === 'Runtime.exceptionThrown').length === 0, "Source library raised a browser exception.");
      const screenshot = await pageClient.send("Page.captureScreenshot", { format: "png", fromSurface: true });
      await mkdir(path.join(root, ".source-library"), { recursive: true });
      await writeFile(path.join(root, ".source-library", "browser-check.png"), Buffer.from(screenshot.data, "base64"));
      console.log("Source library browser test passed: real file, deep link, clickable explanation, keyboard navigation, French/English/Arabic, RTL, learning-mode toggle, file-switch explanation, filename and content search, favourites, mobile layout, desktop, and no runtime exceptions.");
      return;
    }

    if (process.argv.includes("--daily-only")) {
      const { checkDailySession } = await import("./smoke-daily-session.mjs");
      await checkDailySession({ client: pageClient, evaluate, waitFor, setViewport, baseUrl, root });
      return;
    }

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

    await waitFor(pageClient, "document.querySelector('[data-shop-mission=page]')?.disabled === false", "mini shop workshop ready");
    await evaluate(pageClient, `document.querySelector('[data-shop-choice="0"]').click(); document.querySelector('[data-shop-check]').click()`);
    await waitFor(pageClient, "document.querySelector('[data-shop-preview]')?.textContent.includes('404')", "wrong page path preview");
    await evaluate(pageClient, "document.querySelector('[data-shop-check]').click()");
    await waitFor(pageClient, "Boolean(document.querySelector('[data-shop-feedback]')) && !document.querySelector('[data-shop-complete]')", "specific wrong-answer feedback without completion");
    await evaluate(pageClient, `document.querySelector('[data-shop-choice="1"]').click()`);
    await evaluate(pageClient, "document.querySelector('[data-shop-check]').click()");
    await waitFor(pageClient, "document.querySelector('[data-shop-complete]')?.disabled === true", "reflection before mission completion");
    await evaluate(pageClient, `(() => { const input = document.querySelector('[data-shop-reflection]'); Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(input, 'Le dossier donne la route et page.tsx affiche la page.'); input.dispatchEvent(new Event('input', { bubbles: true })); })()`);
    await waitFor(pageClient, "document.querySelector('[data-shop-complete]')?.disabled === false", "reflection entered");
    await evaluate(pageClient, "document.querySelector('[data-shop-complete]').click()");
    await waitFor(pageClient, "document.querySelector('[data-workshop-score]')?.textContent.startsWith('1/5')", "one mission counted once");
    await evaluate(pageClient, "document.querySelector('[data-shop-mission=state]').click()");
    await evaluate(pageClient, `document.querySelector('[data-shop-choice="1"]').click()`);
    await evaluate(pageClient, "document.querySelector('[data-shop-cart]').click(); document.querySelector('[data-shop-cart]').click(); document.querySelector('[data-shop-cart]').click()");
    await waitFor(pageClient, "document.querySelector('[data-shop-count]')?.textContent.trim().endsWith('1')", "constant state stays at one");
    await evaluate(pageClient, `document.querySelector('[data-shop-choice="0"]').click()`);
    await evaluate(pageClient, "document.querySelector('[data-shop-cart]').click(); document.querySelector('[data-shop-cart]').click(); document.querySelector('[data-shop-cart]').click()");
    await waitFor(pageClient, "document.querySelector('[data-shop-count]')?.textContent.trim().endsWith('3')", "functional state update adds all three clicks");

    await waitFor(pageClient, "Boolean(document.querySelector('[role=progressbar]'))", "guided lesson progress");
    await waitFor(pageClient, "[...document.querySelectorAll('button')].some(button => button.textContent.trim().startsWith('Continuer') && !button.disabled)", "guided lesson controls ready");
    await evaluate(pageClient, `([...document.querySelectorAll('button')].find(button => button.textContent.trim().startsWith('Continuer'))).click()`);
    await waitFor(pageClient, "document.querySelector('[role=progressbar]')?.getAttribute('aria-valuenow') === '2'", "guided lesson advance");
    const previousPageTime = await evaluate(pageClient, "performance.timeOrigin");
    await pageClient.send("Page.reload");
    await waitFor(pageClient, `performance.timeOrigin !== ${previousPageTime}`, "new page after reload");
    await waitFor(pageClient, "document.querySelector('[role=progressbar]')?.getAttribute('aria-valuenow') === '2'", "saved guided step after reload");
    await waitFor(pageClient, "document.querySelector('[data-workshop-score]')?.textContent.startsWith('1/5') && document.querySelector('[data-shop-mission=link]')?.getAttribute('aria-current') === 'step'", "workshop progress and next mission after reload");
    await evaluate(pageClient, `document.querySelector('[data-reading-mode=full]').click()`);
    await waitFor(pageClient, "Boolean(document.querySelector('[data-lesson-id]'))", "full lesson reading mode");

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
    assert(desktop.title === directLesson.title && desktop.moduleId === module.id && desktop.lessonId === module.lessonIds[0], "The hash opened the wrong lesson: " + JSON.stringify({ title: desktop.title, moduleId: desktop.moduleId, lessonId: desktop.lessonId }));
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
      const details = reader.querySelector('[data-lesson-id] details');
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
      return { toc: visible(reader.querySelector('[data-lesson-id] details')), selects: [...reader.querySelectorAll('select')].filter(visible).length, overflow: document.documentElement.scrollWidth - innerWidth };
    })()`);
    assert(tablet.toc && tablet.selects >= 2 && tablet.overflow <= 2, "Tablet Academy navigation or layout is invalid.");

    await setViewport(pageClient, 1440, 1000);
    const finalDesktop = await evaluate(pageClient, `(() => {
      const reader = document.querySelector('#academy-reader-top');
      const visible = node => Boolean(node && node.getClientRects().length);
      return { asides: [...reader.querySelectorAll('aside')].filter(visible).length, mobileToc: visible(reader.querySelector('[data-lesson-id] details')), overflow: document.documentElement.scrollWidth - innerWidth };
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
        courseHeaderOffset: getComputedStyle(courseHeader).top,
        adminPadding: getComputedStyle(adminMain).paddingTop,
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

    await evaluate(pageClient, `(() => {
      const select = document.querySelector('#course-section-select');
      Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(select, 'game');
      select.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    })()`);
    await waitFor(pageClient, `!!document.querySelector('#code-coach-game [data-code-game-action="advance"]')`, "Code Game demonstration");
    assert(await evaluate(pageClient, `document.querySelector('#code-coach-game')?.dataset.codeGameLevels === '100'`), "Code Game did not load the current 100-level bundle.");
    await evaluate(pageClient, `document.querySelector('#code-coach-game [data-code-game-action="advance"]').click()`);
    await waitFor(pageClient, `document.querySelector('#code-coach-game [data-code-game-action="advance"]')?.previousElementSibling?.disabled === true`, "Code Game completed demonstration");
    assert(await evaluate(pageClient, `document.querySelectorAll('#code-coach-game [data-code-demo-line]').length >= 12`), "Code Game lessons must expose at least 12 guided lines.");
    await evaluate(pageClient, `document.querySelector('[data-code-demo-line="0"]').click()`);
    await waitFor(pageClient, `document.querySelector('[data-code-demo-line="0"]')?.getAttribute('aria-pressed') === 'true'`, "clickable line-by-line bot explanation");
    await evaluate(pageClient, `document.querySelector('[data-code-game-view="preview"]').click()`);
    await waitFor(pageClient, `!!document.querySelector('[data-code-game-preview]')`, "Code Game visual result preview");
    await evaluate(pageClient, `document.querySelector('[data-code-game-view="meaning"]').click()`);
    await waitFor(pageClient, `document.querySelector('[data-code-game-view="meaning"]')?.getAttribute('aria-pressed') === 'true'`, "Code Game meaning question");
    await evaluate(pageClient, `document.querySelector('#code-coach-game [data-code-game-action="advance"]').click()`);
    await waitFor(pageClient, `!!document.querySelector('#code-game-editor')`, "Code Game practice editor");
    await evaluate(pageClient, `(() => {
      const editor = document.querySelector('#code-game-editor');
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(editor, 'export default function Test(){ return <main><h1>Bonjour</h1><p>Test</p></main> }');
      editor.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    })()`);
    await waitFor(pageClient, `!document.querySelector('[data-code-game-action="check"]')?.disabled`, "enabled Code Game validation");
    await evaluate(pageClient, `document.querySelector('[data-code-game-action="check"]').click()`);
    await waitFor(pageClient, `document.querySelector('[data-code-game-result]')?.dataset.codeGameResult === 'correct'`, "correct Code Game feedback");
    const gameMobile = await evaluate(pageClient, `({ overflow: document.querySelector('#admin-main').scrollWidth - document.querySelector('#admin-main').clientWidth, editorHeight: document.querySelector('#code-game-editor').getBoundingClientRect().height })`);
    assert(gameMobile.overflow <= 2 && gameMobile.editorHeight >= 300, "Code Game is not usable at 390px: " + JSON.stringify(gameMobile));

    const exceptions = pageClient.events.filter(event => event.method === "Runtime.exceptionThrown");
    assert(exceptions.length === 0, "The browser reported an uncaught runtime exception.");
    const storageAudit = await evaluate(pageClient, `({
      current: JSON.stringify(Object.fromEntries(Object.keys(localStorage).filter(key => /academy|course|lesson|progress/i.test(key)).map(key => [key, localStorage.getItem(key)]))),
      writes: window.__academyStorageWrites ?? [],
    })`);
    assert(storageAudit.current === initialCourseStorage && storageAudit.writes.length === 0, "Interactions persisted Academy course or progress state in localStorage.");

    console.log("Academy browser smoke test passed: deep link, language retention, RTL, copy, quiz, hints, solution, Code Game validation, keyboard-ready controls, 390px, tablet, and desktop.");
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
