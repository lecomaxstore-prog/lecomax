const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { load } = require('../scripts/inspect.cjs');
const { getLesson, index } = load('lecomax-learning-app/services/content.ts');
const { library } = load('lecomax-learning-app/services/course-library.ts');
const { lessonSequence } = load('lecomax-learning-app/services/course-navigation.ts');
const { initial, readProgress } = load('lecomax-learning-app/utils/progress.ts');
const { practiceReady, rubricKey, curriculumGaps } = load('lecomax-learning-app/services/curriculum-evidence.ts');
const { roadmap } = load('lecomax-learning-app/services/learning-roadmap.ts');

test('computer path preserves the original and adds a complete ordered practical sequence', () => {
  const course = library.find(c => c.id === 'computer-basics');
  assert.equal(course.lessons[0].id, 'university-computer');
  assert.equal(course.lessons.at(-1).id, 'computer-capstone');
  assert.equal(course.lessons.length, 6);
  const ids = new Set();
  for (const [i, item] of course.lessons.entries()) {
    assert(!ids.has(item.id));
    const lesson = getLesson(item.id, 'en');
    assert(lesson);
    assert.equal(lessonSequence(course.id, item.id).position, i);
    if (lesson.curriculum) {
      for (const prerequisite of lesson.curriculum.prerequisiteIds) assert(ids.has(prerequisite), prerequisite);
      assert(lesson.curriculum.objectives.length >= 3);
      assert(lesson.curriculum.rubric.every(r => r.evidence && r.revise));
      assert(lesson.exercise.task && lesson.exercise.solution && lesson.exercise.hints.length);
      assert(lesson.quiz.length >= 3);
      for (const q of lesson.quiz) {
        assert(q.options[q.correctIndex]);
        assert(q.explanation);
      }
      for (const language of ['ar', 'fr', 'en']) assert.equal(getLesson(item.id, language).contentLanguage, 'en');
    }
    ids.add(item.id);
  }
  assert.equal(new Set(index.flatMap(m => m.lessons.map(l => l.id))).size, index.flatMap(m => m.lessons).length);
});

test('worked algorithm executes and the independent challenge catches the stated boundary bug', () => {
  const lesson = getLesson('computer-algorithm-tests', 'en');
  const output = [];
  const context = { console: { log: (...args) => output.push(args) } };
  vm.createContext(context);
  vm.runInContext(lesson.codeExample[0].code, context, { timeout: 1000 });
  assert.deepEqual(output.map(row => row[1]), ['invalid', 5, 5, 0, 0, 'invalid']);
  const changed = lesson.codeExample[0].code.replace('>= 50 ? 0 : 5', '>= 80 ? 0 : 7');
  vm.runInContext(changed, context);
  assert.equal(vm.runInContext('delivery(80)', context), 0);
  assert.equal(vm.runInContext('delivery(79)', context), 7);
  vm.runInContext(changed.replace('>= 80', '> 80'), context);
  assert.equal(vm.runInContext('delivery(80)', context), 7);
});

test('quiz success alone cannot meet practice criteria; rubric and drafts survive reload without granting mastery', () => {
  const lesson = getLesson('computer-files-recovery', 'en');
  let p = structuredClone(initial);
  p.completed = ['old-lesson'];
  assert.equal(practiceReady(lesson, p), false);
  lesson.curriculum.rubric.forEach((_, i) => p.drafts[rubricKey(lesson.id, i)] = '2');
  assert.equal(practiceReady(lesson, p), false);
  p.drafts[lesson.id] = 'v1 restored into recovery; v2 preserved; same-drive limitation recorded';
  p = readProgress(JSON.stringify(p));
  assert.equal(practiceReady(lesson, p), true);
  assert.equal(p.completed.length, 1);
  p.drafts[rubricKey(lesson.id, 1)] = '1';
  assert.equal(practiceReady(lesson, p), false);
  assert.equal(curriculumGaps(lesson, p)[0].criterion, 'Recovery evidence');
  assert.equal(roadmap('computer-basics', p).projectDone, false);
});
