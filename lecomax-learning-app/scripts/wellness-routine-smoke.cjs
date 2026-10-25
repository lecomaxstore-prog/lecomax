const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { load } = require('./inspect.cjs');
const { initial } = load('lecomax-learning-app/utils/progress.ts');
const url = process.env.WELLNESS_URL || 'http://localhost:8083';
async function main() {
 fs.mkdirSync('artifacts/wellness-routine', { recursive: true });
 const browser = await chromium.launch({ headless: true, channel: 'msedge' });
 try {
  for (const language of ['en', 'ar', 'fr']) {
   const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
   await context.addInitScript(state => {
    if (!localStorage.getItem('lecomax-school-v1')) localStorage.setItem('lecomax-school-v1', JSON.stringify(state));
    window.testNotices = []; window.testPermissionRequests = 0;
    class TestNotification {
     static permission = 'default';
     static async requestPermission() { window.testPermissionRequests++; this.permission = 'granted'; return 'granted'; }
     constructor(title, options) { window.testNotices.push({ title, options }); }
     close() {}
    }
    Object.defineProperty(window, 'Notification', { value: TestNotification, configurable: true });
   }, { ...initial, language, theme: 'light' });
   const page = await context.newPage(), errors = [];
   page.on('pageerror', e => errors.push(e.message));
   page.on('console', msg => { if(msg.type() === 'error') errors.push(msg.text()); });
   await page.route('**/api/learning-mobile/auth**', route => {
    const path = new URL(route.request().url()).pathname;
    const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization,content-type', 'access-control-allow-methods': 'GET,POST,OPTIONS' };
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    const json = path.endsWith('/confirm') ? { accessToken: 'test-only', refreshToken: 'test-only', expiresAt: Date.now() + 3600000, sessionId: 'test-only', remembered: false } : path.endsWith('/sessions') ? { sessions: [] } : { challenge: 'test-only' };
    return route.fulfill({ json, headers });
   });
   const words = language === 'en' ? { email: 'Email address', password: 'Password', login: 'Sign in', session: 'No, just this session', morning: 'Start gently', water: 'Drink water throughout the day', reminder: 'Reminders' } : language === 'ar' ? { email: 'البريد الإلكتروني', password: 'كلمة المرور', login: 'تسجيل الدخول', session: 'لا، لهذه الجلسة فقط', morning: 'بداية هادئة', water: 'اشرب الماء خلال اليوم', reminder: 'التذكيرات' } : { email: 'Adresse e-mail', password: 'Mot de passe', login: 'Se connecter', session: 'Non, cette session seulement', morning: 'Bien commencer', water: 'Boire de l’eau dans la journée', reminder: 'Rappels' };
   async function login() {
    await page.getByRole('textbox', { name: words.email, exact: true }).fill('routine-test@example.invalid');
    await page.getByLabel(words.password, { exact: true }).fill('synthetic-test-only');
    await page.getByRole('button', { name: words.login, exact: true }).click();
    await page.getByRole('button', { name: words.session, exact: true }).click();
    await page.getByRole('button', { name: words.login, exact: true }).waitFor({ state: 'hidden' });
   }
   await page.goto(url + '/wellness'); await login();
   const priorityLabel = language === 'ar' ? 'أولويتي اليوم' : language === 'fr' ? 'Ma priorité du jour' : 'My priority today';
   const savePriority = language === 'ar' ? 'احفظ أولويتي' : language === 'fr' ? 'Enregistrer ma priorité' : 'Save my priority';
   await page.getByRole('textbox', { name: priorityLabel, exact: true }).fill('Practise a useful skill today');
   await page.getByRole('button', { name: savePriority, exact: true }).click();
   await page.waitForFunction(() => JSON.parse(localStorage.getItem('lecomax.wellness.v1')).days[Object.keys(JSON.parse(localStorage.getItem('lecomax.wellness.v1')).days).sort().at(-1)].compass?.priority === 'Practise a useful skill today');
   await page.getByRole('tab', { name: language === 'ar' ? 'اليوم' : language === 'fr' ? 'Aujourd’hui' : 'Today', exact: true }).scrollIntoViewIfNeeded();
   await page.screenshot({ path: 'artifacts/wellness-routine/' + language + '-daily-plan.png' });

   await page.getByRole('button', { name: new RegExp(words.morning) }).click();
   await page.getByRole('checkbox', { name: words.water, exact: true }).click();
   await page.getByRole('checkbox', { name: words.water, checked: true }).waitFor();
   await page.reload(); await login();
   assert.equal(await page.getByRole('textbox', { name: priorityLabel, exact: true }).inputValue(), 'Practise a useful skill today');
   await page.getByRole('button', { name: new RegExp(words.morning) }).click();
   await page.getByRole('checkbox', { name: words.water, checked: true }).waitFor();
   for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, language + '/' + width);
   }
   await page.setViewportSize({ width: 390, height: 844 });
   await page.getByRole('button', { name: new RegExp(words.morning) }).scrollIntoViewIfNeeded();
   await page.screenshot({ path: 'artifacts/wellness-routine/' + language + '-routine.png' });
   await page.getByRole('tab', { name: words.reminder, exact: true }).click();
   if (language === 'en') {
    await page.getByRole('button', { name: 'Morning and evening', exact: true }).click();
    assert.equal(await page.evaluate(() => window.testPermissionRequests), 0);
    await page.getByRole('button', { name: 'Save reminders', exact: true }).click();
    await page.getByText('Browser reminders enabled.', { exact: false }).first().waitFor();
    assert.equal(await page.evaluate(() => window.testPermissionRequests), 1);
    const before = await page.evaluate(() => window.testNotices.length);
    await page.getByRole('button', { name: 'Send a test now', exact: true }).click();
    assert.equal(await page.evaluate(() => window.testNotices.length), before + 1);
   }
   await page.screenshot({ path: 'artifacts/wellness-routine/' + language + '-reminders.png' });
   await page.goto(url); await login();
   const openRoutine = language === 'ar' ? 'افتح روتيني اليومي' : language === 'fr' ? 'Ouvrir ma routine du jour' : 'Open today’s routine';
   await page.getByRole('button', { name: openRoutine, exact: true }).scrollIntoViewIfNeeded();
   await page.screenshot({ path: 'artifacts/wellness-routine/' + language + '-home.png' });
   await page.getByRole('button', { name: openRoutine, exact: true }).click();
   await page.getByRole('button', { name: new RegExp(words.morning) }).waitFor();
   assert.deepEqual(errors, []); await context.close();
  }
  console.log('PASS: three languages, 320/390/768px, persistent completion, browser reminder opt-in and explicit test; no page errors.');
 } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
