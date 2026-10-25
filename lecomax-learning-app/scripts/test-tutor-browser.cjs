const http = require('node:http'); const fs = require('node:fs'); const path = require('node:path'); const assert = require('node:assert/strict');
const { chromium } = require('playwright'); const { load } = require('./inspect.cjs'); const { reply } = require('../tests/fixtures/tutor.cjs');
const root = path.resolve(__dirname, process.env.LEARNING_WEB_EXPORT || '../dist-tutor-check'); const out = path.resolve(__dirname, '../artifacts/tutor'); fs.mkdirSync(out, { recursive: true });
const server = http.createServer((req, res) => {
  const requested = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
  if (!requested.startsWith(root + path.sep) && requested !== root) { res.writeHead(403).end(); return; }
  const file = fs.existsSync(requested) && fs.statSync(requested).isFile() ? requested : path.join(root, 'index.html');
  const mime = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.png': 'image/png', '.woff2': 'font/woff2', '.ttf': 'font/ttf' }[path.extname(file)] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': mime }); fs.createReadStream(file).pipe(res);
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve)); const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ headless: true, channel: 'msedge' }); const errors = []; const requests = [];
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await context.addInitScript(() => { window.SpeechRecognition = class { start() { this.onerror?.({ error: 'not-allowed' }); } stop() { this.onend?.(); } abort() {} }; });
    const { initial } = load('lecomax-learning-app/utils/progress.ts');
    await context.addInitScript(state => { if (window !== window.top) return; if (!localStorage.getItem('lecomax-school-v1')) localStorage.setItem('lecomax-school-v1', JSON.stringify(state)); }, { ...initial, language: 'en', theme: 'light' });
    let fail = false;
    await context.route('**/api/learning-mobile/**', async route => {
      if (route.request().url().endsWith('/tutor')) {
        const input = route.request().postDataJSON(); requests.push(input);
        if (input.message === 'Cancel this request') { await new Promise(resolve => setTimeout(resolve, 800)); await route.abort().catch(() => {}); return; }
        if (fail) { await route.fulfill({ status: 503, json: { error: 'TEACHER_UNAVAILABLE' } }); return; }
        const next = input.action === 'simpler' ? { ...reply, answer: 'Imagine two equal baskets. Put two apples in each.', lesson: null, roadmap: [], revision: [] } : reply;
        await route.fulfill({ contentType: 'application/x-ndjson', body: JSON.stringify({ type: 'partial', answer: 'Imagine...' }) + '\n' + JSON.stringify({ type: 'complete', reply: next, model: 'mock-provider', usage: { inputTokens: 10, outputTokens: 20, estimatedUSD: null, remaining: 100 } }) + '\n' }); return;
      }
      await route.fulfill({ json: route.request().url().endsWith('/auth') ? { challenge: 'fixture' } : { accessToken: 'fixture', refreshToken: 'fixture', expiresAt: Date.now() + 3600000, sessionId: 'fixture', remembered: false } });
    });
    const page = await context.newPage(); page.setDefaultTimeout(60000); page.on('pageerror', e => errors.push(e.message));
    const button = name => page.getByRole('button', { name, exact: true });
    async function signIn() { await page.getByPlaceholder('Your email', { exact: true }).fill('fixture@example.test'); await page.getByPlaceholder('Your password', { exact: true }).fill('fixture'); await button('Sign in').click(); await button('No, just this session').click(); await page.getByRole('heading', { name: 'Your AI teacher', exact: true }).waitFor(); }
    await page.goto(origin + '/tutor'); await signIn();
    await page.getByPlaceholder('What would you like to learn?').fill('Understand fractions'); await button('New session').click();
    await button('Dictate').click(); await page.getByText('Microphone denied. Allow it in the browser or type your answer.', { exact: true }).waitFor();
    await button('Start with the teacher').click();
    await page.getByText('A half is one of two equal parts.', { exact: true }).waitFor();
    assert.equal(requests[0].mode, 'zero');
    await button('Summary').click(); assert(await button('Complete lesson').isDisabled()); await button('Check').click(); await button('Three').click(); await page.getByText('Review this concept', { exact: true }).waitFor();
    await button('Simpler').click(); await page.getByText('Imagine two equal baskets. Put two apples in each.', { exact: true }).waitFor();
    assert.equal(requests.at(-1).action, 'simpler'); assert.match(requests.at(-1).context, /fractions-1/); assert.match(requests.at(-1).context, /"correct":false/);
    await button('Two').click(); await button('Summary').click(); await button('Complete lesson').click(); await button('Lesson completed').waitFor();
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('lecomax-school-v1')).tutor.sessions[0].complete);
    await page.reload(); await signIn(); await button('Lesson completed').waitFor();
    const draft = page.getByPlaceholder('Your question, answer, or attempt…'); await draft.fill('Please explain quarters'); fail = true; await button('Send').click(); await page.getByText('Response unavailable or invalid. Draft preserved: retry.', { exact: true }).waitFor(); assert.equal(await draft.inputValue(), 'Please explain quarters');
    fail = false; await button('Send').click(); await page.getByText('Let us split four apples into equal groups.', { exact: true }).last().waitFor();
    await page.locator('input[type=file]').setInputFiles({ name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('Four apples in two groups.') }); await draft.fill('Explain my notes'); await button('Send').click(); await page.waitForFunction(() => !document.body.textContent.includes('The teacher is preparing and validating'));
    assert.equal(requests.at(-1).attachment.data, 'Four apples in two groups.');
    await draft.fill('Cancel this request'); await button('Send').click(); await button('Cancel').click(); await page.getByText('Stopped or timed out. Draft preserved.', { exact: true }).waitFor(); assert.equal(await draft.inputValue(), 'Cancel this request');
    await page.evaluate(() => { for (const e of document.querySelectorAll('*')) if (e.scrollTop) e.scrollTop = 0; }); await page.screenshot({ path: path.join(out, 'english-phone.png'), fullPage: false });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2), 'No horizontal overflow');
    await context.close();
    const ar = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await ar.addInitScript(state => localStorage.setItem('lecomax-school-v1', JSON.stringify(state)), { ...initial, language: 'ar', theme: 'light' });
    await ar.route('**/api/learning-mobile/**', route => route.fulfill({ json: route.request().url().endsWith('/auth') ? { challenge: 'fixture' } : { accessToken: 'fixture', expiresAt: Date.now() + 3600000, sessionId: 'fixture', remembered: false } }));
    const arabic = await ar.newPage(); arabic.setDefaultTimeout(60000); arabic.on('pageerror', e => errors.push(e.message)); await arabic.goto(origin + '/tutor');
    await arabic.getByPlaceholder('بريدك الإلكتروني', { exact: true }).fill('fixture@example.test'); await arabic.getByPlaceholder('كلمة مرورك', { exact: true }).fill('fixture'); await arabic.getByRole('button', { name: 'تسجيل الدخول', exact: true }).click(); await arabic.getByRole('button', { name: 'لا، لهذه الجلسة فقط', exact: true }).click(); await arabic.getByRole('heading', { name: 'معلّمك الذكي', exact: true }).waitFor();
    await arabic.screenshot({ path: path.join(out, 'arabic-phone.png'), fullPage: false }); assert(await arabic.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2));
    assert.deepEqual(errors, []); fs.writeFileSync(path.join(out, 'browser-results.json'), JSON.stringify({ status: 'passed', provider: 'mocked', checks: ['new subject', 'roadmap and lesson', 'incorrect feedback', 'simpler exact context', 'quiz gate', 'reload resume', 'API failure preserves draft', 'retry', 'text attachment', 'cancellation preserves draft', 'simulated microphone denial', 'English and Arabic phone layout'], requests: requests.length, errors }, null, 2));
    console.log('Tutor browser flows passed with mocked provider. English and Arabic screenshots saved.');
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
