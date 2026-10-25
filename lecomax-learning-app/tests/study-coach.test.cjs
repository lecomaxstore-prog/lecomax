const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { createRoot } = require('react-dom/client');
const { JSDOM } = require('jsdom');
function evaluate(file, deps) {
  const output = ts.transpileModule(fs.readFileSync(require.resolve(file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const exports = {};
  vm.runInNewContext(output, { exports, require(name) { if (name in deps) return deps[name]; if (name === 'react' || name === 'react/jsx-runtime') return require(name); throw Error(name); } });
  return exports;
}
const study = evaluate('../data/study-skills.ts', { './study-skills.json': require('../data/study-skills.json') });
test('four study lessons resolve in every language with practice, valid quizzes and module boundaries', () => {
  assert.equal(study.studySkillsIndex.lessons.length, 4);
  for (const lang of ['ar', 'en', 'fr']) for (const [i, item] of study.studySkillsIndex.lessons.entries()) {
    const lesson = study.getStudyLesson(item.id, lang);
    assert.equal(lesson.title, item.title[lang]);
    assert.equal(lesson.language, lang);
    assert.equal(lesson.explanation.length, 3);
    assert(lesson.explanation.every(block => block.text.length > 100));
    assert(lesson.exercise.task && lesson.exercise.solution);
    assert(lesson.quiz[0].options[lesson.quiz[0].correctIndex]);
    assert.equal(lesson.nextLesson, study.studySkillsIndex.lessons[i + 1]?.id || '');
  }
  assert.equal(study.getStudyLesson('unknown', 'en'), undefined);
});
test('Python enhancements add instruction without mutating original course material', () => {
  const { enhanceLesson } = evaluate('../services/lesson-enhancements.ts', { '../data/lesson-enhancements.json': require('../data/lesson-enhancements.json'), '../data/python-environment-guide.json': require('../data/python-environment-guide.json') });
  for (const lang of ['ar', 'en', 'fr']) {
    const course = require('../data/lessons/' + lang + '/guide-python.json');
    for (const id of ['guide-python-2', 'guide-python-3', 'guide-python-4', 'guide-python-5']) {
      const original = course.lessons.find(lesson => lesson.id === id);
      const snapshot = JSON.stringify(original);
      const result = enhanceLesson(original, lang);
      assert.equal(result.explanation.length, original.explanation.length + 2);
      assert.equal(result.quiz.length, original.quiz.length + 1);
      assert(result.exercise.task.length > original.exercise.task.length);
      assert.equal(JSON.stringify(original), snapshot);
      assert.equal(result.nextLesson, original.nextLesson);
    }
  }
  assert.equal(enhanceLesson(undefined, 'en'), undefined);
});
test('recall hides the explanation, saves writing, compares feedback and queues difficult lessons', async () => {
  const dom = new JSDOM('<div id="root"></div>');
  const saved = { window: global.window, document: global.document, IS_REACT_ACT_ENVIRONMENT: global.IS_REACT_ACT_ENVIRONMENT };
  Object.assign(global, { window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true });
  const box = ({ children }) => React.createElement('div', null, children);
  let state = { drafts: {}, difficult: [] };
  const lesson = study.getStudyLesson('study-understand', 'en');
  const root = createRoot(document.getElementById('root'));
  let render;
  const { StudyCoach, GuidedReading } = evaluate('../components/StudyCoach.tsx', {
    'react-native': { View: box },
    '@expo/vector-icons/Ionicons': { default: () => null, __esModule: true },
    'expo-router': { router: { push() {} } },
    '../store/School': { useSchool: () => ({ state, colors: {}, t: (_fr, en) => en, update(fn) { state = fn(state); render(); } }) },
    './UI': { Card: box, Row: box, Label: box,
      Button: ({ title, onPress, disabled }) => React.createElement('button', { onClick: onPress, disabled }, title),
      Field: ({ value, onChangeText }) => React.createElement('textarea', { value, onInput: e => onChangeText(e.target.value) }),
    },
  });
  const click = async (title) => {
    const button = [...document.querySelectorAll('button')].find(item => item.textContent === title);
    assert(button, title);
    await React.act(() => button.click());
  };
  render = () => root.render(React.createElement(StudyCoach, { lesson }, React.createElement('p', null, 'LESSON_BODY')));
  try {
    await React.act(render);
    assert(document.body.textContent.includes('LESSON_BODY'));
    assert(document.querySelector('button[disabled]'));
    assert(document.body.textContent.includes('Write a first idea to unlock comparison.'));
    assert(!document.body.textContent.includes('How did you do?'));
    await click('Hide lesson and try recall');
    assert(!document.body.textContent.includes('LESSON_BODY'));
    const input = document.querySelector('textarea');
    await React.act(() => { input.value = 'I can explain and adapt a rule.'; input.dispatchEvent(new dom.window.Event('input', { bubbles: true })); });
    assert.equal(state.drafts['study:recall:study-understand'], 'I can explain and adapt a rule.');
    await click('Compare with key points');
    assert(document.body.textContent.includes(lesson.summary[1]));
    await click('Not yet');
    assert.equal(JSON.stringify(state.difficult), JSON.stringify(['study-understand']));
    await click('Not yet');
    assert.equal(state.difficult.length, 1);
    await React.act(() => { input.value = 'My revised explanation.'; input.dispatchEvent(new dom.window.Event('input', { bubbles: true })); });
    assert.equal(state.drafts['study:confidence:study-understand'], '');
    await React.act(() => { input.value = ''; input.dispatchEvent(new dom.window.Event('input', { bubbles: true })); });
    assert(!document.body.textContent.includes(lesson.summary[1]));
    assert(!document.body.textContent.includes('How did you do?'));
    await React.act(() => { input.value = 'I can explain and adapt a rule.'; input.dispatchEvent(new dom.window.Event('input', { bubbles: true })); });
    await click('Read the lesson again');
    assert(document.body.textContent.includes('LESSON_BODY'));
    assert.equal(document.querySelector('textarea').value, 'I can explain and adapt a rule.');
    await React.act(() => root.render(React.createElement(GuidedReading, { lesson })));
    assert(document.body.textContent.includes(lesson.explanation[0].text));
    assert(!document.body.textContent.includes(lesson.explanation[1].text));
    await click('Next');
    assert(document.body.textContent.includes(lesson.explanation[1].text));
    await click('Read all');
    assert(lesson.explanation.every(block => document.body.textContent.includes(block.text)));
  } finally { await React.act(() => root.unmount()); dom.window.close(); Object.assign(global, saved); }
});
