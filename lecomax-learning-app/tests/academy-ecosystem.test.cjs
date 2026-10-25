const { test } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../scripts/inspect.cjs');
const { initial, readProgress, recordAnswer } = load('lecomax-learning-app/utils/progress.ts');
const { readProfile, teacherProfile } = load('lecomax-learning-app/utils/academy.ts');
const { weeklyAcademy, retainedLesson } = load('lecomax-learning-app/utils/weekly-academy.ts');
const { readAgent, runAgent, starterAgent } = load('lecomax-learning-app/utils/agent-studio.ts');
const catalog = [
  { id: 'one', minutes: 45, difficulty: 1, questionIds: ['a', 'b'] },
  { id: 'two', minutes: 10, difficulty: 2, questionIds: ['a'] },
];
const DAY = 86400000;

test('old profiles survive and optional preferences round trip without losing work', () => {
  const p = structuredClone(initial);
  p.notes.keep = 'my work';
  p.academy.profile = readProfile({
    ...p.academy.profile,
    interests: ['science', 'science'],
    routineGoal: 'Walk after study',
    accessibilityNeeds: 'Short sentences',
  });
  p.drafts['agent-studio.config'] = JSON.stringify(starterAgent);
  const restored = readProgress(JSON.stringify(p));
  assert.equal(restored.notes.keep, 'my work');
  assert.equal(restored.academy.profile.interests.length, 1);
  assert.equal(restored.academy.profile.accessibilityNeeds, 'Short sentences');
  assert.equal(teacherProfile(restored.academy.profile).accessibilityNeeds, undefined);
  assert.equal(
    teacherProfile({ ...restored.academy.profile, shareOptionalPreferences: true })
      .accessibilityNeeds,
    'Short sentences',
  );
  assert.equal(readAgent(restored.drafts['agent-studio.config']).tool, 'notes');
  assert.equal(readProfile(initial.academy.profile).dailyMinutes, 20);
  assert.throws(() => readProfile({ ...initial.academy.profile, interests: ['invalid'] }));
  assert.throws(() => readProfile({ ...initial.academy.profile, routineGoal: 'x'.repeat(301) }));
});

test('weekly budget and curriculum order ignore opening and completion claims', () => {
  const p = structuredClone(initial);
  p.academy.profile.dailyMinutes = 5;
  p.completed = ['one'];
  p.lastLesson = 'two';
  const week = weeklyAcademy(p, catalog, DAY);
  assert.equal(week.length, 7);
  assert(week.every((s) => s.minutes <= 5));
  assert.equal(week[0].lessonId, 'one');
  assert.equal(week[1].kind, 'practice');
  assert.equal(week[6].kind, 'reflect');
  assert.equal(retainedLesson(p, catalog[0]), false);
});

test('only complete spaced recall evidence advances the plan; mistakes return first', () => {
  let p = structuredClone(initial);
  p = recordAnswer(p, 'one', 'a', 0, true, DAY);
  p = recordAnswer(p, 'one', 'a', 0, true, DAY + 100);
  assert.equal(retainedLesson(p, catalog[0]), false, 'immediate retries do not establish recall');
  p = recordAnswer(p, 'one', 'a', 0, true, DAY * 3);
  assert.equal(
    retainedLesson(p, catalog[0]),
    false,
    'one question cannot stand for the entire lesson',
  );
  p = recordAnswer(p, 'one', 'b', 0, true, DAY);
  p = recordAnswer(p, 'one', 'b', 0, true, DAY * 3);
  assert.equal(retainedLesson(p, catalog[0]), true);
  assert.equal(weeklyAcademy(p, catalog, DAY * 3)[0].lessonId, 'two');
  p = recordAnswer(p, 'one', 'a', 1, false, DAY * 4);
  const week = weeklyAcademy(p, catalog, DAY * 4 + 600001);
  assert.equal(week[0].kind, 'review');
  assert.equal(week[0].lessonId, 'one');
});

test('agent executes supported tools and fails closed on unknown input and low budgets', () => {
  const known = runAgent(starterAgent, 'Explain retrieval');
  assert.equal(known.trace.length, 3);
  assert.equal(known.grounded, true);
  assert.match(known.answer, /Retrieval practice/);
  const calculator = { ...starterAgent, tool: 'calculator' };
  assert.equal(runAgent(calculator, '6 * 7').answer, '6 * 7 = 42');
  for (const input of ['1 / 0', 'process.exit()', '1+2;fetch("https://example.com")', ''])
    assert.equal(runAgent(calculator, input).grounded, false);
  assert.equal(runAgent({ ...starterAgent, maxSteps: 1 }, 'retrieval').trace.length, 1);
  assert.equal(runAgent({ ...starterAgent, maxSteps: 2 }, 'retrieval').grounded, false);
  assert.equal(runAgent({ ...starterAgent, requireEvidence: false }, 'unknown').grounded, false);
  assert.throws(() => readAgent('{invalid'));
  assert.throws(() => runAgent({ ...starterAgent, maxSteps: 99 }, 'retrieval'));
});
