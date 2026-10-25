// Disposable browser profile; synthetic authentication and course, no real account or provider.
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { load } = require('./inspect.cjs');
const { plan } = require('../tests/fixtures/learning-journey.cjs');
const { initial } = load('lecomax-learning-app/utils/progress.ts');
const root = path.resolve(__dirname, '../dist-academy-3-check');
const server = http.createServer((req, res) => {
  const candidate = path.resolve(root, '.' + new URL(req.url, 'http://localhost').pathname);
  if (!candidate.startsWith(root + path.sep)) { res.writeHead(403); res.end(); return; }
  const file = fs.existsSync(candidate) && fs.statSync(candidate).isFile() ? candidate : path.join(root, 'index.html');
  const mime = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.ttf': 'font/ttf', '.png': 'image/png', '.json': 'application/json' };
  res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});
async function main() {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    for (const language of ['en', 'fr', 'ar']) {
      const words = {
        en: ['Email address', 'Password', 'Sign in', 'No, just this session', 'Confident', 'Record my answer', 'Continue learning', 'Create recall card', 'Open Memory Studio'],
        fr: ['Adresse e-mail', 'Mot de passe', 'Se connecter', 'Non, cette session seulement', 'Sûr', 'Enregistrer ma réponse', 'Continuer à apprendre', 'Créer une carte de rappel', 'Ouvrir Memory Studio'],
        ar: ['البريد الإلكتروني', 'كلمة المرور', 'تسجيل الدخول', 'لا، لهذه الجلسة فقط', 'واثق', 'سجّل إجابتي', 'تابع التعلم', 'أنشئ بطاقة استدعاء', 'افتح استوديو الذاكرة'],
      }[language];
      const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
      await context.addInitScript(state => { if (!localStorage.getItem('lecomax-school-v1')) localStorage.setItem('lecomax-school-v1', JSON.stringify(state)); }, { ...initial, language, academy: { ...initial.academy, plans: [plan()] } });
      const page = await context.newPage(); const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.route('**/*', async route => {
        const req = route.request();
        if (req.url().startsWith(origin)) return route.continue();
        if (!req.url().includes('/api/learning-mobile/auth')) return route.abort();
        const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization,content-type', 'access-control-allow-methods': 'POST,GET,OPTIONS' };
        if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
        const json = req.url().endsWith('/confirm') ? { accessToken: 'synthetic', refreshToken: 'synthetic', expiresAt: Date.now() + 3600000, sessionId: 'test', remembered: false } : { challenge: 'synthetic', sessions: [] };
        return route.fulfill({ headers, json });
      });
      const login = async () => {
        await page.getByLabel(words[0], { exact: true }).fill('learner@example.invalid');
        await page.getByLabel(words[1], { exact: true }).fill('synthetic-password');
        await page.getByRole('button', { name: words[2], exact: true }).click();
        await page.getByRole('button', { name: words[3], exact: true }).click();
      };
      await page.goto(origin + '/learning-journey?id=plan-journey'); await login();
      await page.getByText('Starting question 0', { exact: true }).waitFor();
      for (const [width, height] of [[320, 568], [390, 844], [844, 390], [768, 1024]]) {
        await page.setViewportSize({ width, height });
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${language}/${width} overflow`);
      }
      await page.setViewportSize({ width: 390, height: 844 });
      await page.screenshot({ path: `artifacts/academy-3-${language}.png`, fullPage: true });
      for (let i = 0; i < 3; i++) {
        await page.getByRole('button', { name: 'Baseline incorrect', exact: true }).click();
        await page.getByRole('button', { name: words[4], exact: true }).click();
        await page.getByRole('button', { name: words[5], exact: true }).click();
      }
      await page.getByRole('button', { name: words[6], exact: true }).waitFor();
      await page.getByRole('button', { name: words[7], exact: true }).first().click();
      await page.waitForFunction(() => JSON.parse(localStorage.getItem('lecomax-school-v1')).flashcards.cards.length === 1);
      await page.reload(); await login();
      await page.getByRole('button', { name: words[6], exact: true }).waitFor();
      assert.equal(await page.getByText('Starting question 0', { exact: true }).count(), 0);
      await page.getByRole('button', { name: words[8], exact: true }).click();
      await page.waitForURL('**/memory-studio');
      assert.deepEqual(errors, []);
      await context.close();
      console.log(`PASS ${language}: responsive journey, baseline, actual local storage, reload and memory navigation (mock auth)`);
    }
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => server.close());
