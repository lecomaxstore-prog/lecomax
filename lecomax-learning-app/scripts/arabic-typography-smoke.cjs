// Disposable browser sessions and synthetic API responses; no real account is used.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { initial } = require('./inspect.cjs').load('lecomax-learning-app/utils/progress.ts');
const output = path.resolve(__dirname, '../artifacts/arabic-typography');
const copy = {
  ar: ['تسجيل الدخول', 'لا، لهذه الجلسة فقط', 'تعلّم بالوتيرة التي تناسبك', 'غيّر مسار التعلّم', 'تحدّث مع المعلّم'],
  en: ['Sign in', 'No, just this session', 'Your rhythm. Your route.', 'Change learning journey', 'Open my AI tutor'],
  fr: ['Se connecter', 'Non, cette session seulement', 'Votre rythme, votre chemin', 'Changer de parcours', 'Ouvrir mon professeur IA'],
};
(async () => {
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const results = [];
  try {
    for (const language of ['ar', 'en', 'fr']) for (const theme of ['light', 'dark']) {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      await context.addInitScript(state => {
        if (!localStorage.getItem('lecomax-school-v1')) localStorage.setItem('lecomax-school-v1', JSON.stringify(state));
      }, { ...initial, language, theme });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.route('**/api/learning-mobile/**', route => route.fulfill({ json: route.request().url().endsWith('/auth') ? { challenge: 'test' } : { accessToken: 'test', refreshToken: 'test', expiresAt: Date.now() + 3600000, sessionId: 'test', remembered: false } }));
      await page.goto(process.env.APP_URL || 'http://localhost:8081');
      await page.getByRole('textbox').first().fill('test@example.invalid');
      await page.locator('input[type="password"]').fill('synthetic-test');
      await page.getByRole('button', { name: copy[language][0], exact: true }).click();
      await page.getByRole('button', { name: copy[language][1], exact: true }).click();
      const heading = page.getByText(copy[language][2], { exact: true });
      await heading.waitFor({ timeout: 60000 });
      await page.evaluate(() => document.fonts.ready);
      for (const width of [320, 390, 768, 1280]) {
        await page.setViewportSize({ width, height: 844 });
        await heading.scrollIntoViewIfNeeded();
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${language}/${theme}/${width}: overflow`);
        assert.equal(await page.getByRole('tab').count(), 5);
        const style = await heading.evaluate(el => ({ direction: getComputedStyle(el).direction, family: getComputedStyle(el).fontFamily, width: el.scrollWidth, available: el.clientWidth }));
        assert.equal(style.direction, language === 'ar' ? 'rtl' : 'ltr');
        assert(style.width <= style.available + 1, 'Heading must wrap inside its card');
        if (language === 'ar') {
          assert.match(style.family, /AcademyNotoArabicSemibold/);
          assert(await page.evaluate(() => document.fonts.check('16px AcademyNotoArabic') && document.fonts.check('16px AcademyNotoArabicSemibold')));
        }
        results.push({ language, theme, width, status: 'passed' });
        if (width === 390 || (language === 'ar' && width === 320)) await page.screenshot({ path: path.join(output, `${language}-${theme}-${width}.png`) });
      }
      await page.getByRole('button', { name: copy[language][3], exact: true }).click();
      const journey = page.getByRole('button', { name: { ar: /^رحلة المبتدئ ·/, en: /^Beginner Journey ·/, fr: /^Premiers pas ·/ }[language] });
      await journey.waitFor({ state: 'visible' });
      await page.getByRole('button', { name: copy[language][3], exact: true }).click();
      await journey.waitFor({ state: 'detached' });
      await page.getByRole('button', { name: copy[language][4], exact: true }).click();
      await page.waitForURL('**/tutor?**');
      assert.deepEqual(errors, []);
      await context.close();
    }
    fs.writeFileSync(path.join(output, 'checks.json'), JSON.stringify({ checkedAt: new Date().toISOString(), results, limitations: ['Synthetic authentication only.', 'No physical Android/iOS device testing or production deployment.'] }, null, 2));
    console.log('PASS: 24 viewport/language/theme checks, loaded Arabic fonts, RTL/LTR, journey expansion and tutor navigation.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
