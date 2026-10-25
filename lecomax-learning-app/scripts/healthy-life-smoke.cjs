// Disposable browser profile; synthetic authentication and course, no real account or provider.
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { load } = require('./inspect.cjs');
const { plan } = require('../tests/fixtures/learning-journey.cjs');
const { initial } = load('lecomax-learning-app/utils/progress.ts');
const root = path.resolve(__dirname, '../dist-healthy-life-check');
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

      await page.goto(origin + '/wellness'); await login();
      const button=name=>page.getByRole('button',{name,exact:true});
      await button('Add activity').click();
      await page.getByLabel('Activity name',{exact:true}).fill('Review algebra');
      await page.getByLabel('Time (HH:MM)',{exact:true}).fill('10:00');
      await button('study').click();await button('Save activity').click();
      await button('Focus on: Review algebra').click();
      await page.getByLabel('My next Academy task',{exact:true}).waitFor();
      assert.equal(await page.getByLabel('My next Academy task',{exact:true}).inputValue(),'Review algebra');
      await page.clock.install();
      await page.getByLabel('Focus duration (1\u2013180 minutes)',{exact:true}).fill('1');
      await button('Set new timer').click();await button('Start or resume focus').click();
      await page.clock.fastForward(61000);
      await page.getByLabel('Session reflection (optional, local only)',{exact:true}).fill('One idea reviewed');
      await button('Save finished session').click();await button('Session saved').waitFor();
      await button('Habits').click();await button('Add habit').click();
      await page.getByLabel('Habit name',{exact:true}).fill('Read one page');await button('Save habit').click();
      await button('Rest: Read one page').click();await page.getByText('Rest day',{exact:true}).waitFor();
      await page.reload();await login();await button('Habits').click();await page.getByText('Rest day',{exact:true}).waitFor();
      await button('Skip: Read one page').click();await button('Insights').click();
      await page.getByText('1 recorded check-ins',{exact:false}).waitFor();
      for(const section of ['My Day','Habits','Planner','Focus','Learn','Move & learn','Insights','Privacy']){
        await button(section).click();
        for(const width of [320,390,768,1280]){await page.setViewportSize({width,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,section+' overflow '+width);}
        await page.setViewportSize({width:390,height:844});
        await page.evaluate(()=>document.querySelectorAll('*').forEach(el=>{if(el.scrollHeight>el.clientHeight)el.scrollTop=0;}));
        await page.screenshot({path:'artifacts/healthy-life-'+section.replaceAll(/[^a-z]/gi,'').toLowerCase()+'.png',fullPage:true});
      }
      await button('My Day').click();await button('Low energy? Preview a lighter day').click();await button('Apply lighter day').click();
      await button('Move & learn').click();await button('Gentle exploration').click();await button('Mark step 1 learned').click();
      await page.reload();await login();await button('Move & learn').click();await button('Undo step 1').waitFor();
      await button('Reminders').click();
      await page.getByLabel('Quiet hours start',{exact:true}).fill('22:00');await page.getByLabel('Quiet hours end',{exact:true}).fill('08:00');
      await button('Save reminders').click();
      await page.waitForFunction(()=>JSON.parse(localStorage.getItem('lecomax.wellness.v1')).notifications.quietStart==='22:00');
      await page.reload();await login();
      assert.equal(await page.getByLabel('Quiet hours end',{exact:true}).inputValue(),'08:00');
      await page.screenshot({path:'artifacts/healthy-life-quiet-hours.png',fullPage:true});
      assert.deepEqual(errors,[]);await context.close();
      console.log('Healthy Life browser CRUD, reload, study linkage, learning progression and 32 responsive checks passed.');
    }
  }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
}
main().catch(error=>{console.error(error);server.close();process.exitCode=1;});
