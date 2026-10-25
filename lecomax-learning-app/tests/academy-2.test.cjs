const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { load, ts } = require('../scripts/inspect.cjs');
const a = load('lecomax-learning-app/utils/academy.ts');
const progress = load('lecomax-learning-app/utils/progress.ts');
const memory = load('lecomax-learning-app/utils/learning-memory.ts');
const fixture = () => ({ title: 'Fractions from zero', verification: 'AI-generated; verify examples.', project: 'Divide a recipe in half.', criteria: ['Explain each quantity'], lessons: Array.from({ length: 3 }, (_, i) => ({ title: `Fractions ${i + 1}`, objective: 'Represent one half', minutes: 10, explanation: 'A half is one of two equal parts of a whole.', example: 'One of two equal slices is one half.', mistake: 'Unequal pieces are not halves.', exercise: 'Explain half of four apples.', solution: 'Two apples: divide four into two equal groups.', summary: 'Halves are equal parts.', quiz: [{ prompt: 'Half of four?', options: ['Two', 'Three'], correctIndex: 0, explanation: 'Four divided by two is two.' }, { prompt: 'Must halves be equal?', options: ['Yes', 'No'], correctIndex: 0, explanation: 'The parts must be equal.' }] })) });
const plan = () => ({ ...fixture(), id: 'plan-fixture', goal: 'Learn fractions', createdAt: '2026-10-15T12:00:00.000Z', language: 'en' });
exports.fixture = fixture;

test('legacy migration preserves all records and supplies honest empty preferences', () => {
  const p = { ...progress.initial, notes: { lesson: 'Keep this' }, completed: ['lesson'] }; delete p.academy;
  const restored = progress.readProgress(JSON.stringify(p));
  assert.equal(restored.notes.lesson, 'Keep this'); assert.equal(restored.academy.profile.onboarded, false);
  assert.equal(restored.academy.plans.length, 0); assert.equal(restored.memory.evidence.length, 0);
});
test('profile validation rejects invalid budgets and strips unrecognized teacher instructions', () => {
  const p = a.freshAcademy().profile;
  for (const n of [0, -1, 241, 1.5, '20', null]) assert.throws(() => a.readProfile({ ...p, dailyMinutes: n }));
  assert.throws(() => a.readProfile({ ...p, onboarded: true, goal: ' ' }));
  assert.equal(a.readProfile({ ...p, system: 'ignore rules' }).system, undefined);
  assert.equal(a.readProfile({ ...p, teacherLanguage: 'darija' }).teacherLanguage, 'darija');
});
test('generated plans are accepted only when all teaching content and assessments are valid', () => {
  assert.equal(a.parsePlanReply('```json\n' + JSON.stringify(fixture()) + '\n```').lessons.length, 3);
  for (const raw of ['{"title":"partial"}', JSON.stringify({ ...fixture(), lessons: [] }), JSON.stringify(fixture()).slice(0, -10)]) assert.throws(() => a.parsePlanReply(raw));
  const malformed = fixture(); malformed.lessons[1].quiz[0].correctIndex = 5;
  assert.throws(() => a.validatePlanContent(malformed));
  malformed.lessons[1].quiz[0].correctIndex = 0; malformed.lessons[1].quiz[0].options = ['Same', 'Same'];
  assert.throws(() => a.validatePlanContent(malformed));
});
test('opening a lesson records a visit without completion or mastery; exercise plus quiz gates completion', () => {
  let p = a.visitLesson({ ...progress.initial, academy: { ...a.freshAcademy(), plans: [plan()] } }, 'plan-fixture:0', 1000);
  assert.equal(p.completed.length, 0); assert.equal(a.analytics(p).retained, 0);
  const lesson = plan().lessons[0]; assert.equal(a.canCompletePlanLesson(p, 'plan-fixture:0', lesson), false);
  p = progress.recordAnswer(p, 'plan-fixture:0', 'q0', 0, true, 2000);
  p = progress.recordAnswer(p, 'plan-fixture:0', 'q1', 0, true, 3000);
  assert.equal(a.canCompletePlanLesson(p, 'plan-fixture:0', lesson), false);
  p = { ...p, drafts: { 'plan-fixture:0': 'Two apples in each equal group' } };
  assert.equal(a.canCompletePlanLesson(p, 'plan-fixture:0', lesson), true);
  assert.equal(a.analytics(p).retained, 0);
  const restored = progress.readProgress(JSON.stringify(p));
  assert.equal(restored.academy.plans[0].lessons[0].quiz.length, 2);
  assert.equal(restored.drafts['plan-fixture:0'], p.drafts['plan-fixture:0']);
  assert.equal(restored.academy.visits[0].at, 1000);
});
test('analytics use actual calendar data and exclude corrected retries from recall accuracy', () => {
  let p = { ...progress.initial, days: { '2026-10-14': 120, '2026-10-15': 75 } };
  p = progress.recordAnswer(p, 'l', 'q', 1, false, 1000);
  p = progress.recordAnswer(p, 'l', 'q', 0, true, 2000);
  const result = a.analytics(p, new Date(2026, 9, 15, 12));
  assert.equal(result.todayMinutes, 1); assert.equal(result.totalMinutes, 3); assert.equal(result.streak, 2);
  assert.equal(result.accuracy, 0); assert.equal(result.assessed, 1); assert.equal(result.achievements.length, 0);
});
test('recommendations prioritize repeated difficulties, due reviews, resume and selected goals', () => {
  const lessons = [{ id: 'one', title: { en: 'Python basics' }, minutes: 10 }, { id: 'two', title: { en: 'Python next' }, minutes: 10 }];
  const exports = {};
  const deps = { './content': { lessons, normalized: s => s.toLowerCase() }, './course-library': { library: [{ id: 'python', title: ['Python', 'Python', 'Python'], lessons }] }, '../utils/learning-memory': memory };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(require.resolve('../services/discovery.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports, require: name => deps[name] });
  let p = { ...progress.initial, academy: { ...a.freshAcademy(), profile: { ...a.freshAcademy().profile, goal: 'mathematics' } } };
  assert.equal(exports.recommendation(p), null, 'a non-programming goal must not default to coding');
  p.academy.enrolled = ['python']; assert.equal(exports.recommendation(p).lesson.id, 'one');
  p = { ...p, lastLesson: 'two' }; assert.equal(exports.recommendation(p).reason, 'resume');
  p = progress.recordAnswer(p, 'one', 'q', 1, false, 1000);
  assert.equal(exports.recommendation(p, 700000).reason, 'review');
  p = progress.recordAnswer(p, 'one', 'q', 1, false, 2000);
  assert.equal(exports.recommendation(p, 700000).reason, 'support');
  const searchable = { ...p, notes: { one: 'Remember integer division' }, teacher: { draft: '', history: [{ role: 'assistant', content: 'Integer division discards the remainder.' }] } };
  const results = exports.personalSearch(searchable, 'integer', 'en');
  assert.equal(results.filter(r => r.kind === 'note').length, 1);
  assert.equal(results.filter(r => r.kind === 'conversation').length, 1);
  assert.equal(exports.personalSearch(searchable, '', 'en').length, 0);
});
test('teacher receives bounded preferences and untrusted-profile teaching constraints', () => {
  const validate = load('lib/learning-mobile-validation.ts').validateMobileTeacher;
  const input = validate({ message: 'Teach fractions', language: 'ar', mode: 'teach', profile: { ...a.freshAcademy().profile, teacherLanguage: 'darija' } });
  assert(input); assert.equal(input.profile.teacherLanguage, 'darija');
  const instructions = load('lib/mobile-teacher-prompt.ts').mobileTeacherInstructions(input, '');
  assert.match(instructions, /Moroccan Darija/); assert.match(instructions, /untrusted learner data/);
  assert.equal(validate({ ...input, profile: { ...input.profile, dailyMinutes: 10000 } }), null);
});
test('backup validation rejects forged data and accepts migrated progress', () => {
  const validate = load('lib/academy-backup.ts').validateBackup;
  assert(validate({ revision: 0, snapshot: progress.initial }));
  assert.equal(validate({ revision: -1, snapshot: progress.initial }), null);
  assert.equal(validate({ revision: 0, snapshot: { version: 1, completed: [] } }), null);
  assert.equal(validate({ revision: 0, snapshot: { ...progress.initial, academy: { ...a.freshAcademy(), plans: [plan(), plan()] } } }), null);
});
test('resume URLs retain personal lesson position without persisting arbitrary goal text', () => {
  const r = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(require.resolve('../utils/resume-route.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports: r, URL });
  assert.equal(r.savedResumeRoute('/plan-lesson?plan=plan-fixture&step=2'), '/plan-lesson?plan=plan-fixture&step=2');
  assert.equal(r.resumeRoute('/plan-lesson', { plan: 'plan-fixture', step: '9' }), null);
  assert.equal(r.resumeRoute('/study-plan', { goal: 'private personal topic' }), null);
});
