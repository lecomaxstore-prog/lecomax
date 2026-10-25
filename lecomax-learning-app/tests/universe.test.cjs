const { test } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../scripts/inspect.cjs');
const m = load('lecomax-learning-app/features/universe/model.ts');
const { initial, readProgress } = load('lecomax-learning-app/utils/progress.ts');
const { addEvidence } = load('lecomax-learning-app/utils/learning-memory.ts');

test('all nine game generators have valid localized answer keys across 100 seeds', () => {
  for (const [game] of m.games) for (const subject of ['numbers', 'javascript']) for (let seed = 0; seed < 100; seed++) {
    if (game === 'debug' && subject === 'numbers') { assert.throws(() => m.challenges(game, subject, seed)); continue; }
    const qs = m.challenges(game, subject, seed);
    for (const q of qs) {
      assert.equal(q.prompt.length, 3); assert(q.prompt.every(Boolean));
      assert(q.correct >= 0 && q.correct < q.options.length);
      for (let lang = 0; lang < 3; lang++) assert.equal(new Set(q.options.map(o => o[lang])).size, q.options.length);
      if (q.order) assert.equal(new Set(q.order).size, q.options.length);
    }
    if (game === 'match') assert.equal(new Set(qs.map(q => q.options[q.correct][1])).size, 4);
    assert.equal(JSON.stringify(qs), JSON.stringify(m.challenges(game, subject, seed)));
  }
});
test('scoring checks exact answers, prevents repeat awards, and preserves result across restart and backup', () => {
  for (const [game] of m.games.filter(g => g[0] !== 'match')) {
    let r = m.newRun(game, 'javascript', 13, false);
    const qs = m.challenges(game, 'javascript', 13);
    for (const q of qs) {
      const at = r.startedAt + 1000;
      r = m.answerRun(r, q.order || [q.correct], 'I add the units and count forward.', at);
      assert.equal(r.answers.at(-1).points, 100);
      assert.equal(m.answerRun(r, [3], '', at), r);
      r = m.readRun(JSON.stringify(m.nextRound(r, at)));
      assert(r);
    }
    assert.equal(m.gameScore(r), qs.length * 100);
    const p = readProgress(JSON.stringify({ ...initial, drafts: { 'universe:game': JSON.stringify(r) } }));
    assert.equal(m.readRun(p.drafts['universe:game']).index, qs.length);
    assert(load('lib/academy-backup.ts').validateBackup({ revision: 0, snapshot: p }));
  }
});
test('speed deadline survives interruption; untimed mode remains accessible; explanations are not auto-graded', () => {
  let r = m.newRun('speed', 'numbers', 25);
  const q = m.challenges(r.game, r.subject, r.seed)[0];
  const restored = m.readRun(JSON.stringify(r));
  assert.equal(m.answerRun(restored, [q.correct], '', r.startedAt + 30000).answers[0].points, 0);
  assert.equal(m.answerRun({ ...restored, timed: false }, [q.correct], '', r.startedAt + 90000).answers[0].points, 100);
  r = m.newRun('explain', 'numbers', 4);
  assert.equal(m.answerRun(r, [0], 'tiny'), r);
  assert.equal(m.answerRun(r, [1], 'Long explanation that selects wrong reasoning.').answers[0].correct, false);
  assert.match(m.challenges('explain', 'numbers', 4)[0].feedback[1], /not your prose/);
});
test('corrupt saves fail closed; scores never change evidence or unlock mastery', () => {
  assert.equal(m.readRun('{'), null);
  for (const patch of [{ index: 99 }, { seed: -1 }, { startedAt: null }, { answers: [{}] }, { game: 'fake' }, { subject: 'fake' }]) assert.equal(m.readRun(JSON.stringify({ ...m.newRun('quest', 'numbers', 4), ...patch })), null);
  const p = { ...initial, completed: [], lastLesson: '', drafts: { 'universe:game': JSON.stringify(m.newRun('quest', 'numbers', 4)) } };
  assert.equal(m.skillState(p, 'lesson', ['prerequisite'], 10), 'locked');
  assert.equal(m.skillState(p, 'lesson', [], 10), 'available');
  p.completed = ['lesson'];
  assert.equal(m.skillState(p, 'lesson', [], 10), 'progress');
  p.memory = addEvidence(p.memory, 'lesson', 'q', 0, true, 1000);
  assert.equal(m.skillState(p, 'lesson', [], 1001), 'progress');
  assert.equal(m.skillState(p, 'lesson', [], 86401001), 'review');
  p.memory = addEvidence(p.memory, 'lesson', 'q', 0, true, 86402000);
  assert.equal(m.skillState(p, 'lesson', [], 86402001), 'mastered');
});
test('journeys select real step orders and survive progress serialization', () => {
  assert.equal(m.journeys.length, 7);
  for (const [id, , , steps] of m.journeys) {
    assert(steps.every(n => n >= 0 && n <= 3));
    assert.equal(m.selectedJourney(readProgress(JSON.stringify({ ...initial, drafts: { 'universe:journey': id } }))), id);
  }
  assert.equal(m.journeys.find(j => j[0] === 'exam')[3][0], 3);
  assert.equal(m.journeys.find(j => j[0] === 'project')[3][0], 2);
});
