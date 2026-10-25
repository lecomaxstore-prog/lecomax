const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('fs');
const assert = require('node:assert/strict');
async function main() {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('http://localhost:8083');
    await page.waitForTimeout(5000);
    fs.mkdirSync('artifacts/redesign', { recursive: true });
    await page.screenshot({ path: 'artifacts/redesign/home.png' });
    await page.getByText('خطوتك التالية', { exact: true }).waitFor();
    const routes = ['/', '/path', '/project', '/teacher', '/more', '/search', '/settings', '/module/start', '/course/nextjs', '/lesson/start-0', '/file?path=app%2Fpage.tsx', ...['notes', 'bookmarks', 'mistakes', 'flashcards', 'glossary', 'errors', 'statistics'].map(k => '/collection/' + k)];
    // Use a real lesson from the catalog, keeping this audit independent of editorial IDs.
    routes[routes.indexOf('/lesson/start-0')] = '/lesson/' + require('../data/index.json').find(m => m.id === 'start').lessons[0].id;
    for (const route of routes) {
      await page.goto('http://localhost:8083' + route);
      await page.getByText('L’ECOMAX LEARN', { exact: true }).waitFor();
      await page.waitForTimeout(250);
      for (const width of [320, 390, 430, 768]) {
        await page.setViewportSize({ width, height: 844 });
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `Overflow: ${route} at ${width}`);
      }
      await page.setViewportSize({ width: 390, height: 844 });
      await page.screenshot({ path: 'artifacts/redesign/' + (route === '/' ? 'home' : route.split('?')[0].replaceAll('/', '-')) + '.png' });
      console.log('PASS responsive:', route);
    }
    await page.goto('http://localhost:8083/settings');
    await page.getByRole('button', { name: 'داكن', exact: true }).click();
    await page.goto('http://localhost:8083');
    await page.getByText('خطوتك التالية', { exact: true }).waitFor();
    await page.screenshot({ path: 'artifacts/redesign/home-dark.png' });
    const tabs = await page.getByRole('tab').all();
    const labels = await Promise.all(tabs.map(t => t.innerText()));
    console.log('RTL tab order:', labels);
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
}
main().catch(e => { console.error(e); process.exitCode = 1; });
