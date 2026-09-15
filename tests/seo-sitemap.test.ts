import { securityIo } from "./helpers/security-io.ts";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

async function sitemap(result: { data: unknown[] | null; error: unknown }) {
  const exports: { GET?: () => Promise<Response> } = {};
  const source = readFileSync(new URL("../app/sitemap.xml/route.ts", import.meta.url), "utf8");
  vm.runInNewContext(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, {
    exports, URL,
    require(name: string) {
      const securityModule = securityIo(name); if (securityModule) return securityModule;
      if (name === "next/server") return { NextResponse: Response };
      if (name === "@/lib/seo") return { SITE_URL: "https://lecomax.com" };
      if (name === "@/lib/products") return { products: [{ slug: "old-product" }] };
      if (name === "@/lib/ecomedia-guides") return { ecomediaGuides: [] };
      if (name === "@/lib/supabase-server") return {
        createServerSupabaseClient: () => ({
          from(table: string) {
            const query = {
              select() { return query; }, eq() { return query; }, order() { return query; },
              limit() { return Promise.resolve(table === "products" ? result : { data: [], error: null }); },
            };
            return query;
          },
        }),
      };
      throw new Error(`Unexpected dependency: ${name}`);
    },
  });
  return (await exports.GET!()).text();
}

test("sitemap uses live products without resurrecting deleted bundled products", async () => {
  const xml = await sitemap({ data: [{ slug: "current-product", updated_at: "2026-09-10" }], error: null });
  assert.match(xml, /\/produit\/current-product\//);
  assert.doesNotMatch(xml, /old-product/);
  assert.match(xml, /2026-09-10T00:00:00.000Z/);
});

test("a successful empty catalogue leaves products out of the sitemap", async () => {
  assert.doesNotMatch(await sitemap({ data: [], error: null }), /\/produit\//);
});

test("a catalogue outage retains fallback discovery", async () => {
  assert.match(await sitemap({ data: null, error: { message: "Unavailable" } }), /\/produit\/old-product\//);
});
