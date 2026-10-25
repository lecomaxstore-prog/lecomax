const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { load } = require('./inspect.cjs');
const { phoneExplorerDocument } = load('lecomax-learning-app/utils/phone-explorer-document.ts');

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const results = [];
  const output = path.resolve(__dirname, '../artifacts/phone-scroll');
  fs.mkdirSync(output, { recursive: true });
  try {
    for (const language of ['en', 'fr', 'ar']) {
      for (const viewport of [{ width: 360, height: 740 }, { width: 844, height: 390 }, { width: 1280, height: 800 }]) {
        const page = await browser.newPage({ viewport, hasTouch: true });
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.setContent(phoneExplorerDocument(language));
        await page.waitForFunction(() => document.querySelector('#teardown-image').naturalWidth > 0);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'no horizontal page overflow');
        await page.locator('#photo-picker').selectOption('storage');
        await page.locator('#photo-zoom').click();
        const area = page.locator('.photo-viewport');
        const scrolling = await area.evaluate(el => ({ overflow: getComputedStyle(el).overflow, touch: getComputedStyle(el).touchAction }));
        assert.equal(scrolling.overflow, 'auto');
        assert.ok(['manipulation', 'pan-x pan-y pinch-zoom'].includes(scrolling.touch), 'both pan axes and pinch enabled');
        await area.evaluate(el => { el.scrollLeft = 70; el.scrollTop = 120; });
        const before = await area.evaluate(el => [el.scrollLeft, el.scrollTop]);
        await page.setViewportSize({ ...viewport, height: viewport.height + 30 });
        assert.deepEqual(await area.evaluate(el => [el.scrollLeft, el.scrollTop]), before, 'resize preserves user pan');
        await page.locator('#piece-open').click();
        assert.equal(await page.locator('#piece-dialog').evaluate(el => el.open), true);
        const pageY = await page.evaluate(() => scrollY);
        assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).overflow), 'hidden');
        await page.locator('.piece-body').evaluate(el => { el.scrollTop = el.scrollHeight; });
        assert.ok(await page.locator('.piece-body').evaluate(el => el.scrollTop > 0), 'dialog content scrolls');
        const closeBounds = await page.locator('#piece-close').boundingBox();
        assert.ok(closeBounds.y >= 0 && closeBounds.y + closeBounds.height <= viewport.height + 30, 'close remains visible');
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('#piece-dialog').evaluate(el => el.open), false);
        assert.equal(await page.evaluate(() => scrollY), pageY, 'closing preserves page position');
        assert.equal(await page.evaluate(() => document.activeElement.id), 'piece-open');
        await page.locator('#photo-zoom').click();
        assert.equal(await area.evaluate(el => getComputedStyle(el).overflow), 'visible', 'full image has no nested scroll trap');
        await page.screenshot({ path: path.join(output, `${language}-${viewport.width}.png`), fullPage: true });
        assert.deepEqual(errors, []);
        results.push({ language, viewport, status: 'passed' });
        await page.close();
      }
    }
    fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify({ checkedAt: new Date().toISOString(), scope: 'Isolated generated Phone Lab document in desktop Edge with touch enabled; not native device or app integration', results }, null, 2));
    console.log(`${results.length} browser language/viewport combinations passed.`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
