const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  try {
    const page = await browser.newPage({ viewport: { width: 1000, height: 500 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.setContent(require('../data/world-runtime.json'));
    await page.evaluate(() => {
      window.received = [];
      window.addEventListener('message', (e) => window.received.push(e.data));
    });
    await page.selectOption('#country', 'MAR');
    await page.click('#open');
    await page.waitForFunction(() =>
      window.received.some((m) => m.channel === 'world' && m.id === 'MAR'),
    );
    assert.match(await page.locator('#status').innerText(), /Morocco/);
    assert.equal(await page.locator('#country option').count(), 178);
    await page.click('#in');
    await page.click('#out');
    fs.mkdirSync(path.resolve(__dirname, '../artifacts/world'), { recursive: true });
    await page.screenshot({
      path: path.resolve(__dirname, '../artifacts/world/globe-desktop.png'),
    });
    await page.click('#mode');
    assert.equal(await page.locator('#in').isDisabled(), true);
    // 2D map selection at Morocco's geographical position.
    const box = await page.locator('#view').boundingBox();
    await page.mouse.click(
      box.x + box.width * ((-7 + 180) / 360),
      box.y + box.height * ((90 - 32) / 180),
    );
    assert.match(await page.locator('#status').innerText(), /Morocco/);
    await page.setViewportSize({ width: 390, height: 600 });
    await page.screenshot({ path: path.resolve(__dirname, '../artifacts/world/map-mobile.png') });
    await page.click('#label');
    await page.click('#layer');
    await page.click('#reset');
    assert.equal(await page.locator('#country').inputValue(), '');
    assert.deepEqual(errors, []);
    const fallback = await browser.newPage();
    await fallback.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (kind, ...args) {
        return kind.startsWith('webgl') ? null : original.call(this, kind, ...args);
      };
    });
    await fallback.goto('about:blank');
    await fallback.setContent(require('../data/world-runtime.json'));
    await fallback.selectOption('#country', 'BRA');
    await fallback.click('#open');
    assert.match(await fallback.locator('#status').innerText(), /Brazil/);
    assert.equal(await fallback.locator('#in').isDisabled(), true);
    console.log(
      'PASS: 3D selection, zoom, 2D hit-test, mobile layout, labels/borders/reset, and forced WebGL fallback.',
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
