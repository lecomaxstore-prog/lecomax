import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import { isLibraryPath, searchLibrary } from "../scripts/source-library.mjs";
const require = createRequire(import.meta.url);
const ts = require("typescript");
function route(name: string, denied = false) {
  let reads = 0;
  const module = { exports: {} as { GET: (req: unknown) => Promise<Response> } };
  const source = readFileSync(new URL(`../app/api/dev-docs/${name}/route.ts`, import.meta.url), "utf8");
  runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, {
    module, exports: module.exports,
    require(id: string) {
      if (id === "next/server") return { NextResponse: { json: (body: unknown, init?: ResponseInit) => Response.json(body, init) } };
      if (id === "@/lib/dev-docs-access") return { protectSourceBrowser: async () => denied ? Response.json({}, { status: 403 }) : null };
      if (id === "@/scripts/source-library.mjs") return { isLibraryPath, searchLibrary };
      if (id === "@/lib/source-library") return { getSourceLibrary: async () => { reads++; return { version: 1, generatedAt: "2026-09-23", omitted: 0, files: [{ path: "app/page.tsx", content: "first\nconst cart = 1;", lines: 2, size: 21 }] }; } };
      throw new Error(id);
    },
  });
  return { run: (query = "") => module.exports.GET({ nextUrl: new URL("http://localhost/api/dev-docs/" + name + query) }), reads: () => reads };
}
test("every source endpoint authenticates before loading private code", async () => {
  for (const name of ["library", "content", "tree"]) {
    const api = route(name, true);
    assert.equal((await api.run("?path=app/page.tsx")).status, 403);
    assert.equal(api.reads(), 0);
  }
});
test("content endpoint rejects secrets and traversal and serves source without public caching", async () => {
  for (const value of [".env.local", "../package.json", "app/../../.env", "app/node_modules/x.ts"]) {
    const api = route("content");
    assert.equal((await api.run("?path=" + encodeURIComponent(value))).status, 403);
    assert.equal(api.reads(), 0);
  }
  const response = await route("content").run("?path=app/page.tsx");
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.equal((await response.json()).content, "first\nconst cart = 1;");
  assert.equal((await route("content").run("?path=app/missing.tsx")).status, 404);
});
test("full-text search returns matching line and tree uses the same snapshot", async () => {
  const response = await route("library").run("?q=cart");
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  const result = await response.json();
  assert.equal(result.results[0].line, 2);
  assert.equal(result.results[0].path, "app/page.tsx");
  assert.equal(result.results[0].content, undefined);
  const tree = await (await route("tree").run()).json();
  assert.equal(tree[0].children[0].path, "app/page.tsx");
});
