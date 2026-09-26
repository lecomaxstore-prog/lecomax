import test from 'node:test';
import assert from 'node:assert/strict';
import { HOUR_PLAN, DAILY_CHALLENGES, EMPTY_WORKBOOK, readWorkbook, workbookReady } from '../app/admin/how-it-was-built/course/hour-workshop.ts';
import { DAILY_LESSONS } from '../app/admin/how-it-was-built/course/daily-lessons.ts';
import { readSessions, emptySession } from '../app/admin/how-it-was-built/course/daily-path.ts';
test('every introductory lesson has a specific translated challenge and a sixty-minute plan', () => {
  assert.equal(HOUR_PLAN.reduce((sum, part) => sum + part.minutes, 0), 60);
  for (const lesson of DAILY_LESSONS) {
    assert.equal(DAILY_CHALLENGES[lesson.id].length, 3);
    for (const challenge of DAILY_CHALLENGES[lesson.id]) assert.ok(challenge.length > 100, lesson.id);
  }
});
test('workbook completion requires all four developed answers', () => {
  assert.equal(workbookReady(EMPTY_WORKBOOK), false);
  const complete = Object.fromEntries(Object.keys(EMPTY_WORKBOOK).map(key => [key, 'A concrete example with the expected result and my observed result.']));
  assert.equal(workbookReady(readWorkbook(complete)), true);
  assert.equal(workbookReady(readWorkbook({ ...complete, challenge: ' '.repeat(70) })), false);
  assert.equal(workbookReady(readWorkbook({ ...complete, guided: 123 })), false);
});
test('workbook resumes safely without erasing older completed lessons', () => {
  const workbook = { ...EMPTY_WORKBOOK, recall: 'My saved prediction', guided: 'a'.repeat(5000) };
  const saved = readSessions({ files: { ...emptySession, workbook }, website: { ...emptySession, practiced: true, answers: [1,0,1], completedOn: '2026-09-23' } });
  assert.equal(saved.files.workbook?.recall, 'My saved prediction');
  assert.equal(saved.files.workbook?.guided.length, 4000);
  assert.equal(saved.website.completedOn, '2026-09-23');
  assert.deepEqual(readSessions(JSON.parse(JSON.stringify(saved))), saved);
});
