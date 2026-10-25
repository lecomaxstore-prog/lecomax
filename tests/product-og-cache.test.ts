import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
function harness() {
  let renders = 0;
  let fail = false;
  const entries = new Map<string, string>();
  const exports: any = {};
  vm.runInNewContext(ts.transpileModule(readFileSync(new URL("../lib/product-og-cache.ts", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, {
    exports, Buffer,
    require(name: string) {
      if (name === "server-only") return {};
      if (name === "next/cache") return { unstable_cache(fn: (...args: string[]) => Promise<string>) {
        return async (...args: string[]) => {
          const key = JSON.stringify(args);
          if (entries.has(key)) return entries.get(key);
          const result = await fn(...args);
          entries.set(key, result);
          return result;
        };
      } };
      if (name === "./product-og-renderer") return { async renderProductOgImage(product: unknown) {
        renders++;
        if (fail) throw new Error("render failed");
        return new Response(JSON.stringify(product));
      } };
      return require(name);
    },
  });
  return { png: exports.getProductOgPng, renders: () => renders, fail: (value: boolean) => { fail = value; } };
}
const product = { slug: "shoe", name: "Shoe", description: "Description", category: "shoes", price: 99,
  stock: 10, image: "/shoe.jpg", imageUrl: "https://example.test/shoe.jpg" };

test("concurrent requests share rendering and invisible changes reuse the final PNG", async () => {
  const h = harness();
  const images = await Promise.all(Array.from({ length: 10 }, () => h.png(product)));
  assert.equal(h.renders(), 1);
  assert.deepEqual(await h.png({ ...product, stock: 9, description: "Updated" }), images[0]);
  assert.equal(h.renders(), 1);
});

test("visible product changes get distinct artwork", async () => {
  const h = harness();
  const original = await h.png(product);
  for (const change of [{ price: 89 }, { stock: 0 }, { stock: undefined }, { stock: 0, preorderEnabled: true }, { name: "New name" }, { image: "/new.jpg", imageUrl: "https://example.test/new.jpg" }]) {
    assert.notDeepEqual(await h.png({ ...product, ...change }), original);
  }
  assert.equal(h.renders(), 7);
});

test("a failed render is retried, never retained as an in-flight or successful cache entry", async () => {
  const h = harness();
  h.fail(true);
  await assert.rejects(h.png(product), /render failed/);
  h.fail(false);
  await h.png(product);
  assert.equal(h.renders(), 2);
});
