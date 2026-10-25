const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { load } = require('./inspect.cjs');
const root = path.resolve(__dirname, '../dist-discovery-player-check');
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
      {
        ...load('lecomax-learning-app/utils/progress.ts').initial,
        language: 'ar',
        theme: process.argv.includes('--dark') ? 'dark' : 'light',
      },
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
                sessions: [],
                currentSessionId: 'local-test',
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
    const login = async () => {
      await page.getByPlaceholder('بريدك الإلكتروني').fill('test@example.invalid');
      await page.getByPlaceholder('كلمة مرورك').fill('test-only');
      await click('تسجيل الدخول');
      await click('لا، لهذه الجلسة فقط');
    };

    await page.goto(base + '/discovery?topic=ai');
    await login();
    const j = load('lecomax-learning-app/features/curiosity/journeys.ts');
    const a = load('lecomax-learning-app/features/curiosity/arabic-ai.ts').localizeJourney(
      j.aiJourney,
      'ar',
    );
    await page.getByText('كيف يعمل الذكاء الاصطناعي؟', { exact: true }).waitFor();
    await page.setViewportSize({ width: 390, height: 844 });
    const labels = [
      'عتبة القرار', 'الوزن', 'عدد أمثلة الفئة أ من أصل ١٠٠', 'وحدات التنفيذ المتوازي',
      'تحديثات التحسين', 'درجة الرمز الثاني', 'درجة الحرارة', 'حصة الفئة أ',
    ];
    for (let i = 0; i < a.steps.length; i++) {
      const step = a.steps[i];
      await click('تجربة تفاعلية');
      await click('زيادة ' + labels[i]);
      await click('اختبر معرفتي');
      if (i === 0) {
        await click(step.options[1]);
        await click('تحقّق من الإجابة');
        await page.getByText('حاول مرة أخرى.', { exact: false }).waitFor();
      }
      await click(step.options[step.correct]);
      await click('تحقّق من الإجابة');
      await page.getByText(/^إجابة صحيحة\./).waitFor();
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      if (i < 7) await click('الخطوة التالية');
    }
    await page.getByText('أكملت اختبارات الرحلة', { exact: true }).waitFor();
    await click('شرح مبسّط');
    await page.screenshot({
      path: path.resolve(__dirname, '../artifacts/discovery-arabic-mobile.png'),
      fullPage: true,
    });
    await click('اسأل المعلّم الذكي');
    await page.getByPlaceholder('اكتب سؤالك عن هذه الخطوة').fill('اشرح لي هذا المثال بطريقة أبسط');
    await click('أرسل سؤالي');
    await page.waitForURL(/\/tutor$/);
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('lecomax-school-v1')).tutor.sessions.some(s => s.discoveryId === 'ai' && s.settings.conversationLanguage === 'العربية'));
    await page.goto(base + '/settings');
    await login();
    await page.screenshot({ path: path.resolve(__dirname, '../artifacts/arabic-settings-check.png'), fullPage: true });
    await page.getByText('تذكيرات التعلّم', { exact: true }).waitFor();
    assert(
      await page
        .getByRole('button', { name: 'إرسال إشعار تجريبي بعد ٥ ثوانٍ', exact: true })
        .isDisabled(),
    );
    await click('تذكيرات البرنامج اليومي');
    await page.waitForURL(/\/wellness\/notifications$/);
    assert.deepEqual(errors, []);
    console.log(
      'PASS Arabic: eight lessons, wrong/correct answers, localized controls, 390px layout, Arabic tutor default and web reminder limitations/navigation. Authentication mocked.',
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
