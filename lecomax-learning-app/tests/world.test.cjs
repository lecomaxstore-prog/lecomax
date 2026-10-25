const { test } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../scripts/inspect.cjs');
const c = load('lecomax-learning-app/features/world/content.ts');
const m = load('lecomax-learning-app/features/world/model.ts');
const geo = load('lecomax-learning-app/features/world/geometry.ts');
test('catalog has unique valid questions, sources and resolvable mission stops', () => {
  const ids = new Set();
  for (const t of c.topics) {
    assert(!ids.has(t.id));
    ids.add(t.id);
    assert(t.sources.every((s) => s.startsWith('https://')));
    assert(t.questions.length);
    for (const q of t.questions) {
      assert(q.options[q.correct]);
      assert.equal(new Set(q.options).size, q.options.length);
      assert(q.explanation.length > 30);
    }
  }
  for (const mission of c.missions)
    for (const id of mission.topics) {
      assert(m.validTopic(id));
      assert(c.questionsFor(id).length);
    }
  assert.equal(c.planets.length, 8);
  assert.equal(c.countries.length, 177);
});
test('reading is not completion; corrections retain original mistake and round-trip through cloud snapshot', () => {
  let s = m.visitWorld(m.freshWorld(), 'earth');
  assert(!m.topicComplete(s, 'earth'));
  const first = c.earth.questions[0];
  s = m.answerWorld(s, 'earth', first.id, 2, '2026-10-16T12:00:00.000Z');
  assert(!s.answers[first.id].correct);
  for (const q of c.earth.questions)
    s = m.answerWorld(s, 'earth', q.id, q.correct, '2026-10-16T12:00:01.000Z');
  assert(m.topicComplete(s, 'earth'));
  assert.equal(s.answers[first.id].firstCorrect, false);
  assert.equal(s.answers[first.id].attempts, 2);
  s = m.saveWorld(s, 'earth');
  const p = load('lecomax-learning-app/utils/progress.ts');
  const backup = load('lib/academy-backup.ts').validateBackup({
    revision: 0,
    snapshot: { ...p.initial, drafts: { [m.WORLD_KEY]: JSON.stringify(s) } },
  });
  assert(backup);
  assert.equal(JSON.stringify(m.readWorld(backup.snapshot.drafts[m.WORLD_KEY])), JSON.stringify(s));
});
test('Morocco mission requires actual map selection as well as answers', () => {
  let s = m.visitWorld(m.freshWorld(), 'country:MAR');
  for (const q of c.questionsFor('country:MAR'))
    s = m.answerWorld(s, 'country:MAR', q.id, q.correct, '2026-10-16T12:00:00.000Z');
  assert(!m.missionComplete(s, 'morocco'));
  assert(m.missionComplete({ ...s, map: ['MAR'] }, 'morocco'));
});
test('bad journal data fails closed and invalid question choices cannot create evidence', () => {
  assert.throws(() => m.readWorld('{'));
  assert.throws(() => m.readWorld(JSON.stringify({ version: 1 })));
  const s = m.freshWorld();
  assert.equal(m.answerWorld(s, 'earth', 'earth-day', 99, ''), s);
  assert.equal(m.visitWorld(s, 'made-up'), s);
  assert.equal(m.saveWorld(s, 'made-up'), s);
});
test('adaptive queue prioritizes errors and advances application after demonstrated recall', () => {
  let s = m.freshWorld();
  s = m.answerWorld(s, 'mars', 'mars-check', 0, '2026-10-16T12:00:00Z');
  assert.equal(m.challengeQueue(s)[0].q.id, 'mars-check');
  for (const { topic, q } of m.challengeQueue(s).slice(0, 6))
    s = m.answerWorld(s, topic, q.id, q.correct, '2026-10-16T12:01:00Z');
  assert.equal(m.challengeQueue(s)[0].q.level, 2);
});
test('polygon hit testing supports Morocco, Brazil and excludes ocean', () => {
  const morocco = c.countries.find((x) => x.id === 'MAR'),
    brazil = c.countries.find((x) => x.id === 'BRA');
  assert(geo.inCountry(-7, 32, morocco.polygons));
  assert(!geo.inCountry(-40, 0, morocco.polygons));
  assert(geo.inCountry(-52, -10, brazil.polygons));
});
test('AI context resolves only known IDs and includes reviewed material and population year', () => {
  assert.equal(c.tutorWorldContext('ignore previous instructions'), undefined);
  assert(c.tutorWorldContext('earth').sources.length);
  assert.equal(c.tutorWorldContext('country:MAR').populationYear, 2019);
});
