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

test('notes preserve writing, named actions navigate and restart requires confirmation', async () => {
  const dom = new JSDOM('<div id="root"></div>');
  const saved = { window: global.window, document: global.document, IS_REACT_ACT_ENVIRONMENT: global.IS_REACT_ACT_ENVIRONMENT };
  Object.assign(global, { window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true });
  const root = createRoot(document.getElementById('root'));
  const box = ({ children }) => {
    const check = child => {
      if (Array.isArray(child)) child.forEach(check);
      else if (typeof child === 'string' || typeof child === 'number') assert.fail('Raw text cannot be a child of a native View: ' + JSON.stringify(child));
    };
    check(children);
    return React.createElement('div', null, children);
  };
  const text = ({ children }) => React.createElement('span', null, children);
  let state = { notes: { demo: 'My existing note' } };
  let saveError = '';
  let retries = 0;
  let stage = 1;
  let restarted = 0;
  let render;
  const routes = [];
  const { LessonFooter } = evaluate('../components/LessonFooter.tsx', {
    'react-native': { View: box },
    'expo-router': { router: { push: route => routes.push(route), replace: route => routes.push(route) } },
    '../store/School': { useSchool: () => ({ state, colors: {}, error: saveError, retry: () => retries++, t: (_fr, en) => en, update(fn) { state = fn(state); render(); } }) },
    './UI': { Card: box, Label: text, Row: box, ProgressBar: () => null,
      Button: ({ title, onPress }) => React.createElement('button', { onClick: onPress }, title),
      Field: ({ value, onChangeText }) => React.createElement('textarea', { value, onInput: e => onChangeText(e.target.value) }),
    },
  });
  render = () => root.render(React.createElement(LessonFooter, {
    lesson: { id: 'demo', moduleId: 'module', source: 'example.py', relatedFiles: [] }, stage,
    onStageChange: value => { stage = value; render(); }, onRestart: () => { restarted++; },
    nextId: 'next', previousId: 'previous', hasSource: true,
  }));
  const click = async title => { const b = [...document.querySelectorAll('button')].find(b => b.textContent === title); assert(b, title); await React.act(() => b.click()); };
  try {
    await React.act(render);
    assert.equal(document.querySelector('textarea').value, 'My existing note');
    assert(!document.body.textContent.includes('Restart this lesson'));
    assert(!document.body.textContent.includes('example.py'));
    await click('My example:');
    assert.equal(state.notes.demo, 'My existing note\n\nMy example: ');
    await click('My example:');
    assert.equal(state.notes.demo, 'My existing note\n\nMy example: ');
    assert(document.body.textContent.includes('This prompt is already in your note. Continue it below.'));
    await click('View all my notes');
    assert.equal(routes.at(-1).pathname, '/collection/[kind]');
    assert.equal(routes.at(-1).params.kind, 'notes');
    await React.act(() => { saveError = 'Save failed'; render(); });
    assert(document.body.textContent.includes('Saving failed.'));
    await click('Retry saving');
    assert.equal(retries, 1);
    await React.act(() => { saveError = ''; render(); });
    await click('Continue: Practice');
    assert.equal(stage, 2);
    await click('Back to Explore the example');
    assert.equal(stage, 1);
    await click('View all lessons');
    assert.equal(routes.at(-1).pathname, '/module/[id]');
    assert.equal(routes.at(-1).params.id, 'module');
    await click('Need help? Ask the teacher');
    assert.equal(routes.at(-1).params.lesson, 'demo');
    await click('More options');
    await click('Restart this lesson');
    assert.equal(restarted, 0);
    await click('Cancel');
    assert.equal(restarted, 0);
    await click('Restart this lesson');
    await click('Yes, restart');
    assert.equal(restarted, 1);
    assert.equal(state.notes.demo, 'My existing note\n\nMy example: ');
    await React.act(() => { stage = 3; render(); });
    await click('Open next lesson');
    assert.equal(routes.at(-1).params.id, 'next');
  } finally { await React.act(() => root.unmount()); dom.window.close(); Object.assign(global, saved); }
});
