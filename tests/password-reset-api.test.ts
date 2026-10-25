import { securityIo } from "./helpers/security-io.ts";
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function setup({ user = { email: "owner@example.com" } as { email?: string } | null, status = 200, fail = false, configured = true, limited = false, appEnv = "production" } = {}) {
  const calls: { url: URL; init: RequestInit }[] = [];
  const exports: { POST?: (request: unknown) => Promise<Response> } = {};
  const source = readFileSync(new URL("../app/api/account/password-reset/route.ts", import.meta.url), "utf8");
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, {
    exports, URL, AbortSignal,
    process: { env: configured ? { APP_ENV: appEnv, NEXT_PUBLIC_SUPABASE_URL: "https://auth.example.com", NEXT_PUBLIC_SUPABASE_ANON_KEY: "public-key", NEXT_PUBLIC_SITE_URL: "https://shop.example.com" } : {} },
    require: (name: string) => {
      const securityModule = securityIo(name); if (securityModule) return securityModule;
      if (name === "@/lib/request-auth") return { getCustomerUser: async () => user };
      if (name === "@/lib/sensitive-rate-limit") return { sensitiveRateLimit: async (_req: unknown, _scope: string, email: string) => {
        assert.equal(email, user?.email);
        return limited ? Response.json({ error: "limited" }, { status: 429 }) : null;
      } };
      if (name === "next/server") return { NextResponse: { json: (body: unknown, options: ResponseInit) => Response.json(body, options) } };
      throw new Error(`Unexpected import ${name}`);
    },
    fetch: async (url: URL, init: RequestInit) => {
      calls.push({ url, init });
      if (fail) throw new Error("network unavailable");
      return new Response("{}", { status, headers: { "retry-after": "90" } });
    },
  });
  return { calls, post: () => exports.POST!({ json: async () => ({ email: "attacker@example.com", redirectTo: "https://evil.example" }) }) };
}

test("reset API only sends to the authenticated account and configured redirect", async () => {
  const { post, calls } = setup();
  const response = await post();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.equal(calls.length, 1);
  assert.deepEqual(JSON.parse(calls[0].init.body as string), { email: "owner@example.com" });
  assert.equal(calls[0].url.searchParams.get("redirect_to"), "https://shop.example.com/mot-de-passe");
  assert.ok(calls[0].init.signal);
});

test("nonproduction password reset cannot trigger Supabase email even with configured credentials", async () => {
  for (const appEnv of ["staging", "preview", "development", "test", ""]) {
    const { post, calls } = setup({ appEnv });
    assert.equal((await post()).status, 503);
    assert.equal(calls.length, 0);
  }
});

test("reset API rate limit prevents calling the email provider", async () => {
  const { post, calls } = setup({ limited: true });
  assert.equal((await post()).status, 429);
  assert.equal(calls.length, 0);
});

for (const scenario of [
  { name: "unauthenticated", user: null, expected: 401 },
  { name: "missing email", user: {}, expected: 400 },
  { name: "missing configuration", configured: false, expected: 503 },
]) test(`reset API rejects ${scenario.name} without sending email`, async () => {
  const { post, calls } = setup(scenario);
  assert.equal((await post()).status, scenario.expected);
  assert.equal(calls.length, 0);
});

for (const scenario of [
  { name: "provider rate limit", status: 429, expected: 429 },
  { name: "provider error", status: 500, expected: 502 },
  { name: "network failure", fail: true, expected: 503 },
]) test(`reset API handles ${scenario.name}`, async () => {
  const { post, calls } = setup(scenario);
  const response = await post();
  assert.equal(response.status, scenario.expected);
  assert.equal(calls.length, 1);
  if (scenario.status === 429) assert.equal(response.headers.get("retry-after"), "90");
  assert.equal(typeof (await response.json()).error, "string");
});
