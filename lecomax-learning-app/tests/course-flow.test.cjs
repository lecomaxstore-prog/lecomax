const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { createRoot } = require('react-dom/client');
const { JSDOM } = require('jsdom');
const { load } = require('../scripts/inspect.cjs');

test('every published curriculum path retains its exact lessons and navigation boundaries', () => {
  const { curriculum } = load('lecomax-learning-app/data/university/curriculum.ts');
  const { pathLessons } = load('lecomax-learning-app/services/curriculum.ts');
  const { lessonSequence, courseNavigation } = load('lecomax-learning-app/services/course-navigation.ts');
  for (const path of curriculum) {
    const lessons = [...new Map(pathLessons(path).map(l => [l.id, l])).values()];
    for (const [i, lesson] of lessons.entries()) {
      const key = 'path:' + path.id;
      const sequence = lessonSequence(key, lesson.id);
      assert.equal(sequence.courseId, key);
      assert.equal(sequence.position, i);
      assert.deepEqual(Array.from(sequence.lessons, l => l.id), Array.from(lessons, l => l.id));
      const navigation = courseNavigation(key, lesson.id);
      assert.equal(navigation.previous, lessons[i - 1]?.id);
      assert.equal(navigation.next, lessons[i + 1]?.id);
    }
  }
  assert.equal(courseNavigation('path:missing', 'academy-computer'), undefined);
});

function evaluate(file, dependencies) {
  const exports = {};
  const js = ts.transpileModule(fs.readFileSync(require.resolve(file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  vm.runInNewContext(js, { exports, setInterval, clearInterval, require: name => name in dependencies ? dependencies[name] : require(name) });
  return exports;
}

test('device save feedback waits for the latest write and retries failed notes without loading stale storage', async () => {
  const dom = new JSDOM('<div id="root"></div>');
  const previous = { window: global.window, document: global.document, IS_REACT_ACT_ENVIRONMENT: global.IS_REACT_ACT_ENVIRONMENT };
  Object.assign(global, { window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true });
  const progress = load('lecomax-learning-app/utils/progress.ts');
  let stored = JSON.stringify(progress.initial), reads = 0, pending = [], context;
  const school = evaluate('../store/School.tsx', {
    'expo-router': { usePathname: () => '/interactive-studio' },
    '../services/auth': { auth: { snapshot: () => 'anonymous' } },
    'react-native': { AppState: { currentState: 'active' }, useColorScheme: () => 'light' },
    '@react-native-async-storage/async-storage': {
      getItem: async () => { reads++; return stored; },
      setItem: (_key, value) => new Promise((resolve, reject) => pending.push({ resolve: () => { stored = value; resolve(); }, reject })),
    },
    '../utils/progress': progress, '../constants/design': { light: {}, dark: {} },
  });
  function Content() { context = school.useSchool(); return null; }
  const root = createRoot(document.getElementById('root'));
  const settle = async fail => React.act(async () => { const write = pending.shift(); assert(write); fail ? write.reject(new Error('disk full')) : write.resolve(); });
  try {
    await React.act(async () => root.render(React.createElement(school.SchoolProvider, null, React.createElement(Content))));
    assert.equal(context.saveStatus, 'saving'); await settle(); assert.equal(context.saveStatus, 'saved');
    await React.act(() => context.update(p => ({ ...p, notes: { lesson: 'first' } })));
    await React.act(() => context.update(p => ({ ...p, notes: { lesson: 'latest' } })));
    await settle(); assert.equal(context.saveStatus, 'saving', 'an older completed write must not report the latest note saved');
    await settle(true); assert.equal(context.saveStatus, 'error'); assert.equal(context.state.notes.lesson, 'latest');
    await React.act(() => context.retry()); await settle();
    assert.equal(reads, 1); assert.equal(context.saveStatus, 'saved');
    assert.equal(progress.readProgress(stored).notes.lesson, 'latest');
  } finally { await React.act(() => root.unmount()); dom.window.close(); Object.assign(global, previous); }
});

test('full lesson list searches, opens in course context and restores saved completion after remount', async () => {
  const dom = new JSDOM('<div id="root"></div>');
  const previous = { window: global.window, document: global.document, IS_REACT_ACT_ENVIRONMENT: global.IS_REACT_ACT_ENVIRONMENT };
  Object.assign(global, { window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true });
  const progress = load('lecomax-learning-app/utils/progress.ts');
  let stored = JSON.stringify({ ...progress.initial, language: 'en' });
  const writes = [];
  const storage = { getItem: async () => stored, setItem: async (_key, value) => { stored = value; writes.push(value); } };
  const colors = { accent: '#176B5B', muted: '#586E70', bg: '#fff', soft: '#eee' };
  const school = evaluate('../store/School.tsx', {
    'expo-router': { usePathname: () => '/lesson/l0' },
    '../services/auth': { auth: { snapshot: () => 'anonymous' } },
    'react-native': { AppState: { currentState: 'active' }, useColorScheme: () => 'light' },
    '@react-native-async-storage/async-storage': storage,
    '../utils/progress': progress,
    '../constants/design': { light: colors, dark: colors },
  });
  const box = ({ children }) => React.createElement('div', null, children);
  const routes = [];
  const { CourseLessonList } = evaluate('../components/CourseLessonList.tsx', {
    'react-native': { View: box, Pressable: ({ children, onPress, accessibilityLabel }) => React.createElement('button', { onClick: onPress, 'aria-label': accessibilityLabel }, children) },
    '@expo/vector-icons/Ionicons': () => null,
    'expo-router': { router: { push: route => routes.push(route) } },
    '../store/School': school,
    '../services/teacher-navigation': load('lecomax-learning-app/services/teacher-navigation.ts'),
    '../services/content': { normalized: text => text.toLowerCase() },
    './UI': { Card: box, Label: box, Row: box, Button: ({ title, onPress }) => React.createElement('button', { onClick: onPress }, title) },
    './LearningUI': { SearchBar: ({ value, onChangeText }) => React.createElement('input', { value, onInput: e => onChangeText(e.target.value) }) },
  });
  const modules = [0, 1].map(i => ({ id: 'm' + i, title: { en: 'Module ' + i }, lessons: [{ id: 'l' + i, title: { en: 'Lesson ' + i }, minutes: 10 }] }));
  let context;
  function Content() { context = school.useSchool(); return context.ready ? React.createElement(CourseLessonList, { modules, courseId: 'path:test' }) : null; }
  const screen = () => React.createElement(school.SchoolProvider, null, React.createElement(Content));
  let root = createRoot(document.getElementById('root'));
  try {
    await React.act(async () => root.render(screen()));
    assert.equal(document.querySelectorAll('button[aria-label]').length, 2);
    await React.act(() => document.querySelector('button[aria-label]').click());
    assert.equal(routes[0].params.course, 'path:test');
    assert.equal(routes[0].params.id, 'l0');
    await React.act(() => [...document.querySelectorAll('button')].find(b => b.textContent === 'Explain this lesson').click());
    assert.equal(routes.at(-1).pathname, '/(tabs)/teacher');
    assert.equal(routes.at(-1).params.lesson, 'l0');
    assert.match(routes.at(-1).params.question, /Lesson 0/);
    await React.act(async () => context.update(p => ({ ...p, completed: [...p.completed, 'l0'], lastLesson: 'l1', stages: { l1: 2 } })));
    assert(document.querySelector('[aria-label="Lesson 0 · Completed"]'));
    assert(document.querySelector('[aria-label="Lesson 1 · In progress"]'));
    assert(progress.readProgress(stored).completed.includes('l0'));
    const input = document.querySelector('input');
    await React.act(() => { input.value = 'missing'; input.dispatchEvent(new dom.window.Event('input', { bubbles: true })); });
    assert.match(document.body.textContent, /No matching lessons/);
    await React.act(() => [...document.querySelectorAll('button')].find(b => b.textContent === 'Clear search').click());
    assert.equal(document.querySelectorAll('button[aria-label]').length, 2);
    await React.act(() => root.unmount());
    root = createRoot(document.getElementById('root'));
    await React.act(async () => root.render(screen()));
    assert(document.querySelector('[aria-label="Lesson 0 · Completed"]'));
    assert(document.querySelector('[aria-label="Lesson 1 · In progress"]'));
    assert(writes.length > 0);
  } finally { await React.act(() => root.unmount()); dom.window.close(); Object.assign(global, previous); }
});
