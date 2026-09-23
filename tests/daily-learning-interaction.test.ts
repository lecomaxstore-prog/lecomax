import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import * as quiz from "../app/admin/how-it-was-built/course/daily-tests.ts";
import { dailyText } from "../app/admin/how-it-was-built/course/daily-lessons.ts";
import { recordDailyAttempt, type DailyEntry } from "../app/admin/how-it-was-built/course/daily-progress.ts";
const require = createRequire(import.meta.url);
const ts = require("typescript");
type Element = { type: unknown; props: Record<string, any> };

// Exercise the component's event handlers without a browser or network.
function mountTest() {
  const state: unknown[] = [];
  let cursor = 0;
  let entry: DailyEntry = { note: "My explanation", practiced: true, compared: false };
  let submissions = 0;
  let lang = "en";
  const module = { exports: {} as { default: (props: unknown) => Element } };
  const source = readFileSync(new URL("../app/admin/how-it-was-built/DailyLessonTest.tsx", import.meta.url), "utf8");
  runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText, {
    module, exports: module.exports, requestAnimationFrame: () => 0,
    require(name: string) {
      if (name === "react") return {
        useRef: () => ({ current: null }),
        useState(initial: unknown) { const index = cursor++; if (!(index in state)) state[index] = initial; return [state[index], (next: unknown) => { state[index] = typeof next === "function" ? next(state[index]) : next; }]; },
      };
      if (name === "react/jsx-runtime") return require(name);
      if (name === "./course/daily-tests") return quiz;
      if (name === "./course/daily-lessons") return { dailyText };
      if (name === "./course/journey") return { translate: (language: string, fr: string, en: string, ar: string) => ({ fr, en, ar })[language] };
      throw new Error("Unexpected dependency: " + name);
    },
  });
  let tree: Element;
  function render() {
    cursor = 0;
    tree = module.exports.default({ lessonId: "website", lang, assessment: entry.assessment, practiced: entry.practiced, saving: false, onReview() {}, onPractice() {}, onSubmit(answers: number[]) { submissions++; entry = recordDailyAttempt("website", entry, answers, "2026-09-23")!; } });
  }
  function all(node: unknown = tree): Element[] {
    if (Array.isArray(node)) return node.flatMap(item => all(item));
    if (!node || typeof node !== "object" || !("props" in node)) return [];
    const item = node as Element;
    return [item, ...(item.props.children === undefined ? [] : all(item.props.children))];
  }
  const button = (label: string) => all().find(item => item.type === "button" && item.props.children === label)!;
  function choose(index: number, answer: number) { all().find(item => item.type === "input" && item.props.name === `daily-test-website-${index}` && item.props.value === answer)!.props.onChange(); render(); }
  render();
  return { all, button, choose, render, getEntry: () => entry, submissions: () => submissions, language(value: string) { lang = value; render(); } };
}

test("test UI requires every answer, gives corrections on failure, and validates after a retry", () => {
  const ui = mountTest();
  assert.equal(ui.button("Check my answers").props.disabled, true);
  ui.choose(0, 0); ui.choose(1, 0);
  assert.equal(ui.button("Check my answers").props.disabled, true);
  ui.choose(2, 0);
  assert.equal(ui.button("Check my answers").props.disabled, false);
  ui.button("Check my answers").props.onClick(); ui.render();
  assert.equal(ui.getEntry().completedOn, undefined);
  assert.ok(ui.all().some(item => item.props.children === "Not validated yet · let’s review"));
  assert.equal(ui.all().filter(item => item.type === "fieldset" && item.props.disabled).length, 3);
  ui.button("Try the test again").props.onClick(); ui.render();
  assert.equal(ui.button("Check my answers").props.disabled, true);
  quiz.DAILY_TESTS.website.forEach((question, index) => ui.choose(index, question.correctIndex));
  ui.button("Check my answers").props.onClick(); ui.render();
  assert.equal(ui.getEntry().completedOn, "2026-09-23");
  assert.equal(ui.getEntry().assessment?.attempts, 2);
  assert.equal(ui.submissions(), 2);
  assert.ok(ui.all().some(item => item.props.children === "Test passed · lesson validated"));
  ui.language("fr");
  assert.ok(ui.all().some(item => item.props.children === "Test réussi · leçon validée"));
  assert.equal(ui.getEntry().assessment?.attempts, 2);
});
