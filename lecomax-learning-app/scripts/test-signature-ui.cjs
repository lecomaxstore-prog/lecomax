// UI regression with fixture authentication; never touches a learner's saved browser data.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { load } = require('./inspect.cjs');
const root = path.resolve(__dirname, process.env.SIGNATURE_EXPORT || '../dist-signature-check');
const out = path.resolve(__dirname, '../artifacts/signature');
fs.mkdirSync(out, { recursive: true });
const initial = load('lecomax-learning-app/utils/progress.ts').initial;
const server = http.createServer((req, res) => {
  const target = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
  if (!target.startsWith(root + path.sep) && target !== root) return res.writeHead(403).end();
  const file = fs.existsSync(target) && fs.statSync(target).isFile() ? target : path.join(root, 'index.html');
  res.setHeader('Content-Type', ({ '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.ttf': 'font/ttf', '.png': 'image/png' })[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const checks = [], errors = [];
  const routes = ['/', '/explore', '/teacher', '/practice', '/account', '/onboarding', '/course/academy-foundations', '/lesson/academy-computer?course=academy-foundations', '/path', '/my-learning', '/settings', '/search', '/interactive-studio', '/interactive-studio?tool=cards', '/interactive-studio?tool=quiz', '/wellness/notifications', '/collection/notes', '/collection/bookmarks', '/collection/mistakes', '/collection/statistics', '/speaking', '/practice-lab', '/learning-path/html-css', '/learning-path/missing'];
  try {
    for (const language of (process.env.UI_LANG ? [process.env.UI_LANG] : ['en', 'fr', 'ar'])) for (const theme of ['light', 'dark']) {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
      await context.addInitScript(s => { if (window === window.top && !localStorage.getItem('lecomax-school-v1')) localStorage.setItem('lecomax-school-v1', JSON.stringify(s)); }, { ...initial, language, theme });
      await context.route('**/api/learning-mobile/**', route => route.fulfill({ json: route.request().url().endsWith('/auth') ? { challenge: 'fixture' } : route.request().url().includes('/sessions') ? { sessions: [], currentSessionId: 'fixture' } : { accessToken: 'fixture', refreshToken: 'fixture', expiresAt: Date.now() + 3600000, sessionId: 'fixture', remembered: false } }));
      const page = await context.newPage(); page.setDefaultTimeout(15000);
      page.on('pageerror', error => errors.push(`${language}/${theme}: ${error.message}`));
      page.on('console', message => { if (message.type() === 'error') { errors.push(message.text()); console.error('BROWSER', message.text()); } });
      const labels = { en: ['Sign in', 'No, just this session'], fr: ['Se connecter', 'Non, cette session seulement'], ar: ['تسجيل الدخول', 'لا، لهذه الجلسة فقط'] }[language];
      async function open(route) {
        await page.goto(origin + route);
        await page.locator('input[type="email"]').fill('fixture@example.test');
        await page.locator('input[type="password"]').fill('fixture');
        await page.getByRole('button', { name: labels[0], exact: true }).click();
        await page.getByRole('button', { name: labels[1], exact: true }).click();
        await page.locator('input[type="password"]').waitFor({ state: 'hidden' });
        await page.getByRole('heading').first().waitFor().catch(async error => { console.error(language, theme, route, errors, (await page.locator('body').innerText()).slice(0,1500)); throw error; });
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(900);
      }
      for (const [i, route] of routes.entries()) {
        if (process.env.UI_ROUTE && process.env.UI_ROUTE !== route) continue;
        await open(route);
        assert(!await page.getByText('Unmatched Route', { exact: true }).count(), route);
        for (const width of i === 0 ? [320, 390, 768, 1280] : [320, 390]) {
          await page.setViewportSize({ width, height: 844 });
          await page.waitForTimeout(200);
          assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), `${language}/${theme} ${route} at ${width}`);
          if (i === 0 || ['en', 'ar'].includes(language)) await page.screenshot({ path: path.join(out, `${language}-${theme}-${i}-${width}.png`) });
          if (i === 0 && width === 1280) await page.screenshot({ path: path.join(out, `${language}-${theme}-home-full.png`), fullPage: true });
        }
        checks.push(`${language}/${theme}: ${route}`);
        await page.setViewportSize({ width: 390, height: 844 });
      }
      await open('/');
      const tabs = page.getByRole('tablist').getByRole('tab'); assert.equal(await tabs.count(), 5);
      for (let i = 0; i < 5; i++) { await tabs.nth(i).click(); await page.waitForFunction(index => document.querySelectorAll('[role="tablist"] [role="tab"]')[index]?.getAttribute('aria-selected') === 'true', i); await page.getByRole('heading').first().waitFor(); }
      checks.push(`${language}/${theme}: all five tabs navigate and update selected state`);
      if (language === 'en' || language === 'ar') {
        await open('/explore');
        const planLabel = language === 'en' ? 'A plan for your own goal' : 'مسار يناسب هدفك';
        const goalLabel = language === 'en' ? 'Describe your learning goal…' : 'اكتب هدفك التعليمي…';
        assert.equal(await page.getByPlaceholder(goalLabel).count(), 0);
        await page.getByRole('button', { name: planLabel, exact: true }).click();
        await page.getByPlaceholder(goalLabel).fill('Learn how websites work');
        await page.getByRole('button', { name: language === 'en' ? 'Close learning goal' : 'أغلق هدفي التعليمي', exact: true }).click();
        await page.getByRole('button', { name: planLabel, exact: true }).click();
        assert.equal(await page.getByPlaceholder(goalLabel).inputValue(), 'Learn how websites work');
        let pendingTeacher;
        await page.route('**/api/learning-mobile/teacher', route => { pendingTeacher = route; });
        await open('/teacher');
        const composer = page.getByLabel(language === 'en' ? 'Message to teacher' : 'رسالة إلى الأستاذ', { exact: true });
        await composer.fill(language === 'en' ? 'Explain how a website works' : 'اشرح كيف يعمل الموقع');
        await page.setViewportSize({ width: 390, height: 500 });
        await composer.focus();
        const box = await composer.boundingBox(); assert(box && box.y >= 0 && box.y + box.height <= 500);
        await page.screenshot({ path: path.join(out, `${language}-${theme}-teacher-focused-short.png`) });
        await page.setViewportSize({ width: 390, height: 844 });
        await page.getByRole('button', { name: language === 'en' ? 'Send' : 'أرسل', exact: true }).click();
        await page.getByText(language === 'en' ? 'Preparing your explanation…' : 'يشرح لك الآن…', { exact: true }).waitFor();
        await page.screenshot({ path: path.join(out, `${language}-${theme}-teacher-loading.png`) });
        assert(pendingTeacher);
        const answer = language === 'en' ? 'A browser requests a page from a server. The browser then displays the response.' : 'يطلب المتصفح صفحة من الخادم، ثم يعرض المحتوى الذي يستقبله.';
        await pendingTeacher.fulfill({ json: { answer, model: 'visual-fixture' } });
        await page.getByText(answer, { exact: true }).waitFor();
        await page.screenshot({ path: path.join(out, `${language}-${theme}-teacher-populated.png`) });
        await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('lecomax-school-v1')); s.academy.profile.name = 'Visual QA'; s.academy.profile.goal = 'Learn how websites work'; s.academy.profile.onboarded = true; s.lastLesson = 'academy-computer'; s.completed = ['academy-computer']; s.academy.enrolled = ['academy-foundations']; localStorage.setItem('lecomax-school-v1', JSON.stringify(s)); });
        await open('/');
        assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('lecomax-school-v1')).academy.profile.name), 'Visual QA');
        await page.screenshot({ path: path.join(out, `${language}-${theme}-home-populated.png`) });
        await open('/account');
        await page.getByRole('heading', { name: 'Visual QA', exact: true }).waitFor();
        await page.screenshot({ path: path.join(out, `${language}-${theme}-profile-populated.png`) });
        checks.push(`${language}/${theme}: goal disclosure retains input; teacher loading, reply, short viewport focus and populated learner screens`);
      }
      if (language === 'en' && theme === 'light') {
        await open('/collection/notes');
        await page.getByRole('button', { name: 'Explore courses', exact: true }).click();
        await page.waitForURL('**/explore');
        await open('/collection/mistakes');
        await page.getByRole('button', { name: 'Try a practice challenge', exact: true }).click();
        await page.waitForURL('**/practice-lab');
        await open('/learning-path/missing');
        await page.getByRole('button', { name: 'Explore learning paths', exact: true }).click();
        await page.waitForURL('**/path');
        const { curriculum } = load('lecomax-learning-app/data/university/curriculum.ts');
        const { pathLessons } = load('lecomax-learning-app/services/curriculum.ts');
        const completed = pathLessons(curriculum.find(p => p.id === 'html-css')).map(l => l.id);
        assert(completed.length > 0);
        await page.evaluate(ids => { const state = JSON.parse(localStorage.getItem('lecomax-school-v1')); state.completed = ids; localStorage.setItem('lecomax-school-v1', JSON.stringify(state)); }, completed);
        await open('/learning-path/html-css');
        await page.getByText('A milestone worth celebrating', { exact: true }).waitFor();
        await page.screenshot({ path: path.join(out, 'completed-path.png') });
        await page.getByRole('button', { name: 'Choose my next topic', exact: true }).click();
        await page.waitForURL('**/path');
        checks.push('Empty collections and missing path recover; completed published path offers next topic');
      }
      if (language === 'ar') assert(await page.evaluate(() => document.fonts.check('16px AcademyArabic')), 'Arabic font loaded');
      await context.close();
      console.log(`${language}/${theme}: routes, layouts and tabs passed`);
    }
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(out, 'ui-results.json'), JSON.stringify({ at: new Date().toISOString(), checks, errors, limits: 'Headless Edge; fixture authentication; browser viewport emulation, not physical devices. No paid provider calls.' }, null, 2));
  } finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
