const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../scripts/inspect.cjs');
const model = load('lecomax-learning-app/features/interactive/model.ts');
test('expression parser handles precedence, signs, fractions and functions', () => {
  for (const [source, expected] of [['2+3*4',14],['-2^2',-4],['2^-2',0.25],['2^3^2',512],['sqrt(9)+abs(-4)',7],['sin(pi/2)',1],['12/3',4]]) assert.equal(model.calculate(source), expected);
  assert.equal(model.calculate('x^2', -3),9);
});
test('math parser rejects executable input, incomplete expressions and nonfinite results', () => {
  for (const source of ['globalThis.alert(1)','x.constructor','1/0','sqrt(-1)','2+','(2','2 3','2**3','1e999','']) assert.throws(() => model.calculate(source),source);
});
test('assessment keys grade precisely and reject wrong numerical answers', () => {
  for (const question of model.quizQuestions) { assert.equal(model.gradeAnswer(question,question.answer),true); assert.equal(model.gradeAnswer(question,''),false); assert.equal(model.gradeAnswer(question,'wrong'),false); }
  const q=model.quizQuestions.find(q=>q.kind==='number'); assert.equal(model.gradeAnswer(q,'12 / 3'),true); assert.equal(model.gradeAnswer(q,'4.1'),false);
  const matching=model.quizQuestions.find(q=>q.kind==='matching');assert.equal(model.gradeAnswer(matching,'CSS=style,JavaScript=behavior,HTML=structure'),true);
});
test('SM-2 review transitions preserve persistent dates and reset on lapse', () => {
  const card=model.cardsFromNotes('Q :: A','Deck',100)[0];
  let next=model.reviewCard(card,'good',100);assert.equal(next.interval,1);assert.equal(next.due,86400100);
  next=model.reviewCard(next,'good',next.due);assert.equal(next.interval,6);
  next=model.reviewCard(next,'easy',next.due);assert.equal(next.interval,15);
  next=model.reviewCard(next,'again',200);assert.equal(next.due,60200);assert.equal(next.repetitions,0);assert.equal(next.lapses,1);assert.equal(card.reviews,0);
});
test('notes conversion keeps exact sourced answers and ignores unstructured lines',()=> {
  const cards=model.cardsFromNotes('Explain this paragraph\nQ :: A\n :: no question\nNo answer ::','Lesson',100);
  assert.equal(cards.length,1);assert.equal(cards[0].back,'A');assert.equal(cards[0].deck,'Lesson');
});
test('studio work survives existing progress import/export',()=> {
  const progress=load('lecomax-learning-app/utils/progress.ts');
  const value={...progress.initial,drafts:{'interactive:code:sql':'SELECT 1;','interactive:cards':JSON.stringify(model.cardsFromNotes('Q :: A','Deck',100))}};
  const restored=progress.readProgress(JSON.stringify(value));assert.equal(restored.drafts['interactive:code:sql'],'SELECT 1;');assert.equal(JSON.parse(restored.drafts['interactive:cards'])[0].due,100);
});
