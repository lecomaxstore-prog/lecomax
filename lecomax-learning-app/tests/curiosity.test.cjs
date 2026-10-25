const { test } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../scripts/inspect.cjs');
const c = load('lecomax-learning-app/features/curiosity/catalog.ts');
const m = load('lecomax-learning-app/features/curiosity/model.ts');
test('catalog contains at least 20 linked sourced discoveries and valid assessments', () => {
  assert(c.catalog.length >= 20);
  assert.equal(new Set(c.catalog.map((d) => d.id)).size, c.catalog.length);
  for (const d of c.catalog) {
    assert(d.source.startsWith('https://'));
    assert.match(d.checked, /^\d{4}-\d{2}-\d{2}$/);
    assert(d.deep.length > 80);
    assert(d.simple.length > 40);
    assert(d.options[d.correct]);
    assert.equal(new Set(d.options).size, d.options.length);
    assert(d.feedback.length > 40);
    for (const id of d.related) assert(c.getDiscovery(id));
  }
  for (const mode of m.modes) assert(m.forMode(mode).length > 0, mode);
  assert(!m.forMode('How Is It Made?').some((d) => d.id === 'internet'));
});
test('reading is not assessment; invalid choices cannot create evidence', () => {
  const s = m.freshJournal();
  s.visited = ['ai'];
  assert.equal(Object.keys(s.answers).length, 0);
  assert.equal(m.answer(s, 'ai', 99), s);
  assert.equal(m.answer(s, 'missing', 0), s);
});
test('spaced reviews preserve mistakes and cannot be inflated with repeated clicks', () => {
  let s = m.answer(m.freshJournal(), 'ai', 0, 1000);
  assert.equal(s.answers.ai.firstCorrect, false);
  assert.equal(s.answers.ai.streak, 0);
  s = m.answer(s, 'ai', 1, 2000);
  assert.equal(s.answers.ai.streak, 1);
  const due = s.answers.ai.due;
  s = m.answer(s, 'ai', 1, 3000);
  assert.equal(s.answers.ai.streak, 1);
  assert.equal(s.answers.ai.due, due);
  s = m.answer(s, 'ai', 1, due);
  assert.equal(s.answers.ai.streak, 2);
  assert.equal(s.answers.ai.due, due + 3 * 86400000);
  assert.equal(s.answers.ai.firstCorrect, false);
});
test('journal round trips with existing progress and rejects corrupt state', () => {
  let s = m.answer(m.freshJournal(), 'ai', 1, 1000);
  s.saved = ['ai'];
  s.collections.Science = ['ai'];
  assert.equal(JSON.stringify(m.readJournal(JSON.stringify(s))), JSON.stringify(s));
  const p = load('lecomax-learning-app/utils/progress.ts');
  const b = load('lib/academy-backup.ts').validateBackup({
    revision: 0,
    snapshot: { ...p.initial, drafts: { [m.CURIOSITY_KEY]: JSON.stringify(s) } },
  });
  assert(b);
  assert.equal(b.snapshot.drafts[m.CURIOSITY_KEY], JSON.stringify(s));
  for (const raw of [
    '{',
    'null',
    '{}',
    JSON.stringify({ ...s, answers: { ai: { ...s.answers.ai, correct: false } } }),
  ])
    assert.throws(() => m.readJournal(raw));
});
test('recommendations use evidence, relations and interests while maintaining diversity', () => {
  const s = m.freshJournal();
  s.interests = ['Computing'];
  const r = m.recommend(s, 'ai');
  assert(!r.some((d) => d.id === 'ai'));
  assert(new Set(r.slice(0, 3).map((d) => d.category)).size > 1);
  assert(r.some((d) => ['gpu', 'attention', 'chips'].includes(d.id)));
  const due = m.answer(s, 'heart', 0, 0);
  assert(m.recommend(due, '', [], 86400001).some((d) => d.id === 'heart'));
});
test('daily selection is stable for a local calendar date and changes the next day', () => {
  assert.equal(
    m.dailyDiscovery(new Date(2026, 9, 16, 1)).id,
    m.dailyDiscovery(new Date(2026, 9, 16, 23)).id,
  );
  assert.notEqual(
    m.dailyDiscovery(new Date(2026, 9, 16)).id,
    m.dailyDiscovery(new Date(2026, 9, 17)).id,
  );
});
test('Tutor session retains discovery context across serialization', () => {
  const t = load('lecomax-learning-app/utils/tutor-memory.ts');
  const session = { ...t.newTutorSession('AI', 'explain'), discoveryId: 'ai' };
  const memory = t.readTutorMemory(
    JSON.parse(
      JSON.stringify({ version: 1, active: session.id, sessions: [session], concepts: [] }),
    ),
  );
  assert.equal(memory.sessions[0].discoveryId, 'ai');
  assert(c.discoveryContext(memory.sessions[0].discoveryId).source);
  assert.equal(c.discoveryContext('unknown'), undefined);
  const p = load('lecomax-learning-app/utils/progress.ts');
  const backup = load('lib/academy-backup.ts').validateBackup({
    revision: 0,
    snapshot: { ...p.initial, tutor: memory },
  });
  assert.equal(backup.snapshot.tutor.sessions[0].discoveryId, 'ai');
  const bounded = load('lecomax-learning-app/utils/tutor-context.ts').boundedTutorContext({
    discovery: c.discoveryContext('ai'),
  });
  assert(JSON.parse(bounded).discovery.journey['Run inference']);
});
