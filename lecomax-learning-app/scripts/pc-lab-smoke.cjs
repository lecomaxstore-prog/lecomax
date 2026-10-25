const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { load } = require('./inspect.cjs');
const { pcExplorerDocument } = load('lecomax-learning-app/utils/pc-explorer-document.ts');
(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const output = path.resolve(__dirname, '../artifacts/pc-lab');
  fs.mkdirSync(output, { recursive: true });
  const results = [];
  try {
    for (const language of ['en', 'fr', 'ar']) for (const viewport of [{ width: 360, height: 740 }, { width: 844, height: 390 }, { width: 1280, height: 900 }]) {
      const page = await browser.newPage({ viewport, hasTouch: true });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.setContent(pcExplorerDocument(language));
      await page.waitForFunction(() => document.querySelectorAll('[data-part]').length === 15);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'no horizontal overflow');
      assert.ok(await page.evaluate(() => faces.length > 500), 'detailed rendered geometry');
      await page.screenshot({ path: path.join(output, `${language}-${viewport.width}-tower.png`), fullPage: true });
      const initial = await page.locator('#pc').evaluate(el => el.toDataURL());
      await page.locator('#right').click();
      assert.notEqual(await page.locator('#pc').evaluate(el => el.toDataURL()), initial, 'rotation changes actual drawing');
      await page.locator('#cover').click();
      assert.equal(await page.locator('#cover').getAttribute('aria-pressed'), 'false');
      await page.locator('#explode').click();
      assert.equal(await page.locator('#cover').getAttribute('aria-pressed'), 'true');
      assert.equal(await page.locator('#explode').getAttribute('aria-pressed'), 'true');
      await page.locator('#zoom-in').click();
      assert.equal(await page.locator('#zoom-label').textContent(), '115%');
      await page.locator('#reset').click();
      assert.equal(await page.locator('#zoom-label').textContent(), '100%');
      await page.locator('#pc').scrollIntoViewIfNeeded();
      const target = await page.evaluate(() => {
        for (const face of [...faces].reverse()) {
          const x = face.points.reduce((s, p) => s + p[0], 0) / face.points.length;
          const y = face.points.reduce((s, p) => s + p[1], 0) / face.points.length;
          const id = pcHit(faces, x, y);
          if (id && id !== 'case' && id !== 'motherboard') return { x, y, id };
        }
      });
      assert.ok(target, 'visible part can be picked');
      await page.locator('#pc').click({ position: { x: target.x, y: target.y } });
      assert.equal(await page.locator('#part-picker').inputValue(), target.id, 'actual canvas hit updates selected component');
      const beforeKey = await page.locator('#pc').evaluate(el => el.toDataURL());
      await page.locator('#pc').press('ArrowLeft');
      assert.notEqual(await page.locator('#pc').evaluate(el => el.toDataURL()), beforeKey, 'keyboard rotates the model');
      const ids = await page.locator('#part-picker option').evaluateAll(options => options.map(el => el.value));
      for (const id of ids) {
        await page.locator('#part-picker').selectOption(id);
        const title = await page.locator('#title').textContent();
        assert.ok(title.length > 2);
        await page.locator('#inspect').click();
        assert.equal(await page.locator('#piece-dialog').evaluate(el => el.open), true);
        assert.equal(await page.locator('#piece-title').textContent(), title);
        assert.ok(await page.locator('#piece-canvas').evaluate((canvas, id) => renderPC(canvas, { only: id, yaw: -.4, pitch: -.3, zoom: 1 }).length > 0, id), `${id} has isolated geometry`);
        const y = await page.evaluate(() => scrollY);
        await page.locator('.dialog-body').evaluate(el => { el.scrollTop = el.scrollHeight; });
        await page.locator('#piece-learned').click();
        assert.equal(await page.locator('#piece-learned').isDisabled(), true);
        await page.keyboard.press('Escape');
        assert.equal(await page.evaluate(() => scrollY), y, 'dialog close keeps position');
        assert.equal(await page.evaluate(() => document.activeElement.id), 'inspect');
      }
      assert.equal(await page.locator('#progress-bar').getAttribute('value'), '15');
      await page.locator('[data-answer=ssd]').click();
      assert.ok((await page.locator('#feedback').textContent()).length > 10);
      await page.evaluate(() => window.dispatchEvent(new MessageEvent('message', { data: JSON.stringify({ type: 'init', ids: ['cpu', 'cpu', 'unknown'] }) })));
      assert.equal(await page.locator('#progress-bar').getAttribute('value'), '1');
      await page.locator('#part-picker').selectOption('gpu');
      await page.locator('#inspect').click();
      await page.screenshot({ path: path.join(output, `${language}-${viewport.width}-part.png`) });
      await page.keyboard.press('Escape');
      assert.deepEqual(errors, []);
      results.push({ language, viewport, partsInspected: ids.length, status: 'passed' });
      await page.close();
    }
    fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify({ checkedAt: new Date().toISOString(), scope: 'Generated PC document in desktop Edge, touch enabled; no physical native device', results }, null, 2));
    console.log(`${results.length} layouts passed; 135 localized component inspections.`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
