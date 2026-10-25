const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { createRoot } = require('react-dom/client');
const { JSDOM } = require('jsdom');

test('curriculum filters combine, reset empty results and preserve topic navigation', async () => {
  const dom = new JSDOM('<div id="root"></div>');
  const saved = { window: global.window, document: global.document, IS_REACT_ACT_ENVIRONMENT: global.IS_REACT_ACT_ENVIRONMENT };
  Object.assign(global, { window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true });
  const root = createRoot(document.getElementById('root'));
  const box = ({ children }) => React.createElement('div', null, children);
  const button = ({ title, onPress }) => React.createElement('button', { onClick: onPress }, title);
  const input = ({ value, onChangeText }) => React.createElement('input', { value, onInput: e => onChangeText(e.target.value) });
  const topics = [
    { id: 'computer', phase: 0, title: { en: 'Computer', ar: 'الحاسوب' }, syllabus: ['CPU', 'RAM'], lessons: [{ id: 'one' }] },
    { id: 'network', phase: 0, title: { en: 'Network', ar: 'الشبكات' }, syllabus: ['IP', 'DNS'], lessons: [] },
    { id: 'web', phase: 1, title: { en: 'Web', ar: 'الويب' }, syllabus: ['HTML', 'CSS'], lessons: [{ id: 'two' }] },
  ];
  let language = 'en';
  let browse = 0;
  const routes = [];
  const deps = {
    './StudioVisual': { StudioVisual: () => null },
    'react-native': { View: box, FlatList: ({ data, renderItem, ListHeaderComponent, ListEmptyComponent }) => React.createElement('div', null, ListHeaderComponent, data.length ? data.map(item => React.createElement(React.Fragment, { key: item.id }, renderItem({ item }))) : ListEmptyComponent) },
    'expo-router': { router: { push: route => routes.push(route) } },
    '../data/university/curriculum': { phaseTitles: [{ en: 'Foundations', ar: 'الأساسيات' }, { en: 'Build web', ar: 'الويب' }] },
    '../services/curriculum': { searchPaths: q => topics.filter(p => p.title.en.toLowerCase().includes(q.toLowerCase())), pathLessons: p => p.lessons },
    '../store/School': { useSchool: () => ({ state: { language, completed: ['one'] }, colors: {}, t: (...s) => s[language === 'ar' ? 2 : 1] }) },
    '../services/teacher-navigation': require('../scripts/inspect.cjs').load('lecomax-learning-app/services/teacher-navigation.ts'),
    './UI': { Button: button, Card: box, EmptyState: ({ title }) => React.createElement('p', null, title), Label: box, Page: box, Row: box },
    './LearningUI': { SearchBar: input, LearningPathCard: ({ title, meta, onPress }) => React.createElement('button', { onClick: onPress, 'data-topic': true }, title, ' · ', meta) },
  };
  deps['react-native'].useWindowDimensions = () => ({ width: 390, height: 844, fontScale: 1 });
  const exports = {};
  const source = fs.readFileSync(require.resolve('../components/CurriculumLibrary.tsx'), 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  vm.runInNewContext(js, { exports, require: name => deps[name] || require(name) });
  const render = () => root.render(React.createElement(exports.CurriculumLibrary, { onBrowse: () => browse++ }));
  const click = async text => { const b = [...document.querySelectorAll('button')].find(b => b.textContent === text); assert(b, text); await React.act(() => b.click()); };
  const count = () => document.querySelectorAll('[data-topic]').length;
  try {
    await React.act(render);
    assert.equal(count(), 2, 'Start with published lessons');
    await click('All topics');
    assert.equal(count(), 3);
    assert.match(document.body.textContent, /Planned topic/);
    await click('Available now'); assert.equal(count(), 2);
    await click('All learning phases');
    await click('Foundations'); assert.equal(count(), 1);
    await React.act(() => document.querySelector('[data-topic]').click());
    assert.equal(routes[0].params.id, 'computer');
    assert.equal(routes[0].pathname, '/learning-path/[id]');
    const field = document.querySelector('input');
    await React.act(() => { field.value = 'missing'; field.dispatchEvent(new dom.window.Event('input', { bubbles: true })); });
    assert.equal(count(), 0);
    await click('Reset filters'); assert.equal(count(), 3);
    await click('Library'); assert.equal(browse, 1);
    await click('Help me choose');
    assert.equal(routes.at(-1).pathname, '/(tabs)/teacher');
    assert.match(routes.at(-1).params.question, /First ask about my level and goal/);
    await click('Start from zero'); assert.equal(count(), 1);
    await click('Foundations');
    await click('All learning phases'); assert.equal(count(), 2);
    language = 'ar'; await React.act(render);
    assert.match(document.body.textContent, /أكملت 1 من 1 دروس/);
    await click('متاحة الآن'); assert.equal(count(), 2);
  } finally { await React.act(() => root.unmount()); dom.window.close(); Object.assign(global, saved); }
});
