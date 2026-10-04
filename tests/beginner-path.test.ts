import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
const require = createRequire(import.meta.url);
const ts = require('typescript');
const data = { exports: {} as any };
runInNewContext(ts.transpileModule(readFileSync('app/admin/how-it-was-built/course/beginner-path.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { module: data, exports: data.exports });
const { STARTER_LESSONS, readStarterProgress } = data.exports;
const practiceData = { exports: {} as any };
runInNewContext(ts.transpileModule(readFileSync('app/admin/how-it-was-built/course/beginner-practice.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { module: practiceData, exports: practiceData.exports });
const { STARTER_PRACTICE, checkStarterCode } = practiceData.exports;

test('every lesson has translated coding guidance and feedback for each answer', () => {
  for (const lesson of STARTER_LESSONS) {
    const exercise = STARTER_PRACTICE[lesson.id];
    assert.ok(exercise, lesson.id);
    assert.equal(exercise.answerFeedback.length, lesson.options.length);
    for (const value of [exercise.prompt, exercise.hint, exercise.explanation, ...exercise.answerFeedback]) {
      assert.equal(value.length, 3);
      assert.ok(value.every((text: string) => text.trim().length > 0));
    }
    assert.equal(checkStarterCode(exercise, ` ${exercise.answer} `), true);
    for (const wrong of ['', '___', `${exercise.answer};`, '<script>alert(1)</script>']) assert.equal(checkStarterCode(exercise, wrong), false);
  }
  assert.equal(checkStarterCode(STARTER_PRACTICE.state, 'setquantity'), false);
});

test('foundation lessons have translated explanations, valid files and matching code annotations', () => {
  assert.equal(STARTER_LESSONS.length, 10);
  assert.equal(new Set(STARTER_LESSONS.map((lesson: any) => lesson.id)).size, 10);
  for (const lesson of STARTER_LESSONS) {
    for (const text of [lesson.title, lesson.goal, lesson.idea, lesson.analogy, lesson.task, lesson.observe, lesson.question, lesson.feedback, lesson.definition, ...lesson.options, ...lesson.lines]) {
      assert.equal(text.length, 3);
      assert.ok(text.every((value: unknown) => typeof value === 'string' && value.trim().length > 0));
    }
    assert.ok(existsSync(lesson.file), lesson.file);
    assert.equal(lesson.code.split('\n').length, lesson.lines.length);
    assert.ok(lesson.correct >= 0 && lesson.correct < lesson.options.length);
  }
});
test('saved progress rejects invalid values, deduplicates completions and bounds notes', () => {
  const value = readStarterProgress({ selected: 999, completed: ['html', 'html', 'unknown'], notes: { html: 'a'.repeat(3000), web: 1, unknown: 'bad' } });
  assert.equal(value.selected, 9);
  assert.deepEqual(Array.from(value.completed), ['html']);
  assert.equal(value.notes.html.length, 2000);
  assert.equal(value.notes.web, undefined);
  for (const malformed of [null, [], 'bad', { selected: '1', completed: null, notes: null }]) assert.equal(readStarterProgress(malformed).selected, 0);
});

function mount(saved = 'null', unavailable = false) {
  const values: any[] = []; let cursor = 0; let stored = saved; let effects: (() => void)[] = []; let language = 'en';
  let timer: (() => void) | undefined;
  const cleanups: Record<number, (() => void) | undefined> = {};
  const component = { exports: {} as any };
  runInNewContext(ts.transpileModule(readFileSync('app/admin/how-it-was-built/BeginnerJourney.tsx', 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText, {
    module: component, exports: component.exports,
    localStorage: { getItem() { if (unavailable) throw Error('unavailable'); return stored; }, setItem(_key: string, value: string) { if (unavailable) throw Error('unavailable'); stored = value; } },
    requestAnimationFrame(fn: () => void) { fn(); }, setTimeout(fn: () => void) { timer = fn; return 1; }, clearTimeout() { timer = undefined; },
    require(name: string) {
      if (name === 'react') return {
        useState(initial: any) { const index = cursor++; if (!(index in values)) values[index] = typeof initial === 'function' ? initial() : initial; return [values[index], (value: any) => { values[index] = typeof value === 'function' ? value(values[index]) : value; }]; },
        useRef(initial: any) { const index = cursor++; return values[index] ??= { current: initial }; },
        useEffect(effect: () => (() => void) | void, deps: any[]) { const index = cursor++; if (!values[index] || deps.some((value, i) => value !== values[index][i])) { values[index] = deps; effects.push(() => { cleanups[index]?.(); cleanups[index] = effect() || undefined; }); } },
      };
      if (name === 'react/jsx-runtime') return require(name);
      if (name === './course/beginner-path') return data.exports;
      if (name === './course/beginner-practice') return practiceData.exports;
      if (name.endsWith('.css')) return { default: new Proxy({}, { get: (_target, key) => key }) };
      throw Error(name);
    },
  });
  let tree: any;
  function render() { cursor = 0; tree = component.exports.default({ lang: language, onNavigate() {} }); const pending = effects; effects = []; pending.forEach(fn => fn()); }
  function walk(node: any): any[] { if (Array.isArray(node)) return node.flatMap(walk); return node?.props ? [node, ...walk(node.props.children)] : []; }
  function all() { return walk(tree); }
  function text(node: any): string { if (Array.isArray(node)) return node.map(text).join(''); if (node?.props) return text(node.props.children); return typeof node === 'string' || typeof node === 'number' ? String(node) : ''; }
  function click(label: string) { const button = all().find(node => node.type === 'button' && text(node).includes(label)); assert.ok(button, label); assert.ok(!button.props.disabled, `${label} disabled`); button.props.onClick(); render(); }
  render(); render();
  function code(value: string) { all().find(node => node.props.id === 'starter-code-input').props.onChange({ target: { value } }); render(); }
  function checkCode() { all().find(node => node.type === 'form').props.onSubmit({ preventDefault() {} }); render(); }
  function tryRequest() { click('Send request'); timer?.(); render(); }
  return { all, click, render, code, checkCode, tryRequest, text, flushRequest() { timer?.(); render(); }, stored: () => JSON.parse(stored), language(lang: string) { language = lang; render(); } };
}
test('an experiment and a correct answer are required; notes and completion survive reload', () => {
  const ui = mount();
  ui.click('See it and try');
  assert.equal(ui.all().find(node => node.type === 'button' && node.props.children === 'Check my understanding').props.disabled, true);
  ui.tryRequest(); ui.code('fetch'); ui.checkCode(); ui.click('Check my understanding');
  const radios = () => ui.all().filter(node => node.type === 'input' && node.props.type === 'radio');
  radios()[1].props.onChange(); ui.render(); ui.click('Check my answer');
  assert.equal(ui.all().some(node => node.props.className === 'note'), false);
  assert.equal(ui.stored(), null);
  radios()[0].props.onChange(); ui.render(); ui.click('Check my answer');
  ui.all().find(node => node.type === 'textarea').props.onChange({ target: { value: 'The browser shows the page.' } }); ui.render();
  ui.click('Complete this lesson');
  assert.deepEqual(ui.stored().completed, ['web']);
  ui.click('Next lesson');
  assert.equal(ui.stored().selected, 1);
  const restored = mount(JSON.stringify(ui.stored()));
  assert.equal(restored.all().find(node => node.type === 'h2' && node.props.tabIndex === -1).props.children, 'Write what people see');
  assert.equal(restored.stored().notes.web, 'The browser shows the page.');
});
test('changing lessons resets the exercise and every language supports the same path', () => {
  const ui = mount(); ui.click('See it and try'); ui.tryRequest(); ui.code('fetch'); ui.checkCode(); ui.click('Check my understanding');
  ui.click('Write what people see');
  ui.click('See it and try');
  assert.equal(ui.all().find(node => node.type === 'button' && node.props.children === 'Check my understanding').props.disabled, true);
  for (const lang of ['fr', 'en', 'ar']) { ui.language(lang); assert.equal(ui.all().find(node => node.props['data-beginner-journey']).props.dir, lang === 'ar' ? 'rtl' : 'ltr'); }
});
test('invalid storage and unavailable storage leave the lesson usable', () => {
  for (const ui of [mount('not json'), mount('null', true)]) {
    ui.click('See it and try'); ui.tryRequest(); ui.code('fetch'); ui.checkCode(); ui.click('Check my understanding');
    assert.ok(ui.all().some(node => node.type === 'fieldset'));
    assert.ok(ui.all().some(node => node.props.className === 'storage' && node.props.children.includes('cannot save')));
  }
});

test('code and a finished experiment gate the quiz; editing correct code invalidates it', () => {
  const ui = mount(); ui.click('See it and try');
  const locked = () => ui.all().find(node => node.type === 'button' && node.props.children === 'Check my understanding').props.disabled;
  ui.code('fetch'); ui.checkCode();
  assert.equal(locked(), true);
  ui.click('Send request');
  assert.equal(locked(), true, 'wait for the simulated response');
  ui.flushRequest();
  assert.equal(locked(), false);
  ui.code('Fetch'); ui.checkCode();
  assert.equal(locked(), true);
  assert.equal(ui.all().find(node => node.props.id === 'starter-code-input').props['aria-invalid'], true);
  ui.click('See the explained solution');
  assert.equal(locked(), true, 'viewing the solution does not pass the exercise');
  ui.code(' fetch '); ui.checkCode();
  assert.equal(locked(), false);
  ui.click('Write what people see'); ui.click('See it and try');
  assert.equal(ui.all().find(node => node.props.id === 'starter-code-input').props.value, '');
  assert.equal(locked(), true);
});

test('all ten lessons accept their coding exercise and explain every quiz choice', () => {
  for (const [index, lesson] of STARTER_LESSONS.entries()) {
    const ui = mount(JSON.stringify({ selected: index })); ui.click('See it and try');
    const exercise = STARTER_PRACTICE[lesson.id];
    if (lesson.experiment === 'request') ui.tryRequest();
    else if (lesson.experiment === 'quantity') {
      ui.all().find(node => node.props['aria-label'] === 'Increase quantity').props.onClick(); ui.render();
    } else {
      const controlId = lesson.experiment === 'text' ? 'starter-name' : lesson.experiment === 'style' ? 'starter-color' : 'starter-route';
      const value = lesson.experiment === 'text' ? 'My shop' : lesson.experiment === 'style' ? '#eff6ff' : 'boutique';
      ui.all().find(node => node.props.id === controlId).props.onChange({ target: { value } }); ui.render();
    }
    ui.code(exercise.answer); ui.checkCode(); ui.click('Check my understanding');
    for (let choice = 0; choice < lesson.options.length; choice++) {
      ui.all().filter(node => node.props.type === 'radio')[choice].props.onChange(); ui.render(); ui.click('Check my answer');
      assert.ok(ui.all().some(node => node.type === 'p' && ui.text(node) === exercise.answerFeedback[choice][1]), `${lesson.id}: feedback ${choice}`);
      assert.equal(ui.all().some(node => node.props.className === 'note'), choice === lesson.correct);
    }
    ui.all().filter(node => node.props.type === 'radio')[lesson.correct].props.onChange(); ui.render(); ui.click('Check my answer'); ui.click('Complete this lesson');
    assert.deepEqual(ui.stored().completed, [lesson.id]);
  }
});

test('previously completed lessons remain available for review', () => {
  const ui = mount(JSON.stringify({ selected: 0, completed: ['web'], notes: { web: 'Saved before coding exercises.' } }));
  ui.click('3Check');
  assert.ok(ui.all().some(node => node.type === 'fieldset'));
  assert.equal(ui.stored().notes.web, 'Saved before coding exercises.');
});
