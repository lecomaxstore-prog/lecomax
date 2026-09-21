import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const mobileRequire = createRequire(new URL("../mobile/package.json", import.meta.url));
function setup(platform: string, params: Record<string, string>, failure = false) {
  const effects: (() => any)[] = [];
  const routes: string[] = [];
  const callbacks: string[] = [];
  const exports: any = {};
  const code = ts.transpileModule(readFileSync(new URL("../mobile/src/app/auth.tsx", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code, {
    exports, URL, Promise,
    window: { location: { href: `http://localhost:8081/auth?${new URLSearchParams(params)}` }, history: { replaceState() {} } },
    require(name: string) {
      if (name === "zod") return mobileRequire("zod");
      if (name === "react") return { useEffect: (fn: () => any) => effects.push(fn), useRef: (current: any) => ({ current }), useState: (value: any) => [value, () => {}] };
      if (name === "react/jsx-runtime") { const jsx = (type: any, props: any) => ({ type, props }); return { jsx, jsxs: jsx }; }
      if (name === "expo-router") return { useLocalSearchParams: () => params, router: { replace: (route: string) => routes.push(route) } };
      if (name === "react-native") return { KeyboardAvoidingView: "KeyboardAvoidingView", ScrollView: "ScrollView", Platform: { OS: platform }, StyleSheet: { create: (styles: any) => styles } };
      if (name === "react-native-safe-area-context") return { useSafeAreaInsets: () => ({ top: 0, bottom: 0 }) };
      if (name === "react-hook-form") return { useForm: () => ({ formState: {}, getValues: () => "" }) };
      if (name === "@hookform/resolvers/zod") return { zodResolver: () => {} };
      if (name === "@/i18n") return { useLocale() {}, msg: (key: string) => key };
      if (name === "@/constants/theme") return { palette: {}, typography: {} };
      if (name === "@/lib/google-auth") return { completeGoogleSignIn: async (url: string) => { callbacks.push(url); if (failure) throw new Error("Authentication failed"); } };
      return {};
    },
  });
  const tree = exports.default();
  const cleanup = effects[0]();
  return { callbacks, routes, cleanup, tree };
}

test("Google callback works after native app reopen and on web", async () => {
  for (const platform of ["android", "ios", "web"]) {
    const state = setup(platform, { code: "test-code", returnTo: "account" });
    await new Promise(setImmediate);
    assert.equal(new URL(state.callbacks[0]).searchParams.get("code"), "test-code");
    assert.deepEqual(state.routes, ["/account"]);
  }
});

test("normal auth visits do not exchange or navigate", async () => {
  const state = setup("android", { mode: "signup" });
  await new Promise(setImmediate);
  assert.deepEqual(state.callbacks, []);
  assert.deepEqual(state.routes, []);
});

test("failed callbacks and unmounted screens do not navigate", async () => {
  const failed = setup("android", { code: "invalid" }, true);
  const left = setup("web", { code: "test-code" });
  left.cleanup();
  await new Promise(setImmediate);
  assert.deepEqual(failed.routes, []);
  assert.deepEqual(left.routes, []);
});

test("Android sign-up keeps a flexible scroll viewport when the native keyboard resizes the window", () => {
  const { tree } = setup("android", { mode: "signup" });
  assert.equal(tree.type, "KeyboardAvoidingView");
  assert.equal(tree.props.enabled, false, "Android must have only one keyboard resize owner");
  assert.equal(tree.props.behavior, undefined, "must not pin the form to its pre-keyboard height");
  assert.equal(tree.props.style.flex, 1);
  const scroll = tree.props.children.find((child: any) => child?.type === "ScrollView");
  assert.equal(scroll.props.style.flex, 1, "scrolling must use the remaining keyboard-safe space");
  assert.equal(scroll.props.removeClippedSubviews, false, "focused inputs must stay mounted while scrolling");
  assert.equal(scroll.props.keyboardDismissMode, "none");
  assert.equal(scroll.props.keyboardShouldPersistTaps, "handled");
});

test("iOS retains keyboard padding and web leaves keyboard sizing to its viewport", () => {
  const ios = setup("ios", { mode: "signup" }).tree;
  assert.equal(ios.props.enabled, true);
  assert.equal(ios.props.behavior, "padding");
  const web = setup("web", { mode: "signup" }).tree;
  assert.equal(web.props.enabled, false);
  assert.equal(web.props.behavior, undefined);
});
test("Android system link reaches the callback screen and finishes at the account", async () => {
  const intent: any = {};
  vm.runInNewContext(ts.transpileModule(readFileSync(new URL("../mobile/src/app/+native-intent.ts", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, { exports: intent, URL });
  const route = intent.redirectSystemPath({ path: "lecomax://auth?code=google-code&returnTo=account", initial: true });
  const url = new URL(route, "https://lecomax.com");
  assert.equal(url.pathname, "/auth");
  const state = setup("android", Object.fromEntries(url.searchParams));
  await new Promise(setImmediate);
  assert.equal(new URL(state.callbacks[0]).searchParams.get("code"), "google-code");
  assert.deepEqual(state.routes, ["/account"]);
});

