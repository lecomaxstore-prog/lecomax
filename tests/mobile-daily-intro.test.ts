import { securityIo } from "./helpers/security-io.ts";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const mobileRequire = createRequire(new URL("../mobile/package.json", import.meta.url));
const source = ts.transpileModule(readFileSync(new URL("../mobile/src/stores/app-opening.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText;

function launch(storage: Map<string, string>, clock: { day: number }, web = false, broken = false) {
  let resume: (state: string) => void = () => {};
  let visibility: () => void = () => {};
  const effects: (() => unknown)[] = [];
  const dependencies: Record<string, unknown> = {
    react: { useEffect: (effect: () => unknown) => effects.push(effect) },
    zustand: mobileRequire("zustand"),
    "react-native": {
      Platform: { OS: web ? "web" : "android" },
      AppState: { currentState: "active", addEventListener: (_: string, callback: typeof resume) => {
        resume = callback; return { remove() {} };
      } },
    },
    "@react-native-async-storage/async-storage": {
      async getItem(key: string) { if (broken) throw Error("Storage unavailable"); return storage.get(key) ?? null; },
      async setItem(key: string, value: string) { if (broken) throw Error("Storage unavailable"); storage.set(key, value); },
    },
  };
  const exports: any = {};
  vm.runInNewContext(source, {
    exports, require: (name: string) => securityIo(name) ?? dependencies[name],
    Date: class extends Date { constructor() { super(2026, 8, clock.day, 23, 59); } },
    document: { visibilityState: "visible", addEventListener: (_: string, callback: () => void) => { visibility = callback; }, removeEventListener() {} },
  });
  exports.useAppOpeningLifecycle();
  for (const effect of effects) effect();
  return { state: () => exports.useAppOpening.getState(), resume: () => { resume("background"); resume("active"); }, visibility: () => visibility() };
}

const settle = () => new Promise<void>((resolve) => setImmediate(resolve));

test("intro appears once per local day across skipping, resuming, and cold restarts", async () => {
  const storage = new Map<string, string>();
  const clock = { day: 10 };
  const app = launch(storage, clock);
  assert.equal(app.state().ready, false);
  await settle();
  assert.equal(app.state().ready, true);
  assert.equal(app.state().finished, false);
  app.state().finish();
  app.resume();
  await settle();
  assert.equal(app.state().finished, true);
  const restarted = launch(storage, clock);
  await settle();
  assert.equal(restarted.state().finished, true);
  clock.day = 11;
  restarted.resume();
  await settle();
  assert.equal(restarted.state().finished, false);
  restarted.state().finish();
  restarted.resume();
  await settle();
  assert.equal(restarted.state().finished, true);
});

test("interrupted intro counts as shown, and web visibility only replays on a new day", async () => {
  const storage = new Map<string, string>();
  const clock = { day: 30 };
  launch(storage, clock, true);
  await settle();
  const app = launch(storage, clock, true);
  await settle();
  app.visibility();
  await settle();
  assert.equal(app.state().finished, true);
  clock.day = 31; // Date rolls into October.
  app.visibility();
  await settle();
  assert.equal(app.state().finished, false);
});

test("storage failure does not block startup or repeat the intro in the same session", async () => {
  const app = launch(new Map(), { day: 10 }, false, true);
  await settle();
  assert.equal(app.state().ready, true);
  app.state().finish();
  app.resume();
  await settle();
  assert.equal(app.state().finished, true);
});
