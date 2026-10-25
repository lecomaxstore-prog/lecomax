const { test } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../scripts/inspect.cjs');
const j = load('lecomax-learning-app/features/curiosity/journeys.ts');
const l = load('lecomax-learning-app/features/curiosity/labs.ts');
const m = load('lecomax-learning-app/features/curiosity/player-model.ts');
test('all subject journeys complete, serialize, bookmark and retain distinct checkpoints', () => {
  const journal = load('lecomax-learning-app/features/curiosity/model.ts');
  let state = m.freshPlayer();
  assert.equal(new Set(j.journeys.map((x) => x.id)).size, j.journeys.length);
  for (const journey of j.journeys) {
    assert.equal(new Set(journey.steps.map((x) => x.question)).size, journey.steps.length);
    for (const step of journey.steps) {
      const spec = l.labSpec[step.lab];
      for (let value = spec.min; value <= spec.max; value += spec.increment)
        assert(l.labResult(step.lab, value).nodes.every((n) => Number.isFinite(n.value)));
      state = m.experiment(state, journey.id, step.id, spec.initial + spec.increment);
      state = m.checkpoint(state, journey.id, step.id, step.correct, 1000);
    }
    assert.equal(
      m.completedSteps(m.readPlayer(JSON.stringify(state)), journey.id),
      journey.steps.length,
    );
    assert.deepEqual(
      Array.from(journal.readJournal(JSON.stringify({ ...journal.freshJournal(), saved: [journey.id] })).saved),
      [journey.id],
    );
  }
});
test('new science models satisfy physical and arithmetic invariants', () => {
  const value = (kind, input, index = 2) => l.labResult(kind, input).nodes[index].value;
  assert.equal(value('lever', 5) * 5, 100);
  assert.equal(value('lift', 20) / value('lift', 10), 4);
  assert.equal(value('solution', 4) * 4, 2);
  assert.equal(value('population', 100), 0);
  assert.equal(value('population', 50), 5);
  assert(Math.abs(value('population', 10) - value('population', 90)) < 1e-12);
  assert.equal(value('strata', 4), 0);
  assert.equal(value('strata', 4, 1), 3);
  assert.equal(value('echo', 20) / value('echo', 10), 2);
});
test('every AI step has an executable model, explanatory views, primary source and valid checkpoint', () => {
  assert.equal(j.aiJourney.steps.length, 8);
  assert.equal(new Set(j.aiJourney.steps.map((s) => s.id)).size, 8);
  for (const s of j.aiJourney.steps) {
    assert(s.simple.length > 70);
    assert(s.deep.length > 80);
    assert(s.parts.length >= 3);
    assert(s.mechanism.length >= 3);
    assert(s.options[s.correct]);
    assert(s.source.startsWith('https://'));
    const spec = l.labSpec[s.lab];
    for (let v = spec.min; v <= spec.max; v += spec.increment) {
      const r = l.labResult(s.lab, v);
      assert(r.nodes.every((n) => Number.isFinite(n.value)));
      assert(r.limitation.length > 40);
    }
  }
});
test('real math models satisfy known results and invariants', () => {
  assert.equal(l.labResult('neuron', -1).nodes[2].value, 0);
  assert.equal(l.labResult('neuron', 2).nodes[2].value, 5);
  assert.equal(l.labResult('threshold', 7).nodes[2].value, 0);
  assert.equal(l.labResult('parallel', 4).nodes[2].value, 4);
  assert.equal(l.labResult('data', 90).nodes[2].value, 90);
  assert.equal(l.labResult('evaluation', 90).nodes[2].value, 85);
  let loss = Infinity;
  for (let i = 0; i <= 8; i++) {
    const next = l.labResult('training', i).nodes[2].value;
    assert(next < loss);
    loss = next;
  }
  const a = l.softmax([0, 3]);
  assert(Math.abs(a[0] + a[1] - 1) < 1e-12);
  assert(a[1] > a[0]);
  assert(l.labResult('generation', 2).nodes[0].value < l.labResult('generation', 1).nodes[0].value);
});
test('navigation does not award completion; experiments and checkpoints both required', () => {
  let s = m.freshPlayer();
  s = m.visitStep(s, 'ai', 'what-is-ai');
  s = m.checkpoint(s, 'ai', 'what-is-ai', 0, 1000);
  assert.equal(m.completedSteps(s, 'ai'), 0);
  s = m.experiment(s, 'ai', 'what-is-ai', 6);
  assert.equal(m.completedSteps(s, 'ai'), 1);
  assert.equal(m.experiment(s, 'ai', 'what-is-ai', 999), s);
});
test('wrong answers and hint use survive correction; repeat clicks do not postpone due review', () => {
  let s = m.freshPlayer();
  s = m.checkpoint(s, 'ai', 'neural-network', 0, 1000);
  s = m.checkpoint(s, 'ai', 'neural-network', 1, 2000);
  const a = m.stepMemory(s, 'ai', 'neural-network').answer;
  assert.equal(a.firstCorrect, false);
  assert.equal(a.assisted, true);
  assert.equal(a.attempts, 2);
  s = m.checkpoint(s, 'ai', 'neural-network', 1, 3000);
  assert.equal(m.stepMemory(s, 'ai', 'neural-network').answer.due, a.due);
});
test('complete AI journey resumes and round-trips through existing cloud backup without losing old progress', () => {
  let s = m.freshPlayer();
  for (const step of j.aiJourney.steps) {
    const spec = l.labSpec[step.lab];
    s = m.experiment(s, 'ai', step.id, spec.initial + spec.increment);
    s = m.checkpoint(s, 'ai', step.id, step.correct, 1000);
  }
  assert.equal(m.completedSteps(s, 'ai'), 8);
  assert.equal(m.readPlayer(JSON.stringify(s)).topics.ai.active, 'evolution');
  const p = load('lecomax-learning-app/utils/progress.ts');
  const b = load('lib/academy-backup.ts').validateBackup({
    revision: 0,
    snapshot: {
      ...p.initial,
      bookmarks: ['start-web'],
      drafts: { legacy: 'keep me', [m.PLAYER_KEY]: JSON.stringify(s) },
    },
  });
  assert(b);
  assert.equal(b.snapshot.drafts.legacy, 'keep me');
  assert.equal(m.completedSteps(m.readPlayer(b.snapshot.drafts[m.PLAYER_KEY]), 'ai'), 8);
});
test('malformed state is rejected without mutation and unknown topic/choice cannot create evidence', () => {
  for (const raw of [
    '{',
    'null',
    '{}',
    JSON.stringify({ version: 1, last: 'unknown', topics: {} }),
  ])
    assert.throws(() => m.readPlayer(raw));
  const s = m.freshPlayer();
  assert.equal(m.checkpoint(s, 'ai', 'training', 99), s);
  assert.equal(m.visitStep(s, 'unknown', 'x'), s);
});
test('Tutor serialization and bounded handoff preserve active step and misconception evidence', () => {
  const t = load('lecomax-learning-app/utils/tutor-memory.ts');
  const s = { ...t.newTutorSession('AI', 'explain'), discoveryId: 'ai', discoveryStep: 'training' };
  const r = t.readTutorMemory({ version: 1, active: s.id, sessions: [s], concepts: [] });
  assert.equal(r.sessions[0].discoveryStep, 'training');
  const state = m.checkpoint(m.freshPlayer(), 'ai', 'training', 0, 1000);
  const ctx = load('lecomax-learning-app/utils/tutor-context.ts').boundedTutorContext({
    discovery: m.playerContext('ai', 'training', state),
  });
  const parsed = JSON.parse(ctx).discovery;
  assert.equal(parsed.activeStep, 'training');
  assert.equal(parsed.checkpoint.correct, false);
  assert(parsed.source);
  assert(ctx.length <= 14000);
});
