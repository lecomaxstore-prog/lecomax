const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const React = require('react');
const { createRoot } = require('react-dom/client');
const { JSDOM } = require('jsdom');
const { load, ts } = require('../scripts/inspect.cjs');
const { courseWorkshops, workshopDraftKey } = load('lecomax-learning-app/constants/course-workshops.ts');
const { courses } = load('lecomax-learning-app/constants/courses.ts');
const { index } = load('lecomax-learning-app/services/content.ts');
const { initial, readProgress } = load('lecomax-learning-app/utils/progress.ts');

test('every catalog course has practical work with declared language and valid course-scoped lesson links', () => {
  assert.deepEqual(Object.keys(courseWorkshops).sort(), Array.from(courses, c => c.id).sort());
  const keys = new Set();
  for (const course of courses) {
    const plan = courseWorkshops[course.id];
    assert(plan.stages.length >= 1);
    assert.equal(new Set(plan.stages.map(s => s.id)).size, plan.stages.length);
    for (const text of [plan.title, plan.brief, plan.deliverable, plan.defense, ...plan.stages.flatMap(s => [s.title, s.task, s.verify, s.review])]) {
      assert.equal(text.length, 3);
      assert.ok(text.every(value => typeof value === 'string' && value.trim().length > 2));
      if (plan.contentLanguage === 'en') assert.equal(text[2], text[1]);
      else assert.match(text[2], /[\u0600-\u06ff]/);
    }
    for (const stage of plan.stages) {
      assert.ok(course.modules.includes(stage.module), course.id + ': link leaves course');
      assert.ok(index.find(m => m.id === stage.module)?.lessons.length, stage.module + ': empty/missing module');
      const key = workshopDraftKey(course.id, stage.id);
      assert.ok(!keys.has(key), 'draft collision: ' + key);
      keys.add(key);
    }
  }
});

test('workshop notes survive existing progress serialization without completing lessons', () => {
  const drafts = { existing: 'Keep my earlier attempt' };
  for (const course of courses) {
    for (const stage of [...courseWorkshops[course.id].stages, { id: 'defense' }]) {
      drafts[workshopDraftKey(course.id, stage.id)] = course.id + '/' + stage.id;
    }
  }
  const before = { ...initial, completed: ['existing-lesson'], drafts };
  const restored = readProgress(JSON.stringify(before));
  assert.deepEqual(JSON.parse(JSON.stringify(restored)), JSON.parse(JSON.stringify(before)));
  assert.equal(Object.keys(restored.drafts).length, 1 + courses.reduce((sum, c) => sum + courseWorkshops[c.id].stages.length + 1, 0));
});

test('workshop progressively reveals reviews, keeps separate drafts, routes to lessons and reports save failures', async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost' });
  const saved = { window: global.window, document: global.document, IS_REACT_ACT_ENVIRONMENT: global.IS_REACT_ACT_ENVIRONMENT };
  Object.assign(global, { window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true });
  const Context = React.createContext(null);
  const navigation = [];
  let snapshot = { ...initial, language: 'en', drafts: {}, completed: ['keep-me'] };
  let options = { course: 'python', error: '', ready: true };
  let retries = 0;
  const box = ({ children }) => React.createElement('div', null, children);
  const dependencies = {
    'react-native': { View: box },
    'expo-router': { router: { push: value => navigation.push(value) } },
    './UI': {
      Card: box, Label: box,
      Button: ({ title, onPress, selected }) => React.createElement('button', { onClick: onPress, 'aria-pressed': !!selected }, title),
      Field: ({ value, onChangeText, placeholder, editable }) => React.createElement('textarea', { value, disabled: !editable, 'aria-label': placeholder, onInput: e => onChangeText(e.target.value) }),
    },
    '../store/School': { useSchool: () => React.useContext(Context) },
    '../constants/course-workshops': { courseWorkshops, workshopDraftKey },
  };
  const exports = {};
  const output = ts.transpileModule(fs.readFileSync(require.resolve('../components/CourseWorkshop.tsx'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(output, { exports, require: name => dependencies[name] || require(name) });
  function Harness() {
    const [state, update] = React.useState(snapshot);
    snapshot = state;
    return React.createElement(Context.Provider, { value: { state, update, ready: options.ready, error: options.error, retry: () => retries++, t: (...args) => args[{ fr: 0, en: 1, ar: 2 }[state.language]] } },
      React.createElement(exports.CourseWorkshop, { key: options.course, courseId: options.course }));
  }
  let root = createRoot(document.getElementById('root'));
  const button = label => [...document.querySelectorAll('button')].find(b => b.textContent === label);
  const click = async label => { assert.ok(button(label), label); await React.act(() => button(label).click()); };
  try {
    await React.act(() => root.render(React.createElement(Harness)));
    assert.equal(document.querySelectorAll('textarea').length, 0);
    await click('Open workshop');
    await click('1. Define the CSV contract');
    assert.ok(!document.body.textContent.includes(courseWorkshops.python.stages[0].review[1]));
    const field = document.querySelector('textarea');
    await React.act(() => { field.value = 'A and B accepted; C rejected on row 4.'; field.dispatchEvent(new dom.window.Event('input', { bubbles: true })); });
    assert.equal(snapshot.drafts[workshopDraftKey('python', 'parse')], field.value);
    assert.deepEqual(snapshot.completed, ['keep-me']);
    await click('Compare with worked review');
    assert.ok(document.body.textContent.includes(courseWorkshops.python.stages[0].review[1]));
    await click('Review supporting lessons');
    assert.deepEqual(JSON.parse(JSON.stringify(navigation[0])), { pathname: '/module/[id]', params: { id: 'python-core-lab', course: 'python' } });
    await click('2. Calculate without losing evidence');
    assert.equal(document.querySelectorAll('textarea')[1].value, '');
    options = { ...options, error: 'Save failed' };
    await React.act(() => root.render(React.createElement(Harness)));
    await click('Retry saving');
    assert.equal(retries, 1);
    assert.equal(document.querySelector('textarea').value, 'A and B accepted; C rejected on row 4.');
    await React.act(() => root.unmount());
    snapshot = readProgress(JSON.stringify(snapshot));
    root = createRoot(document.getElementById('root'));
    options = { course: 'api', error: '', ready: true };
    await React.act(() => root.render(React.createElement(Harness)));
    await click('Open workshop');
    await click('1. Specify before coding');
    assert.equal(document.querySelector('textarea').value, '');
    options = { ...options, course: 'python' };
    await React.act(() => root.render(React.createElement(Harness)));
    await click('Open workshop');
    await click('1. Define the CSV contract');
    assert.equal(document.querySelector('textarea').value, 'A and B accepted; C rejected on row 4.');
    assert.ok(!document.body.textContent.includes(courseWorkshops.python.stages[0].review[1]));
    options = { ...options, ready: false };
    await React.act(() => root.render(React.createElement(Harness)));
    assert.equal(document.querySelector('textarea').disabled, true);
  } finally {
    await React.act(() => root.unmount());
    dom.window.close();
    Object.assign(global, saved);
  }
});
