import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { parisLearningDay } from "../lib/learning-reminder-time.ts";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";

const require = createRequire(import.meta.url);
const ts = require("typescript");

function reminderRoute(options: { hour?: number; devices?: boolean; claimed?: boolean; lookupError?: boolean; deliveryError?: boolean } = {}) {
  const calls: { claims: number; deliveries: unknown[][]; filters: unknown[][] } = { claims: 0, deliveries: [], filters: [] };
  const query = {
    select: () => query,
    eq: (...args: unknown[]) => { calls.filters.push(args); return query; },
    limit: async () => ({ data: options.devices === false ? [] : [{ endpoint: "owner-device" }], error: options.lookupError ? {} : null }),
  };
  const module = { exports: {} as { GET: (request: Request) => Promise<Response> } };
  const source = readFileSync(new URL("../app/api/cron/learning-reminder/route.ts", import.meta.url), "utf8");
  runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, {
    module, exports: module.exports,
    process: { env: { CRON_SECRET: "test-secret", ADMIN_EMAIL: " Owner@Example.Test " } },
    require(name: string) {
      if (name === "next/server") return { NextResponse: { json: (body: unknown, init?: ResponseInit) => Response.json(body, init) } };
      if (name === "@/lib/learning-reminder-time") return { parisLearningDay: () => ({ hour: options.hour ?? 21, date: "2026-09-22" }) };
      if (name === "@supabase/supabase-js") return { createClient: () => ({ from: () => query, rpc: async () => { calls.claims++; return { data: options.claimed !== false, error: null }; } }) };
      if (name === "@/lib/push-notifications") return { broadcastAdminPushNotification: async (...args: unknown[]) => {
        calls.deliveries.push(args);
        if (options.deliveryError) throw new Error("uncertain delivery");
        return { sent: 1, failed: 0 };
      } };
      throw new Error(`Unexpected import ${name}`);
    },
  });
  return { calls, run: (authorized = true) => module.exports.GET(new Request("https://example.test/api/cron/learning-reminder", { headers: authorized ? { authorization: "Bearer test-secret" } : {} })) };
}

test("reminders require cron authorization and the Paris evening hour", async () => {
  const unauthorized = reminderRoute();
  assert.equal((await unauthorized.run(false)).status, 401);
  assert.equal(unauthorized.calls.claims, 0);
  const early = reminderRoute({ hour: 20 });
  assert.equal((await (await early.run()).json()).skipped, "outside-evening-hour");
  assert.equal(early.calls.claims, 0);
});

test("missing devices, failed lookups and previously claimed days never send", async () => {
  for (const options of [{ devices: false }, { lookupError: true }, { claimed: false }]) {
    const route = reminderRoute(options);
    await route.run();
    assert.equal(route.calls.deliveries.length, 0);
    assert.equal(route.calls.claims, "claimed" in options ? 1 : 0);
  }
});

test("reminders target the normalized owner and do not retry uncertain deliveries", async () => {
  const route = reminderRoute();
  assert.equal((await route.run()).status, 200);
  assert.equal(route.calls.deliveries[0][2], "owner@example.test");
  assert.deepEqual(route.calls.filters, [["admin_email", "owner@example.test"]]);
  const failed = reminderRoute({ deliveryError: true });
  assert.equal((await failed.run()).status, 502);
  assert.equal(failed.calls.claims, 1);
  assert.equal(failed.calls.deliveries.length, 1);
});

test("Paris reminder hour follows summer, winter and clock-change dates", () => {
  for (const value of ["2026-09-23T19:00:00Z", "2026-12-23T20:00:00Z", "2026-03-29T19:00:00Z", "2026-10-25T20:00:00Z"]) {
    assert.equal(parisLearningDay(new Date(value)).hour, 21);
  }
  assert.equal(parisLearningDay(new Date("2026-09-23T20:00:00Z")).hour, 22);
  assert.equal(parisLearningDay(new Date("2026-12-23T19:00:00Z")).hour, 20);
  assert.equal(parisLearningDay(new Date("2026-09-23T22:30:00Z")).date, "2026-09-24");
});

test("daily reminder claims skip completed lessons and prevent duplicate sends", async () => {
  const db = new PGlite();
  try {
    await db.exec("create role anon; create role authenticated; create role service_role; create table push_subscriptions(endpoint text primary key);");
    await db.exec(readFileSync(new URL("../supabase/migrations/20260922210000_learning_reminders.sql", import.meta.url), "utf8"));
    const claim = async (day: string) => (await db.query<{ claimed: boolean }>(
      "select claim_learning_reminder('owner@example.test', $1::date) as claimed", [day],
    )).rows[0].claimed;
    await db.exec("insert into owner_learning_days(owner_email, learning_date, completed_at) values ('owner@example.test', '2026-09-23', now());");
    assert.equal(await claim("2026-09-23"), false);
    assert.equal(await claim("2026-09-24"), true);
    assert.equal(await claim("2026-09-24"), false);
    assert.equal(await claim("2026-09-25"), true);
    await db.exec("set role anon;");
    await assert.rejects(db.query("select * from owner_learning_days"), /permission denied/);
    await assert.rejects(db.query("select claim_learning_reminder('owner@example.test', '2026-09-26')"), /permission denied/);
  } finally { await db.close(); }
});
