const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const advanced = evaluate(fs.readFileSync(require.resolve('../data/iptv-advanced.ts'), 'utf8'));
const mastery = evaluate(fs.readFileSync(require.resolve('../data/iptv-mastery.ts'), 'utf8'));
const live = evaluate(fs.readFileSync(require.resolve('../data/iptv-live.ts'), 'utf8'), { './iptv-advanced': advanced, './iptv-mastery': mastery });
const index = JSON.parse(JSON.stringify(require('../scripts/inspect.cjs').load('lecomax-learning-app/services/content.ts').index));
function evaluate(code, dependencies = {}) {
  dependencies = { '../data/university/curriculum': require('../scripts/inspect.cjs').load('lecomax-learning-app/data/university/curriculum.ts'), './curriculum': require('../scripts/inspect.cjs').load('lecomax-learning-app/services/curriculum.ts'), ...dependencies };
  const output = ts.transpileModule(code, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  vm.runInNewContext(output, { exports, URL, Response, require(name) { assert(name in dependencies, name); return dependencies[name]; } });
  return exports;
}
test('course library references real modules, including every original academy module', () => {
  const { courses } = evaluate(fs.readFileSync(require.resolve('../constants/courses.ts'), 'utf8'), { '../services/content': { index } });
  assert.equal(new Set(courses.map(course => course.id)).size, courses.length);
  for (const id of ['academy-foundations', 'iptv-live', 'real-site', 'python', 'nextjs', 'api', 'database', 'javascript', 'deploy', 'iptv']) assert(courses.some(course => course.id === id), id);
  for (const course of courses) {
    assert(course.modules.length > 0);
    for (const id of course.modules) assert(index.some(m => m.id === id && m.lessons.length > 0), id);
  }
  const manifest = require('../../app/admin/how-it-was-built/course/generated/manifest.json');
  assert.deepEqual(index.filter(m => m.academy).map(m => m.id), manifest.modules.map(m => m.id));
  for (const m of manifest.modules) assert(courses.find(c => c.id === 'real-site').modules.includes(m.id));
});
test('IPTV workshop has ten localized lessons with practice and quizzes', () => {
  for (const lang of ['ar', 'en', 'fr']) {
    const { lessons } = require(`../data/lessons/${lang}/iptv-workshop.json`);
    assert.equal(lessons.length, 10);
    for (const lesson of lessons) {
      assert(lesson.explanation[0].text.length > 100);
      assert(lesson.codeExample[0].code);
      assert(lesson.exercise.task && lesson.exercise.solution);
      assert.equal(lesson.quiz.length, 1);
    }
  }
});

test('live IPTV course resolves every localized lesson and keeps its local lab isolated', () => {
  assert.equal(live.iptvLiveIndex.lessons.length, 30);
  for (const lang of ['ar', 'en', 'fr']) {
    for (const [i, entry] of live.iptvLiveIndex.lessons.entries()) {
      const lesson = live.getIptvLiveLesson(entry.id, lang);
      assert.equal(lesson.title, entry.title[lang]);
      assert(lesson.explanation.some(block => block.text.length > 150));
      assert(lesson.exercise.task && lesson.exercise.solution);
      assert(lesson.quiz[0].options[lesson.quiz[0].correctIndex]);
      assert.equal(lesson.nextLesson, live.iptvLiveIndex.lessons[i + 1]?.id || '');
    }
  }
  const command = live.getIptvLiveLesson('iptv-live-server', 'en').codeExample[0].code;
  assert(command.includes('127.0.0.1:1935:1935'));
  assert(command.includes('127.0.0.1:8888:8888'));
  assert.equal(live.getIptvLiveLesson('unknown', 'en'), undefined);
  const ops = live.getIptvLiveLesson('iptv-live-operations', 'en');
  const results = [];
  vm.runInNewContext(ops.codeExample[0].code, { console: { log: value => results.push(value) } });
  assert(Math.abs(results[0] - 62.56) < 0.0001);
  const hostingResults = [];
  vm.runInNewContext(live.getIptvLiveLesson('iptv-live-hosting', 'en').codeExample[0].code, {
    console: { log: value => hostingResults.push(value) },
  });
  assert.equal(hostingResults[0].egressMbps, 400);
  assert.equal(hostingResults[0].transferGB, 360);
  assert.equal(live.iptvLiveIndex.lessons[0].id, 'iptv-live-basics');
});

test('expanded paths have unique modules, guidance, and course-scoped lesson boundaries', () => {
  const { courses } = evaluate(fs.readFileSync(require.resolve('../constants/courses.ts'), 'utf8'), { '../services/content': { index } });
  const { courseGuidance } = evaluate(fs.readFileSync(require.resolve('../constants/course-guidance.ts'), 'utf8'));
  const { courseNavigation } = evaluate(fs.readFileSync(require.resolve('../services/course-navigation.ts'), 'utf8'), { '../constants/courses': { courses }, './content': { index } });
  for (const course of courses) {
    assert.equal(new Set(course.modules).size, course.modules.length);
    assert.equal(courseGuidance[course.id].prerequisite.length, 3);
    assert.equal(courseGuidance[course.id].outcome.length, 3);
    const modules = course.modules.map(id => index.find(m => m.id === id));
    const ids = modules.flatMap(m => m.lessons.map(l => l.id));
    assert.equal(courseNavigation(course.id, ids[0]).previous, undefined);
    assert.equal(courseNavigation(course.id, ids.at(-1)).next, undefined);
    const boundary = modules[0].lessons.at(-1).id;
    assert.equal(courseNavigation(course.id, boundary).next, modules[1]?.lessons[0].id);
  }
  assert.equal(courseNavigation('unknown', 'guide-python-0'), undefined);
  assert.equal(courseNavigation('python', 'iptv-api'), undefined);
});

test('Python workshops are fully localized with stable IDs, exercises and valid quiz answers', () => {
  for (const moduleId of ['python-core-lab', 'python-professional-lab']) {
    const localized = ['ar', 'en', 'fr'].map(lang => require(`../data/lessons/${lang}/${moduleId}.json`));
    assert.equal(localized[0].lessons.length, 4);
    for (const module of localized) {
      assert.deepEqual(module.lessons.map(l => l.id), localized[0].lessons.map(l => l.id));
      for (const lesson of module.lessons) {
        assert(lesson.explanation[0].text.length > 150);
        assert(lesson.codeExample[0].code);
        assert(lesson.exercise.task && lesson.exercise.solution);
        assert(Object.values(lesson.teaching).every(Boolean));
        for (const quiz of lesson.quiz) assert(quiz.options[quiz.correctIndex]);
      }
    }
    assert.notEqual(localized[0].lessons[0].concept, localized[1].lessons[0].concept);
    assert.notEqual(localized[1].lessons[0].concept, localized[2].lessons[0].concept);
  }
});
test('taught IPTV API and schedule examples handle missing channels and time boundaries', async () => {
  const lessons = require('../data/lessons/en/iptv-workshop.json').lessons;
  const code = id => lessons.find(l => l.id === 'iptv-' + id).codeExample[0].code;
  const catalog = evaluate(code('catalog'));
  const { GET } = evaluate(code('api'), { '@/lib/channels': catalog });
  assert.equal(GET({url:'http://localhost/api/channels'}).status, 200);
  assert.equal((await GET({url:'http://localhost/api/channels?id=demo'}).json()).id, 'demo');
  assert.equal(GET({url:'http://localhost/api/channels?id=unknown'}).status, 404);
  const { programAt } = evaluate(code('guide'));
  assert.equal(programAt(Date.parse('2026-10-07T09:59:00Z')), undefined);
  assert.equal(programAt(Date.parse('2026-10-07T10:00:00Z')).title, 'Demo program');
  assert.equal(programAt(Date.parse('2026-10-07T10:30:00Z')), undefined);
});

test('library progress resumes unfinished lessons and handles shared, duplicate and completed progress', () => {
  const { courses } = evaluate(fs.readFileSync(require.resolve('../constants/courses.ts'), 'utf8'), { '../services/content': { index } });
  const { library, courseProgress, normalizeCourseQuery } = evaluate(fs.readFileSync(require.resolve('../services/course-library.ts'), 'utf8'), { '../constants/courses': { courses }, './content': { index } });
  const course = library.find(c => c.id === 'python');
  const [first, second] = course.lessons;
  assert.equal(courseProgress(course, [], '').next.id, first.id);
  assert.equal(courseProgress(course, [], second.id).next.id, second.id);
  assert.equal(courseProgress(course, [], second.id).started, true);
  assert.equal(courseProgress(course, [first.id, first.id, 'unknown'], first.id).done, 1);
  assert.equal(courseProgress(course, [first.id], first.id).next.id, second.id);
  assert.equal(courseProgress(course, course.lessons.map(l => l.id), first.id).next, undefined);
  assert.equal(normalizeCourseQuery('  DÉCOUVRIR  '), 'decouvrir');
  assert.equal(normalizeCourseQuery('أَساسِيّات'), normalizeCourseQuery('اساسيات'));
  for (const item of library) assert.equal(item.lessons.length, new Set(item.lessons.map(l => l.id)).size);
});


test('direct lesson links recover the full IPTV path and keep explicit course ordering', () => {
  const { courses } = evaluate(fs.readFileSync(require.resolve('../constants/courses.ts'), 'utf8'), { '../services/content': { index } });
  const { lessonSequence } = evaluate(fs.readFileSync(require.resolve('../services/course-navigation.ts'), 'utf8'), { '../constants/courses': { courses }, './content': { index } });
  const sequence = lessonSequence(undefined, 'iptv-live-basics');
  assert.equal(sequence.courseId, 'iptv-live');
  assert.equal(sequence.lessons.length, 40);
  assert.equal(sequence.position, 0);
  assert.equal(sequence.lessons[1].id, live.iptvLiveIndex.lessons[1].id);
  const final = lessonSequence(undefined, sequence.lessons.at(-1).id);
  assert.equal(final.courseId, 'iptv-live');
  assert.equal(final.position, 39);
  assert.equal(final.lessons[final.position + 1], undefined);
  const explicit = lessonSequence('iptv', sequence.lessons.at(-1).id);
  assert.equal(explicit.courseId, 'iptv');
  assert.equal(lessonSequence(undefined, 'missing-lesson'), undefined);
});
