const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { load } = require('./inspect.cjs');
const { initial } = load('lecomax-learning-app/utils/progress.ts');
(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    // Synthetic auth responses in an isolated browser context; no credentials or API writes.
    await page.route('**/api/**', route => {
      const url = new URL(route.request().url());
      const json = url.pathname.endsWith('/auth') ? { challenge: 'local-test' } : url.pathname.endsWith('/confirm') ? { accessToken: 'local-test', refreshToken: 'local-test', expiresAt: Date.now() + 3600000, sessionId: 'local-test', remembered: false } : {};
      return route.fulfill({ json, headers: { 'access-control-allow-origin': '*' } });
    });
    await page.addInitScript(seed => {
      if (window.top !== window) return;
      if (!localStorage.getItem('lecomax-school-v1')) localStorage.setItem('lecomax-school-v1', JSON.stringify(seed));
    }, { ...initial, language: 'en', drafts: { 'pc-explorer:understood': '["cpu"]', 'phone-explorer:understood': '["battery"]' } });
    async function login() {
      await page.getByPlaceholder('Your email', { exact: true }).fill('test@example.invalid');
      await page.getByPlaceholder('Your password', { exact: true }).fill('local-fixture-only');
      await page.getByRole('button', { name: 'Sign in', exact: true }).click();
      await page.getByRole('button', { name: 'No, just this session', exact: true }).click();
    }
    await page.goto('http://localhost:8081/pc-lab', { timeout: 120000 });
    await login();
    const lab = page.frameLocator('iframe[title="3D PC lab"]');
    await lab.locator('#title').waitFor();
    assert.equal(await lab.locator('#progress-bar').getAttribute('value'), '1');
    await lab.locator('#part-picker').selectOption('ram');
    await lab.locator('#learned').click();
    await page.waitForFunction(() => JSON.parse(JSON.parse(localStorage.getItem('lecomax-school-v1')).drafts['pc-explorer:understood']).includes('ram'));
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('lecomax-school-v1')).drafts['phone-explorer:understood']), '["battery"]');
    await page.reload();
    await login();
    await lab.locator('#title').waitFor();
    assert.equal(await lab.locator('#progress-bar').getAttribute('value'), '2', 'PC progress survives reload and login');
    await page.screenshot({ path: path.resolve(__dirname, '../artifacts/pc-lab/app.png') });
    await lab.locator('[data-teacher=explain]').click();
    await page.waitForURL(/teacher/);
    assert.ok(new URL(page.url()).searchParams.get('question').includes('desktop computer component'));
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.resolve(__dirname, '../artifacts/pc-lab/app-results.json'), JSON.stringify({ checkedAt: new Date().toISOString(), scope: 'Actual local Expo app with synthetic auth and API responses. No live backend or AI response tested.', status: 'passed', checks: ['route renders iframe', 'seeded progress restored', 'PC progress saved across reload', 'phone progress unchanged', 'teacher navigation receives PC lesson'] }, null, 2));
    console.log('Local PC route, saved progress and teacher navigation passed with mocked API.');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
