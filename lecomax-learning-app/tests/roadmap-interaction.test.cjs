const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { createRoot } = require('react-dom/client');
const { JSDOM } = require('jsdom');
const { load } = require('../scripts/inspect.cjs');
const engine = load('lecomax-learning-app/services/learning-roadmap.ts');
const progress = load('lecomax-learning-app/utils/progress.ts');
test('real roadmap UI selects a path, offers optional assessment, opens lessons and preserves completions', async () => {
  const dom = new JSDOM('<div id="root"></div>');
  const saved = {
    window: global.window,
    document: global.document,
    IS_REACT_ACT_ENVIRONMENT: global.IS_REACT_ACT_ENVIRONMENT,
  };
  Object.assign(global, {
    window: dom.window,
    document: dom.window.document,
    IS_REACT_ACT_ENVIRONMENT: true,
  });
  let state = structuredClone(progress.initial);
  state.language = 'en';
  state.completed = ['keep-old'];
  const routes = [];
  const box = ({ children }) => React.createElement('div', null, children);
  const ui = {
    Page: box,
    Card: box,
    Label: box,
    ProgressBar: ({ value }) => React.createElement('progress', { value, max: 1 }),
    Field: ({ value, onChangeText }) =>
      React.createElement('textarea', { value, onChange: (e) => onChangeText(e.target.value) }),
    Button: ({ title, onPress, disabled }) =>
      React.createElement('button', { onClick: onPress, disabled }, title),
  };
  const deps = {
    '../components/CourseProgram': { CourseProgram: () => null },
    'expo-router': { router: { push: (r) => routes.push(r), replace: (r) => routes.push(r) } },
    '../components/UI': ui,
    '../store/School': {
      useSchool: () => ({
        state,
        update: (fn) => {
          state = fn(state);
        },
        t: (fr, en, ar) => ({ fr, en, ar })[state.language],
      }),
    },
    '../services/learning-roadmap': engine,
    '../services/content': load('lecomax-learning-app/services/content.ts'),
    '../services/course-learning': load('lecomax-learning-app/services/course-learning.ts'),
  };
  const exports = {};
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(require.resolve('../app/roadmap.tsx'), 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText,
    { exports, require: (n) => deps[n] || require(n) },
  );
  const root = createRoot(document.getElementById('root'));
  const render = () => React.act(() => root.render(React.createElement(exports.default)));
  const click = async (title) => {
    const target = [...document.querySelectorAll('button')].find((b) => b.textContent === title);
    assert(target, title);
    await React.act(() => target.click());
  };
  try {
    await render();
    await click('Learn Python');
    assert(document.body.textContent.includes('Optional starting-point assessment'));
    await click('Start at the beginning — no test');
    assert.equal(routes.at(-1), '/');
    assert.equal(state.journey.activeCourse, 'python');
    assert(state.completed.includes('keep-old'));
    await render();
    await click('Optional starting-point assessment');
    assert(document.body.textContent.includes('cannot measure mastery'));
    const submit = [...document.querySelectorAll('button')].find(
      (b) => b.textContent === 'Show recommendation',
    );
    assert(submit.disabled);
    const first = engine.roadmap('python', state).next;
    await click(first.title.en);
    assert.equal(routes.at(-1).params.id, first.id);
    assert.equal(routes.at(-1).params.course, 'python');
    state = progress.readProgress(JSON.stringify(state));
    assert.equal(state.completed.length, 1);
    for (const language of ['ar', 'fr']) {
      state.language = language;
      await render();
      assert(
        document.body.textContent.includes(
          language === 'ar' ? 'تقييم اختياري' : 'Diagnostic facultatif',
        ),
      );
    }
  } finally {
    await React.act(() => root.unmount());
    dom.window.close();
    Object.assign(global, saved);
  }
});
