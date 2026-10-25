const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { load } = require('./inspect.cjs');
const { initial } = load('lecomax-learning-app/utils/progress.ts');
const { library } = load('lecomax-learning-app/services/course-library.ts');
const { recordCourseLesson, courseGroups } = load('lecomax-learning-app/services/course-learning.ts');
const python = library.find(c => c.id === 'python');
const javascript = library.find(c => c.id === 'javascript');
const foundations = library.find(c => c.id === 'academy-foundations');
const out = path.resolve(__dirname, '../artifacts/organized-courses');
const base = process.env.APP_URL || 'http://localhost:8081';
const labels = {
  ar: ['تسجيل الدخول', 'لا، لهذه الجلسة فقط', 'ابحث عن دورة', 'ابدأ الدرس الأول', 'تابع درسي', 'كل الدورات', 'المكتملة', 'كل التصنيفات'],
  en: ['Sign in', 'No, just this session', 'Search courses', 'Start first lesson', 'Continue my lesson', 'All courses', 'Completed', 'All categories'],
  fr: ['Se connecter', 'Non, cette session seulement', 'Rechercher un cours', 'Commencer la première leçon', 'Continuer ma leçon', 'Tous les cours', 'Terminés', 'Toutes les catégories'],
};
async function login(page, language) {
  await page.getByRole('textbox').first().fill('test@example.invalid');
  await page.locator('input[type="password"]').fill('synthetic-test');
  await page.getByRole('button', { name: labels[language][0], exact: true }).click();
  await page.getByRole('button', { name: labels[language][1], exact: true }).click();
}
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const checks = [];
  try {
    for (const language of ['ar', 'en', 'fr']) for (const returning of [false, true]) {
      let seed = structuredClone(initial);
      seed.language = language;
      seed.theme = returning ? 'dark' : 'light';
      if (returning) {
        seed = recordCourseLesson(seed, javascript.lessons[5].id, javascript.id);
        seed = recordCourseLesson(seed, python.lessons[3].id, python.id);
        seed.stages[python.lessons[3].id] = 2;
        seed.completed = [...foundations.lessons.map(l => l.id), ...python.lessons.slice(0, 3).map(l => l.id)];
        seed.academy.enrolled = ['iptv-live'];
      }
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      await context.addInitScript(state => {
        if (!localStorage.getItem('lecomax-school-v1')) localStorage.setItem('lecomax-school-v1', JSON.stringify(state));
      }, seed);
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      // Test-only responses in an isolated profile; never use a real account or API mutation.
      await page.route('**/api/learning-mobile/**', route => route.fulfill({ json: route.request().url().endsWith('/auth') ? { challenge: 'test' } : { accessToken: 'test', refreshToken: 'test', expiresAt: Date.now() + 3600000, sessionId: 'test', remembered: false } }));
      await page.goto(base + '/discover');
      await login(page, language);
      const search = page.getByPlaceholder(labels[language][2]);
      await search.waitFor({ timeout: 60000 });
      for (const width of [320, 390, 768, 1280]) {
        await page.setViewportSize({ width, height: 844 });
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${language}/${returning}/${width}`);
        checks.push({ language, returning, width, status: 'passed' });
      }
      await page.setViewportSize({ width: 390, height: 844 });
      await page.screenshot({ path: path.join(out, `${language}-${returning ? 'returning' : 'new'}.png`) });
      await page.getByRole('button', { name: new RegExp('^' + labels[language][5] + ' \\(') }).click();
      await search.fill('PYTHON');
      const outline = { ar: 'خطة الدورة', en: 'Course outline', fr: 'Plan du cours' }[language];
      assert.equal(await page.getByRole('button', { name: outline, exact: true }).count(), 1);
      await search.fill('no-such-course-xyz');
      assert.equal(await page.getByRole('button', { name: outline, exact: true }).count(), 0);
      await search.fill('');
      assert.equal(await page.getByRole('button', { name: outline, exact: true }).count(), library.length);
      await page.getByRole('button', { name: labels[language][7], exact: true }).click();
      const langIndex = { fr: 0, en: 1, ar: 2 }[language];
      await page.getByRole('button', { name: courseGroups[2].title[langIndex], exact: true }).click();
      assert.equal(await page.getByRole('button', { name: outline, exact: true }).count(), 3);
      await page.getByRole('button', { name: labels[language][7], exact: true }).click();
      await page.getByRole('button', { name: labels[language][7], exact: true }).first().click();
      const pythonCard = page.getByText(python.title[langIndex], { exact: true }).last().locator('..');
      await pythonCard.getByRole('button', { name: { ar: 'احفظها لوقت لاحق', en: 'Save for later', fr: 'Garder pour plus tard' }[language], exact: true }).click();
      await page.waitForFunction(() => JSON.parse(localStorage.getItem('lecomax-school-v1')).academy.enrolled.includes('python'));
      await pythonCard.getByRole('button', { name: { ar: 'إزالة من خطتي', en: 'Remove from my plan', fr: 'Retirer de mon plan' }[language], exact: true }).click();
      await page.waitForFunction(() => !JSON.parse(localStorage.getItem('lecomax-school-v1')).academy.enrolled.includes('python'));
      if (language === 'ar') {
        await pythonCard.scrollIntoViewIfNeeded();
        await page.screenshot({ path: path.join(out, `ar-${returning ? 'returning' : 'new'}-list.png`) });
      }
      await page.getByRole('button', { name: new RegExp('^' + labels[language][6] + ' \\(') }).click();
      assert.equal(await page.getByRole('button', { name: outline, exact: true }).count(), returning ? 1 : 0);
      await page.getByRole('button', { name: labels[language][returning ? 4 : 3], exact: true }).click();
      await page.waitForURL('**/lesson/**');
      const expected = returning ? python : foundations;
      assert.equal(new URL(page.url()).searchParams.get('course'), expected.id);
      assert(page.url().includes(expected.lessons[returning ? 3 : 0].id));
      if (returning) assert.equal(await page.getByRole('tab', { name: { ar: '3. تدريب', en: '3. Practice', fr: '3. Pratiquer' }[language], exact: true }).getAttribute('aria-selected'), 'true');
      await page.waitForFunction(id => JSON.parse(localStorage.getItem('lecomax-school-v1')).drafts['learning:last-course'] === id, expected.id);
      await page.goto(base + '/courses');
      await login(page, language);
      await page.getByRole('button', { name: labels[language][4], exact: true }).waitFor();
      const persisted = await page.evaluate(() => JSON.parse(localStorage.getItem('lecomax-school-v1')));
      assert.equal(persisted.drafts['learning:course:' + expected.id], expected.lessons[returning ? 3 : 0].id);
      if (returning) {
        assert.equal(persisted.drafts['learning:course:javascript'], javascript.lessons[5].id);
        await page.getByRole('button', { name: new RegExp('^' + labels[language][5] + ' \\(') }).click();
        const title = javascript.title[{ fr: 0, en: 1, ar: 2 }[language]];
        const courseCard = page.getByText(title, { exact: true }).last().locator('..');
        await courseCard.getByRole('button', { name: { ar: 'تابع هذه الدورة', en: 'Continue this course', fr: 'Continuer ce cours' }[language], exact: true }).click();
        await page.waitForURL('**/lesson/**');
        assert.equal(new URL(page.url()).searchParams.get('course'), 'javascript');
        assert(page.url().includes(javascript.lessons[5].id));
      }
      if (language === 'ar') {
        await page.goto(base);
        await login(page, language);
        const resume = page.getByRole('button', { name: labels[language][4], exact: true });
        await resume.scrollIntoViewIfNeeded();
        await page.screenshot({ path: path.join(out, `ar-${returning ? 'returning' : 'new'}-home.png`) });
        await resume.click();
        await page.waitForURL('**/lesson/**');
        assert.equal(new URL(page.url()).searchParams.get('course'), returning ? javascript.id : foundations.id);
      }
      assert.deepEqual(errors, []);
      await context.close();
    }
    fs.writeFileSync(path.join(out, 'checks.json'), JSON.stringify({ checkedAt: new Date().toISOString(), checks, limitations: ['Synthetic authentication.', 'No physical device or production deployment validation.'] }, null, 2));
    console.log('PASS: 24 responsive checks; three languages; fresh and returning learners; search, completion filters, contextual resume, saved stage, reload persistence and switching courses.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
