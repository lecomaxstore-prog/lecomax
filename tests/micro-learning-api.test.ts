import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import * as learning from "../lib/micro-learning.ts";

const require = createRequire(import.meta.url);
const ts = require("typescript");

function loadModule(path: string, imports: Record<string, unknown>, extra: Record<string, unknown> = {}) {
  const module = { exports: {} as any };
  runInNewContext(ts.transpileModule(readFileSync(path, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, {
    module, exports: module.exports, Date, console, URL, AbortSignal, setTimeout, clearTimeout, Uint8Array, atob,
    process: { env: { CRON_SECRET: "test-secret", VAPID_SUBJECT: "test", VAPID_PRIVATE_KEY: "test", NEXT_PUBLIC_VAPID_PUBLIC_KEY: "AQID" } },
    require: (name: string) => { if (!(name in imports)) throw new Error(`Unexpected import: ${name}`); return imports[name]; }, ...extra,
  });
  return module.exports;
}

function api(denied = false, mutationDenied = false) {
  const calls: unknown[][] = [];
  const query: any = {};
  for (const method of ["select", "eq", "is", "like", "order", "limit", "update"]) query[method] = (...args: unknown[]) => { calls.push([method, ...args]); return query; };
  query.then = (resolve: (value: unknown) => void) => resolve({ data: [{ endpoint: "device" }], count: 1, error: null });
  query.maybeSingle = async () => ({ data: null, error: null });
  const db = { from: (table: string) => { calls.push(["from", table]); return query; }, rpc: async (...args: unknown[]) => { calls.push(["rpc", ...args]); return { error: null }; } };
  const handler = loadModule("app/api/admin/micro-learning/route.ts", {
    "next/server": { NextResponse: { json: (body: unknown, options?: ResponseInit) => Response.json(body, options) } },
    "@/lib/dev-docs-access": { protectSourceBrowser: async () => denied ? Response.json({}, { status: 403 }) : null },
    "@/lib/api-security": { protectAdminMutation: async () => mutationDenied ? Response.json({}, { status: 403 }) : null },
    "@/lib/admin-access": { getAdminAccess: async () => ({ email: "owner@example.test", owner: true }) },
    "@/lib/supabase-server": { createServerSupabaseClient: () => db },
    "@/lib/micro-learning": learning,
    "@/lib/request-body": { readJsonLimited: (request: Request) => request.json() },
  });
  return { calls, handler };
}

test("learning API requires owner/PIN access and same-origin mutations before reading data", async () => {
  const blocked = api(true);
  assert.equal((await blocked.handler.GET(new Request("https://site.test"))).status, 403);
  assert.equal((await blocked.handler.PATCH(new Request("https://site.test", { method: "PATCH" }))).status, 403);
  assert.equal(blocked.calls.length, 0);
  const crossOrigin = api(false, true);
  assert.equal((await crossOrigin.handler.PATCH(new Request("https://site.test", { method: "PATCH" }))).status, 403);
  assert.equal(crossOrigin.calls.length, 0);
});

test("settings and history use the session identity, not a submitted user ID", async () => {
  const { handler, calls } = api();
  const request = (body: unknown) => new Request("https://site.test", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  assert.equal((await handler.PATCH(request({ action: "settings", owner_email: "attacker", settings: learning.DEFAULT_LEARNING_SETTINGS }))).status, 200);
  assert.equal((calls.find(call => call[0] === "rpc")?.[2] as any).p_owner, "owner@example.test");
  for (const field of ["learned", "favorite", "read"]) {
    assert.equal((await handler.PATCH(request({ action: "history", owner_email: "attacker", tipId: 1, field, value: true }))).status, 200);
  }
  assert.ok(calls.some(call => call[0] === "eq" && call[1] === "owner_email" && call[2] === "owner@example.test"));
  assert.equal((await handler.PATCH(request({ action: "settings", settings: { ...learning.DEFAULT_LEARNING_SETTINGS, interval_minutes: 2 } }))).status, 400);
  assert.equal((await handler.PATCH(request({ action: "history", tipId: "1", field: "favorite", value: true }))).status, 400);
});

test("cron denies unauthenticated calls and dispatches only for the configured owner", async () => {
  const owners: string[] = [];
  const route = loadModule("app/api/cron/micro-learning/route.ts", {
    "next/server": { NextResponse: { json: (body: unknown, options?: ResponseInit) => Response.json(body, options) } },
    "@/lib/micro-learning-server": { dispatchMicroLearning: async (owner: string) => { owners.push(owner); return { accepted: 1 }; } },
  });
  assert.equal((await route.GET(new Request("https://site.test"))).status, 401);
  assert.equal(owners.length, 0);
  assert.equal((await route.GET(new Request("https://site.test", { headers: { authorization: "Bearer test-secret" } }))).status, 200);
  assert.deepEqual(owners, ["contact@lecomax.com"]);
});

test("push registration reuses a device and handles denied permission", async () => {
  let permission = "granted";
  let subscribed = 0;
  let persisted = 0;
  const worker = { update: async () => {}, pushManager: { getSubscription: async () => ({ toJSON: () => ({ endpoint: "device" }) }), subscribe: async () => { subscribed++; } } };
  const browser = { isSecureContext: true, PushManager: {}, Notification: {}, atob };
  const registration = loadModule("lib/register-learning-device.ts", {}, {
    window: browser, navigator: { serviceWorker: { register: async () => worker, ready: Promise.resolve(worker) } },
    Notification: { requestPermission: async () => permission },
    localStorage: { setItem() {} },
    fetch: async () => { persisted++; return Response.json({ ok: true }); },
  });
  await registration.registerLearningDevice();
  assert.equal(subscribed, 0); assert.equal(persisted, 1);
  permission = "denied";
  await assert.rejects(registration.registerLearningDevice(), /الإشعارات غير مسموحة/);
  assert.equal(persisted, 1);
});
