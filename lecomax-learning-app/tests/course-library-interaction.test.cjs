const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { JSDOM } = require('jsdom');
const React = require('react');
const { createRoot } = require('react-dom/client');

function evaluate(file, dependencies) {
  const source = fs.readFileSync(require.resolve(file), 'utf8');
  const exports = {};
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(output, { exports, require: (name) => {
    if (name in dependencies) return dependencies[name];
    if (name === 'react' || name === 'react/jsx-runtime') return require(name);
    throw new Error(name);
  } });
  return exports;
}

test('course screen searches, recovers from empty filters and opens the next lesson within its course', async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost' });
  const saved = { window: global.window, document: global.document, IS_REACT_ACT_ENVIRONMENT: global.IS_REACT_ACT_ENVIRONMENT };
  global.window = dom.window;
  global.document = dom.window.document;
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const { index } = require('../scripts/inspect.cjs').load('lecomax-learning-app/services/content.ts');
  const { courses } = evaluate('../constants/courses.ts', { '../services/content': { index } });
  const library = evaluate('../services/course-library.ts', { '../constants/courses': { courses }, './content': { index } });
  const python = library.library.find(c => c.id === 'python');
  const state = { language: 'en', completed: [python.lessons[0].id], lastLesson: python.lessons[0].id };
  const navigations = [];
  const box = ({ children }) => React.createElement('div', null, children);
  const ui = {
    Button: ({ title, onPress }) => React.createElement('button', { onClick: onPress }, title),
    Card: box, Row: box, Label: box, ProgressBar: () => null,
    EmptyState: ({ title }) => React.createElement('p', null, title),
    Field: ({ value, onChangeText }) => React.createElement('input', { value, onInput: e => onChangeText(e.target.value) }),
  };
  const { CourseLibrary } = evaluate('../components/CourseLibrary.tsx', {
    'react-native': { View: box, Pressable: ({ children, onPress, accessibilityLabel }) => React.createElement('button', { onClick: onPress, 'aria-label': accessibilityLabel }, children) },
    '@expo/vector-icons/Ionicons': { __esModule: true, default: () => null },
    'expo-router': { router: { push: route => navigations.push(route) } },
    '../services/course-library': library,
    '../store/School': { useSchool: () => ({ state, t: (_fr, en) => en, colors: {}, rtl: false }) },
    './UI': ui,
  });
  const root = createRoot(document.getElementById('root'));
  const click = async label => {
    const button = [...document.querySelectorAll('button')].find(b => b.textContent === label);
    assert(button, label);
    await React.act(() => button.click());
  };
  try {
    await React.act(() => root.render(React.createElement(CourseLibrary)));
    await click('Completed');
    assert.match(document.body.textContent, /No courses here yet/);
    await click('Show all courses');
    const input = document.querySelector('input');
    await React.act(() => {
      input.value = 'PYTHON';
      input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    });
    assert.match(document.body.textContent, /1 courses shown/);
    await click('Continue');
    assert.equal(navigations[0].pathname, '/lesson/[id]');
    assert.equal(navigations[0].params.course, 'python');
    assert.equal(navigations[0].params.id, python.lessons[1].id);
    await click('Curriculum');
    assert.equal(navigations[1].params.id, 'python');
  } finally {
    await React.act(() => root.unmount());
    dom.window.close();
    Object.assign(global, saved);
  }
});
