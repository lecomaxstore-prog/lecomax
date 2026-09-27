import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
const require = createRequire(import.meta.url);
const ts = require("typescript");
type Element = { type: unknown; props: Record<string, any> };

function mount(saved = "{}", unavailable = false) {
  const values: any[] = [];
  let cursor = 0;
  let language = "en";
  let stored = saved;
  let effects: (() => void)[] = [];
  const data = { exports: {} as any };
  runInNewContext(ts.transpileModule(readFileSync(new URL("../app/admin/how-it-was-built/course/backend-guides.ts", import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { module: data, exports: data.exports });
  const practice = { exports: {} as any };
  runInNewContext(ts.transpileModule(readFileSync(new URL("../app/admin/how-it-was-built/course/backend-practice.ts", import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { module: practice, exports: practice.exports });
  for (const guide of data.exports.backendGuides) {
    assert.equal(practice.exports.backendPractice[guide.id].length, guide.chapters.length);
    for (const lesson of practice.exports.backendPractice[guide.id]) {
      for (const field of [lesson.idea, lesson.task, lesson.result]) {
        assert.equal(field.length, 3);
        assert.ok(field.every((translation: string) => translation.trim().length > 15));
      }
    }
  }
  const module = { exports: {} as any };
  runInNewContext(ts.transpileModule(readFileSync(new URL("../app/admin/how-it-was-built/BackendGuides.tsx", import.meta.url), "utf8"), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText, {
    module, exports: module.exports,
    localStorage: { getItem: () => { if (unavailable) throw Error("Unavailable"); return stored; }, setItem: (_: string, value: string) => { if (unavailable) throw Error("Unavailable"); stored = value; } },
    document: { body: { style: { overflow: "" } } },
    window: { addEventListener() {}, removeEventListener() {} },
    require(name: string) {
      if (name === "react") return {
        useState(initial: unknown) { const i = cursor++; if (!(i in values)) values[i] = initial; return [values[i], (value: any) => { values[i] = typeof value === "function" ? value(values[i]) : value; }]; },
        useRef(initial: unknown) { const i = cursor++; return values[i] ??= { current: initial }; },
        useEffect(effect: () => void, deps: unknown[]) { const i = cursor++; if (!values[i] || deps.some((value, j) => value !== values[i][j])) { values[i] = deps; effects.push(effect); } },
      };
      if (name === "react/jsx-runtime") return require(name);
      if (name === "./course/backend-guides") return data.exports;
      if (name === "./course/backend-practice") return practice.exports;
      if (name.endsWith(".css")) return { default: new Proxy({}, { get: (_target, key) => key }) };
      throw Error(name);
    },
  });
  let tree: Element;
  function render() { cursor = 0; tree = module.exports.default({ lang: language }); const pending = effects; effects = []; pending.forEach(fn => fn()); }
  function all(node: any = tree): Element[] { if (Array.isArray(node)) return node.flatMap(item => item === undefined ? [] : all(item)); return node?.props ? [node, ...(node.props.children === undefined ? [] : all(node.props.children))] : []; }
  function click(className: string) { const button = all().find(item => item.type === "button" && item.props.className === className)!; assert.ok(button); button.props.onClick({ currentTarget: { focus() {} } }); render(); }
  render(); render();
  return { all, render, click, saved: () => JSON.parse(stored), language: (lang: string) => { language = lang; render(); } };
}

test("reader moves one lesson at a time and only marks lessons read explicitly", () => {
  const ui = mount();
  assert.equal(ui.all().filter(item => item.props.className === "guideCard").length, 3);
  ui.click("guideCard");
  assert.equal(ui.all().filter(item => item.type === "article").length, 1);
  assert.equal(ui.all().find(item => item.type === "select")?.props.value, 0);
  const next = ui.all().find(item => item.type === "button" && item.props.children === "Next")!;
  next.props.onClick(); ui.render();
  assert.equal(ui.saved().apis.position, 1);
  assert.equal(ui.saved().apis.read.length, 0);
  ui.click("primary");
  assert.deepEqual(ui.saved().apis.read, [1]);
  assert.equal(ui.saved().apis.position, 2);
  ui.click("close");
  assert.equal(ui.all().filter(item => item.type === "article").length, 0);
  const resumed = mount(JSON.stringify(ui.saved()));
  resumed.click("guideCard");
  assert.equal(resumed.all().find(item => item.type === "select")?.props.value, 2);
  resumed.language("ar");
  assert.equal(resumed.all().find(item => item.type === "dialog")?.props.dir, "rtl");
});

test("invalid saved progress is bounded and storage failures do not prevent reading", () => {
  const ui = mount(JSON.stringify({ apis: { position: 999, read: [-1, 1, 1, 99, "2"] } }));
  ui.click("guideCard");
  assert.equal(ui.all().find(item => item.type === "select")?.props.value, 3);
  ui.click("primary");
  assert.deepEqual(ui.saved().apis.read, [1, 3]);
  const privateBrowser = mount("{}", true);
  privateBrowser.click("guideCard"); privateBrowser.click("primary");
  assert.equal(privateBrowser.all().find(item => item.type === "select")?.props.value, 1);
  assert.ok(privateBrowser.all().some(item => item.props.role === "status"));
});

test("beginner reader shows a task and optional answer without marking it read", () => {
  const ui = mount();
  ui.click("guideCard");
  assert.ok(ui.all().some(item => item.props.children === "An API receives a request and returns data."));
  assert.ok(ui.all().some(item => item.type === "summary" && item.props.children === "3. Check my result"));
  assert.ok(ui.all().filter(item => item.type === "details").every(item => !item.props.open));
  const larger = ui.all().find(item => item.type === "button" && item.props.children === "Larger text")!;
  larger.props.onClick(); ui.render();
  assert.equal(ui.all().find(item => item.props.className === "readerBody")?.props["data-large-text"], true);
  assert.deepEqual(ui.saved(), {});
  ui.click("primary");
  assert.deepEqual(ui.saved().apis.read, [0]);
  assert.ok(ui.all().some(item => item.props.children === "fetch requests data. You also need to check whether the request succeeded."));
});
