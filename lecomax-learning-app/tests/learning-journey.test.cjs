const { test } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../scripts/inspect.cjs');
const { plan } = require('./fixtures/learning-journey.cjs');
const academy = load('lecomax-learning-app/utils/academy.ts');
const progress = load('lecomax-learning-app/utils/progress.ts');
const journey = load('lecomax-learning-app/utils/learning-journey.ts');
const fresh = () => ({ ...progress.initial, academy: { ...academy.freshAcademy(), plans: [plan()] } });
const diagnosed = () => [0, 1, 2].reduce((p, i) => journey.recordDiagnostic(p, 'plan-journey', i, 1, 'certain', 1000), fresh());

test('course design rejects cycles, dangling links, duplicate dependencies and reused quiz questions', () => {
  assert(academy.validatePlanContent(plan()).design);
  for (const deps of [[[0], [0], [1]], [[], [2], [1]], [[], [0, 0], [1]], [[], [-1], [1]], [[], [0]]]) {
    const bad = plan(); bad.design.prerequisites = deps; assert.throws(() => academy.validatePlanContent(bad));
  }
  const bad = plan(); bad.design.diagnostic[0] = bad.lessons[0].quiz[0]; assert.throws(() => academy.validatePlanContent(bad));
  bad.design.diagnostic = []; assert.throws(() => academy.validatePlanContent(bad));
  const legacy = plan(); delete legacy.design; assert(academy.validatePlanContent(legacy));
});
test('baseline is immutable, survives reload and cannot award completion, recall, or mastery', () => {
  let p = journey.recordDiagnostic(fresh(), 'plan-journey', 0, 1, 'certain', 1000);
  assert.equal(journey.recordDiagnostic(p, 'plan-journey', 0, 0, 'unsure', 2000), p);
  p = progress.readProgress(JSON.stringify(p));
  assert.equal(p.academy.diagnostics['plan-journey:0'].choice, 1);
  assert.equal(p.memory.evidence.length, 0); assert.equal(p.completed.length, 0);
  assert.equal(journey.journeyRecommendation(p, plan()).index, 1);
  for (const choice of [-1, 2, 0.5, NaN]) assert.throws(() => journey.recordDiagnostic(p, 'plan-journey', 1, choice, 'certain'));
  assert.throws(() => journey.recordDiagnostic(p, 'plan-journey', 1, 0, 'invented'));
  p.academy.diagnostics['unknown:0'] = { choice: 0, confidence: 'certain', at: 1 };
  assert.throws(() => progress.readProgress(JSON.stringify(p)));
  assert.equal(load('lib/academy-backup.ts').validateBackup({ revision: 0, snapshot: p }), null);
});
test('learner scenarios: no single-error difficulty change, repeated mistakes revisit prerequisites, due review, project', () => {
  let p = diagnosed();
  assert.equal(journey.journeyRecommendation(p, plan(), 2000).reason, 'starting-gap');
  p = progress.recordAnswer(p, 'plan-journey:2', 'q0', 1, false, 2000);
  assert.equal(journey.journeyRecommendation(p, plan(), 2001).state, 'EXPLAIN');
  p = progress.recordAnswer(p, 'plan-journey:2', 'q0', 1, false, 3000);
  assert.equal(journey.journeyRecommendation(p, plan(), 3001).reason, 'prerequisite');
  assert.equal(journey.journeyRecommendation(p, plan(), 3001).index, 1);
  p = { ...p, completed: ['plan-journey:1'] };
  assert.equal(journey.journeyRecommendation(p, plan(), 3001).reason, 'repeated-errors');
  p = progress.recordAnswer(diagnosed(), 'plan-journey:0', 'q0', 0, true, 1000);
  assert.equal(journey.journeyRecommendation(p, plan(), 86401000).state, 'REVIEW');
  p = { ...diagnosed(), completed: [0, 1, 2].map(i => `plan-journey:${i}`) };
  assert.equal(journey.journeyRecommendation(p, plan()).state, 'ADVANCE');
  assert.equal(load('lib/academy-backup.ts').validateBackup({ revision: 0, snapshot: p }).snapshot.academy.diagnostics['plan-journey:0'].confidence, 'certain');
});

test('generation uses the existing teacher and rejects incomplete designs or provider errors without a fallback course', async () => {
  const fs = require('node:fs'); const vm = require('node:vm');
  const { ts } = require('../scripts/inspect.cjs');
  let response = plan(); let request; let failure = false;
  const exports = {};
  const deps = { '../utils/academy': academy, './teacher': { askTeacherReply: async (...args) => {
    request = args; if (failure) throw new Error('TEACHER_UNAVAILABLE'); return { answer: JSON.stringify(response) };
  } } };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(require.resolve('../services/study-plan.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports, require: name => deps[name] });
  const signal = new AbortController().signal;
  const result = await exports.generateStudyPlan('Become a developer', academy.freshAcademy().profile, signal);
  assert.equal(result.design.version, 1); assert.equal(result.goal, 'Become a developer'); assert.match(result.id, /^plan-/);
  assert.equal(request[5].signal, signal); assert.match(request[0], /DIFFERENT question/);
  assert.equal(request[2], 'study-plan');
  assert.match(request[0], /Field character limits/);
  response = plan(); delete response.design;
  await assert.rejects(exports.generateStudyPlan('Goal', academy.freshAcademy().profile, signal), /Missing learning design/);
  response = plan(); response.design.prerequisites[0] = [2];
  await assert.rejects(exports.generateStudyPlan('Goal', academy.freshAcademy().profile, signal), /Invalid learning design/);
  failure = true;
  await assert.rejects(exports.generateStudyPlan('Goal', academy.freshAcademy().profile, signal), /TEACHER_UNAVAILABLE/);
});

test('course generation has a dedicated contract and supports English subjects with Arabic explanations', () => {
  const { validateMobileTeacher } = load('lib/learning-mobile-validation.ts');
  const { mobileTeacherInstructions } = load('lib/mobile-teacher-prompt.ts');
  const input = validateMobileTeacher({ message: 'English', mode: 'study-plan', language: 'ar', profile: academy.freshAcademy().profile });
  assert(input);
  const instructions = mobileTeacherInstructions(input, '');
  assert.match(instructions, /ONLY the complete JSON/);
  assert.match(instructions, /Modern Standard Arabic/);
  assert.match(instructions, /target-language words/);
  assert.doesNotMatch(instructions, /200–450 words/);
  assert.equal(validateMobileTeacher({ ...input, mode: 'unknown' }), null);
  assert.match(mobileTeacherInstructions({ ...input, mode: 'teach' }, ''), /TEACHING CONTRACT/);
});
