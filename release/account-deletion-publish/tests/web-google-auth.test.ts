import { securityIo } from "./helpers/security-io.ts";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

function setup(result: any = { data: { url: "https://accounts.google.com/authorize" }, error: null }) {
  const storage = new Map<string, string>();
  const calls: any[] = [];
  const exports: any = {};
  const code = ts.transpileModule(readFileSync(new URL("../lib/google-auth.ts", import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  vm.runInNewContext(code, {
    exports, URL, Date, Error,
    window: {
      location: { origin: "https://shop.example", assign: (url: string) => calls.push(["redirect", url]) },
      sessionStorage: { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value), removeItem: (key: string) => storage.delete(key) },
    },
    require: () => ({ supabase: { auth: { signInWithOAuth: async (options: any) => { calls.push(["oauth", options]); return result; } } } }),
  });
  return { api: exports, calls, storage };
}

test("Google sign-in uses a fixed callback and preserves the requested destination", async () => {
  const { api, calls } = setup();
  await api.startGoogleSignIn("/compte/commandes?order=123");
  assert.equal(calls[0][1].options.redirectTo, "https://shop.example/auth/callback");
  assert.equal(calls[0][1].options.skipBrowserRedirect, true);
  assert.equal(calls[0][1].options.queryParams.prompt, "select_account");
  assert.equal(api.pendingGoogleReturn(), "/compte/commandes?order=123");
  assert.deepEqual(calls[1], ["redirect", "https://accounts.google.com/authorize"]);
});

test("Google failures clear the pending return and never navigate", async () => {
  for (const result of [{ data: { url: null }, error: null }, { data: {}, error: { message: "disabled" } }]) {
    const { api, calls } = setup(result);
    await assert.rejects(api.startGoogleSignIn("/compte"));
    assert.equal(api.pendingGoogleReturn(), null);
    assert.equal(calls.length, 1);
  }
});

test("external URLs, backslashes, control characters and auth loops cannot become return destinations", () => {
  const { api } = setup();
  for (const value of [null, "", "https://evil.example", "//evil.example", "/\\evil.example", "/\nevil.example", "/auth/callback", "/connexion", "/inscription", "/shop/../auth/callback"]) {
    assert.equal(api.safeAuthReturnPath(value), "/compte", String(value));
  }
  assert.equal(api.safeAuthReturnPath("/panier?step=payment#summary"), "/panier?step=payment#summary");
});

test("normal visits and expired or malformed attempts are not treated as Google returns", () => {
  const { api, storage } = setup();
  assert.equal(api.pendingGoogleReturn(), null);
  for (const value of ["invalid json", JSON.stringify({ path: "/compte", createdAt: Date.now() - 600001 }), JSON.stringify({ path: "/compte" })]) {
    storage.set(api.GOOGLE_RETURN_KEY, value);
    assert.equal(api.pendingGoogleReturn(), null);
  }
});

function callbackSetup({ callback = true, pathname = "/auth/callback", pending = "/compte/commandes", search = "", session = { user: { id: "test-user" } } as any } = {}) {
  const effects: (() => any)[] = [];
  const changes: any[] = [];
  const routes: string[] = [];
  const saved = new Map<string, string>();
  let resolveSession: (value: any) => void = () => {};
  const sessionPromise = new Promise((resolve) => { resolveSession = resolve; });
  const exports: any = {};
  const code = ts.transpileModule(readFileSync(new URL("../components/GoogleAuthReturn.tsx", import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  vm.runInNewContext(code, {
    exports, URLSearchParams, Error,
    window: {
      location: { search, hash: "" },
      localStorage: { setItem: (key: string, value: string) => saved.set(key, value) },
      sessionStorage: { removeItem: () => {} },
      history: { state: null, replaceState: () => {} },
      setTimeout: () => 1, clearTimeout: () => {},
    },
    require(name: string) {
      const securityModule = securityIo(name); if (securityModule) return securityModule;
      if (name === "react") return { useEffect: (fn: () => any) => effects.push(fn), useState: (value: any) => [value, (next: any) => changes.push(next)] };
      if (name === "react/jsx-runtime") return { jsx: () => null, jsxs: () => null };
      if (name === "next/navigation") return { usePathname: () => pathname, useRouter: () => ({ replace: (path: string) => routes.push(path) }) };
      if (name === "@/lib/supabase") return { supabase: { auth: { getSession: () => sessionPromise } } };
      if (name === "@/lib/customer-api") return { CUSTOMER_SESSION_KEY: "customer" };
      if (name === "@/lib/google-auth") return { GOOGLE_RETURN_KEY: "google", pendingGoogleReturn: () => pending };
      return { default: {} };
    },
  });
  exports.default({ callback });
  const cleanup = effects[0]();
  return { routes, saved, changes, cleanup, async finish() {
    resolveSession({ data: { session }, error: null });
    await sessionPromise;
    await Promise.resolve();
    await Promise.resolve();
  } };
}

test("the callback waits for the session to persist before opening the requested account page", async () => {
  const state = callbackSetup();
  assert.deepEqual(state.routes, []);
  await state.finish();
  assert.deepEqual(state.routes, ["/compte/commandes"]);
  assert.equal(state.saved.get("customer"), "1");
});

test("a pending Google return on home recovers the account destination", async () => {
  const state = callbackSetup({ callback: false, pathname: "/" });
  await state.finish();
  assert.deepEqual(state.routes, ["/compte/commandes"]);
});

test("cancellation and missing sessions show an error without navigation", async () => {
  for (const options of [{ search: "?error=access_denied" }, { session: null }]) {
    const state = callbackSetup(options);
    await state.finish();
    assert.deepEqual(state.routes, []);
    assert.equal(state.saved.size, 0);
    assert.ok(state.changes.some((value) => typeof value === "string" && value.length > 0));
  }
});

test("leaving the callback before authentication finishes prevents a stale redirect", async () => {
  const state = callbackSetup();
  state.cleanup();
  await state.finish();
  assert.deepEqual(state.routes, []);
  assert.equal(state.saved.size, 0);
});

test("ordinary homepage visits are not redirected", async () => {
  const state = callbackSetup({ callback: false, pathname: "/", pending: null as any });
  await state.finish();
  assert.deepEqual(state.routes, []);
  assert.equal(state.saved.size, 0);
});
