import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function setup({ authenticated = true, databaseError = false, status = "pending" } = {}) {
  const writes: { row: Record<string, unknown>; options: Record<string, unknown> }[] = [];
  const exports: { POST?: (request: unknown) => Promise<Response> } = {};
  const source = readFileSync(new URL("../app/api/account/delete-request/route.ts", import.meta.url), "utf8");
  const query = {
    upsert: async (row: Record<string, unknown>, options: Record<string, unknown>) => { writes.push({ row, options }); return { error: databaseError ? new Error("offline") : null }; },
    select: () => query,
    eq: (_: string, user: string) => { assert.equal(user, "verified-user"); return query; },
    single: async () => ({ data: { status }, error: null }),
  };
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, {
    exports, console: { error: () => {} }, process: { env: {} },
    require: (name: string) => {
      if (name === "next/server") return { NextResponse: { json: (body: unknown, options: ResponseInit) => Response.json(body, options) } };
      if (name === "@/lib/request-auth") return { getCustomerUser: async () => authenticated ? { id: "verified-user", email: "owner@example.com" } : null };
      if (name === "@supabase/supabase-js") return { createClient: () => ({ from: () => query }) };
      throw Error(name);
    },
  });
  return { writes, post: (body: unknown) => exports.POST!({ json: async () => body }) };
}

for (const confirmation of [undefined, "", "REMOVE MY ACCOUNT", "remove my account ", "delete"]) {
  test(`API rejects incorrect confirmation: ${JSON.stringify(confirmation)}`, async () => {
    const { post, writes } = setup();
    assert.equal((await post({ confirmation })).status, 400);
    assert.equal(writes.length, 0);
  });
}
test("confirmation cannot bypass authentication", async () => {
  const { post, writes } = setup({ authenticated: false });
  assert.equal((await post({ confirmation: "remove my account" })).status, 401);
  assert.equal(writes.length, 0);
});
test("valid confirmation uses verified identity and preserves existing requests", async () => {
  const { post, writes } = setup({ status: "processing" });
  const response = await post({ confirmation: "remove my account", user_id: "someone-else" });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).status, "processing");
  assert.equal(writes[0].row.user_id, "verified-user");
  assert.equal(writes[0].options.ignoreDuplicates, true);
  assert.equal(writes[0].row.resolved_at, undefined);
});
test("database failure never reports success", async () => {
  const { post } = setup({ databaseError: true });
  assert.equal((await post({ confirmation: "remove my account" })).status, 500);
});
