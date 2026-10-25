const { test } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../scripts/inspect.cjs');
const { library } = load('lecomax-learning-app/services/course-library.ts');
const { initial, readProgress } = load('lecomax-learning-app/utils/progress.ts');
const { courseGroups, courseLearning, currentLearningCourse, recordCourseLesson } = load('lecomax-learning-app/services/course-learning.ts');
const fresh = () => structuredClone(initial);
const python = library.find(c => c.id === 'python');
const javascript = library.find(c => c.id === 'javascript');

test('course groups contain every existing course exactly once', () => {
  const ids = courseGroups.flatMap(g => g.courses);
  assert.equal(new Set(ids).size, library.length);
  assert.equal(ids.length, library.length);
  for (const course of library) assert(ids.includes(course.id));
});

test('new learners start at the beginning without invented progress', () => {
  for (const course of library) {
    const p = courseLearning(course, fresh());
    assert.equal(p.started, false);
    assert.equal(p.done, 0);
    assert.equal(p.position, 1);
    assert.equal(p.next.id, course.lessons[0].id);
  }
});

test('switching courses preserves individual checkpoints and stages after storage reload', () => {
  const lesson = python.lessons[3];
  let state = recordCourseLesson(fresh(), lesson.id, python.id);
  state.stages[lesson.id] = 2;
  state = recordCourseLesson(state, javascript.lessons[5].id, javascript.id);
  state = readProgress(JSON.stringify(state));
  assert.equal(currentLearningCourse(state).id, javascript.id);
  assert.equal(courseLearning(python, state).next.id, lesson.id);
  assert.equal(courseLearning(python, state).started, true);
  assert.equal(state.stages[lesson.id], 2);
  assert.equal(courseLearning(javascript, state).next.id, javascript.lessons[5].id);
});

test('shared introductory lessons keep explicit course ownership without starting other courses', () => {
  const shared = python.lessons.find(l => javascript.lessons.some(j => j.id === l.id));
  assert(shared);
  const state = recordCourseLesson(fresh(), shared.id, javascript.id);
  assert.equal(currentLearningCourse(state).id, javascript.id);
  assert.equal(courseLearning(javascript, state).started, true);
  assert.equal(courseLearning(python, state).started, false);
});

test('completion advances to unfinished work and never starts a completed course over', () => {
  let state = recordCourseLesson(fresh(), python.lessons[0].id, python.id);
  state.completed = [python.lessons[0].id, python.lessons[0].id, 'unknown'];
  assert.equal(courseLearning(python, state).next.id, python.lessons[1].id);
  assert.equal(courseLearning(python, state).done, 1);
  state.completed = python.lessons.map(l => l.id);
  const progress = courseLearning(python, state);
  assert.equal(progress.complete, true);
  assert.equal(progress.next, undefined);
});

test('legacy progress remains usable and invalid checkpoints are ignored', () => {
  const unique = python.lessons.find(l => library.filter(c => c.lessons.some(x => x.id === l.id)).length === 1);
  assert(unique);
  const state = fresh();
  state.academy.visits = [{ id: unique.id, at: 100 }];
  state.stages[unique.id] = 1;
  state.drafts['learning:course:python'] = 'deleted-lesson';
  assert.equal(courseLearning(python, state).next.id, unique.id);
  assert.equal(courseLearning(python, state).started, true);
  state.academy.enrolled = [javascript.id];
  assert.equal(courseLearning(javascript, state).saved, true);
  assert.equal(courseLearning(javascript, state).started, false);
});
