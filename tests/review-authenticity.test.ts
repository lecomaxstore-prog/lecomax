import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

function loadRoute(file: string, rows: Record<string, unknown>[] = []) {
  const response = { json: (body: unknown, options?: { status?: number }) => ({ body, status: options?.status ?? 200 }) };
  const query: Record<string, any> = {
    select: () => query, eq: () => query, order: () => query,
    then: (resolve: (result: unknown) => unknown) => Promise.resolve({ data: rows, error: null }).then(resolve),
  };
  const require = (name: string) => {
    if (name === "next/server") return { NextResponse: response };
    if (name === "@supabase/supabase-js") return { createClient: () => ({ from: () => query }) };
    return {};
  };
  const code = ts.transpileModule(readFileSync(new URL(`../${file}`, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} as Record<string, any> };
  new Function("require", "module", "exports", code)(require, module, module.exports);
  return module.exports;
}

test("public reviews exclude manual and legacy reviews without purchase verification", async () => {
  const route = loadRoute("app/api/reviews/route.ts", [
    { id: "customer", rating: 3, verified_purchase: true },
    { id: "manual", rating: 5, verified_purchase: false },
    { id: "legacy", rating: 5 },
  ]);
  const result = await route.GET({ nextUrl: new URL("https://example.test/api/reviews?slug=shoe") });
  assert.deepEqual(result.body.reviews, [{ id: "customer", rating: 3, verified_purchase: true }]);
});

test("AI and manual review creation are disabled", async () => {
  for (const file of ["app/api/ai-review/route.ts", "app/api/reviews/admin/route.ts", "app/api/trustpilot-featured/route.ts"]) {
    assert.equal((await loadRoute(file).POST()).status, 410);
  }
});

test("manually authored Trustpilot entries are not published", async () => {
  const route = loadRoute("app/api/trustpilot-featured/route.ts");
  assert.deepEqual((await route.GET()).body, { reviews: [] });
});
