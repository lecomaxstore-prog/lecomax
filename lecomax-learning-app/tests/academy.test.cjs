const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const { JSDOM } = require('jsdom');
const { validateAcademy, readAcademy, words } = require('../scripts/validate-academy.cjs');
const { load, ts } = require('../scripts/inspect.cjs');
const data = readAcademy();
const byId = id => data.lessons.find(lesson => lesson.id === id);
const run = code => { const output = []; vm.runInNewContext(code, { console: { log: (...args) => output.push(args.map(String).join(' ')) } }, { timeout: 1000 }); return output; };

test('all published long-form lessons meet the content contract and source fingerprints', () => {
  assert.deepEqual(validateAcademy(data), []);
  assert.equal(data.lessons.length, 7);
  assert.equal(data.coverage.tracks.filter(track => track.status === 'complete').length, 0);
  const project = require('../data/project.json');
  for (const lesson of data.lessons) for (const source of lesson.sourceFiles) {
    const entry = project.find(file => file.path === source.path);
    assert(entry, source.path);
    assert.equal(entry.hash, source.sha256, 'source viewer must match lesson: ' + source.path);
    const snapshot = require('../data/source/' + entry.hash + '.json');
    assert.equal(crypto.createHash('sha256').update(snapshot.content).digest('hex'), source.sha256);
  }
});

test('integrity checks reject missing, duplicate, misordered, placeholder and incomplete lessons', () => {
  const cases = [
    [copy => copy.lessons.pop(), /missing lesson/],
    [copy => delete copy.lessons[0].exercises, /invalid lesson shape/],
    [copy => copy.lessons.push(copy.lessons[0]), /duplicate lesson/],
    [copy => copy.catalog[0].lessonIds.reverse(), /invalid prerequisite order/],
    [copy => copy.lessons[0].prerequisites.push('absent'), /broken prerequisite/],
    [copy => copy.lessons[0].exercises[0].solution = '', /incomplete exercise/],
    [copy => copy.lessons[0].quiz[0].correctIndex = 99, /invalid correct answer/],
    [copy => copy.lessons[0].quiz[0].answerExplanations = [], /missing answer feedback/],
    [copy => copy.lessons[0].sections = [{ title: 'Intro', text: 'Content coming soon' }], /missing teaching sections/],
    [copy => copy.coverage.tracks[0].status = 'complete', /unproven complete track/],
    [copy => copy.lessons[0].sections[1].text = copy.lessons[0].sections[0].text, /duplicate section content/],
    [copy => copy.lessons[0].id = copy.legacyIds[0], /duplicate lesson/],
  ];
  for (const [mutate, expected] of cases) {
    const copy = structuredClone(data); mutate(copy);
    assert.match(validateAcademy(copy).join('\n'), expected);
  }
});

test('offline adapter preserves every teaching section, exercise, quiz and language fallback', () => {
  const academy = load('lecomax-learning-app/services/academy.ts');
  const ids = academy.academyIndex.flatMap(module => module.lessons.map(lesson => lesson.id));
  assert.equal(new Set(ids).size, data.lessons.length);
  const registry = fs.readFileSync(path.join(__dirname, '../data/academy/registry.ts'), 'utf8');
  for (const lesson of data.lessons) {
    assert(registry.includes('./lessons/' + lesson.id + '.json'), 'must be statically bundled');
    for (const language of ['ar', 'en', 'fr']) {
      const loaded = academy.getAcademyLesson(lesson.id, language);
      assert.equal(loaded.language, language);
      assert.equal(loaded.contentLanguage, 'ar');
      assert.equal(loaded.title, lesson.title[language]);
      assert.equal(loaded.explanation.length, lesson.sections.length + 1);
      assert.equal(loaded.academy.exercises.length, lesson.exercises.length);
      assert.equal(loaded.quiz.length, lesson.quiz.length);
      assert.equal(loaded.estimatedMinutes, Math.ceil(words(lesson.sections.map(section => section.text).join(' ')) / 120) + lesson.practiceMinutes);
      for (const section of lesson.sections) assert(loaded.explanation.some(block => block.text === section.text));
      if (loaded.nextLesson) assert(ids.includes(loaded.nextLesson));
    }
  }
  assert.equal(academy.getAcademyLesson('missing', 'ar'), undefined);
  const content = load('lecomax-learning-app/services/content.ts');
  for (const lesson of data.lessons) assert(content.getLesson(lesson.id, 'ar').academy);
  assert(content.searchLessons('Shallow copy', 'ar').some(lesson => lesson.id === 'academy-js-values'));
  const navigation = load('lecomax-learning-app/services/course-navigation.ts');
  const sequence = navigation.lessonSequence('academy-foundations', 'academy-computer');
  assert.equal(sequence.lessons.length, 7);
  assert.equal(sequence.position, 0);
  assert.equal(navigation.courseNavigation('academy-foundations', 'academy-computer').previous, undefined);
  assert.equal(navigation.courseNavigation('academy-foundations', 'academy-site-boutique').next, undefined);
});

test('every runnable JavaScript example produces its documented output', () => {
  for (const lesson of data.lessons) for (const example of lesson.examples) {
    if (example.language !== 'javascript') continue;
    assert(example.expectedOutput?.length, lesson.id + ':' + example.id);
    assert.deepEqual(run(example.code), example.expectedOutput, lesson.id + ':' + example.id);
  }
});

test('delivery calculation meets empty-order and threshold contracts', () => {
  const code = byId('academy-algorithms').examples.find(example => example.id === 'delivery').code;
  for (const [subtotal, shipping, total] of [[0,0,0],[1,15,16],[199,15,214],[200,0,200],[201,0,201]]) {
    assert.deepEqual(run(code.replace('const subtotal = 200;', 'const subtotal = ' + subtotal + ';')), [String(shipping), String(total)]);
  }
  assert.notDeepEqual(run(code.replace('subtotal < 200', 'subtotal <= 200')), ['0','200']);
});

test('quantity conversion rejects malformed and out-of-range inputs', () => {
  const code = byId('academy-js-values').examples.find(example => example.id === 'quantity').code;
  for (const value of ['', ' ', '3x', '3.5', '0', '100', '-1', 'Infinity', 'NaN']) {
    assert.deepEqual(run(code.replace('" 3 "', JSON.stringify(value))), ['Invalid quantity'], value);
  }
  for (const [value, total] of [[' 3 ',60],['1',20],['99',1980]]) assert.deepEqual(run(code.replace('" 3 "', JSON.stringify(value))), [String(total)]);
  const copy = byId('academy-js-values').exercises.find(exercise => exercise.id === 'copy');
  assert.deepEqual(run(copy.solution), ['Rabat','Casa']);
});

test('HTML labs have complete local assets, valid fragment targets and useful semantics', () => {
  for (const id of ['academy-files','academy-html-document']) {
    const lesson = byId(id);
    const assets = new Set(lesson.examples.map(example => '/' + example.filename));
    for (const example of lesson.examples.filter(example => example.language === 'html')) {
      const dom = new JSDOM(example.code, { url: 'https://academy.test/' + example.filename });
      const document = dom.window.document;
      assert(document.doctype && document.title && document.documentElement.lang);
      assert.equal(document.querySelectorAll('h1').length, 1);
      const ids = [...document.querySelectorAll('[id]')].map(element => element.id);
      assert.equal(new Set(ids).size, ids.length);
      for (const image of document.querySelectorAll('img')) {
        assert(image.getAttribute('alt'));
        assert(assets.has(new URL(image.src).pathname), 'missing local image ' + image.src);
      }
      for (const link of document.querySelectorAll('a[href]')) {
        const href = link.getAttribute('href');
        if (href.startsWith('#')) assert(document.getElementById(href.slice(1)), href);
        else assert(assets.has(new URL(link.href).pathname), 'missing local page ' + href);
      }
      for (const element of document.querySelectorAll('[aria-labelledby]')) {
        for (const id of element.getAttribute('aria-labelledby').split(' ')) assert(document.getElementById(id));
      }
      if (id === 'academy-html-document') assert(document.querySelector('main article section h2'));
      dom.window.close();
    }
  }
});

test('actual page snapshot waits for the request, fetches active products and forwards the list', async () => {
  const source = byId('academy-site-boutique').examples.find(example => example.id === 'actual-page').code;
  assert.equal(source, fs.readFileSync(path.join(data.repositoryRoot, 'app/boutique/page.tsx'), 'utf8'));
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const calls = [];
  const products = [{ slug: 'demo', price: 20 }];
  const exports = {};
  vm.runInNewContext(output, { exports, require: name => {
    if (name === 'next/server') return { connection: async () => { calls.push('connection'); } };
    if (name === '@/lib/db-server') return { getDbProducts: async options => { assert.deepEqual(JSON.parse(JSON.stringify(options)), {activeOnly:true}); calls.push('products'); return products; } };
    if (name === './BoutiqueClient') return { default: 'client-component' };
    if (name === 'react/jsx-runtime') return { jsx: (type, props) => ({type, props}) };
    throw new Error(name);
  } });
  const result = await exports.default();
  assert.deepEqual(calls, ['connection','products']);
  assert.equal(result.props.initialProducts, products);
  assert.equal(exports.revalidate, 300);
});
