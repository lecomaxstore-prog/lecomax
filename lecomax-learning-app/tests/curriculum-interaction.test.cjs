const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { createRoot } = require('react-dom/client');
const { JSDOM } = require('jsdom');
const { load } = require('../scripts/inspect.cjs');
function evaluate(file, deps) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(require.resolve(file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, { exports, require: n => n in deps ? deps[n] : require(n) });
  return exports;
}
test('real rubric saves ratings, recommends revision, restores evidence and navigates to a next course', async () => {
  const dom = new JSDOM('<div id="root"></div>');
  const saved = { window: global.window, document: global.document, IS_REACT_ACT_ENVIRONMENT: global.IS_REACT_ACT_ENVIRONMENT };
  Object.assign(global, { window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true });
  const context = React.createContext(null);
  const progress = load('lecomax-learning-app/utils/progress.ts');
  const content = load('lecomax-learning-app/services/content.ts');
  const evidence = load('lecomax-learning-app/services/curriculum-evidence.ts');
  const lesson = content.getLesson('computer-files-recovery', 'en');
  let snapshot = structuredClone(progress.initial);
  snapshot.language = 'en';
  snapshot.drafts[lesson.id] = 'v1 recovered separately; v2 preserved';
  const routes = [];
  const box = ({ children }) => React.createElement('div', null, children);
  const ui = { Card: box, Label: box, Button: ({ title, onPress, selected }) => React.createElement('button', { onClick: onPress, 'aria-pressed': !!selected }, title) };
  const school = { useSchool: () => React.useContext(context) };
  const rubric = evaluate('../components/CurriculumRubric.tsx', { 'react-native': { Linking: { openURL() {} } }, '../store/School': school, '../services/curriculum-evidence': evidence, './UI': ui });
  const program = evaluate('../components/CourseProgram.tsx', { 'expo-router': { router: { push: r => routes.push(r) } }, '../store/School': school, '../constants/course-programs': load('lecomax-learning-app/constants/course-programs.ts'), '../services/course-library': load('lecomax-learning-app/services/course-library.ts'), '../services/content': content, '../services/curriculum-evidence': evidence, './UI': ui });
  function Harness() {
    const [state, update] = React.useState(snapshot); snapshot = state;
    return React.createElement(context.Provider, { value: { state, update, t: (_fr, en) => en } }, React.createElement(rubric.CurriculumRubric, { lesson }), React.createElement(program.CourseProgram, { courseId: 'computer-basics' }));
  }
  let root = createRoot(document.getElementById('root'));
  const click = async title => { const button = [...document.querySelectorAll('button')].find(b => b.textContent === title); assert(button, title); await React.act(() => button.click()); };
  try {
    await React.act(() => root.render(React.createElement(Harness)));
    assert(document.body.textContent.includes('Recommended revision'));
    await click(lesson.title);
    assert.equal(routes.at(-1).params.course, 'computer-basics');
    for (const r of lesson.curriculum.rubric) await click(r.criterion + ': 2');
    assert.equal(evidence.practiceReady(lesson, snapshot), true);
    assert(!document.body.textContent.includes('Recommended revision'));
    await React.act(() => root.unmount());
    snapshot = progress.readProgress(JSON.stringify(snapshot));
    root = createRoot(document.getElementById('root'));
    await React.act(() => root.render(React.createElement(Harness)));
    assert.equal(evidence.practiceReady(lesson, snapshot), true);
    await click('Recovery evidence: 1');
    assert(document.body.textContent.includes('Recommended revision'));
    await click('Learn Python');
    assert.equal(routes.at(-1).params.id, 'python');
    assert.equal(snapshot.completed.length, 0);
  } finally { await React.act(() => root.unmount()); dom.window.close(); Object.assign(global, saved); }
});
