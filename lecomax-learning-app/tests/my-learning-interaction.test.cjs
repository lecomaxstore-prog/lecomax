const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const React = require('react');
const { createRoot } = require('react-dom/client');
const { JSDOM } = require('jsdom');
const { ts, load } = require('../scripts/inspect.cjs');
const { plan } = require('./fixtures/learning-journey.cjs');

test('My learning filters the catalogue, resumes lessons, shows generated progress and preserves data when unenrolling', async () => {
  const dom = new JSDOM('<div id="root"></div>');
  const saved = { window: global.window, document: global.document, IS_REACT_ACT_ENVIRONMENT: global.IS_REACT_ACT_ENVIRONMENT };
  Object.assign(global, { window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true });
  const academy = load('lecomax-learning-app/utils/academy.ts');
  let state = { language: 'en', academy: { ...academy.freshAcademy(), enrolled: ['chosen'], plans: [plan()] }, completed: ['started-1', 'plan-journey:0'], lastLesson: 'started-2', memory: { reviews: {} }, bookmarks: [], notes: {} };
  const routes = [];
  const library = ['chosen', 'started', 'untouched'].map(id => ({ id, title: [id, id, id], lessons: [{ id: id + '-1' }, { id: id + '-2' }] }));
  const box = ({ children }) => React.createElement('div', null, children);
  const button = ({ title, onPress }) => React.createElement('button', { onClick: onPress }, title);
  const deps = {
    'expo-router': { router: { push: route => routes.push(route) } },
    '../components/UI': { Card: box, Row: box, Page: box, Label: box, Button: button, ListItem: ({ title, subtitle, onPress }) => React.createElement('button', { onClick: onPress }, title, subtitle), ProgressBar: ({ value }) => React.createElement('progress', { value, max: 1 }) },
    '../components/AcademyDashboard': { WeeklyChart: () => null, openLearningItem: id => routes.push(id) },
    '../store/School': { useSchool: () => ({ state, update: fn => { state = fn(state); }, t: (fr, en, ar) => ({ fr, en, ar })[state.language] }) },
    '../utils/academy': { analytics: () => ({}) },
    '../services/course-library': { library, courseProgress: (c, completed, last) => ({ done: c.lessons.filter(l => completed.includes(l.id)).length, total: c.lessons.length, started: c.lessons.some(l => completed.includes(l.id) || l.id === last), next: c.lessons.find(l => !completed.includes(l.id)) }) },
    '../services/content': { lessons: [] },
    '../components/ContinueLearning': { ContinueLearning: () => null },
    '../services/course-learning': { courseLearning: (c, p) => ({ done: c.lessons.filter(l => p.completed.includes(l.id)).length, total: c.lessons.length, started: c.lessons.some(l => p.completed.includes(l.id) || l.id === p.lastLesson), complete: c.lessons.every(l => p.completed.includes(l.id)), next: c.lessons.find(l => !p.completed.includes(l.id)) }) },
    '../utils/progress': { toggle: (items, id) => items.includes(id) ? items.filter(item => item !== id) : [...items, id] },
  };
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(require.resolve('../app/my-learning.tsx'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText, { exports, setInterval, clearInterval, require: name => deps[name] || require(name) });
  const root = createRoot(document.getElementById('root'));
  const render = () => React.act(() => root.render(React.createElement(exports.default, { key: state.language })));
  const click = async title => {
    const target = [...document.querySelectorAll('button')].find(item => item.textContent === title);
    assert(target, title); await React.act(() => target.click());
  };
  try {
    await render();
    assert(document.body.textContent.includes('chosen'));
    assert(document.body.textContent.includes('started'));
    assert(!document.body.textContent.includes('untouched'));
    assert(document.body.textContent.includes('1 / 3 lessons completed'));
    await click('Start course'); assert.equal(routes.at(-1).params.id, 'chosen-1'); assert.equal(routes.at(-1).params.course, 'chosen');
    await click('Resume lesson'); assert.equal(routes.at(-1).params.id, 'started-2'); assert.equal(routes.at(-1).params.course, 'started');
    await click('Continue my learning plan'); assert.equal(routes.at(-1).pathname, '/learning-journey'); assert.equal(routes.at(-1).params.id, 'plan-journey');
    await click('View lessons'); assert.equal(routes.at(-1).pathname, '/study-plan');
    await click('Remove from my plan'); await render();
    assert(!document.body.textContent.includes('chosen'));
    assert.equal(state.completed.length, 2); assert.equal(state.academy.plans.length, 1);
    state.completed.push('plan-journey:1', 'plan-journey:2'); await render();
    await click('Continue to project'); assert.equal(routes.at(-1).pathname, '/study-plan');
    state.memory.reviews = {
      due: { lessonId: 'started-1', questionId: 'q1', dueAt: Date.now() - 60000, recalls: 1 },
      later: { lessonId: 'started-2', questionId: 'q2', dueAt: Date.now() + 86400000, recalls: 2 },
    };
    await click('Reviews');
    assert(document.body.textContent.includes('Ready to review'));
    assert(document.body.textContent.includes('Upcoming'));
    await click('Paths');
    for (const language of ['ar', 'fr']) {
      state.language = language; await render();
      await click(language === 'ar' ? 'متابعة الدرس' : 'Reprendre la leçon'); assert.equal(routes.at(-1).params.id, 'started-2');
    }
    state = { ...state, language: 'en', completed: [], lastLesson: '', academy: { ...state.academy, plans: [], enrolled: [] } };
    await render(); assert(document.body.textContent.includes('Your first step is waiting'));
    assert(!document.body.textContent.includes('untouched'));
  } finally { await React.act(() => root.unmount()); dom.window.close(); Object.assign(global, saved); }
});
