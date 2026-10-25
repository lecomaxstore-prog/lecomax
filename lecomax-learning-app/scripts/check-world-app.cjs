const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { load } = require('./inspect.cjs');
const root = path.resolve(__dirname, '../dist-world-check');
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
      { ...load('lecomax-learning-app/utils/progress.ts').initial, language: 'en' },
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
    async function login() {
      await page.getByPlaceholder('Your email').fill('test@example.invalid');
      await page.getByPlaceholder('Your password').fill('test-only');
      await page.getByRole('button', { name: 'Sign in', exact: true }).click();
      await page.getByRole('button', { name: 'No, just this session', exact: true }).click();
      await page.getByRole('button', { name: 'World knowledge challenge', exact: true }).waitFor();
    }
    await page.goto(base + '/world');
    await login();
    const frame = page.frameLocator('iframe[title="Interactive Earth globe"]');
    await frame.locator('#country').selectOption('MAR');
    await frame.locator('#open').click();
    await page.getByRole('button', { name: 'Save discovery', exact: true }).click();
    await page.getByRole('button', { name: 'Northern Africa', exact: true }).click();
    await page.getByRole('button', { name: 'Casablanca', exact: true }).click();
    await page.getByText('Not yet · use the explanation and try again', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Rabat', exact: true }).click();
    await page.getByRole('button', { name: 'Journal', exact: true }).click();
    await page
      .getByText('1 bookmarks · 1 explorations with completed checks · 1 missions completed', {
        exact: true,
      })
      .waitFor();
    await page.getByRole('button', { name: 'Compare planets', exact: true }).click();
    await page
      .getByText('The second planet’s diameter is 11.21 times the first.', { exact: true })
      .waitFor();
    await page.getByRole('button', { name: 'Home', exact: true }).click();
    await page
      .frameLocator('iframe')
      .locator('#country option')
      .nth(177)
      .waitFor({ state: 'attached' });
    await page.screenshot({ path: path.resolve(__dirname, '../artifacts/world/app-desktop.png') });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('iframe').scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.resolve(__dirname, '../artifacts/world/app-mobile.png') });
    assert(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
    );
    await page.reload();
    await login();
    await page.getByRole('button', { name: 'Journal', exact: true }).click();
    await page
      .getByText('1 bookmarks · 1 explorations with completed checks · 1 missions completed', {
        exact: true,
      })
      .waitFor();
    await page.getByRole('button', { name: '✓ Morocco', exact: true }).first().click();
    await page.getByRole('button', { name: 'Ask the Discovery AI Tutor', exact: true }).click();
    await page.waitForURL(/\/tutor\?.*world=country/);
    assert.deepEqual(errors, []);
    console.log(
      'PASS: app navigation, map-to-lesson, bookmarks, wrong/correct feedback, mission evidence, planet comparison, mobile overflow, persistence after reload, and Tutor handoff (mock auth only).',
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
