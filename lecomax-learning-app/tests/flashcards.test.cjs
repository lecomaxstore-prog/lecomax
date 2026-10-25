const { test } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../scripts/inspect.cjs');
const f = load('lecomax-learning-app/utils/flashcards.ts');
const p = load('lecomax-learning-app/utils/progress.ts');
const DAY = 86400000;
test('SM-2 successful recalls use one day, six days, then prior ease; failure resets', () => {
  let card = f.createCard('one', 'Half of four?', 'Two', '', 1000);
  card = f.scheduleCard(card, 'good', 1000);
  assert.equal(card.interval, 1); assert.equal(card.ease, 2.5);
  assert.throws(() => f.scheduleCard(card, 'easy', 1000));
  card = f.scheduleCard(card, 'good', card.dueAt);
  assert.equal(card.interval, 6);
  card = f.scheduleCard(card, 'good', card.dueAt);
  assert.equal(card.interval, 15);
  const at = card.dueAt;
  card = f.scheduleCard(card, 'again', at);
  assert.equal(card.repetitions, 0); assert.equal(card.interval, 0); assert.equal(card.dueAt, at + 600000);
  card = f.scheduleCard(card, 'hard', card.dueAt);
  assert.equal(card.interval, 1); assert(card.ease >= 1.3);
});
test('hard reduces ease, easy increases it, bounds and rounding remain stable', () => {
  let c = f.createCard('one', 'Q', 'A', '', 1000);
  assert(f.scheduleCard(c, 'hard', 1000).ease < c.ease);
  assert(f.scheduleCard(c, 'easy', 1000).ease > c.ease);
  for (let i = 0; i < 30; i++) c = f.scheduleCard(c, 'hard', c.dueAt);
  assert.equal(c.ease, 1.3); assert(c.interval <= 3650);
  assert.equal(f.scheduleCard({ ...c, repetitions: 2, interval: 7, ease: 1.3 }, 'good', c.dueAt).interval, 10);
});
test('additive migration and serialization retain notes, card history and due dates without mastery', () => {
  const legacy = { ...p.initial, notes: { old: 'Preserve me' } }; delete legacy.flashcards;
  const migrated = p.readProgress(JSON.stringify(legacy));
  assert.equal(migrated.flashcards.cards.length, 0); assert.equal(migrated.notes.old, 'Preserve me');
  const cards = { version: 1, cards: [f.createCard('one', 'Q', 'A', 'old', 1000)], events: [] };
  const reviewed = f.reviewCard(cards, 'one', 'good', 1000);
  const restored = p.readProgress(JSON.stringify({ ...migrated, flashcards: reviewed }));
  assert.equal(restored.flashcards.events.length, 1); assert.equal(restored.flashcards.cards[0].dueAt, 1000 + DAY);
  assert.equal(restored.memory.evidence.length, 0); assert.equal(restored.completed.length, 0);
  assert.equal(f.dueCards(reviewed, 1000 + DAY - 1).length, 0);
  assert.equal(f.dueCards(reviewed, 1000 + DAY).length, 1);
  assert.throws(() => f.reviewCard(reviewed, 'one', 'good', 1001));
});
test('imports reject duplicate cards, invalid fields and orphaned review events', () => {
  const card = f.createCard('one', 'Q', 'A', '', 1000);
  for (const patch of [{ question: '' }, { answer: 'x'.repeat(6001) }, { ease: NaN }, { dueAt: -1 }, { repetitions: 0.5 }, { interval: 3651 }])
    assert.throws(() => f.readFlashcards({ version: 1, cards: [{ ...card, ...patch }], events: [] }));
  assert.throws(() => f.readFlashcards({ version: 1, cards: [card, card], events: [] }));
  assert.throws(() => f.readFlashcards({ version: 1, cards: [], events: [{ cardId: 'missing', at: 1000, dueAt: 2000, rating: 'good' }] }));
});
