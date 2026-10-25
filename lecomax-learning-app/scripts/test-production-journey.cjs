// Real UI/storage/runtimes with synthetic authentication and teacher transport.
// No production credentials, paid calls or user progress are used.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { load } = require('./inspect.cjs');
const root = path.resolve(__dirname, process.env.LEARNING_WEB_EXPORT || '../dist-production-check');
const out = path.resolve(__dirname, '../artifacts/production');
fs.mkdirSync(out, { recursive: true });
const server = http.createServer((req, res) => {
  const target = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
  if (target !== root && !target.startsWith(root + path.sep)) return res.writeHead(403).end();
  const file = fs.existsSync(target) && fs.statSync(target).isFile() ? target : path.join(root, 'index.html');
  res.setHeader('Content-Type', ({ '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.png': 'image/png', '.ttf': 'font/ttf' })[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const checks = [], errors = [], requests = [];
  let page;
  const initial = load('lecomax-learning-app/utils/progress.ts').initial;
  const lesson = load('lecomax-learning-app/services/academy.ts').getAcademyLesson('academy-computer', 'en');
  const teacherAnswer = 'Displaying a result does not save it. Write it to persistent storage, then reopen it to verify.';
  const record = name => { checks.push(name); console.log(name); };
  async function configure(context) {
    await context.route('**/api/learning-mobile/**', async route => {
      if (route.request().url().endsWith('/teacher')) {
        requests.push(route.request().postDataJSON());
        await route.fulfill({ json: { answer: teacherAnswer + '\n\\[x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}\\]', model: 'fixture' } });
      } else await route.fulfill({ json: route.request().url().endsWith('/auth') ? { challenge: 'fixture' } : { accessToken: 'fixture', refreshToken: 'fixture', expiresAt: Date.now() + 3600000, sessionId: 'fixture', remembered: false } });
    });
  }
  const button = name => page.getByRole('button', { name, exact: true });
  async function signIn() {
    await page.getByPlaceholder('Your email', { exact: true }).fill('fixture@example.test');
    await page.getByPlaceholder('Your password', { exact: true }).fill('fixture');
    await button('Sign in').click(); await button('No, just this session').click();
  }
  async function open(route) { await page.goto(origin + route); await signIn(); }
  async function capture(name) { await page.screenshot({ path: path.join(out, name + '.png'), fullPage: false }); }
  const saved = () => page.waitForFunction(() => !!JSON.parse(localStorage.getItem('lecomax-school-v1')));
  try {
    let context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    await configure(context);
    await context.addInitScript(state => { if (window === window.top && !localStorage.getItem('lecomax-school-v1')) localStorage.setItem('lecomax-school-v1', JSON.stringify(state)); }, { ...initial, language: 'en', theme: 'light' });
    page = await context.newPage(); page.setDefaultTimeout(20000); page.on('pageerror', e => errors.push(e.message));
    await page.goto(origin); await page.getByPlaceholder('Your email', { exact: true }).waitFor(); await capture('01-sign-in');
    await signIn(); await button('Personalize my learning').click();
    await page.getByPlaceholder('Name (optional)', { exact: true }).fill('Journey learner');
    await page.getByPlaceholder('Speak French, learn Python, understand mathematics…', { exact: true }).fill('Understand computers and write reliable programs');
    await button('Continue').click(); await button('English').click(); await button('Continue').click(); await button('Save my profile').click();
    await page.getByRole('heading', { name: 'Follow your curiosity', exact: true }).waitFor(); await capture('02-onboarded');
    record('Authentication UI, goal selection and onboarding persist');
    await open('/course/academy-foundations'); await button('Start this course').click();
    await page.getByRole('heading', { name: lesson.title, exact: true }).waitFor(); await capture('03-lesson');
    await button('Need help? Ask the AI teacher').click(); await button('Explain simply').click();
    await page.getByText(teacherAnswer, { exact: true }).waitFor();
    await page.locator('math mfrac').waitFor();
    assert.equal(await page.locator('math msqrt').count(), 1);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2));
    record('Teacher response renders fraction and square root as MathML without page overflow');
    assert(requests.length > 0); assert(JSON.stringify(requests[0]).includes('academy-computer'));
    await capture('04-contextual-teacher'); record('Course navigation and contextual teacher request (fixture response)');
    await open('/lesson/academy-computer?course=academy-foundations');
    await button('Save').click();
    await page.getByLabel('My note for this lesson', { exact: true }).fill('A displayed result is not saved until a storage write succeeds.');
    await page.getByRole('tab', { name: '4. Quiz', exact: true }).click();
    const first = lesson.quiz[0]; const wrong = first.correctIndex === 0 ? 1 : 0;
    await button(first.options[wrong]).click(); await page.getByText(/^Try again\./).waitFor();
    assert(await button('Complete lesson').isDisabled()); await capture('05-incorrect-answer');
    for (const q of lesson.quiz) await button(q.options[q.correctIndex]).click();
    for (const skill of lesson.academy.readiness) await button(skill).click();
    await button('Completed ✓').waitFor();
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('lecomax-school-v1')).completed.includes('academy-computer'));
    record('Incorrect feedback, quiz/readiness completion, bookmark and note stored');
    await open('/practice-lab'); await button('Open Interactive Learning Studio').click();
    await button('Open JavaScript Studio').click(); await button('Run exercise tests').click();
    await page.getByText('PASS · square(-3) = 9 · actual: 9', { exact: true }).waitFor();
    await button('Editor').click(); await page.locator('.cm-content').fill('throw new Error("journey-error");'); await button('Run code').click();
    await page.getByText(/Error: journey-error/).first().waitFor(); await capture('06-runtime-error');
    await button('All studio tools').click(); await button('Open Flashcard Review').click();
    await page.getByLabel('Card question', { exact: true }).fill('Does displaying a result save it?');
    await page.getByLabel('Card answer', { exact: true }).fill('No; persistent storage needs a successful write.');
    await button('Add flashcard').click(); await button('Reveal answer').click({ timeout: 5000 }); await button('good').click();
    await page.getByText('No cards due in this deck.', { exact: true }).waitFor(); await saved();
    await page.waitForFunction(() => JSON.parse(JSON.parse(localStorage.getItem('lecomax-school-v1')).drafts['interactive:cards'])[0].reviews === 1);
    record('Practice navigation, real program success/error, exercise grading and flashcard review');
    const before = await page.evaluate(() => JSON.parse(localStorage.getItem('lecomax-school-v1')));
    const storageState = await context.storageState(); await context.close();
    context = await browser.newContext({ viewport: { width: 390, height: 844 }, storageState }); await configure(context);
    page = await context.newPage(); page.setDefaultTimeout(20000); page.on('pageerror', e => errors.push(e.message));
    await open('/lesson/academy-computer?course=academy-foundations'); await button('Completed ✓').waitFor();
    assert.equal(await page.getByLabel('My note for this lesson', { exact: true }).inputValue(), before.notes['academy-computer']);
    const after = await page.evaluate(() => JSON.parse(localStorage.getItem('lecomax-school-v1')));
    for (const key of ['completed', 'notes', 'bookmarks', 'answers', 'teacher', 'drafts']) assert.deepEqual(after[key], before[key], key);
    for (const key of ['profile', 'enrolled', 'plans', 'favorites', 'feedback']) assert.deepEqual(after.academy[key], before.academy[key], 'academy.' + key);
    assert.equal(after.academy.visits[0].id, before.academy.visits[0].id);
    assert(after.academy.visits[0].at >= before.academy.visits[0].at, 'reopening records a new visit');
    await capture('07-restored-lesson'); record('Closed and reopened browser context restores profile, goal, lesson, answers, note, bookmark, teacher history, code and card schedule');
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(out, 'journey-results.json'), JSON.stringify({ at: new Date().toISOString(), checks, errors, auth: 'mocked', teacher: 'mocked', runtime: 'real QuickJS', storage: 'real browser localStorage; new context restored saved browser data' }, null, 2));
  } catch (error) { if (page && !page.isClosed()) { console.error((await page.locator('body').innerText()).slice(-4500)); await capture('journey-failure'); } throw error; }
  finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
