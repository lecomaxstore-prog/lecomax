const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { JSDOM } = require('jsdom');
const React = require('react');
const { createRoot } = require('react-dom/client');
const { load } = require('../scripts/inspect.cjs');

test('studio restores drafts, rejects foreign results, locks runs, stops, saves copies and explains the executed snapshot', async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost:8081' });
  // React was imported before the DOM existed; satisfy its legacy input fallback.
  dom.window.HTMLElement.prototype.attachEvent = function () {};
  dom.window.HTMLElement.prototype.detachEvent = function () {};
  const saved = { window: global.window, document: global.document, IS_REACT_ACT_ENVIRONMENT: global.IS_REACT_ACT_ENVIRONMENT };
  Object.assign(global, { window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true });
  let state, editor, prompt, hydrated, copied;
  const immediateDrafts = [];
  let language = 'en';
  const school = React.createContext(null);
  const timers = new Map(); let timerId = 0;
  const clock = { performance, setTimeout: (fn, delay) => { const id = ++timerId; timers.set(id, { fn, delay }); return id; }, clearTimeout: id => timers.delete(id) };
  const sessionExports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(require.resolve('../utils/python-session.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports: sessionExports, ...clock, require: () => load('lecomax-learning-app/utils/python-sandbox.ts') });
  const dependencies = {
    '../store/School': { useSchool: () => React.useContext(school) },
    './PythonEditor.web': { PythonEditor: props => { editor = props; return React.createElement('div', { 'data-code': props.value }); } },
    '../utils/python-sandbox': load('lecomax-learning-app/utils/python-sandbox.ts'),
    '../utils/python-errors': load('lecomax-learning-app/utils/python-errors.ts'),
    '../utils/python-session': sessionExports,
    '../utils/python-practice': load('lecomax-learning-app/utils/python-practice.ts'),
    '../utils/python-viewport': load('lecomax-learning-app/utils/python-viewport.ts'),
    './python-studio-design': load('lecomax-learning-app/components/python-studio-design.ts'),
    './PythonStudioIcon': { PythonStudioIcon: () => null },
  };
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(require.resolve('../components/PythonStudio.web.tsx'), 'utf8'), { compilerOptions: { esModuleInterop: true, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText, {
    exports, require: name => dependencies[name] || require(name), window: dom.window, navigator: { clipboard: { writeText: async value => { copied = value; } } }, performance,
    setTimeout: (fn, delay) => { const id = ++timerId; timers.set(id, { fn, delay }); return id; }, clearTimeout: id => timers.delete(id),
  });
  function Provider({ active = true }) {
    const [progress, setProgress] = React.useState({ drafts: { 'python-studio:draft': 'print("saved")', 'unrelated-lesson': 'keep me' }, theme: 'light', level: 1, answers: {} });
    const [ready, setReady] = React.useState(false);
    state = progress; hydrated = setReady;
    return React.createElement(school.Provider, { value: { state: progress, ready, update: setProgress, error: '', rtl: language === 'ar', t: (fr, en, ar) => ({fr,en,ar})[language] } }, React.createElement(exports.PythonStudio, { active, onDraft: (key, code) => immediateDrafts.push({ key, code }), onExplain: value => { prompt = value; } }));
  }
  const root = createRoot(document.getElementById('root'));
  const button = text => [...document.querySelectorAll('button')].find(item => item.textContent === text) || [...document.querySelectorAll('button')].find(item => item.textContent.startsWith(text));
  const click = text => React.act(async () => button(text).click());
  const message = (data, source = document.querySelector('iframe').contentWindow) => React.act(async () => window.dispatchEvent(new window.MessageEvent('message', { data, source })));
  const completed = { stdout: 'saved\n', stderr: '', exitCode: 0, durationMs: 4, truncated: false };
  try {
    await React.act(async () => root.render(React.createElement(Provider)));
    assert.match(document.body.textContent, /Loading saved draft/); assert.equal(editor, undefined);
    await React.act(async () => hydrated(true));
    assert.equal(editor.value, 'print("saved")'); assert.equal(state.drafts['unrelated-lesson'], 'keep me');
    assert.equal(editor.wrap, true, 'long lines are readable by default');
    await React.act(async () => document.querySelector('[aria-label="Wrap long lines"]').click());
    assert.equal(editor.wrap, false);
    await React.act(async () => document.querySelector('[aria-label="Focus mode"]').click());
    assert(document.querySelector('.py-focus-mode'));
    assert.equal(editor.value, 'print("saved")', 'focus mode preserves the current draft');
    await React.act(async () => window.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape' })));
    assert.equal(document.querySelector('.py-focus-mode'), null);
    await React.act(async () => document.querySelector('[aria-label="Focus mode"]').click());
    await React.act(async () => document.querySelector('[aria-label="Exit focus mode"]').click());
    assert.equal(document.querySelector('.py-focus-mode'), null);
    const iframe = document.querySelector('iframe'); assert.equal(iframe.getAttribute('sandbox'), 'allow-scripts');
    let sent = []; iframe.contentWindow.postMessage = value => sent.push(value);
    await message({ type: 'ready' });
    await click('Run Code'); await click('Run Code'); assert.equal(sent.filter(x => x.type === 'run').length, 1);
    assert.equal(button('Run Code').disabled, true); assert.equal(editor.disabled, true);
    await message({ type: 'result', result: completed }, window); assert.equal(button('Run Code').disabled, true);
    await message({ type: 'running' });
    const deadline = [...timers.entries()].find(([, value]) => value.delay === 10000);
    await message({ type: 'running' }); assert(timers.has(deadline[0]), 'duplicate running must not extend deadline');
    await message({ type: 'result', result: completed });
    await message({ type: 'ready' });
    assert.equal(button('Run Code').disabled, false); assert.match(document.body.textContent, /Completed · 4 ms/);
    assert.match(document.body.textContent, /AI teacher suggestion/);
    await click('Ask AI teacher for a code review'); assert.match(prompt, /ran successfully/);
    await click('Copy output'); assert.equal(copied, 'saved\n');
    await React.act(async () => document.querySelector('.py-body').dispatchEvent(new window.WheelEvent('wheel', { deltaY: -100, bubbles: true })));
    assert.equal(document.querySelector('.py-follow input').checked, false, 'manual upward scrolling pauses follow');
    document.querySelector('iframe').contentWindow.postMessage = value => sent.push(value);
    await click('Run Code'); await message({ type: 'running', interactive: true });
    await message({ type: 'input', id: 1, prompt: 'Your name: ' });
    assert.equal(document.activeElement.getAttribute('aria-label'), 'Answer to Python input');
    assert.match(document.querySelector('.py-input').textContent, /Your name/);
    await click('Editor'); assert.equal(document.querySelector('#py-console').hidden, true);
    await message({ type: 'stream', stream: 'stdout', text: 'Still responsive\n' });
    assert.equal(document.querySelector('#py-console').hidden, true, 'stream updates cannot steal the selected tab while input is pending');
    await click('Console'); assert.equal(document.activeElement.getAttribute('aria-label'), 'Answer to Python input');
    assert.match(document.querySelector('[aria-label="Live Python output"]').textContent, /Still responsive/);
    await click('Send input'); assert(sent.some(value => value.type === 'answer' && value.value === ''));
    await message({ type: 'input', id: 2, prompt: 'Again: ' });
    assert.equal(document.activeElement.getAttribute('aria-label'), 'Answer to Python input');
    await click('Stop'); assert.equal(document.querySelector('.py-input'), null);
    await message({ type: 'ready' });
    await React.act(async () => editor.onChange('print("edited")'));
    assert.equal(immediateDrafts.at(-1).code, 'print("edited")');
    assert.equal(state.drafts['python-studio:draft'], 'print("saved")', 'native recovery is emitted before the autosave timer');
    await React.act(async () => [...timers.values()].filter(value => value.delay === 300).forEach(value => value.fn()));
    assert.equal(state.drafts['python-studio:draft'], 'print("edited")');
    await click('Ask AI Teacher'); assert.match(prompt, /print\("saved"\)/); assert.doesNotMatch(prompt, /print\("edited"\)/);
    await click('Save'); assert.equal(state.drafts['python-script:my-script'], 'print("edited")');
    await React.act(async () => editor.onChange('print("new version")'));
    dom.window.confirm = () => false;
    await click('Save'); assert.equal(state.drafts['python-script:my-script'], 'print("edited")');
    await click('Run Code');
    await message({ type: 'running' });
    await React.act(async () => [...timers.values()].find(value => value.delay === 10000).fn());
    assert.match(document.body.textContent, /Timed out after 10 seconds/);
    assert.notEqual(document.querySelector('iframe'), iframe);
    await message({ type: 'ready' });
    await click('Run Code'); await click('Stop');
    assert.match(document.body.textContent, /Stopped/);
    await message({ type: 'ready' }); await click('Run Code');
    await React.act(async () => root.render(React.createElement(Provider, { active: false })));
    assert.equal(button('Stop').disabled, true);
    language = 'ar';
    await React.act(async () => root.render(React.createElement(Provider, { active: false })));
    assert(button('تشغيل الكود'));
    assert(button('إرسال') === undefined, 'Input form stays hidden without a prompt');
    assert.match(document.body.textContent, /إعدادات المحرر والإدخال/);
    assert.match(document.querySelector('.py-statusbar').textContent, /تغييرات غير محفوظة/);
    assert(!document.body.textContent.includes('???'), 'Arabic controls must not contain corrupted placeholders');
    assert.equal(document.querySelector('.editor-filebar [dir="ltr"]').getAttribute('dir'), 'ltr');
    await React.act(async () => root.unmount()); assert.equal(timers.size, 0);
  } finally { await React.act(async () => root.unmount()); dom.window.close(); Object.assign(global, saved); }
});
