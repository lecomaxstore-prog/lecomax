const { test } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../scripts/inspect.cjs');
const { pcTopics } = load('lecomax-learning-app/data/pc-explorer.ts');
const { pcLearningIds, PC_LEARNING_KEY } = load('lecomax-learning-app/utils/pc-learning.ts');
const { pcTeacherRoute } = load('lecomax-learning-app/utils/pc-teacher.ts');
test('PC lessons have distinct IDs and complete localized physical explanations', () => {
  assert.equal(new Set(pcTopics.map(p => p.id)).size, 15);
  for (const topic of pcTopics) for (const language of ['en', 'fr', 'ar']) for (const field of ['name', 'detail', 'anatomy', 'example']) {
    assert.ok(topic[field][language].trim().length > 2);
    assert.doesNotMatch(topic[field][language], /\uFFFD/);
  }
});
test('PC progress is separate, deduplicated and rejects unrecognized data', () => {
  assert.equal(PC_LEARNING_KEY, 'pc-explorer:understood');
  assert.deepEqual(Array.from(pcLearningIds('["cpu","cpu","ram","unknown",7]')), ['cpu', 'ram']);
  for (const raw of [undefined, '{', '{}', 'null']) assert.equal(pcLearningIds(raw).length, 0);
});
test('teacher context is built from trusted PC lessons and only known intents', () => {
  for (const language of ['en', 'fr', 'ar']) for (const intent of ['explain', 'example', 'quiz']) {
    const route = pcTeacherRoute({ type: 'ask-pc-teacher', id: 'cpu', intent, detail: 'UNTRUSTED' }, language);
    assert.equal(route.pathname, '/(tabs)/teacher');
    assert.ok(route.params.question.includes(pcTopics.find(p => p.id === 'cpu').detail[language]));
    assert.ok(!route.params.question.includes('UNTRUSTED'));
  }
  for (const value of [null, {}, { type: 'ask-pc-teacher', id: 'unknown', intent: 'quiz' }, { type: 'ask-pc-teacher', id: 'cpu', intent: 'hack' }]) assert.equal(pcTeacherRoute(value, 'en'), null);
});
