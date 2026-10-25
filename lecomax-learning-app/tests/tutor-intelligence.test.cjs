const { test } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../scripts/inspect.cjs');
const { reply, teaching } = require('./fixtures/tutor.cjs');
const coach = load('lecomax-learning-app/utils/tutor-coach.ts');
const memory = load('lecomax-learning-app/utils/tutor-memory.ts');
const progress = load('lecomax-learning-app/utils/progress.ts');
const contract = load('lecomax-learning-app/utils/tutor-contract.ts');
const workspace = load('lib/tutor-workspace.ts');
function setup(phase = 'diagnosis') {
  const session = { ...memory.newTutorSession('Understand async/await', 'socratic', 1000), coach: { ...coach.newCoach(), phase, confidence: 'confident' } };
  const p = { ...progress.initial, tutor: { ...memory.emptyTutor(), active: session.id, sessions: [session] } };
  return coach.acceptCoach(p, session.id, { ...reply, teaching }, false, 1000);
}
const evaluate = (p, verdict, at = 2000) => coach.acceptCoach(p, p.tutor.active, { ...reply, teaching, evaluation: { concept: 'Promises', verdict, feedback: 'Await suspends this function, not every task.', misconception: 'Await blocks the whole program', nextExercise: 'Predict two concurrent operations.' } }, true, at, 'Await blocks every task.');

test('ambiguous diagnostic remains in diagnosis; wrong answer identifies a prerequisite without certifying mastery', () => {
  let p = evaluate(setup(), 'uncertain');
  assert.equal(p.tutor.sessions[0].coach.phase, 'diagnosis'); assert.equal(p.tutor.concepts.length, 0);
  p = evaluate(setup(), 'incorrect');
  const c = p.tutor.sessions[0].coach;
  assert.equal(c.phase, 'concept'); assert.equal(c.focus.missingPrerequisite, 'Promise resolution');
  assert.equal(c.outcomes[0].response, 'Await blocks every task.'); assert.equal(c.outcomes[0].confidence, 'confident');
  assert.equal(p.tutor.concepts[0].independent, 0); assert.equal(p.flashcards.events.length, 0);
  assert.equal(p.flashcards.cards[0].dueAt, 2000);
  const restored = progress.readProgress(JSON.stringify(p)); assert.equal(restored.tutor.sessions[0].coach.outcomes[0].question, teaching.question);
  assert(load('lib/academy-backup.ts').validateBackup({ revision: 0, snapshot: p }));
});
test('repeated misconceptions revisit concept; assisted verification cannot advance to recap', () => {
  let p = evaluate(setup('challenge'), 'incorrect');
  p = coach.acceptCoach(p, p.tutor.active, { ...reply, teaching }, false, 3000);
  p = evaluate(p, 'incorrect', 4000); assert.equal(p.tutor.sessions[0].coach.phase, 'concept');
  p = setup('mastery'); p.tutor.sessions[0].coach.hintsUsed = 1;
  p = evaluate(p, 'correct'); assert.equal(p.tutor.sessions[0].coach.phase, 'mastery');
  assert.equal(p.tutor.sessions[0].coach.outcomes[0].hintsUsed, 1);
  p = evaluate(setup('mastery'), 'correct'); assert.equal(p.tutor.sessions[0].coach.phase, 'recap');
});
test('typed teaching cards reject missing questions, fabricated kinds, invalid memory and graded reflections', () => {
  assert(contract.readTutorReply({ ...reply, teaching })); assert(contract.readTutorReply(reply), 'legacy migration');
  for (const patch of [{ kind: 'imaginary' }, { question: null }, { hints: Array(4).fill('hint') }, { kind: 'memory-card', memory: null }])
    assert.throws(() => contract.readTutorReply({ ...reply, teaching: { ...teaching, ...patch } }));
  assert.throws(() => contract.readTutorReply({ ...reply, teaching: { ...teaching, kind: 'reflection' }, evaluation: { concept: 'X', verdict: 'correct', feedback: 'X', misconception: 'X', nextExercise: 'X' } }));
});
test('bounded context stays valid JSON, retains pending question, and bounds answer history', () => {
  const bound = load('lecomax-learning-app/utils/tutor-context.ts').boundedTutorContext;
  const data = { coaching: { prompt: 'q'.repeat(2800), outcomes: Array.from({ length: 20 }, () => ({ question: 'q'.repeat(2000), response: 'r'.repeat(6000) })) }, currentLesson: { sections: Array(6).fill({ text: 'a'.repeat(4000) }) }, answers: Object.fromEntries(Array.from({ length: 100 }, (_, i) => [i, { choice: 1, correct: false }])) };
  const result = bound(data); assert(result.length <= 14000); assert.equal(JSON.parse(result).coaching.prompt.length, 2800);
  assert.equal(Object.keys(JSON.parse(result).answers).length, 8);
});
test('all requested strategies reach server validation and preserve uncertainty and verification limits', () => {
  for (const mode of ['socratic', 'beginner', 'expert', 'mistake', 'different', 'challenge', 'feynman', 'real-world', 'exam', 'memory', 'project', 'reflection']) {
    const input = workspace.readTutorInput({ mode, message: 'Help me understand', language: 'en' });
    const instructions = workspace.tutorInstructions(input);
    assert.match(instructions, /no browsing or execution tools/); assert.match(instructions, /uncertain/); assert.match(instructions, /async\/await/);
    assert.equal(memory.newTutorSession('Goal', mode).mode, mode);
  }
});
test('reflection persists without awarding attempts; malformed evidence cannot enter cloud storage', () => {
  let p = setup(); p.tutor.sessions[0].coach.reflection = { easy: 'Syntax', difficult: 'Promises', surprising: 'Concurrency', at: 1000 };
  assert.equal(progress.readProgress(JSON.stringify(p)).tutor.sessions[0].coach.reflection.difficult, 'Promises');
  assert.equal(p.tutor.concepts.length, 0);
  for (const patch of [{ hintsUsed: 4 }, { focus: false }, { reflection: null }]) {
    const invalid = structuredClone(p); Object.assign(invalid.tutor.sessions[0].coach, patch);
    assert.equal(load('lib/academy-backup.ts').validateBackup({ revision: 0, snapshot: invalid }), null);
  }
});
