import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

function load(path: string, dependencies: Record<string, unknown>) {
  const exports: any = {};
  vm.runInNewContext(ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, { exports, require: (name: string) => dependencies[name] ?? {} });
  return exports;
}

test("database failures propagate through product metadata instead of becoming cacheable 404s", async () => {
  let result: { data: unknown; error: unknown } = { data: null, error: new Error("database unavailable") };
  const query = { select: () => query, eq: () => query, maybeSingle: async () => result };
  const db = load("../lib/db-server.ts", {
    react: { cache: (fn: unknown) => fn },
    "next/cache": { unstable_cache: (fn: unknown) => fn },
    "./supabase-server": { createPublicSupabaseClient: () => ({ from: () => query }) },
  });
  const share = load("../lib/product-share.ts", { "./db-server": db });
  await assert.rejects(db.getDbProductRaw("shoe"), /database unavailable/);
  await assert.rejects(share.getProductShareData("shoe"), /database unavailable/);
  result = { data: null, error: null };
  assert.equal(await share.getProductShareData("missing"), null);
  result = { data: { active: false }, error: null };
  assert.equal(await share.getProductShareData("hidden"), null);
});
