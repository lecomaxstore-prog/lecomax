// Exported app integration tests with synthetic auth; all external traffic is blocked.
const { chromium } = require('playwright');
const fs = require('node:fs'),
  path = require('node:path'),
  http = require('node:http'),
  assert = require('node:assert/strict');
const { load } = require('./inspect.cjs');
const { initial } = load('lecomax-learning-app/utils/progress.ts');
const root = path.resolve(__dirname, '../dist-agent-studio-check');
const server = http.createServer((req, res) => {
  const candidate = path.resolve(root, '.' + new URL(req.url, 'http://localhost').pathname);
  if (candidate !== root && !candidate.startsWith(root + path.sep)) {
    res.writeHead(403);
    return res.end();
  }
  const file =
    fs.existsSync(candidate) && fs.statSync(candidate).isFile()
      ? candidate
      : path.join(root, 'index.html');
  res.setHeader(
    'Content-Type',
    {
      '.js': 'text/javascript',
      '.html': 'text/html',
      '.css': 'text/css',
      '.ttf': 'font/ttf',
      '.png': 'image/png',
      '.json': 'application/json',
    }[path.extname(file)] || 'application/octet-stream',
  );
  fs.createReadStream(file).pipe(res);
});
(async () => {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const results = [];
  fs.mkdirSync('artifacts/agent-studio', { recursive: true });
  try {
    for (const [language, theme, width] of [
      ['en', 'light', 390],
      ['en', 'dark', 1280],
      ['ar', 'dark', 390],
      ['fr', 'light', 320],
    ]) {
      const context = await browser.newContext({
        viewport: { width, height: 900 },
        reducedMotion: 'reduce',
      });
      await context.addInitScript(
        (s) => {
          if (!localStorage.getItem('lecomax-school-v1'))
            localStorage.setItem('lecomax-school-v1', JSON.stringify(s));
        },
        { ...initial, language, theme },
      );
      const page = await context.newPage(),
        errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      let liveCalls = 0;
      const headers = {
        'access-control-allow-origin': '*',
        'access-control-allow-headers': 'authorization,content-type',
        'access-control-allow-methods': 'POST,GET,OPTIONS',
      };
      await page.route('**/*', async (route) => {
        const req = route.request();
        if (req.url().includes('/api/learning-mobile/')) {
          if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
          if (req.url().includes('/auth'))
            return route.fulfill({
              headers,
              json: req.url().endsWith('/confirm')
                ? {
                    accessToken: 'synthetic',
                    refreshToken: 'synthetic',
                    expiresAt: Date.now() + 3600000,
                    sessionId: 'test',
                    remembered: false,
                  }
                : { challenge: 'synthetic', sessions: [] },
            });
          if (req.url().endsWith('/agent-studio')) {
            liveCalls++;
            return route.fulfill({
              status: 503,
              headers,
              json: {
                error: 'Live Studio is disabled on this server. Local testing remains available.',
              },
            });
          }
          return route.abort();
        }
        if (req.url().startsWith(origin)) return route.continue();
        return route.abort();
      });
      const login = async () => {
        await page.getByRole('textbox').first().fill('learner@example.invalid');
        await page.locator('input[type="password"]').fill('synthetic-only');
        await page
          .getByRole('button', {
            name: { en: 'Sign in', fr: 'Se connecter', ar: 'تسجيل الدخول' }[language],
            exact: true,
          })
          .click();
        await page
          .getByRole('button', {
            name: {
              en: 'No, just this session',
              fr: 'Non, cette session seulement',
              ar: 'لا، لهذه الجلسة فقط',
            }[language],
            exact: true,
          })
          .click();
      };
      const click = async (name) => page.getByRole('button', { name, exact: true }).click();
      await page.goto(origin + '/agent-studio');
      await login();
      await page.getByText('From a request to a responsible agent.', { exact: true }).waitFor();
      await page.screenshot({ path: `artifacts/agent-studio/${language}-${theme}-${width}.png` });
      assert(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2),
        'page overflow',
      );
      await click('Build my first agent');
      await page.getByLabel('Agent name', { exact: true }).fill('My tested tutor');
      for (let i = 0; i < 5; i++) await click('Next step');
      await click('Generate workflow from builder');
      await click('Validate and inspect configuration');
      await click('Open workflow editor');
      await click('Show connected graph');
      await click('Zoom in');
      await click('Zoom out');
      await click('Test this workflow');
      await page.getByText('Execution timeline · local-test · approval', { exact: true }).waitFor();
      await click('Show full trace');
      await click('Approve local step');
      await page.getByText('Execution timeline · local-test · complete', { exact: true }).waitFor();
      await click('Run local evaluation set');
      await page.getByText('PASS: approval gate pauses', { exact: true }).waitFor();
      await click('Save version with this run');
      await page.waitForFunction(
        () => JSON.parse(localStorage.getItem('lecomax-school-v1')).drafts['agent-studio.v2'],
      );
      await click('8. Portfolio');
      await page.getByText('My tested tutor · version 1', { exact: true }).waitFor();
      await click('Reopen version 1');
      await click('5. Debugger');
      await click('Tool failure: always');
      await click('Run local workflow');
      await page.getByText('Execution timeline · local-test · failed', { exact: true }).waitFor();
      assert.equal(liveCalls, 0);
      assert(await page.getByRole('button', { name: 'Run live model', exact: true }).isDisabled());
      await click('Allow these inputs to be sent to OpenAI');
      await click('Run live model');
      await page
        .getByText('Live Studio is disabled on this server. Local testing remains available.', {
          exact: true,
        })
        .first()
        .waitFor();
      assert.equal(liveCalls, 1);
      await page.getByLabel('Run input', { exact: true }).fill('New request');
      assert(await page.getByRole('button', { name: 'Run live model', exact: true }).isDisabled());
      await page.reload();
      await login();
      await click('8. Portfolio');
      await page.getByText('My tested tutor · version 1', { exact: true }).waitFor();
      assert.deepEqual(errors, []);
      results.push({
        language,
        theme,
        width,
        passed: true,
        auth: 'mocked',
        provider: 'mocked-disabled',
      });
      await context.close();
    }
    fs.writeFileSync(
      'artifacts/agent-studio/browser-results.json',
      JSON.stringify({ checkedAt: new Date().toISOString(), results }, null, 2),
    );
    console.log(JSON.stringify(results));
  } finally {
    await browser.close();
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
})().catch((e) => {
  console.error(e);
  server.close();
  process.exitCode = 1;
});
