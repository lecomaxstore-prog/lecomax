// Local export, isolated profiles, synthetic authentication. No real account or provider requests.
const { chromium } = require('playwright');
const fs = require('node:fs'), path = require('node:path'), http = require('node:http');
const assert = require('node:assert/strict');
const { load } = require('./inspect.cjs');
const model = load('lecomax-learning-app/features/universe/model.ts');
const { initial } = load('lecomax-learning-app/utils/progress.ts');
const { createCard, emptyFlashcards } = load('lecomax-learning-app/utils/flashcards.ts');
const { library } = load('lecomax-learning-app/services/course-library.ts');
const root = path.resolve(__dirname, '../dist-universe-check');
const server = http.createServer((req, res) => {
  const candidate = path.resolve(root, '.' + new URL(req.url, 'http://localhost').pathname);
  if (candidate !== root && !candidate.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  const file = fs.existsSync(candidate) && fs.statSync(candidate).isFile() ? candidate : path.join(root, 'index.html');
  res.setHeader('Content-Type', ({ '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.ttf': 'font/ttf', '.png': 'image/png' })[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).on('error', () => res.end()).pipe(res);
});
async function main() {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const metrics = [];
  try {
    for (const language of ['en', 'ar', 'fr']) {
      const seed = { ...initial, language, theme: language === 'fr' ? 'dark' : 'light', academy: { ...initial.academy, profile: { ...initial.academy.profile, onboarded: true, name: 'Learner', goal: 'Understand numbers and programming' } }, flashcards: { ...emptyFlashcards(), cards: [createCard('universe-check-card', 'What does + do with two numbers?', 'Adds the two numbers.', '', 1000)] } };
      const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
      await context.addInitScript(state => { if (!localStorage.getItem('lecomax-school-v1')) localStorage.setItem('lecomax-school-v1', JSON.stringify(state)); }, seed);
      const page = await context.newPage(); const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.route('**/*', route => {
        const req = route.request(); if (req.url().startsWith(origin)) return route.continue();
        if (!req.url().includes('/api/learning-mobile/')) return route.abort();
        const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization,content-type', 'access-control-allow-methods': 'POST,GET,OPTIONS' };
        if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
        return route.fulfill({ headers, json: req.url().endsWith('/confirm') ? { accessToken: 'fixture', refreshToken: 'fixture', expiresAt: Date.now() + 3600000, sessionId: 'fixture', remembered: false } : { challenge: 'fixture', sessions: [] } });
      });
      const words = { en: ['Email address', 'Password', 'Sign in', 'No, just this session', 'Continue', 'Choose another game', 'How to check this answer'], fr: ['Adresse e-mail', 'Mot de passe', 'Se connecter', 'Non, cette session seulement', 'Continuer', 'Choisir un autre jeu'], ar: ['البريد الإلكتروني', 'كلمة المرور', 'تسجيل الدخول', 'لا، لهذه الجلسة فقط', 'متابعة', 'اختر لعبة أخرى'] }[language];
      const button = name => page.getByRole('button', { name, exact: true });
      const click = name => button(name).click();
      const login = async () => { await page.getByLabel(words[0], { exact: true }).fill('learner@example.invalid'); await page.getByLabel(words[1], { exact: true }).fill('synthetic-password'); await click(words[2]); await click(words[3]); };
      const go = async route => { const at = Date.now(); await page.goto(origin + route); try { await login(); await page.getByLabel(words[0], { exact: true }).waitFor({ state: 'hidden' }); await page.waitForFunction(() => document.body.innerText.length > 100); await page.waitForTimeout(250); } catch (e) { console.log({ route, errors, body: await page.locator('body').innerText() }); await page.screenshot({ path: 'artifacts/universe-failure.png' }); throw e; } metrics.push({ language, route, navigationAndFixtureLoginMs: Date.now() - at }); };
      const read = () => page.evaluate(() => JSON.parse(localStorage.getItem('lecomax-school-v1')));
      const routes = ['/', '/explore', '/galaxy', '/games', '/growth', '/memory-studio', '/interactive-studio', '/my-learning', `/lesson/${library[0].lessons[0].id}`, '/change-history', '/search', '/tutor', '/settings', '/profile', '/practice-lab', '/project'];
      for (const route of routes) {
        await go(route);
        for (const width of [320, 390, 768, 1280]) {
          await page.setViewportSize({ width, height: 844 });
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `${language} ${route} ${width}: horizontal overflow`);
        }
        await page.setViewportSize({ width: 390, height: 844 });
        await page.screenshot({ path: `artifacts/universe-${language}-${route === '/' ? 'home' : route.split('/').filter(Boolean).join('-')}.png` });
        assert.equal(await page.getByText(/Uncaught|Something went wrong|Element type is invalid|Unable to open this screen/).count(), 0);
      }
      if (language === 'en') {
        await go('/'); await click('Change learning journey');
        await click('Project Journey · Build, observe, explain.');
        await page.waitForFunction(() => JSON.parse(localStorage.getItem('lecomax-school-v1')).drafts['universe:journey'] === 'project');
        await go(`/lesson/${library[0].lessons[0].id}`);
        await click('1 · Practice');
        await page.getByLabel('My deliverable, expected result and verification plan.').fill('Build a small tested example.');
        await page.waitForFunction(() => Object.values(JSON.parse(localStorage.getItem('lecomax-school-v1')).drafts).includes('Build a small tested example.'));
        await go('/games');
        for (const [game, title] of model.games) {
          if (game === 'debug') await click('JavaScript');
          await click(title[1]);
          await page.waitForFunction(() => !!JSON.parse(localStorage.getItem('lecomax-school-v1')).drafts['universe:game']);
          let r = model.readRun((await read()).drafts['universe:game']);
          if (game === 'match') {
            await click('Card 1'); await click('Card 6'); await click('Continue');
            await page.screenshot({path:'artifacts/universe-en-memory-match.png'});
            for (let i = 0; i < 4; i++) { await click(`Card ${i + 1}`); await click(`Card ${i + 5}`); if (i < 3) await click('Continue'); }
            await click('See my score');
          } else {
            for (let i = 0; i < model.challenges(game, r.subject, r.seed).length; i++) {
              r = model.readRun((await read()).drafts['universe:game']);
              const q = model.challenges(game, r.subject, r.seed)[i];
              if (game === 'sequence') { for (const [position, j] of q.order.entries()) { await click(q.options[j][1]); if(i === 0 && position === 0) await go('/games'); } await page.screenshot({path:'artifacts/universe-en-sequence.png'}); await click('Check sequence'); }
              else { if (game === 'explain') await page.getByLabel('My explanation (at least 10 characters)').fill('I count forward by the second number.'); await click(q.options[game === 'detective' && i === 0 ? (q.correct + 1) % q.options.length : q.correct][1]); }
              await click('Continue');
              await page.waitForFunction(index => JSON.parse(JSON.parse(localStorage.getItem('lecomax-school-v1')).drafts['universe:game']).index === index, i + 1);
              if (game === 'quest' && i === 0) { await go('/games'); r = model.readRun((await read()).drafts['universe:game']); assert.equal(r.index, 1); }
            }
          }
          await page.getByText('Challenge complete', { exact: true }).waitFor();
          const result = model.readRun((await read()).drafts['universe:game']);
          assert.equal(result.answers.filter(a => a.correct).length, game === 'detective' ? 3 : result.answers.length, game);
          await click('Choose another game');
          await page.waitForFunction(() => !JSON.parse(localStorage.getItem('lecomax-school-v1')).drafts['universe:game']);
          console.log(`PASS playable ${game}: answers, feedback, completion, persisted score`);
        }
        await go('/growth'); await page.getByText('Memory Match · 390 points · 4/4', { exact: true }).waitFor();
        await go('/memory-studio'); await click('Reveal answer'); await click('Good');
        await page.waitForFunction(() => JSON.parse(localStorage.getItem('lecomax-school-v1')).flashcards.events.length === 1);
        await go('/memory-studio'); await page.getByText('No cards due right now', { exact: true }).waitFor();
        await go('/galaxy'); await button('Explore this concept').first().click(); await click('Enter lesson'); assert(page.url().includes('/lesson/'));
      }
      assert.deepEqual(errors, [], `${language} browser errors`);
      console.log(`PASS ${language}: 16 routes, 4 widths, screenshots, reduced motion, ${seed.theme} theme; no page errors`);
      await context.close();
    }
    fs.writeFileSync('artifacts/universe-browser-metrics.json', JSON.stringify(metrics, null, 2));
  } finally { await browser.close(); }
}
main().catch(e => { console.error(e); process.exitCode = 1; }).finally(() => server.close());
