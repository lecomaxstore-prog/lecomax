import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { lessons } from '../app/admin/how-it-was-built/learning/lessons.ts';
import { readings, predictionIsYes } from '../app/admin/how-it-was-built/learning/reading.ts';
import { labs, labForLesson, previewLab } from '../app/admin/how-it-was-built/learning/practice.ts';
import * as progressHelpers from '../app/admin/how-it-was-built/learning/progress.ts';
import { text } from '../app/admin/how-it-was-built/learning/types.ts';
import * as coaching from '../app/admin/how-it-was-built/learning/coaching.ts';

test('each beginner lesson has accurate excerpts and explanations in all three languages', () => {
  for (const lesson of lessons) {
    const reading = readings[lesson.id];
    assert.ok(reading, lesson.id);
    const source = readFileSync(reading.file, 'utf8');
    assert.ok(reading.lines.length >= 1 && reading.lines.length <= 4);
    for (const line of reading.lines) {
      assert.ok(source.includes(line.code), `${lesson.id}: ${line.code}`);
      assert.equal(line.explanation.length, 3);
      assert.ok(line.explanation.every(value => value.length > 30));
    }
    assert.equal(predictionIsYes[lesson.id], lesson.outcome[0].startsWith('Oui'), lesson.id);
  }
});

test('bounded lab previews accept the intended edits and reject executable input', () => {
  for (const kind of Object.keys(labs) as (keyof typeof labs)[]) {
    assert.equal(previewLab(kind, labs[kind].original)?.solved, false);
    assert.equal(previewLab(kind, labs[kind].solution)?.solved, true);
    for (const unsafe of ['fetch("/api/orders/", {method:"POST"})', '<img src=x onerror=alert(1)>', labs[kind].solution + ';alert(1)', 'x'.repeat(241)]) {
      assert.equal(previewLab(kind, unsafe), null);
    }
  }
  assert.equal(previewLab('route', 'app/../../admin/page.tsx'), null);
  assert.equal(previewLab('state', 'setQuantity(-1)'), null);
  assert.equal(previewLab('spacing', 'className="p-999"'), null);
  assert.equal(previewLab('product', 'const product = { name: "<script>" };'), null);
});

test('saved lesson stages restore valid steps and safely migrate existing progress', () => {
  const ids = lessons.map(item => item.id);
  assert.deepEqual(progressHelpers.readProgress({ lessonSteps: { web: 2, page: 3, state: 4, props: -1, unknown: 1 } }, ids).lessonSteps, { web: 2, page: 3 });
  assert.deepEqual(progressHelpers.readProgress({ completed: ['web'] }, ids).lessonSteps, {});
});

const require = createRequire(import.meta.url);
const ts = require('typescript');
type Element = { type: unknown; props: Record<string, any> };
function mount(component: string, getProps: () => Record<string, unknown>) {
  const state: unknown[] = [];
  let cursor = 0;
  let tree: Element;
  const module = { exports: {} as { default: (props: unknown) => Element } };
  const source = readFileSync(`app/admin/how-it-was-built/learning/${component}.tsx`, 'utf8');
  runInNewContext(ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText, {
    module, exports: module.exports, requestAnimationFrame: () => 0,
    require(name: string) {
      if (name === 'react') return {
        useRef: () => ({ current: null }),
        useState(initial: unknown) { const index = cursor++; if (!(index in state)) state[index] = typeof initial === 'function' ? initial() : initial; return [state[index], (value: unknown) => { state[index] = typeof value === 'function' ? value(state[index]) : value; }]; },
      };
      if (name === 'react/jsx-runtime') return require(name);
      if (name === './types') return { text };
      if (name === './reading') return { predictionIsYes, readings };
      if (name === './practice') return { labForLesson };
      if (name === './progress') return progressHelpers;
      if (name === './coaching') return coaching;
      if (name.endsWith('.css')) return new Proxy({}, { get: (_, key) => String(key) });
      if (['./ReadingCoach', './LessonQuiz', './LessonMap', './MiniLab', './FileCoach', './CodeTokens', '../LessonTeacher'].includes(name)) return { default: name };
      throw new Error(`Unexpected import ${name}`);
    },
  });
  function render() { cursor = 0; tree = module.exports.default(getProps()); }
  function all(node: unknown = tree): Element[] {
    if (Array.isArray(node)) return node.filter(item => item !== undefined).flatMap(item => all(item));
    if (!node || typeof node !== 'object' || !('props' in node)) return [];
    const item = node as Element;
    return [item, ...(item.props.children === undefined ? [] : all(item.props.children))];
  }
  function words(node: unknown): string {
    if (typeof node === 'string' || typeof node === 'number') return String(node);
    if (Array.isArray(node)) return node.map(words).join('');
    return node && typeof node === 'object' && 'props' in node ? words((node as Element).props.children) : '';
  }
  function button(label: string) { const result = all().find(item => item.type === 'button' && words(item.props.children) === label); assert.ok(result, label); return result; }
  render();
  return { all, render, button, words };
}

test('quiz requires an answer, explains mistakes, permits retry and records both questions', () => {
  const results: (number | null)[] = [];
  let lang = 'en';
  const ui = mount('LessonQuiz', () => ({ lesson: lessons[0], lang, onResult: (score: number | null) => results.push(score) }));
  const choose = (value: number) => { ui.all().find(item => item.type === 'input' && item.props.value === value)!.props.onChange(); ui.render(); };
  const click = (label: string) => { ui.button(label).props.onClick(); ui.render(); };
  assert.equal(ui.button('Check my answer').props.disabled, true);
  choose(1); click('Check my answer');
  assert.ok(ui.all().some(item => ui.words(item.props.children) === 'Let’s work through it together.'));
  assert.ok(ui.all().some(item => item.type === 'fieldset' && item.props.disabled));
  click('Retry this question');
  assert.equal(ui.button('Check my answer').props.disabled, true);
  choose(0); click('Check my answer'); click('Next question →');
  choose(0); click('Check my answer');
  assert.equal(results.at(-1), 1);
  click('Retry this question');
  assert.equal(results.at(-1), null);
  choose(1); click('Check my answer');
  assert.equal(results.at(-1), 2);
  lang = 'ar'; ui.render();
  assert.ok(ui.all().some(item => ui.words(item.props.children) === 'نعم، فهمت هذه الفكرة.'));
});

test('lesson completion requires practice and quiz; stage and existing progress survive navigation', () => {
  let progress = progressHelpers.readProgress(null, lessons.map(item => item.id));
  const ui = mount('LessonViewer', () => ({ lesson: lessons[0], lang: 'en', progress, update: (change: Partial<typeof progress>) => { progress = { ...progress, ...structuredClone(change) }; }, onHome() {}, onNext() {}, next: lessons[1] }));
  assert.equal(ui.button('I understand · finish lesson').props.disabled, true);
  ui.button('3Practise').props.onClick(); ui.render();
  assert.equal(progress.lessonSteps.web, 2);
  ui.all().find(item => item.type === 'input')!.props.onChange({ target: { value: '/boutique' } }); ui.render();
  assert.equal(ui.all().find(item => item.type === 'input')!.props.value, '/boutique'); ui.button('Check my attempt').props.onClick(); ui.render();
  assert.deepEqual(progress.exercises, ['web']);
  assert.equal(ui.button('I understand · finish lesson').props.disabled, true);
  ui.all().find(item => item.type === './LessonQuiz')!.props.onResult(2); ui.render();
  assert.equal(ui.button('I understand · finish lesson').props.disabled, false);
  ui.button('I understand · finish lesson').props.onClick(); ui.render();
  assert.deepEqual(progress.completed, ['web']);
  assert.equal(ui.button('Lesson completed ✓').props.disabled, true);
  assert.equal(progress.drafts.web, '/boutique');
  ui.all().find(item => item.type === 'input')!.props.onChange({ target: { value: '/wrong' } }); ui.render();
  assert.deepEqual(progress.exercises, []);
  assert.equal(progress.drafts.web, '/wrong');
  assert.deepEqual(progress.completed, ['web'], 'historical completion is retained during review');
});

test('reader changes explanation depth and gives the consequence for the selected real line', () => {
  let lang = 'en';
  const lesson = lessons.find(item => item.id === 'state')!;
  const ui = mount('ReadingCoach', () => ({ lesson, lang }));
  assert.ok(ui.all().some(item => ui.words(item.props.children) === coaching.analogies.state[1]));
  ui.button('Advanced').props.onClick(); ui.render();
  assert.ok(ui.all().some(item => ui.words(item.props.children) === coaching.advancedNotes.state[1]));
  assert.ok(ui.all().some(item => ui.words(item.props.children) === coaching.removalNotes.state[0][1]));
  ui.button('Next line').props.onClick(); ui.render();
  assert.ok(ui.all().some(item => ui.words(item.props.children) === coaching.removalNotes.state[1][1]));
  assert.equal(ui.button('Next line').props.disabled, true);
  lang = 'ar'; ui.render();
  assert.ok(ui.all().some(item => ui.words(item.props.children) === coaching.removalNotes.state[1][2]));
});

test('returning to a lesson restores its draft without treating it as a checked answer', () => {
  const progress = progressHelpers.readProgress({ drafts: { web: '/boutique' }, lessonSteps: { web: 2 } }, lessons.map(item => item.id));
  const ui = mount('LessonViewer', () => ({ lesson: lessons[0], lang: 'ar', progress, update() {}, onHome() {}, onNext() {} }));
  assert.equal(ui.all().find(item => item.type === 'input')!.props.value, '/boutique');
  assert.equal(ui.button('فهمت · إنهاء الدرس').props.disabled, true);
});
