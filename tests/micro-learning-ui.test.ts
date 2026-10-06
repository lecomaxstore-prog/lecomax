import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import * as learning from "../lib/micro-learning.ts";
import { MICRO_LEARNING_TIPS } from "../lib/micro-learning-curriculum.ts";

const require = createRequire(import.meta.url);
const ts = require("typescript");

async function mount(tipId?: number) {
  const values: any[] = []; let cursor = 0; let effects: (() => void)[] = []; let tree: any;
  const state = {
    settings: { ...learning.DEFAULT_LEARNING_SETTINGS, enabled: true }, tips: MICRO_LEARNING_TIPS, configured: true, schedulerConfigured: true, deviceCount: 2,
    history: MICRO_LEARNING_TIPS.slice(0, 4).map(tip => ({ id: String(tip.id), tip_id: tip.id, title: tip.title, content: tip.content, topic: tip.topic, level: tip.level, created_at: new Date().toISOString(), sent_at: new Date().toISOString(), read_at: null as string | null, learned_at: null as string | null, favorite: false, delivery_state: "accepted" })),
  };
  const mutations: any[] = [];
  const module = { exports: {} as any };
  runInNewContext(ts.transpileModule(readFileSync("app/admin/how-it-was-built/MicroLearning.tsx", "utf8"), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText, {
    module, exports: module.exports, AbortController, AbortSignal, Date, Intl, navigator: {}, window: {},
    fetch: async (_url: string, init?: RequestInit) => {
      if (init?.method === "PATCH") {
        const body = JSON.parse(String(init.body)); mutations.push(body);
        if (body.action === "settings") state.settings = body.settings;
        else {
          const row = state.history.find(item => item.tip_id === body.tipId)!;
          if (body.field === "favorite") row.favorite = body.value;
          if (body.field === "read") row.read_at = new Date().toISOString();
          if (body.field === "learned") row.learned_at = body.value ? new Date().toISOString() : null;
        }
      }
      return { ok: true, json: async () => structuredClone(state) };
    },
    require(name: string) {
      if (name === "react") return {
        useState(initial: any) { const i = cursor++; if (!(i in values)) values[i] = initial; return [values[i], (value: any) => { values[i] = typeof value === "function" ? value(values[i]) : value; }]; },
        useRef(initial: any) { const i = cursor++; return values[i] ??= { current: initial }; },
        useCallback(callback: any, deps: any[]) { const i = cursor++; if (!values[i] || deps.some((value, index) => value !== values[i].deps[index])) values[i] = { callback, deps }; return values[i].callback; },
        useEffect(effect: () => void, deps: any[]) { const i = cursor++; if (!values[i] || deps.some((value, index) => value !== values[i][index])) { values[i] = deps; effects.push(effect); } },
      };
      if (name === "react/jsx-runtime") return require(name);
      if (name === "next/link") return { default: "a" };
      if (name.endsWith(".css")) return { default: new Proxy({}, { get: (_target, key) => key }) };
      if (name === "@/lib/micro-learning") return learning;
      if (name === "@/lib/register-learning-device") return { registerLearningDevice: async () => {} };
      throw new Error(name);
    },
  });
  function render() { cursor = 0; tree = module.exports.default({ tipId }); const pending = effects; effects = []; pending.forEach(effect => effect()); }
  function walk(node: any): any[] { if (Array.isArray(node)) return node.flatMap(walk); return node?.props ? [node, ...walk(node.props.children)] : []; }
  function text(node: any): string { if (Array.isArray(node)) return node.map(text).join(""); return node?.props ? text(node.props.children) : typeof node === "string" || typeof node === "number" ? String(node) : ""; }
  async function settle() { for (let i = 0; i < 3; i++) { await new Promise(resolve => setImmediate(resolve)); render(); } }
  async function click(label: string) { const node = walk(tree).find(node => node.type === "button" && text(node).includes(label)); assert.ok(node, label); node.props.onClick(); await settle(); }
  function field(label: string) { const node = walk(tree).find(node => node.type === "label" && text(node).startsWith(label)); assert.ok(node, label); return walk(node).find(node => node.type === "input" || node.type === "select"); }
  render(); await settle();
  return { state, mutations, click, field, settle, text: () => text(tree), nodes: () => walk(tree), render };
}

test("history supports search, topic, level and favorite filters in RTL", async () => {
  const ui = await mount();
  assert.equal(ui.nodes()[0].props.dir, "rtl"); assert.equal(ui.nodes()[0].props.lang, "ar");
  const links = () => ui.nodes().filter(node => node.type === "a" && node.props.href.includes("/tip/"));
  assert.equal(links().length, 4);
  ui.field("ابحث").props.onChange({ target: { value: "missing-word" } }); ui.render();
  assert.equal(links().length, 0);
  ui.field("ابحث").props.onChange({ target: { value: "" } });
  ui.field("الموضوع").props.onChange({ target: { value: "Next.js" } }); ui.render(); assert.equal(links().length, 3);
  ui.field("الموضوع").props.onChange({ target: { value: "" } });
  ui.field("المستوى").props.onChange({ target: { value: "2" } }); ui.render(); assert.equal(links().length, 1);
  ui.field("المفضلة فقط").props.onChange({ target: { checked: true } }); ui.render(); assert.equal(links().length, 0);
});

test("a lesson records read once, persists learned state and favorites", async () => {
  const ui = await mount(1);
  assert.equal(ui.mutations.filter(item => item.field === "read").length, 1);
  await ui.click("فهمت هذه المعلومة"); assert.ok(ui.state.history[0].learned_at);
  await ui.click("أضف إلى المفضلة"); assert.equal(ui.state.history[0].favorite, true);
  await ui.click("إلغاء العلامة"); assert.equal(ui.state.history[0].learned_at, null);
  assert.equal(ui.mutations.filter(item => item.field === "read").length, 1);
});

test("pause, resume, interval and quiet-hour settings persist", async () => {
  const ui = await mount();
  await ui.click("إيقاف مؤقت"); assert.equal(ui.state.settings.paused, true);
  await ui.click("استئناف التعلم"); assert.equal(ui.state.settings.paused, false);
  ui.field("معلومة كل").props.onChange({ target: { value: "30" } }); ui.render();
  ui.field("وقت هدوء").props.onChange({ target: { checked: false } }); ui.render();
  ui.nodes().find(node => node.type === "form").props.onSubmit({ preventDefault() {} }); await ui.settle();
  assert.equal(ui.state.settings.interval_minutes, 30); assert.equal(ui.state.settings.quiet_enabled, false);
});
