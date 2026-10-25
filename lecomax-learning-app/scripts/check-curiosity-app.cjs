const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { load } = require('./inspect.cjs');
const root = path.resolve(__dirname, '../dist-curiosity-check');
const mime = {
  '.js': 'application/javascript',
  '.html': 'text/html',
  '.json': 'application/json',
  '.ttf': 'font/ttf',
  '.png': 'image/png',
};
const server = http.createServer((req, res) => {
  const relative = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  let file = path.resolve(root, '.' + relative);
  if (!file.startsWith(root + path.sep)) {
    res.writeHead(403).end();
    return;
  }
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(root, 'index.html');
  res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});
(async () => {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.addInitScript(
      (p) => {
        if (window.top !== window) return;
        if (!localStorage.getItem('lecomax-school-v1'))
          localStorage.setItem('lecomax-school-v1', JSON.stringify(p));
      },
      { ...load('lecomax-learning-app/utils/progress.ts').initial, language: 'en', theme: process.argv.includes('--dark') ? 'dark' : 'light' },
    );
    // Test-only transport stubs; no real credentials or cloud writes.
    await page.route('**/api/learning-mobile/**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(
          route.request().url().endsWith('/auth')
            ? { challenge: 'test-only' }
            : {
                accessToken: 'local-test',
                refreshToken: 'local-test',
                expiresAt: Date.now() + 3600000,
                sessionId: 'local-test',
                remembered: false,
              },
        ),
      }),
    );
    const base = 'http://127.0.0.1:' + server.address().port;

    const click = async (name) => page.getByRole('button', { name, exact: true }).first().click();
    await page.goto(base + '/curiosity');
    await page.getByPlaceholder('Your email').fill('test@example.invalid');
    await page.getByPlaceholder('Your password').fill('test-only');
    await click('Sign in');
    await click('No, just this session');
    await page.getByText('Discover something amazing.', { exact: true }).waitFor();
    await page.screenshot({
      path: path.resolve(__dirname, '../artifacts/curiosity-desktop' + (process.argv.includes('--dark') ? '-dark' : '') + '.png'),
      fullPage: false,
    });
    await click('How Is It Made?');
    await click('Explore \u00b7 How does AI learn?');
    await click('Save discovery');
    await click('How it actually works');
    await click('3. Compute predictions');
    await page.getByText(/A neural network transforms inputs/).waitFor();
    await click('Output rises by 2');
    await click('Test: increase weight');
    await page.getByText(/Each weight increase of 1 adds 2/).waitFor();
    await click('Only its training score');
    await click('Check my reasoning');
    await page.getByText(/Not yet. Held-out examples/).waitFor();
    await click('Performance on held-out examples');
    await click('Check my reasoning');
    await page.getByText(/Correct. Held-out examples/).waitFor();
    await page.getByPlaceholder('Collection name').fill('My science');
    await click('Add discovery to collection');
    await click('Journal');
    await page.getByText('My science', { exact: true }).waitFor();
    await page.waitForFunction(() => {
      const p = JSON.parse(localStorage.getItem('lecomax-school-v1'));
      return JSON.parse(p.drafts['curiosity:v1']).collections['My science']?.includes('ai');
    });
    await page.reload();
    await page.getByPlaceholder('Your email').waitFor();
    if (await page.getByPlaceholder('Your email').isVisible()) {
      await page.getByPlaceholder('Your email').fill('test@example.invalid');
      await page.getByPlaceholder('Your password').fill('test-only');
      await click('Sign in');
      await click('No, just this session');
    }
    await page.getByText('Discover something amazing.', { exact: true }).waitFor();
    await click('Journal');
    await page.getByText('My science', { exact: true }).waitFor();
    await click('Map');
    await click('\u2713 How does AI learn?');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({
      path: path.resolve(__dirname, '../artifacts/curiosity-mobile' + (process.argv.includes('--dark') ? '-dark' : '') + '.png'),
      fullPage: false,
    });
    assert(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
      'mobile overflow',
    );
    await click('Explain it like I\u2019m 10.');
    await page.waitForURL(/\/tutor$/);
    await page.waitForFunction(() =>
      JSON.parse(localStorage.getItem('lecomax-school-v1')).tutor.sessions.some(
        (s) => s.discoveryId === 'ai',
      ),
    );
    assert.deepEqual(errors, []);
    console.log(
      'PASS: discovery modes, AI journey nodes, weight experiment, wrong/correct feedback, bookmarks, collections, persisted reload, knowledge map, mobile overflow and contextual Tutor handoff. Mock authentication; no real AI request.',
    );
  } finally {
    await browser.close();
    server.close();
  }
})().catch((e) => {
  console.error(e);
  server.close();
  process.exitCode = 1;
});
