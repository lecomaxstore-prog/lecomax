import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { lessons } from '../app/admin/how-it-was-built/learning/lessons.ts';
import { readings } from '../app/admin/how-it-was-built/learning/reading.ts';
import { analogies, advancedNotes, removalNotes } from '../app/admin/how-it-was-built/learning/coaching.ts';
import { clickFlows } from '../app/admin/how-it-was-built/learning/click-flows.ts';
import { readProgress, recordReview, dueReviews, matchesAnswer } from '../app/admin/how-it-was-built/learning/progress.ts';

const ids = lessons.map(lesson => lesson.id);
test('every reading line has translated consequences and each lesson has a different simpler explanation', () => {
  for (const lesson of lessons) {
    assert.equal(removalNotes[lesson.id].length, readings[lesson.id].lines.length, lesson.id);
    assert.notDeepEqual(analogies[lesson.id], lesson.simple);
    for (const translated of [analogies[lesson.id], advancedNotes[lesson.id], ...removalNotes[lesson.id]]) {
      assert.equal(translated.length, 3);
      assert.ok(translated.every(value => value.length > 25 && !value.includes('???')));
      assert.match(translated[2], /[\u0600-\u06ff]/);
    }
  }
});
test('click journeys reference real files and exact function anchors', () => {
  assert.equal(new Set(clickFlows.map(flow => flow.id)).size, 7);
  for (const flow of clickFlows) for (const step of flow.steps) {
    assert.ok(readFileSync(step.file, 'utf8').includes(step.anchor), `${flow.id}: ${step.file} / ${step.anchor}`);
    assert.ok(step.label.every(value => value.length > 10));
  }
});
test('spaced reviews use local days and regress gently after a mistake', () => {
  const now = new Date(2026, 9, 5, 12);
  const first = recordReview(undefined, true, now);
  assert.equal(first.due, '2026-10-06');
  assert.equal(first.interval, 1);
  const next = recordReview(first, true, new Date(2026, 9, 6, 12));
  assert.equal(next.interval, 2);
  const missed = recordReview(next, false, now);
  assert.equal(missed.due, '2026-10-05');
  assert.equal(missed.successes, 0);
  assert.equal(recordReview(missed, true, now).interval, 1);
  const progress = readProgress({ reviews: { web: first, state: missed } }, ids);
  assert.deepEqual(dueReviews(progress, '2026-10-05'), ['state']);
  assert.deepEqual(dueReviews(progress, '2026-10-06'), ['state', 'web']);
});
test('drafts and review history survive reload, reject malformed data and migrate old progress', () => {
  const progress = readProgress({ drafts: { web: '/boutique', state: 'x'.repeat(800), props: 2, unknown: 'x' }, reviews: { web: recordReview(undefined, true, new Date(2026, 9, 5)), state: null, props: { due: 'bad', interval: -1, misses: 0, successes: 0 } } }, ids);
  assert.equal(progress.drafts.state.length, 180);
  assert.equal(progress.drafts.props, undefined);
  assert.equal(progress.drafts.unknown, undefined);
  assert.deepEqual(readProgress(JSON.parse(JSON.stringify(progress)), ids), progress);
  assert.deepEqual(Object.keys(progress.reviews), ['web']);
  assert.deepEqual(readProgress({ completed: ['web'] }, ids).drafts, {});
  assert.deepEqual(readProgress({ reviews: null, drafts: null }, ids).reviews, {});
});
test('code exercises preserve meaningful case instead of accepting broken identifiers', () => {
  assert.equal(matchesAnswer(' setItems ', ['setItems']), true);
  assert.equal(matchesAnswer('setitems', ['setItems']), false);
  assert.equal(matchesAnswer('hotelcard', ['HotelCard']), false);
  for (const lesson of lessons) assert.ok(matchesAnswer(lesson.answer[0], lesson.answer));
});
