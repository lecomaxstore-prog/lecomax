// Disposable profiles and synthetic progress; no production credentials or API calls.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { load } = require('./inspect.cjs');
const { initial } = load('lecomax-learning-app/utils/progress.ts');
const routes = ['/', '/path', '/project', '/teacher', '/more', '/search', '/settings', '/course/python', '/module/start', '/lesson/start-web', '/file?path=app/page.tsx', ...['bookmarks', 'notes', 'mistakes', 'difficult', 'flashcards', 'glossary', 'errors', 'statistics'].map(k => '/collection/' + k)];
async function main() {
  fs.mkdirSync('artifacts/redesign', { recursive: true });
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const results = [];
  try {
    for (const language of ['ar', 'en']) {
      for (const theme of ['light', 'dark']) {
        const context = await browser.newContext();
        await context.addInitScript(state => localStorage.setItem('lecomax-school-v1', JSON.stringify(state)), { ...initial, language, theme });
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', e => errors.push(e.message));
        for (const route of routes) {
          await page.goto('http://localhost:8083' + route);
          await page.getByRole('heading').first().waitFor();
          await page.evaluate(() => document.fonts.ready);
          for (const width of [320, 390, 768]) {
            await page.setViewportSize({ width, height: 844 });
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${language}/${theme}/${route}/${width}: overflow`);
            if (route === '/') {
              const tabs = page.getByRole('tab');
              assert.equal(await tabs.count(), 5);
              const first = await tabs.first().boundingBox(), last = await tabs.last().boundingBox();
              assert(first && last && (language === 'ar' ? first.x > last.x : first.x < last.x), 'Tab direction');
              assert(first.height >= 44 && first.width >= 44, 'Tab touch target');
            }
            if (width === 390 || (route === '/teacher' && width === 320)) {
              await page.screenshot({ path: `artifacts/redesign/${language}-${theme}-${route.replace(/[^a-z0-9]/gi, '_') || 'home'}-${width}.png` });
            }
            results.push({ language, theme, route, width });
          }
        }
        assert.deepEqual(errors, []);
        await context.close();
      }
    }
    fs.writeFileSync('artifacts/redesign/checks.json', JSON.stringify(results, null, 2));
    console.log(`PASS: ${results.length} route/locale/theme/viewport checks, RTL tab order, accessible touch targets, no page errors.`);
  } finally { await browser.close(); }
}
main().catch(e => { console.error(e); process.exitCode = 1; });
