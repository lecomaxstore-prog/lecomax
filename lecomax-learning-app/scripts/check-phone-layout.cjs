const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const results = [];
  try {
    for (const viewport of [{ width: 360, height: 490 }, { width: 780, height: 230 }]) {
      for (const remote of [{ width: 432, height: 960 }, { width: 960, height: 432 }]) {
        const page = await browser.newPage({ viewport });
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.addInitScript(() => { window.ReactNativeWebView = { postMessage() {} }; });
        await page.route('http://100.80.1.2:8092/**', async route => {
          const pathname = new URL(route.request().url()).pathname;
          const files = { '/': ['direct.html', 'text/html'], '/direct.js': ['direct.js', 'text/javascript'], '/viewer.css': ['viewer.css', 'text/css'] };
          if (files[pathname]) {
            const [file, contentType] = files[pathname];
            return route.fulfill({ contentType, body: fs.readFileSync(path.join(root, 'phone-relay', file)) });
          }
          if (pathname === '/status') return route.fulfill({ json: { approved: true } });
          if (pathname === '/frame') return route.fulfill({ contentType: 'image/svg+xml', body: `<svg xmlns="http://www.w3.org/2000/svg" width="${remote.width}" height="${remote.height}"><rect width="100%" height="100%" fill="#244c40"/><text x="24" y="70" fill="white" font-size="26">Test phone screen</text><rect x="24" y="100" width="180" height="90" rx="12" fill="#77c7a5"/></svg>` });
          return route.fulfill({ json: {} });
        });
        await page.goto('http://100.80.1.2:8092/');
        await page.evaluate(() => {
          window.lecomaxConfigure({ language: 'ar', navigation: { back: 'رجوع', home: 'الرئيسية', recents: 'التطبيقات الأخيرة' }, messages: { 'Connected · Tap or swipe to control': 'متصل · المس أو اسحب للتحكم' } });
          window.lecomaxRestoreSession('a'.repeat(32));
        });
        await page.waitForFunction(() => document.querySelector('#screen').naturalWidth > 0);
        const layout = await page.evaluate(() => {
          const rect = id => { const r = document.querySelector(id).getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, bottom: r.bottom }; };
          return { image: rect('#screen'), stage: rect('.screen-stage'), nav: rect('nav'), overflow: document.querySelector('main').scrollHeight > innerHeight + 1 };
        });
        assert.equal(layout.overflow, false);
        assert.ok(layout.image.width > 40 && layout.image.height > 100);
        assert.ok(Math.abs(layout.image.width / layout.image.height - remote.width / remote.height) < 0.01);
        for (const item of [layout.image, layout.nav]) {
          assert.ok(item.x >= 0 && item.y >= 0 && item.right <= viewport.width + 1 && item.bottom <= viewport.height + 1, JSON.stringify(layout));
        }
        assert.deepEqual(errors, []);
        const name = `${viewport.width}x${viewport.height}-remote-${remote.width}x${remote.height}`;
        fs.mkdirSync(path.join(root, 'artifacts/phone-responsive'), { recursive: true });
        await page.screenshot({ path: path.join(root, `artifacts/phone-responsive/${name}.png`) });
        results.push({ name, ...layout });
        await page.close();
      }
    }
    fs.writeFileSync(path.join(root, 'artifacts/phone-responsive/layout-checks.json'), JSON.stringify({ checkedAt: new Date().toISOString(), fixture: 'Synthetic remote frames; no real device connected', results }, null, 2));
    console.log(`${results.length} portrait/landscape combinations passed with Arabic controls and no clipping.`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
