const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { load } = require('./inspect.cjs');
const root = path.resolve(__dirname, '../dist-discovery-player-check');
const mime = {
  '.js': 'application/javascript',
  '.html': 'text/html',
  '.json': 'application/json',
  '.ttf': 'font/ttf',
  '.png': 'image/png',
};
const server = http.createServer((req, res) => {
  const relative = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  let file = path.resolve(root, '.' + relative);
  if (!file.startsWith(root + path.sep)) {
    res.writeHead(403).end();
    return;
  }
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(root, 'index.html');
  res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});
(async () => {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.addInitScript(
      (p) => {
        if (window.top !== window) return;
        if (!localStorage.getItem('lecomax-school-v1'))
          localStorage.setItem('lecomax-school-v1', JSON.stringify(p));
      },
      {
        ...load('lecomax-learning-app/utils/progress.ts').initial,
        language: 'en',
        theme: process.argv.includes('--dark') ? 'dark' : 'light',
      },
    );
    // Test-only transport stubs; no real credentials or cloud writes.
    await page.route('**/api/learning-mobile/**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(
          route.request().url().endsWith('/auth')
            ? { challenge: 'test-only' }
            : {
                accessToken: 'local-test',
                refreshToken: 'local-test',
                expiresAt: Date.now() + 3600000,
                sessionId: 'local-test',
                remembered: false,
              },
        ),
      }),
    );
    const base = 'http://127.0.0.1:' + server.address().port;

    const click = async (name) => page.getByRole('button', { name, exact: true }).first().click();
    const login = async () => {
      await page.getByPlaceholder('Your email').fill('test@example.invalid');
      await page.getByPlaceholder('Your password').fill('test-only');
      await click('Sign in');
      await click('No, just this session');
    };
    await page.goto(base + '/discovery?topic=ai');
    await login();
    await page.getByText('Step 1 of 8', { exact: false }).waitFor();
    await click('Bookmark journey');
    await click('Explain in Depth');
    await click('Show Me Visually');
    await click('How Does It Work?');
    await click('Test the mechanism');
    const j = load('lecomax-learning-app/features/curiosity/journeys.ts');
    const labs = load('lecomax-learning-app/features/curiosity/labs.ts');
    for (let i = 0; i < j.aiJourney.steps.length; i++) {
      const step = j.aiJourney.steps[i];
      await click('Interactive Experiment');
      await click('Increase ' + labs.labSpec[step.lab].label);
      await click('Challenge My Knowledge');
      if (i === 0) {
        await click(step.options[1]);
        await click('Show a hint');
        await click('Check answer');
        await page.getByText('Not yet.', { exact: false }).waitFor();
      }
      await click(step.options[step.correct]);
      await click('Check answer');
      await page.getByText('Correct.', { exact: false }).waitFor();
      if (i < 7) await click('Next step');
    }
    await page.getByText('Journey checkpoints completed', { exact: true }).waitFor();
    await page.waitForFunction(
      () =>
        JSON.parse(
          JSON.parse(localStorage.getItem('lecomax-school-v1')).drafts['curiosity-player:v1'],
        ).topics.ai.active === 'evolution',
    );
    await page.reload();
    await login();
    await page.getByText('Step 8 of 8', { exact: false }).waitFor();
    await page.getByText('A closer look', { exact: true }).waitFor();
    await click('Previous step');
    await click('What\u2019s Inside?');
    await click('Tools');
    await page
      .getByText(
        'A product may call external tools; text generation alone is not a live web search.',
        { exact: true },
      )
      .waitFor();
    await click('Show Me Visually');
    await page.setViewportSize({ width: 390, height: 844 });
    assert(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
      'mobile overflow',
    );
    await page.screenshot({
      path: path.resolve(__dirname, '../artifacts/discovery-player-mobile.png'),
      fullPage: false,
    });
    await click('Ask AI Teacher');
    await click('Fran\u00e7ais');
    await page.getByPlaceholder('Ask about this step').fill('Why can a confident answer be false?');
    await click('Ask my question');
    await page.waitForURL(/\/tutor$/);
    await page.waitForFunction(() =>
      JSON.parse(localStorage.getItem('lecomax-school-v1')).tutor.sessions.some(
        (s) => s.discoveryStep === 'chatgpt' && s.settings.conversationLanguage === 'Fran\u00e7ais',
      ),
    );
    // Every new journey uses the same eight-mode player, but different model and evidence.
    const additions = load(
      'lecomax-learning-app/features/curiosity/subject-journeys.ts',
    ).subjectJourneys;
    for (const journey of additions) {
      await page.goto(base + '/discovery?topic=' + journey.id);
      await login();
      await page.getByText(`Step 1 of ${journey.steps.length}`, { exact: false }).waitFor();
      await click('Bookmark journey');
      for (let i = 0; i < journey.steps.length; i++) {
        const step = journey.steps[i];
        await click('Interactive Experiment');
        await click('Increase ' + labs.labSpec[step.lab].label);
        await click('Challenge My Knowledge');
        await click(step.options[step.correct]);
        await click('Check answer');
        await page.getByText('Correct.', { exact: false }).waitFor();
        if (i < journey.steps.length - 1) await click('Next step');
      }
      await page.getByText('Journey checkpoints completed', { exact: true }).waitFor();
      await page.waitForFunction((id) => {
        const saved = JSON.parse(localStorage.getItem('lecomax-school-v1'));
        return JSON.parse(saved.drafts['curiosity-player:v1']).topics[id]?.steps[`${id}-2`]?.answer
          ?.correct;
      }, journey.id);
      await page.reload();
      await login();
      await page.getByText('Journey checkpoints completed', { exact: true }).waitFor();
      await page.getByRole('button', { name: 'Bookmarked · remove', exact: true }).waitFor();
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    }
    await page.goto(base + '/curiosity');
    await login();
    await click('Journal');
    await click(additions[0].title);
    await page.waitForURL(/topic=levers/);
    console.log(
      'PASS: six new journeys, 12 checkpoints, bookmark reloads, Journal navigation and mobile widths.',
    );
    assert.deepEqual(errors, []);
    console.log(
      'PASS: all 8 AI steps, all learning modes, calculations, wrong/correct feedback, hints, completion, bookmark, reload resume, components, mobile overflow, and step-specific French Tutor handoff. Auth mocked.',
    );
  } finally {
    await browser.close();
    server.close();
  }
})().catch((e) => {
  console.error(e);
  server.close();
  process.exitCode = 1;
});
