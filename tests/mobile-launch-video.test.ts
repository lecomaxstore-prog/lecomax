import { securityIo } from "./helpers/security-io.ts";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

test("intro unmount never pauses the native player after Expo releases it", () => {
  const effects: (() => void | (() => void))[] = [];
  const cleanups: (() => void)[] = [];
  let released = false;
  let removed = false;
  let pauses = 0;
  let appState: (state: string) => void = () => {};
  const player = {
    status: "ready",
    play() { assert.equal(released, false); },
    pause() { assert.equal(released, false, "Cannot use shared object that was already released"); pauses++; },
    addListener() { return { remove() {} }; },
  };
  const dependencies: Record<string, unknown> = {
    react: {
      useCallback: (fn: unknown) => fn,
      useRef: (current: unknown) => ({ current }),
      useState: (value: unknown) => [value, () => {}],
      useEffect: (fn: () => void) => effects.push(fn),
    },
    "react/jsx-runtime": { jsx: (type: unknown, props: unknown) => ({ type, props }), jsxs: (type: unknown, props: unknown) => ({ type, props }) },
    "react-native": {
      Platform: { OS: "android" }, StyleSheet: { create: (styles: unknown) => styles },
      useWindowDimensions: () => ({ height: 900 }),
      AppState: { addEventListener: (_: string, callback: typeof appState) => {
        appState = callback;
        return { remove() { removed = true; } };
      } },
    },
    "expo-video": { useVideoPlayer: () => {
      // Expo's hook registers its release effect before the component's effects.
      effects.push(() => () => { released = true; });
      return player;
    } },
    "@/stores/app-opening": { useAppOpening: (selector: (state: unknown) => unknown) => selector({ opening: 1, finished: false, finish() {} }) },
    "react-native-safe-area-context": { useSafeAreaInsets: () => ({ top: 0, bottom: 0 }) },
    "expo-status-bar": {}, "expo-linear-gradient": {}, "@expo/vector-icons/Ionicons": {},
    "@/components/animated-pressable": {}, "@/constants/theme": { typography: {} },
    "../../assets/videos/banner-intro.mp4": 1,
  };
  const exports: { LaunchVideo?: () => { type: () => unknown } } = {};
  vm.runInNewContext(ts.transpileModule(readFileSync(new URL("../mobile/src/components/launch-video.tsx", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
  }).outputText, {
    exports, require: (name: string) => {
      const securityModule = securityIo(name); if (securityModule) return securityModule; assert.ok(name in dependencies, name); return dependencies[name]; },
    setTimeout: () => 1, clearTimeout: () => {},
  });
  exports.LaunchVideo!().type();
  for (const effect of effects) { const cleanup = effect(); if (cleanup) cleanups.push(cleanup); }
  appState("background");
  assert.equal(pauses, 1, "Backgrounding still pauses the mounted video");
  appState("active");
  assert.doesNotThrow(() => cleanups.forEach(cleanup => cleanup()));
  assert.equal(released, true);
  assert.equal(removed, true);
  assert.equal(pauses, 1);
});
