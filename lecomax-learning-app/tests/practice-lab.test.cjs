const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { load } = require('../scripts/inspect.cjs');
const { challenges } = load('lecomax-learning-app/features/practice/challenges.ts');
const { readAttempt, recordAttempt, dailyIndex } = load('lecomax-learning-app/features/practice/progress.ts');

test('nine complete multilingual challenges have valid answers and unique IDs', () => {
  assert.equal(challenges.length, 9);
  assert.equal(new Set(challenges.map(c => c.id)).size, 9);
  for (const language of ['JavaScript', 'Python', 'SQL']) assert.equal(challenges.filter(c => c.language === language).length, 3);
  for (const c of challenges) {
    for (const field of ['title', 'concept', 'lesson', 'question', 'hint', 'explanation', 'task']) {
      assert.equal(c[field].length, 3);
      assert.ok(c[field].every(s => typeof s === 'string' && s.trim()));
    }
    assert.equal(c.options.length, 3);
    assert.ok(c.options[c.answer]);
  }
});
test('JavaScript answer keys agree with real execution', () => {
  for (const c of challenges.filter(c => c.language === 'JavaScript')) {
    const output = [];
    vm.runInNewContext(c.code, { console: { log: (...values) => output.push(values.map(String).join(' ')) } }, { timeout: 1000 });
    assert.equal(output.join(' / '), c.options[c.answer], c.id);
  }
});
test('SQL answer keys agree with an in-memory SQLite database', () => {
  const { DatabaseSync } = require('node:sqlite');
  const db = new DatabaseSync(':memory:');
  try {
    db.exec("CREATE TABLE products(name TEXT, price INTEGER); INSERT INTO products VALUES('Pen',2),('Book',12),('Bag',20); CREATE TABLE users(id INTEGER,nickname TEXT); INSERT INTO users VALUES(1,'Ava'),(2,NULL),(3,'Sam'); CREATE TABLE sales(category TEXT,amount INTEGER); INSERT INTO sales VALUES('Books',10),('Games',20),('Books',5);");
    const filter = challenges.find(c => c.id === 'sql-filter');
    assert.equal(db.prepare(filter.code).all().map(row => row.name).join(', '), filter.options[filter.answer]);
    const count = challenges.find(c => c.id === 'sql-count');
    assert.equal(Object.values(db.prepare(count.code).get()).join(', '), count.options[count.answer]);
    const group = challenges.find(c => c.id === 'sql-groups');
    assert.equal(String(db.prepare(group.code).all().find(row => row.category === 'Books')['SUM(amount)']), group.options[group.answer]);
  } finally { db.close(); }
});
test('attempts preserve first-try evidence through hints and retry, and reject corrupt saved data', () => {
  const first = recordAttempt(undefined, 0, 1, false);
  const second = recordAttempt(first, 1, 1, false);
  assert.equal(second.correct, true);
  assert.equal(second.firstCorrect, false);
  assert.equal(second.attempts, 2);
  assert.equal(recordAttempt(undefined, 1, 1, true).firstCorrect, false);
  assert.equal(readAttempt(JSON.stringify(second)).attempts, 2);
  for (const raw of ['{bad', '{}', 'null', JSON.stringify({ ...second, choice: 99 }), JSON.stringify({ ...second, at: 'bad' })]) assert.equal(readAttempt(raw), undefined);
  assert.throws(() => recordAttempt(undefined, -1, 0, false));
});
test('daily selection is deterministic and within the challenge library', () => {
  assert.equal(dailyIndex('2026-10-14', 9), dailyIndex('2026-10-14', 9));
  const seen = new Set();
  for (let day = 1; day <= 28; day++) {
    const index = dailyIndex(`2026-10-${String(day).padStart(2, '0')}`, 9);
    assert.ok(index >= 0 && index < 9);
    seen.add(index);
  }
  assert.equal(seen.size, 9);
});
