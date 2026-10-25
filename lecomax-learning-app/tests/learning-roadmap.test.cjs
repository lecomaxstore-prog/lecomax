const { test } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../scripts/inspect.cjs');
const { initial, readProgress } = load('lecomax-learning-app/utils/progress.ts');
const {
  activeJourney,
  enrollJourney,
  roadmap,
  placement,
  diagnosticQuestions,
  demonstratedSkills,
} = load('lecomax-learning-app/services/learning-roadmap.ts');
const { recordCourseLesson } = load('lecomax-learning-app/services/course-learning.ts');
const { mergeProgress, synchronizeProgress } = load('lecomax-learning-app/utils/progress-sync.ts');
const fresh = () => structuredClone(initial);

test('legacy migration retains all records and adds empty journey preferences', () => {
  const old = fresh();
  delete old.journey;
  old.completed = ['existing'];
  old.notes.existing = 'Keep this';
  const migrated = readProgress(JSON.stringify(old));
  assert.equal(migrated.completed[0], 'existing');
  assert.equal(migrated.notes.existing, 'Keep this');
  assert.equal(migrated.journey.activeCourse, '');
  assert.equal(migrated.journey.diagnostics.length, 0);
});
test('new learner has no invented enrollment or mastery and empty paths are not enrolled', () => {
  assert.equal(activeJourney(fresh()), undefined);
  assert.throws(() => enrollJourney(fresh(), 'empty'));
  assert.equal(roadmap('empty', fresh()), undefined);
  assert.equal(demonstratedSkills('python', fresh()).length, 0);
});
test('computer enrollment does not imply Python completion', () => {
  const p = enrollJourney(fresh(), 'computer-basics');
  assert.equal(activeJourney(p).id, 'computer-basics');
  assert.equal(roadmap('python', p).done, 0);
});
test('opening lessons only records resume, course/module/path totals are explicit', () => {
  let p = enrollJourney(fresh(), 'python');
  const first = roadmap('python', p).next;
  p = recordCourseLesson(p, first.id, 'python');
  p.stages[first.id] = 2;
  p = readProgress(JSON.stringify(p));
  const plan = roadmap('python', p);
  assert.equal(plan.next.id, first.id);
  assert.equal(p.stages[first.id], 2);
  assert.equal(plan.done, 0);
  assert.equal(plan.pathTotal, plan.total + 1);
  assert.equal(plan.stages[1].status, 'upcoming');
});
test('explicit prerequisite override does not award completions', () => {
  const p = enrollJourney(fresh(), 'python');
  const module = roadmap('python', p).stages[1].module.id;
  p.journey.overrides.push('python:' + module);
  assert.equal(roadmap('python', p).stages[1].status, 'available');
  assert.equal(p.completed.length, 0);
});
test('placement requires actual answers and never gives mastery or completion credit', () => {
  const qs = diagnosticQuestions('python', 'en');
  assert(qs.length > 0);
  const blank = placement('python', {}, 'en');
  assert.equal(blank.correct, 0);
  const answers = Object.fromEntries(qs.map((q) => [q.key, q.correctIndex]));
  const result = placement('python', answers, 'en');
  assert.equal(result.correct, qs.length);
  assert.equal(blank.recommendedModule, roadmap('python', fresh()).stages[0].module.id);
});
test('completed courses have no fabricated next lesson, project remains distinct', () => {
  const p = enrollJourney(fresh(), 'python');
  p.completed = roadmap('python', p).course.lessons.map((l) => l.id);
  const plan = roadmap('python', p);
  assert.equal(plan.complete, true);
  assert.equal(plan.next, undefined);
  assert.equal(plan.percent, 100);
  assert.equal(plan.projectDone, false);
  assert(plan.pathPercent < 100);
});
test('three-way sync merges independent notes and additive completions', () => {
  const base = fresh(),
    local = fresh(),
    remote = fresh();
  local.notes.a = 'local';
  remote.notes.b = 'remote';
  local.completed = ['a'];
  remote.completed = ['b'];
  const p = mergeProgress(base, local, remote);
  assert.equal(p.notes.a, 'local');
  assert.equal(p.notes.b, 'remote');
  assert(p.completed.includes('a') && p.completed.includes('b'));
});
test('conflicting notes and completion removals stop without mutation', () => {
  const base = fresh(),
    local = fresh(),
    remote = fresh();
  local.notes.a = 'one';
  remote.notes.a = 'two';
  assert.throws(() => mergeProgress(base, local, remote), /PROGRESS_CONFLICT/);
  assert.equal(local.notes.a, 'one');
  assert.equal(remote.notes.a, 'two');
  base.completed = ['a'];
  local.completed = [];
  remote.completed = ['a', 'b'];
  assert.throws(() => mergeProgress(base, local, remote), /PROGRESS_CONFLICT/);
});
test('failed cloud sync and revision conflicts cannot advance a local snapshot', async () => {
  const local = fresh();
  local.notes.a = 'offline work';
  await assert.rejects(
    synchronizeProgress(local, null, {
      get: async () => {
        throw Error('offline');
      },
      put: async () => assert.fail(),
    }),
    /offline/,
  );
  await assert.rejects(
    synchronizeProgress(local, null, {
      get: async () => ({ revision: 4, snapshot: fresh() }),
      put: async (revision) => {
        assert.equal(revision, 4);
        throw Error('BACKUP_CONFLICT');
      },
    }),
    /BACKUP_CONFLICT/,
  );
  assert.equal(local.notes.a, 'offline work');
});
test('cloud hydration preserves remote work and writes against fetched revision', async () => {
  const remote = fresh();
  remote.notes.remote = 'retained';
  const local = fresh();
  local.notes.local = 'retained';
  let writes = 0;
  const p = await synchronizeProgress(local, null, {
    get: async () => ({ revision: 7, snapshot: remote }),
    put: async (revision, snapshot) => {
      writes++;
      assert.equal(revision, 7);
      assert.equal(snapshot.notes.remote, 'retained');
    },
  });
  assert.equal(writes, 1);
  assert.equal(p.notes.local, 'retained');
});

test('every published course has a real project and project credit requires completed lessons', () => {
  const { journeyCourses } = load('lecomax-learning-app/services/learning-roadmap.ts');
  for (const course of journeyCourses) {
    const p = enrollJourney(fresh(), course.id);
    let plan = roadmap(course.id, p);
    assert(plan.workshop.stages.length > 0);
    p.journey.projects[plan.milestone.id] = {
      artifact: 'My artifact and observed test results',
      reviewed: true,
      at: 100,
    };
    assert.equal(roadmap(course.id, p).projectDone, false);
    p.completed = course.lessons.map((l) => l.id);
    plan = roadmap(course.id, p);
    assert.equal(plan.projectDone, true);
    assert.equal(plan.pathPercent, 100);
  }
});
