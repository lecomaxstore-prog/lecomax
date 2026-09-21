import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

test("keyboard viewport ignores unchanged events and updates when keyboard opens or closes", () => {
  let state = { visible: false, height: 0, top: 0 };
  let effect: () => any = () => {};
  let frame: () => void = () => {};
  const events = new Map<string, () => void>();
  class Element { tagName = "INPUT"; isContentEditable = false; }
  const listeners = { addEventListener: (key: string, fn: () => void) => events.set(key, fn), removeEventListener() {} };
  const viewport = { ...listeners, scale: 1, height: 800, offsetTop: 0 };
  const doc: any = { ...listeners, activeElement: null };
  const exports: any = {};
  vm.runInNewContext(ts.transpileModule(readFileSync(new URL("../mobile/src/hooks/use-keyboard-viewport.ts", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, {
    exports, HTMLElement: Element, document: doc,
    window: { ...listeners, visualViewport: viewport, innerHeight: 800 },
    requestAnimationFrame: (fn: () => void) => { frame = fn; return 1; }, cancelAnimationFrame() {},
    require: (name: string) => name === "react"
      ? { useState: () => [state, (update: any) => { state = typeof update === "function" ? update(state) : update; }], useEffect: (fn: () => any) => { effect = fn; } }
      : { Platform: { OS: "web" } },
  });
  exports.useKeyboardViewport();
  const initial = state;
  effect(); frame();
  assert.equal(state, initial);
  doc.activeElement = new Element();
  events.get("focusin")!(); frame();
  assert.equal(state, initial, "desktop focus must not resize the app");
  viewport.height = 450;
  events.get("resize")!(); frame();
  assert.equal(state.visible, true);
  assert.equal(state.height, 450);
  const shown = state;
  events.get("scroll")!(); frame();
  assert.equal(state, shown, "unchanged viewport must retain its state reference");
  doc.activeElement = null;
  events.get("focusout")!(); frame();
  assert.equal(state.visible, false);
  assert.equal(state.height, 0);
});
