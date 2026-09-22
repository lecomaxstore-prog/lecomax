import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const { NextRequest, NextResponse } = require("next/server");

function setup(pin?: string) {
  const env: Record<string, string | undefined> = {
    HOW_BUILT_PIN: pin, ADMIN_EMAIL: "owner@example.test", NODE_ENV: "production",
  };
  const signed: unknown[][] = [];
  const module = { exports: {} as Record<string, (req: unknown) => Promise<Response>> };
  const source = readFileSync(new URL("../app/api/admin/how-built-pin/route.ts", import.meta.url), "utf8");
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  runInNewContext(code, {
    module, exports: module.exports, process: { env },
    require(name: string) {
      if (name === "next/server") return { NextResponse };
      if (name === "@/lib/request-body") return { readJsonLimited: (req: Request) => req.json() };
      if (name === "@/lib/admin-session") return {
        verifySessionToken: async (token: string) => token === "owner" ? "owner@example.test" : token === "access" ? "how-built-pin@lecomax.local" : null,
        createSessionToken: async (...args: unknown[]) => { signed.push(args); return "signed-access"; },
      };
      throw new Error(`Unexpected import ${name}`);
    },
  });
  function request(method: string, value?: string, owner = true, access = false) {
    return new NextRequest("https://example.test/api/admin/how-built-pin", {
      method,
      headers: { cookie: `${owner ? "admin_session=owner" : "admin_session=other"}${access ? "; how_built_access=access" : ""}`, "Content-Type": "application/json" },
      ...(method === "POST" ? { body: JSON.stringify({ pin: value }) } : {}),
    });
  }
  return { route: module.exports, request, env, signed };
}

test("missing or short configuration reports readable errors before a submission", async () => {
  for (const pin of [undefined, "1234"]) {
    const { route, request } = setup(pin);
    const response = await route.GET(request("GET"));
    assert.equal(response.status, 503);
    assert.match((await response.json()).error, /Accès sécurisé non configuré/);
  }
});

test("configuration failures do not consume the owner's retry allowance", async () => {
  const { route, request, env } = setup();
  for (let i = 0; i < 6; i++) assert.equal((await route.POST(request("POST", "test-code"))).status, 503);
  env.HOW_BUILT_PIN = "test-code";
  assert.equal((await route.POST(request("POST", "test-code"))).status, 200);
});

test("long access codes unlock only for the owner and create a protected eight-hour cookie", async () => {
  const { route, request, signed } = setup("Letters-123! long");
  assert.equal((await route.POST(request("POST", "Letters-123! long", false))).status, 403);
  assert.equal((await route.GET(request("GET", undefined, false))).status, 403);
  assert.equal((await route.POST(request("POST", "wrong-code"))).status, 401);
  const response = await route.POST(request("POST", "Letters-123! long"));
  assert.equal(response.status, 200);
  const cookie = response.headers.get("set-cookie")!;
  for (const flag of [/HttpOnly/i, /Secure/i, /SameSite=strict/i, /Max-Age=28800/i]) assert.match(cookie, flag);
  assert.equal(signed[0][1], 8 * 60 * 60 * 1000);
  assert.equal((await route.GET(request("GET", undefined, true, true))).status, 200);
});

test("wrong codes remain rate limited and logout removes the access cookie", async () => {
  const { route, request } = setup("valid-code");
  for (let i = 0; i < 5; i++) assert.equal((await route.POST(request("POST", "wrong-code"))).status, 401);
  assert.equal((await route.POST(request("POST", "valid-code"))).status, 429);
  const response = await route.DELETE(request("DELETE"));
  assert.match(response.headers.get("set-cookie")!, /Max-Age=0/i);
});
