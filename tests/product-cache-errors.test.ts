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

test("storefront settings use the public cache and recover after a failed read", async () => {
  const failure = new Error("settings unavailable");
  let result: { data: unknown; error: unknown } = { data: null, error: failure };
  const query = { select: () => query, in: async () => result };
  const settings = load("../lib/storefront-settings-server.ts", {
    react: { cache: (fn: unknown) => fn },
    "next/cache": { unstable_cache: () => { throw new Error("unexpected background cache wrapper"); } },
    "./supabase-server": {
      createPublicSupabaseClient: (tags: string[]) => {
        assert.deepEqual(Array.from(tags), ["store-settings"]);
        return { from: () => query };
      },
    },
  });
  await assert.rejects(settings.getStorefrontSettings(), failure);
  result = { data: [{ key: "store_name", value: "Updated store" }, { key: "shipping_cost", value: 25 }], error: null };
  assert.equal(JSON.stringify(await settings.getStorefrontSettings()), JSON.stringify({ store_name: "Updated store", shipping_cost: "25" }));
});

test("review stats recover after an outage without a background cache exception", async () => {
  let result: { data: unknown; error: unknown } = { data: null, error: new Error("offline") };
  const query = { select: () => query, eq: async () => result };
  const db = load("../lib/db-server.ts", {
    react: { cache: (fn: unknown) => fn },
    "next/cache": { unstable_cache: () => { throw new Error("unexpected background cache wrapper"); } },
    "./supabase-server": {
      createPublicSupabaseClient: (tags: string[]) => {
        assert.deepEqual(Array.from(tags), ["storefront-reviews"]);
        return { from: () => query };
      },
    },
  });
  assert.equal(JSON.stringify(await db.getReviewStats()), "{}");
  result = { data: [{ product_slug: "shoe", rating: 4 }, { product_slug: "shoe", rating: 5 }], error: null };
  assert.equal(JSON.stringify(await db.getReviewStats()), JSON.stringify({ shoe: { rating: 4.5, count: 2 } }));
});

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
