const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { load } = require('./inspect.cjs');
const out = path.resolve(__dirname, '../artifacts/production');
const initial = load('lecomax-learning-app/utils/progress.ts').initial;
async function serve(folder) {
  const root = path.resolve(__dirname, folder), requested = new Set();
  const server = http.createServer((req, res) => {
    const target = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
    if (target !== root && !target.startsWith(root + path.sep)) return res.writeHead(403).end();
    const file = fs.existsSync(target) && fs.statSync(target).isFile() ? target : path.join(root, 'index.html');
    requested.add(file);
    res.setHeader('Content-Type', ({ '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.ttf': 'font/ttf', '.png': 'image/png' })[path.extname(file)] || 'application/octet-stream');
    fs.createReadStream(file).pipe(res);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return { origin: `http://127.0.0.1:${server.address().port}`, requested, close: () => new Promise(resolve => server.close(resolve)) };
}
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const measurements = [], checks = [];
  try {
    for (const [label, folder] of [['before', '../dist-interactive-check'], ['after', '../dist-production-check']]) {
      const server = await serve(folder);
      try {
        for (let run = 0; run < 3; run++) {
          server.requested.clear();
          const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
          await context.addInitScript(s => { if (window === window.top) localStorage.setItem('lecomax-school-v1', JSON.stringify(s)); }, { ...initial, language: 'en' });
          const page = await context.newPage(); const start = performance.now();
          await page.goto(server.origin); await page.getByRole('button', { name: 'Sign in', exact: true }).waitFor();
          const elapsedMs = Math.round(performance.now() - start);
          const scripts = [...server.requested].filter(file => file.endsWith('.js')).map(file => ({ name: path.basename(file), bytes: fs.statSync(file).size }));
          measurements.push({ label, run: run + 1, elapsedMs, javascriptBytes: scripts.reduce((sum, file) => sum + file.bytes, 0), scripts });
          await context.close();
        }
      } finally { await server.close(); }
    }
    const server = await serve('../dist-production-check');
    try {
      for (const language of ['en', 'fr', 'ar']) {
        const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
        await context.addInitScript(s => { if (window === window.top && !localStorage.getItem('lecomax-school-v1')) localStorage.setItem('lecomax-school-v1', JSON.stringify(s)); }, { ...initial, language, theme: language === 'fr' ? 'dark' : 'light' });
        await context.route('**/api/learning-mobile/**', route => route.fulfill({ json: route.request().url().endsWith('/auth') ? { challenge: 'fixture' } : { accessToken: 'fixture', expiresAt: Date.now() + 3600000, sessionId: 'fixture', remembered: false } }));
        const page = await context.newPage(); page.setDefaultTimeout(20000); const errors = []; page.on('pageerror', e => errors.push(e.message));
        await page.goto(server.origin + '/interactive-studio');
        const labels = { en: ['Your email', 'Your password', 'Sign in', 'No, just this session'], fr: ['Votre email', 'Votre mot de passe', 'Se connecter', 'Non, cette session seulement'], ar: ['بريدك الإلكتروني', 'كلمة مرورك', 'تسجيل الدخول', 'لا، لهذه الجلسة فقط'] }[language];
        // Input semantics are stable across all translated labels.
        await page.locator('input[type="email"]').fill('fixture@example.test');
        await page.locator('input[type="password"]').fill('fixture');
        await page.getByRole('button', { name: labels[2], exact: true }).click(); await page.getByRole('button', { name: labels[3], exact: true }).click();
        await page.getByRole('button', { name: 'Open JavaScript Studio', exact: true }).waitFor();
        for (const width of [320, 390, 768, 1280]) {
          await page.setViewportSize({ width, height: 844 });
          assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), `${language} hub ${width}`);
        }
        await page.setViewportSize({ width: 390, height: 844 });
        await page.screenshot({ path: path.join(out, `hub-${language}.png`) });
        await page.getByRole('button', { name: 'Open JavaScript Studio', exact: true }).click();
        const editor = page.locator('.cm-content'); await editor.waitFor();
        assert.equal(await editor.evaluate(el => getComputedStyle(el).direction), 'ltr');
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2));
        await page.screenshot({ path: path.join(out, `editor-${language}.png`) });
        await context.setOffline(true); await editor.fill('console.log(6 * 7);');
        await page.getByRole('button', { name: 'Run code', exact: true }).click();
        await page.getByText('42', { exact: true }).waitFor();
        checks.push(`${language}: 4 hub widths, phone editor LTR, reduced-motion preference, real code execution while offline after loading`);
        assert.deepEqual(errors, []); await context.close();
      }
    } finally { await server.close(); }
    fs.writeFileSync(path.join(out, 'quality-results.json'), JSON.stringify({ at: new Date().toISOString(), measurements, checks, limits: 'Local loopback timing, three cold browser contexts per build; not target-device or network performance. French dark theme; Arabic/English light. Authentication mocked. Offline execution tested after assets loaded, not offline cold start.' }, null, 2));
    console.log(JSON.stringify({ measurements: measurements.map(({ scripts, ...rest }) => rest), checks }, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
