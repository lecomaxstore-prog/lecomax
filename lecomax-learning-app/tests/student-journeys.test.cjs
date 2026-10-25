const { test } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../scripts/inspect.cjs');
const { initial, readProgress, recordAnswer } = load('lecomax-learning-app/utils/progress.ts');
const { library } = load('lecomax-learning-app/services/course-library.ts');
const { courseLearning, recordCourseLesson, currentLearningCourse } = load('lecomax-learning-app/services/course-learning.ts');
const { roadmap, placement, diagnosticQuestions, enrollJourney, demonstratedSkills } = load('lecomax-learning-app/services/learning-roadmap.ts');
const { dueReviews } = load('lecomax-learning-app/utils/learning-memory.ts');
const { synchronizeProgress } = load('lecomax-learning-app/utils/progress-sync.ts');
const fresh = () => structuredClone(initial);
const reload = p => readProgress(JSON.stringify(p));

test('A: every course starts with zero evidence and exact unique denominators', () => {
  for (const c of library.filter(c => c.lessons.length)) {
    const p = fresh(), r = roadmap(c.id, p);
    assert.equal(r.next.id, c.lessons[0].id);
    assert.equal(r.percent, 0); assert.equal(r.pathPercent, 0);
    assert.equal(r.total, new Set(c.lessons.map(l => l.id)).size);
    assert.equal(demonstratedSkills(c.id, p).length, 0);
    for (const m of r.stages) assert.equal(m.done, 0);
  }
});
test('B/C: placement survives completion of its first lesson without jumping back to skipped basics', () => {
  const c = library.find(c => c.id === 'python');
  let p = enrollJourney(fresh(), c.id);
  const qs = diagnosticQuestions(c.id, 'en');
  const answers = Object.fromEntries(qs.map(q => [q.key, q.correctIndex]));
  const result = placement(c.id, answers, 'en');
  assert.notEqual(result.recommendedModule, c.modules[0]);
  p.journey.starts[c.id] = result.recommendedModule;
  p.journey.diagnostics.push({ courseId: c.id, answers, recommendedModule: result.recommendedModule, at: 1000 });
  const first = roadmap(c.id, p).next;
  assert.equal(p.completed.length, 0);
  p = recordCourseLesson(p, first.id, c.id, 2000);
  p.completed.push(first.id); // Explicit isolated completion fixture; never written to a learner account.
  p = reload(p);
  const expected = c.lessons[c.lessons.findIndex(l => l.id === first.id) + 1];
  assert.equal(courseLearning(c, p).next.id, expected.id);
  assert.equal(roadmap(c.id, p).next.id, expected.id);
  assert.equal(roadmap(c.id, p).done, 1);
  assert.equal(demonstratedSkills(c.id, p).length, 0);
  const stage = roadmap(c.id, p).stages.find(s => s.module.id === result.recommendedModule);
  p.completed = stage.module.lessons.map(l => l.id);
  const following = roadmap(c.id, reload(p));
  assert.equal(following.current.status, 'available');
  assert.equal(following.current.required.length, 0);
});
test('D: switching active paths restores each checkpoint, and opening a course updates active ownership', () => {
  let p = fresh();
  for (const id of ['python', 'javascript']) {
    const c = library.find(c => c.id === id);
    p = recordCourseLesson(p, c.lessons.at(-1).id, id, 1000);
    p.notes[c.lessons.at(-1).id] = id;
  }
  p = enrollJourney(reload(p), 'python');
  assert.equal(currentLearningCourse(p).id, 'python');
  assert.equal(p.lastLesson, library.find(c => c.id === 'python').lessons.at(-1).id);
  p = enrollJourney(reload(p), 'javascript');
  assert.equal(currentLearningCourse(p).id, 'javascript');
  assert.equal(Object.keys(p.notes).length, 2);
  const python = library.find(c => c.id === 'python');
  p = recordCourseLesson(p, python.lessons[2].id, python.id, 2000);
  assert.equal(p.journey.activeCourse, 'python');
});
test('E: several weeks away produces due reviews without erasing completion or inventing mastery', () => {
  const then = Date.UTC(2026, 8, 1);
  let p = recordAnswer(fresh(), 'academy-computer', 'q1', 0, true, then);
  p = reload(p);
  assert(dueReviews(p, then + 28 * 86400000).some(r => r.lessonId === 'academy-computer'));
  assert.equal(p.completed.length, 0);
});
test('F: failed network sync preserves locally persisted work and reconnect uploads it', async () => {
  const p = fresh(); p.notes.lesson = 'Offline note'; p.drafts.lesson = 'Offline exercise';
  const stored = JSON.stringify(p);
  await assert.rejects(synchronizeProgress(p, null, { get: async () => { throw Error('offline'); }, put: async () => assert.fail() }), /offline/);
  assert.equal(JSON.stringify(p), stored);
  let uploaded;
  await synchronizeProgress(reload(p), null, { get: async () => ({ revision: 0, snapshot: null }), put: async (_, snapshot) => { uploaded = snapshot; } });
  assert.equal(uploaded.notes.lesson, 'Offline note');
  assert.equal(uploaded.drafts.lesson, 'Offline exercise');
});
