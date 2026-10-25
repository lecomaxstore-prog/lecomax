// Isolated current-build UI audit. Only authentication transport is simulated.
// Learning progress and placement scores are produced by real UI interactions.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { load } = require('./inspect.cjs');
const out = path.resolve(__dirname, '../artifacts/student-audit');
const root = path.resolve(__dirname, '../dist-student-audit');
fs.mkdirSync(out, { recursive: true });
const server = http.createServer((req, res) => {
  const target = path.resolve(root, '.' + new URL(req.url, 'http://localhost').pathname);
  if (!target.startsWith(root + path.sep) && target !== root) return res.writeHead(403).end();
  const file = fs.existsSync(target) && fs.statSync(target).isFile() ? target : path.join(root, 'index.html');
  res.setHeader('Content-Type', ({ '.js':'text/javascript', '.html':'text/html', '.css':'text/css', '.ttf':'font/ttf', '.png':'image/png', '.svg':'image/svg+xml' })[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});
(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ headless:true, channel:'msedge' });
  const checks = [], errors = [];
  let page, context;
  const record = text => { checks.push(text); console.log(text); };
  const button = name => page.getByRole('button', { name, exact:true });
  async function capture(name) { await page.screenshot({ path:path.join(out,name+'.png'), fullPage:false }); }
  async function login() {
    await page.getByPlaceholder('Your email', {exact:true}).fill('audit@example.test');
    await page.getByPlaceholder('Your password', {exact:true}).fill('isolated-test');
    await button('Sign in').click(); await button('No, just this session').click();
    await page.getByPlaceholder('Your email', {exact:true}).waitFor({state:'hidden'});
  }
  async function open(route) { await page.goto(origin+route); await login(); }
  const state = () => page.evaluate(() => JSON.parse(localStorage.getItem('lecomax-school-v1')));
  try {
    context = await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
    await context.route('**/api/learning-mobile/**', async route => {
      const url = new URL(route.request().url());
      if (!url.pathname.startsWith('/api/learning-mobile/auth')) return route.abort('internetdisconnected');
      await route.fulfill({json:url.pathname.endsWith('/auth') ? {challenge:'audit'} : {accessToken:'audit',refreshToken:'audit',expiresAt:Date.now()+3600000,sessionId:'audit',remembered:false}});
    });
    const initial = load('lecomax-learning-app/utils/progress.ts').initial;
    await context.addInitScript(s => { if (!localStorage.getItem('lecomax-school-v1')) localStorage.setItem('lecomax-school-v1',JSON.stringify(s)); }, {...initial,language:'en',theme:'light'});
    page = await context.newPage(); page.setDefaultTimeout(15000);
    page.on('pageerror',e=>errors.push(e.message));
    await open('/'); await button('Set up my learning path').waitFor(); await capture('01-beginner');
    assert.equal((await state()).completed.length,0); record('A: empty learner sees Set up my learning path and has zero completions');
    await button('Set up my learning path').click();
    await page.getByPlaceholder('Speak French, learn Python, understand mathematics…',{exact:true}).fill('Learn Python');
    await button('Continue').click(); await button('English').click(); await button('Continue').click(); await button('Save my profile').click();
    await open('/roadmap'); await button('Learn Python').click();
    await button('Start at the beginning — no test').click(); await button('Continue Learning').click();
    await page.getByLabel('My note for this lesson',{exact:true}).waitFor(); await capture('02-started-lesson');
    assert(page.url().includes('/lesson/')); record('A: starting CTA opens a real lesson');
    await open('/lesson/academy-computer?course=academy-foundations');
    await page.getByLabel('My note for this lesson',{exact:true}).fill('Audit: storage must survive a restart.');
    await page.getByRole('tab',{name:'4. Quiz',exact:true}).click();
    const lesson = load('lecomax-learning-app/services/academy.ts').getAcademyLesson('academy-computer','en');
    const q = lesson.quiz[0]; await button(q.options[q.correctIndex === 0 ? 1 : 0]).click();
    await page.getByText(/^Try again\./).waitFor(); await capture('03-quiz-feedback');
    for (const question of lesson.quiz) await button(question.options[question.correctIndex]).click();
    for (const skill of lesson.academy.readiness) await button(skill).click();
    await page.waitForFunction(()=>JSON.parse(localStorage.getItem('lecomax-school-v1')).completed.includes('academy-computer'));
    await open('/my-learning');
    assert((await state()).completed.includes('academy-computer'));
    assert.equal((await state()).notes['academy-computer'],'Audit: storage must survive a restart.');
    await capture('04-returning-progress'); record('B: actual quiz/readiness completion and note survive reload and simulated re-login');
    await open('/roadmap'); await button('Learn Python').first().click(); await button('Optional starting-point assessment').click();
    const questions = load('lecomax-learning-app/services/learning-roadmap.ts').diagnosticQuestions('python','en');
    for (const question of questions) await button(question.options[question.correctIndex]).first().click();
    await button('Show recommendation').click(); await button('Use this starting point').scrollIntoViewIfNeeded(); await capture('05-placement');
    const before = (await state()).completed;
    await button('Use this starting point').click();
    await page.waitForFunction(()=>JSON.parse(localStorage.getItem('lecomax-school-v1')).journey.starts.python);
    assert.deepEqual((await state()).completed,before); record('C: placement uses submitted answers and awards no lesson completions');
    await open('/roadmap'); await button('Learn Python').first().click(); await button('Make this my active path').click();
    await button('Continue Learning').click(); assert(page.url().includes('course=python'));
    await page.getByLabel('My note for this lesson',{exact:true}).waitFor();
    await capture('06-active-path'); record('D: active path selection resumes Python in its own course context');
    await open('/lesson/academy-computer?course=academy-foundations');
    await context.setOffline(true);
    await page.getByLabel('My note for this lesson',{exact:true}).fill('Saved while offline in the real browser.');
    await page.waitForFunction(()=>JSON.parse(localStorage.getItem('lecomax-school-v1')).notes['academy-computer']==='Saved while offline in the real browser.');
    await capture('07-offline-note'); await context.setOffline(false);
    await open('/lesson/academy-computer?course=academy-foundations');
    assert.equal((await state()).notes['academy-computer'],'Saved while offline in the real browser.'); record('F: note saved during network loss survives reconnect and reload');
    for (const width of [320,390,768,1280]) {
      await page.setViewportSize({width,height:844});
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
    }
    record('Lesson has no document horizontal overflow at 320, 390, 768 and 1280px');
    await page.setViewportSize({width:390,height:844}); await open('/');
    const navigation = [];
    for (const [i, name] of ['Learn','AI Tutor','Practice','Profile','Home'].entries()) {
      const tab = page.getByRole('tab',{name,exact:true}); await tab.click();
      await page.waitForFunction(name => [...document.querySelectorAll('[role="tab"]')].some(el => el.getAttribute('aria-label') === name && el.getAttribute('aria-selected') === 'true'),name);
      await page.getByRole('button').first().waitFor();
      assert(!(await page.locator('body').innerText()).includes('Unable to open this screen'));
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
      navigation.push({name,url:page.url(),buttons:await page.getByRole('button').allTextContents()});
      await capture('nav-'+i+'-'+name.replace(/ /g,'-'));
    }
    fs.writeFileSync(path.join(out,'navigation.json'),JSON.stringify(navigation,null,2));
    record('All five mobile navigation tabs switch to their screens without page errors or horizontal overflow');
    await open('/lesson/academy-computer?course=academy-foundations');
    // Only language preference changes; retain actual work from the preceding UI journey.
    await page.evaluate(()=>{const p=JSON.parse(localStorage.getItem('lecomax-school-v1'));p.language='ar';localStorage.setItem('lecomax-school-v1',JSON.stringify(p));});
    await page.setViewportSize({width:390,height:844}); await page.reload();
    await page.getByRole('button',{name:'تسجيل الدخول',exact:true}).waitFor();
    await capture('08-arabic-login');
    await page.getByPlaceholder('بريدك الإلكتروني',{exact:true}).fill('audit@example.test');
    await page.getByPlaceholder('كلمة مرورك',{exact:true}).fill('isolated-test');
    await button('تسجيل الدخول').click(); await button('لا، لهذه الجلسة فقط').click();
    await page.getByLabel('ملاحظتي لهذا الدرس',{exact:true}).waitFor();
    await page.getByLabel('ملاحظتي لهذا الدرس',{exact:true}).scrollIntoViewIfNeeded(); await capture('09-arabic-lesson');
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
    record('Arabic login and lesson render with persisted English notes and no document overflow');
    assert.equal(errors.length,0,errors.join('\n'));
  } catch (error) {
    errors.push(error.stack); console.error(error);
    if (page) { await capture('failure'); fs.writeFileSync(path.join(out,'failure-text.txt'),await page.locator('body').innerText()); }
    process.exitCode=1;
  } finally {
    fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({createdAt:new Date().toISOString(),checks,errors,limitations:['Authentication transport simulated; no live account or production changes','E: weeks-away behavior tested using the pure review engine','No fabricated progress or assessment result injected into browser']},null,2));
    await browser.close(); server.close();
  }
})();
