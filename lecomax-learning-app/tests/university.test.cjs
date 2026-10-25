const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const http = require('node:http');
const { load } = require('../scripts/inspect.cjs');
const base = 'lecomax-learning-app/';
const { curriculum } = load(base + 'data/university/curriculum.ts');
const { universityEntries, universityIndex, getUniversityLesson } = load(base + 'data/university/lessons.ts');
const legacy = require('../data/index.json');
const allModules = [...universityIndex, ...legacy];

test('50 ordered curriculum topics reference real offline modules without invented lessons', () => {
  assert.equal(curriculum.length, 50);
  assert.equal(new Set(curriculum.map(p => p.id)).size, 50);
  const allIds = allModules.flatMap(m => m.lessons.map(l => l.id));
  assert.equal(new Set(allIds).size, allIds.length);
  for (let i = 0; i < curriculum.length; i++) {
    const path = curriculum[i];
    assert(path.phase >= (curriculum[i - 1]?.phase || 0));
    assert.equal(path.syllabus.length, 4);
    for (const language of ['ar', 'en', 'fr']) assert(path.title[language]);
    assert.equal(new Set(path.modules).size, path.modules.length);
    for (const id of path.modules) assert(allModules.some(m => m.id === id && m.lessons.length > 0), id);
  }
  assert(curriculum.find(p => p.id === 'docker').modules.length === 0, 'Unwritten Docker course must not pretend to be available');
});

test('new lessons have substantial unique content, working progression and explicit translation fallback', () => {
  const ids = new Set(allModules.flatMap(m => m.lessons.map(l => l.id)));
  assert.equal(universityEntries.length, 5);
  for (const { lesson, support } of universityEntries) {
    assert(lesson.explanation.length >= 6);
    assert(lesson.explanation.every(section => section.text.length > 180), lesson.id);
    assert(lesson.exercise.task && lesson.exercise.solution);
    assert(support.objective && support.simpler && support.example && support.mistake);
    assert(support.diagram.length >= 4);
    assert(support.terms.length >= 3);
    assert(lesson.quiz.length > 0);
    for (const q of lesson.quiz) assert(q.options[q.correctIndex] && q.explanation.length > 50);
    if (lesson.nextLesson) assert(ids.has(lesson.nextLesson));
    for (const language of ['ar', 'en', 'fr']) {
      const localized = getUniversityLesson(lesson.id, language);
      assert.equal(localized.language, language);
      assert.equal(localized.contentLanguage, 'ar');
    }
  }
  assert.equal(getUniversityLesson('missing', 'ar'), undefined);
});

const code = id => universityEntries.find(e => e.lesson.id === id).lesson.codeExample[0].code;
test('introductory calculations run and match their taught outputs', () => {
  const output = [];
  for (const id of ['university-computer', 'university-model']) {
    vm.runInNewContext(code(id), { console: { log: (...args) => output.push(args) } }, { timeout: 1000 });
  }
  assert.deepEqual(output, [[240], [11, 1]]);
});

test('order tool example does not reveal another user’s order or accept invalid arguments', () => {
  const context = { console: { log() {} } };
  vm.runInNewContext(code('university-agent'), context, { timeout: 1000 });
  const run = expression => JSON.parse(JSON.stringify(vm.runInNewContext(expression, context)));
  assert.deepEqual(run("getOrder('u1', 'demo-1')"), { id: 'demo-1', status: 'packed' });
  assert.deepEqual(run("getOrder('u2', 'demo-1')"), { error: 'Not available' });
  assert.deepEqual(run("getOrder('u1', 'missing')"), { error: 'Not available' });
  assert.deepEqual(run("getOrder('u1', 123)"), { error: 'Invalid input' });
});

test('local server lab binds to loopback and serves the documented status and JSON', async () => {
  let server;
  vm.runInNewContext(code('university-local-server'), {
    require: name => {
      assert.equal(name, 'node:http');
      return { createServer: handler => {
        server = http.createServer(handler);
        return { listen: (port, host) => { assert.equal(port, 3000); assert.equal(host, '127.0.0.1'); } };
      } };
    },
  }, { timeout: 1000 });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const url = `http://127.0.0.1:${server.address().port}`;
    const success = await fetch(url + '/health');
    assert.equal(success.status, 200);
    assert.match(success.headers.get('content-type'), /application\/json/);
    assert.deepEqual(await success.json(), { ok: true });
    for (const [path, method] of [['/unknown', 'GET'], ['/health', 'POST']]) {
      const failure = await fetch(url + path, { method });
      assert.equal(failure.status, 404);
      assert.deepEqual(await failure.json(), { error: 'Not found' });
    }
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
});

test('search covers Arabic and English curriculum topics and preserves highlighted text', () => {
  const { searchPaths } = load(base + 'services/curriculum.ts');
  const { searchSegments } = load(base + 'utils/search-highlight.ts');
  assert(searchPaths('AI agents', 'ar').some(p => p.id === 'agents'));
  assert(searchPaths('Docker', 'ar').some(p => p.id === 'docker'));
  assert(searchPaths('الحاسوب', 'ar').some(p => p.id === 'computers'));
  for (const [text, query] of [['إِنترنت وDNS', 'انترنت'], ['Next.js: next steps', 'next'], ['React (Native)', '(']]) {
    const segments = searchSegments(text, query);
    assert.equal(segments.map(s => s.text).join(''), text);
    assert(segments.some(s => s.match));
  }
});
