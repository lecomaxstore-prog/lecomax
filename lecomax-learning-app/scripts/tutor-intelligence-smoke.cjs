// Disposable profiles and synthetic transport. Never connects to a real account or AI provider.
const { chromium } = require('playwright');
const fs = require('node:fs'); const path = require('node:path'); const http = require('node:http');
const assert = require('node:assert/strict');
const { load } = require('./inspect.cjs');
const { reply, teaching } = require('../tests/fixtures/tutor.cjs');
const { initial } = load('lecomax-learning-app/utils/progress.ts');
const { newTutorSession, emptyTutor } = load('lecomax-learning-app/utils/tutor-memory.ts');
const { newCoach } = load('lecomax-learning-app/utils/tutor-coach.ts');
const root = path.resolve(__dirname, '../dist-tutor-intelligence-check');
const server = http.createServer((req, res) => {
  const candidate = path.resolve(root, '.' + new URL(req.url, 'http://localhost').pathname);
  if (!candidate.startsWith(root + path.sep)) { res.writeHead(403); res.end(); return; }
  const file = fs.existsSync(candidate) && fs.statSync(candidate).isFile() ? candidate : path.join(root, 'index.html');
  res.setHeader('Content-Type', ({ '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.ttf': 'font/ttf', '.png': 'image/png' })[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});
async function main() {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    for (const language of ['en', 'fr', 'ar']) {
      const words = {
        en: ['Email address', 'Password', 'Sign in', 'No, just this session', 'Next teaching hint', 'What felt difficult?', 'Your question, answer, or attempt…', 'Send', 'Change teaching mode', 'Expert mode', 'Reflect on my evidence', 'Tutor cloud backup', 'Check cloud backup', 'Save this device to cloud', 'Restore to this device', 'Confirm'],
        fr: ['Adresse e-mail', 'Mot de passe', 'Se connecter', 'Non, cette session seulement', 'Indice suivant', 'Ce qui était difficile', 'Votre question, réponse ou tentative…', 'Envoyer', 'Changer de stratégie', 'Mode expert', 'Comparer avec mes réponses', 'Sauvegarde cloud du tutorat', 'Vérifier la sauvegarde cloud', 'Enregistrer cet appareil dans le cloud', 'Restaurer sur cet appareil', 'Confirmer'],
        ar: ['البريد الإلكتروني', 'كلمة المرور', 'تسجيل الدخول', 'لا، لهذه الجلسة فقط', 'التلميح التعليمي التالي', 'ما الذي كان صعبًا؟', 'سؤالك أو إجابتك أو محاولتك…', 'إرسال', 'غيّر طريقة التعليم', 'وضع الخبير', 'قارن مع إجاباتي', 'نسخة سحابية للتدريس', 'تحقّق من النسخة السحابية', 'احفظ هذا الجهاز في السحابة', 'استعد على هذا الجهاز', 'تأكيد'],
      }[language];
      const session = { ...newTutorSession('Understand async/await', 'socratic', 1000), coach: { ...newCoach(), awaiting: true, prompt: teaching.question }, reply: { ...reply, teaching, lesson: null, quiz: [], revision: [], roadmap: [] } };
      const seed = { ...initial, language, tutor: { ...emptyTutor(), active: session.id, sessions: [session] } };
      const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
      await context.addInitScript(state => { if (!localStorage.getItem('lecomax-school-v1')) localStorage.setItem('lecomax-school-v1', JSON.stringify(state)); }, seed);
      const page = await context.newPage(); const errors = []; let backup = null; let revision = 0; const requests = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.route('**/*', async route => {
        const req = route.request(); if (req.url().startsWith(origin)) return route.continue();
        if (!req.url().includes('/api/learning-mobile/')) return route.abort();
        const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization,content-type', 'access-control-allow-methods': 'POST,PUT,GET,OPTIONS' };
        if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
        if (req.url().endsWith('/progress')) {
          if (req.method() === 'PUT') { const body = req.postDataJSON(); assert.equal(body.revision, revision); backup = body.snapshot; revision++; }
          return route.fulfill({ headers, json: { revision, snapshot: backup, updated_at: new Date().toISOString() } });
        }
        if (req.url().endsWith('/tutor')) {
          const body = req.postDataJSON(); requests.push(body);
          const answer = { ...reply, lesson: null, quiz: [], roadmap: [], revision: [], teaching: { ...teaching, kind: body.action === 'coach:reflection' ? 'reflection' : 'explanation', body: 'Other tasks may run while this async function waits.', nextActivity: 'Predict one concurrent task.' }, evaluation: body.action === 'coach:answer' ? { concept: 'Promises', verdict: 'incorrect', feedback: 'Await pauses this function only.', misconception: 'Global blocking', nextExercise: 'Predict concurrent tasks.' } : null };
          return route.fulfill({ headers, json: { reply: answer, model: 'synthetic-fixture' } });
        }
        return route.fulfill({ headers, json: req.url().endsWith('/confirm') ? { accessToken: 'synthetic', refreshToken: 'synthetic', expiresAt: Date.now() + 3600000, sessionId: 'test', remembered: false } : { challenge: 'synthetic', sessions: [] } });
      });
      const click = name => page.getByRole('button', { name, exact: true }).click();
      const login = async () => {
        await page.getByLabel(words[0], { exact: true }).fill('learner@example.invalid');
        await page.getByLabel(words[1], { exact: true }).fill('synthetic-password');
        await click(words[2]); await click(words[3]);
      };
      await page.goto(origin + '/tutor'); await login();
      await page.getByText(teaching.question, { exact: true }).waitFor();
      const verificationLabel = { en: 'How to check this answer', fr: 'Comment vérifier cette réponse', ar: 'كيف تتحقق من هذه الإجابة' }[language];
      const beforeVerification = await page.evaluate(() => JSON.parse(localStorage.getItem('lecomax-school-v1')).tutor);
      await click(verificationLabel);
      await page.getByRole('button', { name: 'JavaScript', exact: true }).waitFor();
      await page.getByRole('button', { name: 'Python', exact: true }).waitFor();
      for (const [width, height] of [[320, 568], [390, 844], [844, 390], [768, 1024]]) {
        await page.setViewportSize({ width, height });
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${language}/${width} overflow`);
      }
      await page.setViewportSize({ width: 390, height: 844 });
      await page.getByRole('button', { name: verificationLabel, exact: true }).scrollIntoViewIfNeeded();
      await page.screenshot({ path: `artifacts/tutor-verification-${language}.png` });
      assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('lecomax-school-v1')).tutor), beforeVerification);
      await click(verificationLabel);
      await click(words[4]); await page.getByText(teaching.hints[0], { exact: true }).waitFor();
      assert.equal(await page.getByText(teaching.hints[1], { exact: true }).count(), 0);
      await page.getByText(teaching.objective, { exact: true }).scrollIntoViewIfNeeded();
      await page.screenshot({ path: `artifacts/tutor-intelligence-${language}.png` });
      await page.getByRole('textbox', { name: words[5], exact: true }).fill('Promise resolution');
      await page.waitForFunction(() => JSON.parse(localStorage.getItem('lecomax-school-v1')).tutor.sessions[0].coach.reflection?.difficult === 'Promise resolution');
      await page.reload(); await login();
      await page.getByText(teaching.hints[0], { exact: true }).waitFor();
      await page.getByRole('textbox', { name: words[6], exact: true }).fill('Await blocks every task.'); await click(words[7]);
      await page.waitForFunction(() => JSON.parse(localStorage.getItem('lecomax-school-v1')).tutor.sessions[0].coach.outcomes.length === 1);
      assert.equal(requests.at(-1).action, 'coach:answer');
      await click(words[10]);
      await page.waitForFunction(() => JSON.parse(localStorage.getItem('lecomax-school-v1')).tutor.sessions[0].reply.teaching.kind === 'reflection');
      await click(words[8]); await click(words[9]);
      await click(words[11]); await click(words[12]); await click(words[13]);
      await page.waitForFunction(() => document.body.textContent.includes('Cloud backup saved.') || document.body.textContent.includes('Sauvegarde enregistrée.') || document.body.textContent.includes('حُفظت النسخة السحابية.'));
      assert.equal(backup.tutor.sessions[0].coach.outcomes[0].response, 'Await blocks every task.');
      assert.equal(backup.tutor.sessions[0].mode, 'expert'); assert.equal(backup.flashcards.events.length, 0);
      await page.getByRole('textbox', { name: words[5], exact: true }).fill('Local newer draft');
      await click(words[14]); await click(words[15]);
      await page.waitForFunction(() => JSON.parse(localStorage.getItem('lecomax-school-v1')).tutor.sessions[0].coach.reflection.difficult === 'Promise resolution');
      assert.deepEqual(errors, []); await context.close();
      console.log(`PASS ${language}: typed cards, hints, persistence, assessment, reflection, mode change, cloud save/restore through mocked transport`);
    }
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => server.close());
