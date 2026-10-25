const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { createRoot } = require('react-dom/client');
const { JSDOM } = require('jsdom');

test('speaking practice supports topics, notes, back, completion, repeat and three languages', async () => {
  const dom = new JSDOM('<div id="root"></div>');
  const saved = { window: global.window, document: global.document, IS_REACT_ACT_ENVIRONMENT: global.IS_REACT_ACT_ENVIRONMENT };
  Object.assign(global, { window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true });
  let language = 'en', changeNotes;
  const box = ({ children }) => React.createElement('div', null, children);
  const dependencies = {
    'react-native': { View: box, Pressable: ({ children, onPress, accessibilityState }) => React.createElement('button', { onClick: onPress, 'aria-expanded': accessibilityState?.expanded }, children) },
    '@expo/vector-icons/Ionicons': { __esModule: true, default: () => null },
    '../store/School': { useSchool: () => ({ colors: {}, rtl: language === 'ar', t: (fr, en, ar) => ({ fr, en, ar })[language] }) },
    '../components/UI': {
      Card: box, Label: box, Row: box,
      Page: ({ header, children }) => React.createElement('main', null, header, children),
      Button: ({ title, onPress, selected }) => React.createElement('button', { onClick: onPress, 'aria-pressed': !!selected }, title),
      Field: ({ value, onChangeText }) => { changeNotes = onChangeText; return React.createElement('textarea', { value, readOnly: true }); },
      ProgressBar: ({ value }) => React.createElement('progress', { value, max: 1 }),
    },
  };
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(require.resolve('../app/speaking.tsx'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText, { exports, require: name => dependencies[name] || require(name) });
  const root = createRoot(document.getElementById('root'));
  const click = async title => {
    const el = [...document.querySelectorAll('button')].find(b => b.textContent === title);
    assert.ok(el, title);
    await React.act(() => el.click());
  };
  try {
    await React.act(() => root.render(React.createElement(exports.default)));
    assert.doesNotMatch(document.body.textContent, /Before speaking, ask/);
    await click('Choose your message');
    assert.match(document.body.textContent, /Before speaking, ask/);
    await click('Choose your message');
    assert.doesNotMatch(document.body.textContent, /Before speaking, ask/);
    await click('Start practicing');
    await click('An idea I would suggest');
    assert.equal(document.querySelector('[aria-pressed="true"]').textContent, 'An idea I would suggest');
    await React.act(() => changeNotes('pause, focus, return'));
    await click('Continue');
    assert.match(document.body.textContent, /Step 2 of 4/);
    await click('Back');
    assert.equal(document.querySelector('textarea').value, 'pause, focus, return');
    await click('Continue');
    await click('Continue');
    await click('Continue');
    await click('Finish and reflect');
    assert.match(document.body.textContent, /Practice complete/);
    assert.equal(document.querySelector('progress').value, 1);
    await click('Practice again');
    assert.match(document.body.textContent, /Step 1 of 4/);
    await click('Back to tips');
    await click('Start practicing');
    assert.equal(document.querySelector('textarea').value, 'pause, focus, return');
    for (const [lang, title, next, start] of [['ar', 'تكلّم بوضوح', 'متابعة', 'ابدأ التدريب'], ['fr', 'Parler avec clarté', 'Continuer', 'Commencer à pratiquer']]) {
      language = lang;
      await React.act(() => root.render(React.createElement(exports.default, { key: lang })));
      assert.ok(document.body.textContent.includes(title));
      await click(start);
      await click(next);
      assert.equal(document.querySelector('progress').value, 0.25);
    }
  } finally {
    await React.act(() => root.unmount());
    dom.window.close();
    Object.assign(global, saved);
  }
});
