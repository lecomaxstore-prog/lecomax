// Disposable browser profile; synthetic authentication and course, no real account or provider.
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { load } = require('./inspect.cjs');
const { plan } = require('../tests/fixtures/learning-journey.cjs');
const { initial } = load('lecomax-learning-app/utils/progress.ts');
const root = path.resolve(__dirname, '../dist-ecosystem-check');
const server = http.createServer((req, res) => {
  const candidate = path.resolve(root, '.' + new URL(req.url, 'http://localhost').pathname);
  if (candidate !== root && !candidate.startsWith(root + path.sep)) { res.writeHead(403); res.end(); return; }
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
    for (const language of ['en']) {
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
      await page.goto(origin + '/agent-studio'); await login();
      await page.getByRole('button', {name:'Calculator',exact:true}).click();
      await page.getByLabel('Agent input',{exact:true}).fill('6 * 7');
      await page.getByRole('button',{name:'Run workflow',exact:true}).click();
      await page.getByText('6 * 7 = 42',{exact:true}).waitFor();
      await page.getByRole('button',{name:'Save project',exact:true}).click();
      await page.waitForFunction(() => JSON.parse(localStorage.getItem('lecomax-school-v1')).drafts['agent-studio.config']);
      for (const width of [320,390,768,1280]) {
        await page.setViewportSize({width,height:844});
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),false,'Agent Studio overflow '+width);
      }
      await page.setViewportSize({width:390,height:844});
      await page.screenshot({path:'artifacts/academy-ecosystem-agent.png',fullPage:true});
      await page.reload(); await login();
      await page.getByRole('button',{name:'Run workflow',exact:true}).click();
      await page.getByText('6 * 7 = 42',{exact:true}).waitFor();
      await page.getByRole('button',{name:'Run 3 checks',exact:true}).click();
      await page.getByText('PASS: supported answer',{exact:true}).waitFor();
      await page.goto(origin + '/academy-week'); await login();
      await page.getByText('Your learning week',{exact:true}).waitFor();
      for (const width of [320,390,768,1280]) {
        await page.setViewportSize({width,height:844});
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),false,'Weekly plan overflow '+width);
      }
      await page.setViewportSize({width:390,height:844});
      await page.screenshot({path:'artifacts/academy-ecosystem-week.png',fullPage:true});
      await page.goto(origin + '/'); await login();
      await page.getByText('Your academy',{exact:true}).waitFor();
      await page.getByText('Agent Studio',{exact:true}).click();
      await page.waitForURL('**/agent-studio');
      assert.deepEqual(errors, []);
      await context.close();
      console.log(`PASS ${language}: agent execution, local storage reload, weekly plan, home navigation and responsive widths (mock auth)`);
    }
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => server.close());
