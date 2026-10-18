import test from 'node:test';
import assert from 'node:assert/strict';
import { readProgress } from '../app/admin/how-it-was-built/learning/progress.ts';
import { BACKUP_LIMIT, makeLearningBackup, mergeLearningBackup, parseLearningBackup } from '../app/admin/how-it-was-built/learning/backup.ts';
const ids = ['web', 'state'];

test('old progress acquires bookmarks without losing notes', () => {
  const progress = readProgress({ notes: { web: 'My first note' } }, ids);
  assert.deepEqual(progress.bookmarks, []);
  assert.equal(progress.notes.web, 'My first note');
  assert.deepEqual(readProgress({ bookmarks: ['web', 'web', 'unknown'] }, ids).bookmarks, ['web']);
});

test('backup round trip preserves multilingual notes and lesson progress', () => {
  const progress = readProgress({ current: 'state', notes: { web: 'فهمت الفكرة — compris' }, bookmarks: ['web'], completed: ['state'], quizzes: { state: 2 } }, ids);
  assert.deepEqual(parseLearningBackup(makeLearningBackup(progress, ids), ids), progress);
});

test('backup rejects unrelated versions, malformed files and oversized UTF-8 input', () => {
  for (const value of ['bad', '{}', 'null', JSON.stringify({ kind: 'lecomax-beginner-learning', version: 2, progress: {} }), JSON.stringify({ kind: 'lecomax-beginner-learning', version: 1, progress: [] }), 'ع'.repeat(BACKUP_LIMIT)]) assert.throws(() => parseLearningBackup(value, ids));
});

test('merge adds milestones without overwriting current notes, place or better scores', () => {
  const current = readProgress({ current: 'state', notes: { web: 'Keep this', state: '' }, drafts: { web: 'unfinished' }, completed: ['web'], bookmarks: ['state'], quizzes: { web: 2 } }, ids);
  const imported = readProgress({ current: 'web', notes: { web: 'Older note', state: 'Fill empty note' }, drafts: { web: 'old attempt' }, completed: ['state'], bookmarks: ['web'], quizzes: { web: 1, state: 2 } }, ids);
  const merged = mergeLearningBackup(current, imported, ids);
  assert.equal(merged.current, 'state');
  assert.equal(merged.notes.web, 'Keep this');
  assert.equal(merged.notes.state, 'Fill empty note');
  assert.equal(merged.drafts.web, 'unfinished');
  assert.equal(merged.quizzes.web, 2);
  assert.equal(merged.quizzes.state, 2);
  assert.deepEqual(merged.completed, ['web', 'state']);
  assert.deepEqual(merged.bookmarks, ['state', 'web']);
  assert.equal(current.notes.web, 'Keep this');
});

test('bounded merging preserves existing notes when an import fills the note limit', () => {
  const current = readProgress({ notes: { web: 'My work' } }, ids);
  const imported = readProgress({ notes: Object.fromEntries(Array.from({ length: 40 }, (_, i) => ['project-' + i, 'Imported'])) }, ids);
  const merged = mergeLearningBackup(current, imported, ids);
  assert.equal(merged.notes.web, 'My work');
  assert.equal(Object.keys(merged.notes).length, 40);
});

test('unusual JSON note keys cannot crash the merge or alter object prototypes', () => {
  const current = readProgress(null, ids);
  const imported = readProgress(JSON.parse('{"notes":{"constructor":"a note","__proto__":"ignored"}}'), ids);
  const merged = mergeLearningBackup(current, imported, ids);
  assert.equal(merged.notes.constructor, 'a note');
  assert.equal(Object.hasOwn(merged.notes, '__proto__'), false);
  assert.equal(Object.getPrototypeOf(merged.notes), Object.prototype);
});
