const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const React = require('react');
const { createRoot } = require('react-dom/client');
const { JSDOM } = require('jsdom');
const { load, ts } = require('../scripts/inspect.cjs');
const navigation = load('lecomax-learning-app/services/teacher-navigation.ts');

test('teacher shortcuts retain lesson context and localize distinct learning requests', () => {
  for (const language of ['ar', 'en', 'fr']) {
    const prompts = new Set();
    for (const intent of ['explain', 'example', 'practice', 'plan']) {
      const route = navigation.teacherLessonRoute('JavaScript', language, 'javascript-1', intent);
      assert.equal(route.pathname, '/(tabs)/teacher');
      assert.equal(route.params.lesson, 'javascript-1');
      assert(route.params.explain);
      assert.match(route.params.question, /JavaScript/);
      prompts.add(route.params.question);
    }
    assert.equal(prompts.size, 4);
  }
  assert.equal(navigation.teacherLessonRoute('Programming', 'en', undefined, 'plan').params.lesson, undefined);
});

test('teacher suggestions open only after an explicit choice and send the requested help context', async () => {
  const dom = new JSDOM('<div id="root"></div>');
  const previous = { window: global.window, document: global.document, IS_REACT_ACT_ENVIRONMENT: global.IS_REACT_ACT_ENVIRONMENT };
  Object.assign(global, { window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true });
  const box = ({ children }) => React.createElement('div', null, children);
  const routes = [];
  const dependencies = {
    'expo-router': { router: { push: route => routes.push(route) } },
    '../store/School': { useSchool: () => ({ state: { language: 'en' }, t: (_fr, en) => en }) },
    '../services/teacher-navigation': navigation,
    './UI': { Card: box, Label: box, Button: ({ title, onPress }) => React.createElement('button', { onClick: onPress }, title) },
  };
  const exports = {};
  const source = fs.readFileSync(require.resolve('../components/LessonTeacherHelp.tsx'), 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  vm.runInNewContext(js, { exports, require: name => dependencies[name] || require(name) });
  const root = createRoot(document.getElementById('root'));
  const click = async label => { const b = [...document.querySelectorAll('button')].find(b => b.textContent === label); assert(b, label); await React.act(() => b.click()); };
  try {
    await React.act(() => root.render(React.createElement(exports.LessonTeacherHelp, { title: 'Functions', lessonId: 'functions' })));
    assert.equal(routes.length, 0);
    await click('Need help? Ask the AI teacher');
    assert.equal(routes.length, 0);
    await click('Explain simply'); assert.match(routes.at(-1).params.question, /Explain “Functions” simply/);
    await click('Show an example'); assert.match(routes.at(-1).params.question, /concrete example/);
    await click('Help me practise'); assert.match(routes.at(-1).params.question, /wait for my answer/);
    assert(routes.every(route => route.params.lesson === 'functions'));
    await click('Hide teacher help');
    assert(!document.body.textContent.includes('Show an example'));
  } finally { await React.act(() => root.unmount()); dom.window.close(); Object.assign(global, previous); }
});
