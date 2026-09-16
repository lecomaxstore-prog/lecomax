import { securityIo } from "./helpers/security-io.ts";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

function setup(platform = "web", result = { type: "cancel", url: "" }) {
  const calls: any[] = [];
  const exports: any = {};
  const code = ts.transpileModule(readFileSync(new URL("../mobile/src/lib/google-auth.ts", import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  vm.runInNewContext(code, { exports, URL, Error, window: { location: { origin: "http://localhost:8081", assign: (url: string) => calls.push(["redirect", url]) } }, require(name: string) {
      const securityModule = securityIo(name); if (securityModule) return securityModule;
    if (name === "react-native") return { Platform: { OS: platform } };
    if (name === "expo-web-browser") return { openAuthSessionAsync: async () => result };
    if (name === "./supabase") return { supabase: { auth: {
      signInWithOAuth: async (options: any) => { calls.push(["oauth", options]); return { data: { url: "https://provider.example/authorize" }, error: null }; },
      exchangeCodeForSession: async (value: string) => { calls.push(["exchange", value]); return { data: { session: {} }, error: null }; },
    } } };
    throw new Error(name);
  } });
  return { api: exports, calls };
}
test("web Google sign-in uses the current app origin and returns to account", async () => {
  const { api, calls } = setup();
  await api.startGoogleSignIn("account");
  assert.equal(calls[0][1].provider, "google");
  assert.equal(calls[0][1].options.redirectTo, "http://localhost:8081/auth?returnTo=account");
  assert.equal(calls[1][0], "redirect");
});
test("native cancellation does not create a session", async () => {
  const { api, calls } = setup("android");
  assert.equal(await api.startGoogleSignIn("profile"), false);
  assert.equal(calls.length, 1);
});
test("native Google callback exchanges its authorization code", async () => {
  const { api, calls } = setup("android", { type: "success", url: "lecomax://auth?code=sample" });
  assert.equal(await api.startGoogleSignIn("profile"), true);
  assert.deepEqual(calls[1], ["exchange", "sample"]);
});
test("unexpected callback destination is rejected", async () => {
  const { api, calls } = setup("android", { type: "success", url: "https://other.example/auth?code=sample" });
  await assert.rejects(api.startGoogleSignIn("profile"), /Unexpected/);
  assert.equal(calls.length, 1);
});
test("callback errors and missing codes never create sessions", async () => {
  const { api, calls } = setup();
  await assert.rejects(api.completeGoogleSignIn("https://app.example/auth?error=access_denied"));
  await assert.rejects(api.completeGoogleSignIn("https://app.example/auth"));
  assert.equal(calls.length, 0);
});
test("repeated callbacks exchange a one-time code only once", async () => {
  const { api, calls } = setup();
  await Promise.all([api.completeGoogleSignIn("lecomax://auth?code=sample"), api.completeGoogleSignIn("lecomax://auth?code=sample")]);
  assert.equal(calls.length, 1);
});
