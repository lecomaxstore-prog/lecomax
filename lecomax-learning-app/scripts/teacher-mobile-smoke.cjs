const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const { load } = require('./inspect.cjs');
const { initial } = load('lecomax-learning-app/utils/progress.ts');
async function main() {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  try {
    for (const language of ['ar', 'en', 'fr']) {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      await context.addInitScript(state => { if (!localStorage.getItem('lecomax-school-v1')) localStorage.setItem('lecomax-school-v1', JSON.stringify(state)); }, { ...initial, language });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      page.on('requestfailed', req => console.log('Request failed', req.url().slice(0, 180), req.failure()));
      page.on('console', msg => { if (msg.type() === 'error') console.log('Browser error', msg.text().slice(0, 1200)); });
      let requestBody, failure = false, delay = false;
      await page.route('**/api/learning-mobile/**', async route => {
        const req = route.request();
        const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization,content-type', 'access-control-allow-methods': 'POST,OPTIONS' };
        if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
        if (req.url().endsWith('/auth')) return route.fulfill({ json: { accessToken: 'synthetic-test-session' }, headers });
        requestBody = req.postDataJSON();
        if (delay) await new Promise(resolve => setTimeout(resolve, 1200));
        await route.fulfill({ status: failure ? 503 : 200, json: failure ? { error: 'TEACHER_UNAVAILABLE' } : { model: 'test-model', answer: '## Small steps\nAn **easy explanation**.\n```tsx\nexport default function Page() { return <h1>Hello</h1>; }\n```\nWhat do you expect to see?', sources: [] }, headers }).catch(() => {});
      });
      const words = language === 'ar' ? { input: 'رسالة إلى الأستاذ', sign: 'تسجيل الدخول', email: 'البريد الإلكتروني', password: 'كلمة المرور', send: 'أرسل', customize: 'تخصيص', close: 'إغلاق', stop: 'إيقاف', copy: 'نسخ الكود' } : language === 'fr' ? { input: 'Message au professeur', sign: 'Connexion', email: 'Adresse e-mail', password: 'Mot de passe', send: 'Envoyer', customize: 'Personnaliser', close: 'Fermer', stop: 'Arrêter', copy: 'Copier le code' } : { input: 'Message to teacher', sign: 'Sign in', email: 'Email address', password: 'Password', send: 'Send', customize: 'Personalize', close: 'Close', stop: 'Stop', copy: 'Copy code' };
      await page.goto((process.env.TEACHER_PREVIEW_URL || 'http://localhost:8083') + '/teacher');
      const input = page.getByRole('textbox', { name: words.input, exact: true });
      await input.waitFor({ timeout: 15000 }).catch(async error => { await page.screenshot({ path: 'artifacts/teacher-failure.png' }); console.log((await page.locator('body').innerText()).slice(0, 1600), errors); throw error; });
      for (const [width, height] of [[320, 568], [390, 844], [768, 1024], [390, 480]]) {
        await page.setViewportSize({ width, height });
        const box = await input.boundingBox();
        assert(box && box.y > 0 && box.y + box.height < height - 64, `Composer hidden: ${language}/${width}x${height}`);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      }
      await page.setViewportSize({ width: 390, height: 844 });
      await input.fill(Array.from({ length: 12 }, (_, i) => `line ${i}`).join('\n'));
      assert((await input.boundingBox()).height <= 104, 'Multiline composer must stay bounded');
      await input.fill('');
      assert((await input.boundingBox()).height <= 60, 'Empty composer should shrink');
      await input.blur();
      await page.screenshot({ path: `artifacts/teacher-${language}-welcome.png` });
      assert.equal(await page.getByRole('button', { name: words.sign, exact: true }).count(), 0, 'Login should appear only when sending');
      await input.fill('My saved question');
      await page.getByRole('button', { name: words.send, exact: true }).click();
      await page.getByRole('button', { name: words.close, exact: true }).last().click();
      await page.getByRole('button', { name: words.sign, exact: true }).waitFor({ state: 'hidden' });
      assert.equal(await input.inputValue(), 'My saved question');
      await page.getByRole('button', { name: words.send, exact: true }).click();
      await page.getByRole('textbox', { name: words.email, exact: true }).fill('test@example.invalid');
      await page.getByLabel(words.password, { exact: true }).fill('synthetic-password');
      await page.getByRole('button', { name: words.sign, exact: true }).click();
      await page.getByRole('button', { name: words.send, exact: true }).waitFor();
      await page.getByRole('button', { name: words.customize, exact: true }).click();
      await page.getByRole('button', { name: 'Python', exact: true }).click();
      await page.getByRole('button', { name: words.close, exact: true }).last().click();
      await page.getByRole('button', { name: 'Python', exact: true }).waitFor({ state: 'hidden' });
      await input.fill('Teach me functions from zero');
      await page.getByRole('button', { name: words.send, exact: true }).click();
      await page.getByRole('heading', { name: 'Small steps', exact: true }).waitFor();
      await page.getByRole('button', { name: words.copy, exact: true }).waitFor();
      assert.equal(requestBody.topic, 'python');
      assert.equal(requestBody.level, 'beginner');
      assert.equal(requestBody.message, 'Teach me functions from zero');
      assert.equal(await input.inputValue(), '');
      for (const width of [320, 390, 768]) {
        await page.setViewportSize({ width, height: 844 });
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `Code overflow: ${language}/${width}`);
      }
      await page.setViewportSize({ width: 390, height: 844 });
      await page.screenshot({ path: `artifacts/teacher-${language}-conversation.png` });
      const explain = language === 'ar' ? 'اشرح هذا الكود' : language === 'fr' ? 'Expliquer ce code' : 'Explain this code';
      await page.getByRole('button', { name: explain, exact: true }).click();
      assert.match(await input.inputValue(), /export default function Page/);
      await page.getByRole('button', { name: words.send, exact: true }).click();
      await page.getByRole('button', { name: words.stop, exact: true }).waitFor({ state: 'hidden' });
      assert.equal(requestBody.mode, 'lines');
      const tools = language === 'ar' ? 'أدوات الرسالة' : language === 'fr' ? 'Outils du message' : 'Message tools';
      const beginner = language === 'ar' ? 'شرح للمبتدئ' : language === 'fr' ? 'Explications pour débutant' : 'Beginner explanations';
      await page.getByRole('button', { name: tools, exact: true }).click();
      await page.getByRole('switch', { name: beginner, exact: true }).click();
      await page.getByRole('button', { name: words.close, exact: true }).last().click();
      await page.getByRole('switch', { name: beginner, exact: true }).waitFor({ state: 'hidden' });
      await input.fill('Explain tradeoffs');
      await page.getByRole('button', { name: words.send, exact: true }).click();
      await page.getByRole('button', { name: words.stop, exact: true }).waitFor({ state: 'hidden' });
      assert.equal(requestBody.level, 'intermediate');
      failure = true;
      await input.fill('Keep this draft');
      await page.getByRole('button', { name: words.send, exact: true }).click();
      await page.getByRole('alert').waitFor();
      assert.equal(await input.inputValue(), 'Keep this draft');
      failure = false; delay = true;
      await page.getByRole('button', { name: words.send, exact: true }).click();
      await page.getByRole('button', { name: words.stop, exact: true }).click();
      await page.getByRole('button', { name: words.send, exact: true }).waitFor();
      assert.equal(await input.inputValue(), 'Keep this draft');
      assert.deepEqual(errors, []);
      await page.reload();
      await input.waitFor();
      assert.equal(await input.inputValue(), 'Keep this draft');
      assert.equal(await page.getByRole('heading', { name: 'Small steps', exact: true }).count(), 3);
      await context.close();
    }
    if (process.env.TEACHER_BACKEND_URL) {
      const probe = await browser.newPage();
      await probe.goto('http://localhost:8083/teacher');
      const result = await probe.evaluate(async base => {
        const response = await fetch(base + '/api/learning-mobile/teacher', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: 'probe', language: 'en', mode: 'teach' }) });
        return { status: response.status, body: await response.json() };
      }, process.env.TEACHER_BACKEND_URL);
      assert.equal(result.status, 401);
      assert.equal(result.body.error, 'OWNER_LOGIN_REQUIRED');
      await probe.close();
      console.log('PASS: real local backend is reachable from the browser and requires owner authentication.');
    }
    console.log('PASS: Arabic/French/English mobile chat, short viewport, deferred sign-in, topic and beginner payloads, explain-code action, Markdown code, saved conversation and draft, cancellation, and no page overflow. Auth and chat API mocked; no live provider call in this run.');
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
