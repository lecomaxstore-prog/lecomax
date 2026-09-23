import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import { DAILY_TESTS, DAILY_TEST_VERSION, gradeDailyTest } from "../app/admin/how-it-was-built/course/daily-tests.ts";
const require = createRequire(import.meta.url);
const ts = require("typescript");

function route({ denied = false, dbError = false } = {}) {
  const writes: unknown[] = [];
  const module = { exports: {} as { POST: (request: Request) => Promise<Response> } };
  const source = readFileSync(new URL("../app/api/admin/learning-completion/route.ts", import.meta.url), "utf8");
  runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, {
    module, exports: module.exports, process: { env: {} },
    require(name: string) {
      if (name === "next/server") return { NextResponse: { json: (body: unknown, init?: ResponseInit) => Response.json(body, init) } };
      if (name === "@supabase/supabase-js") return { createClient: () => ({ from: () => ({ upsert: async (data: unknown) => { writes.push(data); return { error: dbError ? {} : null }; } }) }) };
      if (name === "@/lib/dev-docs-access") return { protectSourceBrowser: async () => denied ? Response.json({}, { status: 403 }) : null };
      if (name === "@/lib/api-security") return { protectAdminMutation: async () => null };
      if (name === "@/lib/admin-access") return { getAdminAccess: async () => ({ email: "owner@example.test" }) };
      if (name === "@/lib/learning-reminder-time") return { parisLearningDay: () => ({ date: "2026-09-23" }) };
      if (name === "@/lib/request-body") return { readJsonLimited: (req: Request) => req.json() };
      if (name === "@/app/admin/how-it-was-built/course/daily-tests") return { DAILY_TEST_VERSION, gradeDailyTest };
      throw new Error("Unexpected dependency: " + name);
    },
  });
  return { writes, run: (body?: unknown) => module.exports.POST(new Request("http://localhost/api/admin/learning-completion", { method: "POST", ...(body === undefined ? {} : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }) })) };
}
const submission = { kind: "daily-test", version: DAILY_TEST_VERSION, lessonId: "website", answers: DAILY_TESTS.website.map(question => question.correctIndex) };

test("only a passing daily test records the learning day; claimed score is ignored", async () => {
  const failed = route();
  assert.equal((await failed.run({ ...submission, answers: [0, 0, 0], score: 100, passed: true })).status, 422);
  assert.equal(failed.writes.length, 0);
  const passed = route();
  assert.equal((await passed.run(submission)).status, 200);
  assert.equal(passed.writes.length, 1);
});

test("malformed tests and unauthorized requests cannot record completion", async () => {
  for (const body of [null, {}, { ...submission, answers: [] }, { ...submission, lessonId: "missing" }, { ...submission, version: 0 }]) {
    const invalid = route();
    assert.equal((await invalid.run(body)).status, 400);
    assert.equal(invalid.writes.length, 0);
  }
  const denied = route({ denied: true });
  assert.equal((await denied.run(submission)).status, 403);
  assert.equal(denied.writes.length, 0);
});

test("legacy academy completion remains supported and database failure stays visible", async () => {
  const academy = route();
  assert.equal((await academy.run()).status, 200);
  assert.equal(academy.writes.length, 1);
  assert.equal((await route({ dbError: true }).run(submission)).status, 503);
});
