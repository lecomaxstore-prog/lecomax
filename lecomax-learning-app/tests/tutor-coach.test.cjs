const { test } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../scripts/inspect.cjs');
const c = load('lecomax-learning-app/utils/tutor-coach.ts');
const m = load('lecomax-learning-app/utils/tutor-memory.ts');
const p = load('lecomax-learning-app/utils/progress.ts');
const { reply, quiz } = require('./fixtures/tutor.cjs');
const state = () => { const s = { ...m.newTutorSession('Fractions', 'zero', 1000), coach: c.newCoach() }; return { ...p.initial, tutor: { ...m.emptyTutor(), active: s.id, sessions: [s] } }; };
const feedback = verdict => ({ ...reply, evaluation: { concept: 'Fractions', verdict, feedback: 'Two equal parts make a whole.', misconception: 'Unequal pieces', nextExercise: 'Divide six apples equally.' } });
test('guided cycle waits, diagnoses, remediates mistakes and completes only after responses', () => {
  let s = state(); const id = s.tutor.active;
  s = c.acceptCoach(s, id, reply, false, 1000);
  assert.equal(s.tutor.sessions[0].coach.awaiting, true);
  assert.throws(() => c.acceptCoach(s, id, reply, true, 2000));
  s = c.acceptCoach(s, id, feedback('incorrect'), true, 2000);
  assert.equal(s.tutor.sessions[0].coach.phase, 'concept');
  assert.equal(s.flashcards.cards[0].dueAt, 2000);
  assert.equal(s.tutor.concepts[0].independent, 0);
  assert.equal(c.acceptCoach(s, id, feedback('correct'), true, 2500), s);
  s = c.acceptCoach(s, id, reply, false, 3000);
  s = c.acceptCoach(s, id, feedback('partial'), true, 4000);
  assert.equal(s.tutor.sessions[0].coach.phase, 'concept');
  for (let i = 0; i < 4; i++) { s = c.acceptCoach(s, id, reply, false, 5000 + i*2000); s = c.acceptCoach(s, id, feedback('correct'), true, 6000 + i*2000); }
  assert.equal(s.tutor.sessions[0].coach.phase, 'recap');
  assert.equal(s.tutor.concepts[0].independent, 0);
  const restored = p.readProgress(JSON.stringify(s));
  assert.equal(restored.tutor.sessions[0].coach.outcomes.length, 6);
  assert.equal(restored.flashcards.events.length, 0, 'AI assessment is not a self-rated recall');
});
test('uncertain AI feedback does not create false failure or schedule an unverified answer', () => {
  let s = state(); const id=s.tutor.active;
  s = c.acceptCoach(s,id,reply,false,1000);
  s = c.acceptCoach(s,id,feedback('uncertain'),true,2000);
  assert.equal(s.tutor.concepts.length,0); assert.equal(s.flashcards.cards.length,0);
});
test('quiz review deduplicates answer taps and preserves generated answer provenance', () => {
  let s=state(); const id=s.tutor.active;
  s=c.saveTutorReview(s,id,quiz,false,1000);
  s=c.saveTutorReview(s,id,quiz,true,2000);
  assert.equal(s.flashcards.cards.length,1); assert.equal(s.flashcards.events.length,1);
  assert.match(s.flashcards.cards[0].answer,/AI answer key/);
  assert.equal(s.flashcards.cards[0].dueAt,601000);
});
test('malformed coaching state is rejected while legacy sessions migrate', () => {
  let s=state(); s.tutor.sessions[0].coach.phase='imaginary';
  assert.throws(() => p.readProgress(JSON.stringify(s)));
  delete s.tutor.sessions[0].coach;
  assert.equal(p.readProgress(JSON.stringify(s)).tutor.sessions.length,1);
});

test('exam outcomes schedule review once and privacy deletion removes only tutor cards', () => {
  let s=state(); const session=s.tutor.sessions[0]; session.examDeadline=1000; session.reply={...reply,quiz:[quiz]};
  s=c.finishTutorExam(s,session.id,2000);
  assert.equal(s.flashcards.cards.length,1); assert.equal(s.tutor.concepts[0].attempts,1);
  assert.equal(c.finishTutorExam(s,session.id,3000),s);
  s=c.removeTutorCards(s,session.id); assert.equal(s.flashcards.cards.length,0); assert.equal(s.flashcards.events.length,0);
  assert.equal(p.readProgress(JSON.stringify(s)).tutor.sessions.length,1);
});
test('server teaching contract requests one question, waits and distinguishes uncertain feedback', () => {
  const w=load('lib/tutor-workspace.ts'); const text=w.tutorInstructions(w.readTutorInput({mode:'zero',language:'en',message:'Teach',action:'coach:diagnosis'}));
  assert.match(text,/exactly one short prior-knowledge question and STOP/);
  assert.match(text,/never advance on your own/); assert.match(text,/Uncertainty is not failure/); assert.match(text,/no browsing or execution tools/);
});
