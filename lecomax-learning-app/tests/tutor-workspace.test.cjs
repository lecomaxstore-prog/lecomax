const { test } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../scripts/inspect.cjs');
const { reply, quiz } = require('./fixtures/tutor.cjs');
const contract = load('lecomax-learning-app/utils/tutor-contract.ts');
const memory = load('lecomax-learning-app/utils/tutor-memory.ts');
const progress = load('lecomax-learning-app/utils/progress.ts');
const workspace = load('lib/tutor-workspace.ts');
const clone = value => JSON.parse(JSON.stringify(value));
test('stream preview decodes escaped characters and withholds unfinished escapes', () => {
  const { partialTutorAnswer } = load('lecomax-learning-app/utils/tutor-stream.ts');
  const json = JSON.stringify({ answer: 'Hello "learner"\nمرحبا', summary: 'private metadata' });
  assert.equal(partialTutorAnswer(json), 'Hello "learner"\nمرحبا'); assert.equal(partialTutorAnswer('{"answer":"A\\u00'), 'A'); assert.equal(partialTutorAnswer('{"summary":"first"'), '');
});
test('structured contracts reject malformed lessons, ambiguous quizzes and extra fields', () => {
  assert.equal(contract.readTutorReply(reply).lesson.title, 'Equal groups');
  for (const mutate of [r => { r.lesson.sections = []; }, r => { r.lesson.assessment[0].correctIndex = 4; }, r => { r.lesson.assessment[0].options = ['Two', 'two']; }, r => { r.lesson.assessment.push(r.lesson.assessment[0]); }, r => { r.evaluation = { verdict: 'perfect' }; }, r => { r.untrusted = 'extra'; }, r => { r.answer = 'x'.repeat(12001); }]) {
    const r = clone(reply); mutate(r); assert.throws(() => contract.readTutorReply(r));
  }
});
test('all tutor modes have distinct teaching instructions and validated bounded context', () => {
  const prompts = contract.tutorModes.map(mode => workspace.tutorInstructions(workspace.readTutorInput({ mode, language: 'en', message: 'Teach algebra' })));
  assert.equal(new Set(prompts).size, 17); assert.match(prompts[2], /one useful question/); assert.match(prompts[2], /explicitly asked/); assert.match(prompts[5], /never claim to hear audio/);
  for (const patch of [{ mode: 'fake' }, { context: 'x'.repeat(14001) }, { history: Array(7).fill({ role: 'user', content: 'a' }) }, { conversationLanguage: 'unsupported' }, { exam: { type: 'exam', minutes: -1, target: 'A', difficulty: 'beginner' } }]) assert.throws(() => workspace.readTutorInput({ mode: 'zero', language: 'en', message: 'Teach', ...patch }));
});
test('attachments reject remote URLs, unsupported types, oversized and empty content', () => {
  assert.equal(contract.readAttachment({ name: 'notes.txt', mime: 'text/plain', data: 'Equal parts' }).data, 'Equal parts');
  for (const a of [{ name: 'x', mime: 'image/jpeg', data: 'https://private.local' }, { name: 'x', mime: 'text/html', data: '<script>' }, { name: 'x', mime: 'text/plain', data: 'x'.repeat(20001) }, { name: 'x', mime: 'text/plain', data: '' }]) assert.throws(() => contract.readAttachment(a));
});
test('legacy progress migrates and sessions, drafts, lesson stage and answers survive serialization', () => {
  const old = clone(progress.initial); delete old.tutor; assert.equal(progress.readProgress(JSON.stringify(old)).tutor.sessions.length, 0);
  const s = memory.newTutorSession('Fractions', 'zero', 1000); Object.assign(s, { reply, lesson: reply.lesson, stage: 2, draft: 'My attempt', summary: reply.summary, answers: { 'fractions-1:half': { choice: 1, correct: false, attempts: 1, revealed: false } } });
  old.tutor = { ...memory.emptyTutor(), active: s.id, sessions: [s] };
  const restored = progress.readProgress(JSON.stringify(old)); assert.equal(restored.tutor.sessions[0].draft, 'My attempt'); assert.equal(restored.tutor.sessions[0].stage, 2); assert.equal(restored.tutor.sessions[0].answers['fractions-1:half'].correct, false);
  old.tutor.sessions[0].stage = 99; assert.throws(() => progress.readProgress(JSON.stringify(old)));
});
test('wrong answers and same-day retries never create independent mastery', () => {
  let m = memory.recordConcept(memory.emptyTutor(), 'Fractions', false, true, 'Unequal groups', 'Split six', 1000);
  m = memory.recordConcept(m, 'Fractions', true, false, '', 'Split eight', 2000);
  assert.equal(m.concepts[0].independent, 0); assert.equal(memory.conceptEstimate(m.concepts[0]).mastery, 0);
  m = memory.recordConcept(m, 'Fractions', true, true, '', 'Split ten', 86403000);
  assert.equal(m.concepts[0].independent, 1); assert(m.concepts[0].due > m.concepts[0].lastReview);
});
test('clarification preserves roadmap, current lesson and stage while bounding conversation size', () => {
  let s = memory.acceptTutorReply(memory.newTutorSession('Fractions', 'zero'), reply, 'Teach me', ''); s.stage = 2;
  s = memory.acceptTutorReply(s, { ...reply, lesson: null, roadmap: [], revision: [] }, 'Explain differently', '');
  assert.equal(s.stage, 2); assert.equal(s.lesson.lessonId, 'fractions-1'); assert.equal(s.reply.roadmap.length, 1); assert.equal(s.reply.lesson, null);
  for (let i = 0; i < 20; i++) s = memory.acceptTutorReply(s, { ...reply, answer: 'A'.repeat(12000), lesson: null }, 'B'.repeat(6000), '');
  assert(JSON.stringify(s).length <= 80000); assert(s.messages.length <= 12); assert.equal(memory.readTutorMemory({ ...memory.emptyTutor(), active: s.id, sessions: [s] }).sessions[0].stage, 2);
});
test('exam submission records unanswered questions and is idempotent after reopening', () => {
  const s = memory.newTutorSession('Fractions', 'exam'); s.reply = { ...reply, quiz: [quiz] }; s.examDeadline = 1000;
  const m = { ...memory.emptyTutor(), active: s.id, sessions: [s] };
  const done = memory.submitTutorExam(m, s.id, 2000); assert.equal(done.concepts[0].attempts, 1); assert.equal(done.concepts[0].correct, 0); assert.equal(done.sessions[0].examSubmitted, true);
  assert.equal(memory.submitTutorExam(done, s.id, 3000), done);
});
test('compact memory is bounded and ranks the current topic before unrelated history', () => {
  let m = memory.emptyTutor(); for (let i = 0; i < 15; i++) m = memory.recordConcept(m, 'Topic ' + i, false, true, 'error', 'practice', i + 1);
  const context = memory.compactTutorMemory(m, 'Topic 0'); assert.equal(context.length, 8); assert(context.every(c => c.estimate.confidence === 'low'));
});
