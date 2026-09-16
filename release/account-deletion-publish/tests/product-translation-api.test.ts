import { securityIo } from "./helpers/security-io.ts";
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import { ProductTranslationCache } from "../lib/product-translation-cache.ts";
import { translationFingerprint, MAX_TRANSLATION_SOURCE } from "../lib/product-translation.ts";

function setup(options: { missingTable?: boolean; missingRpc?: boolean; pending?: boolean; hidden?: boolean } = {}) {
  const generated: string[] = [];
  const claims: any[] = [];
  const product = { id: "id", name: "Jordan", brand: "Jordan", description: "Une poche kangourou" };
  const db = {
    from(table: string) {
      const query: any = {
        select: () => query, eq: () => query, match: () => query, update: () => query,
        maybeSingle: async () => table === "products"
          ? { data: options.hidden ? null : product, error: null }
          : { data: options.pending ? { status: "pending", retry_after: new Date(Date.now() + 90000).toISOString() } : null, error: options.missingTable ? { code: "PGRST205" } : null },
      };
      return query;
    },
    async rpc(_name: string, args: unknown) {
      claims.push(args);
      return { data: true, error: options.missingRpc ? { code: "PGRST202" } : null };
    },
  };
  const mocks: Record<string, unknown> = {
    "next/server": { NextResponse: { json: (body: unknown, init: ResponseInit) => Response.json(body, init) } },
    "@supabase/supabase-js": { createClient: () => db },
    "@/lib/api-security": { enforceRateLimit: () => null },
    "@/lib/product-translation-cache": { ProductTranslationCache },
    "@/lib/product-translation": {
      translationFingerprint, MAX_TRANSLATION_SOURCE,
      generateProductTranslation: async (input: any) => { generated.push(input.locale); return { description: input.locale === "fr" ? "Une poche kangourou" : "A kangaroo pocket", model: "test" }; },
    },
  };
  const exports: any = {};
  vm.runInNewContext(ts.transpileModule(readFileSync("app/api/product-translations/route.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, {
    exports, console, process: { env: { NEXT_PUBLIC_SUPABASE_URL: "https://example.invalid", SUPABASE_SERVICE_ROLE_KEY: "test", GROQ_API_KEY: "test" } },
    require: (name: string) => {
      const securityModule = securityIo(name); if (securityModule) return securityModule; if (!(name in mocks)) throw new Error(name); return mocks[name]; },
  });
  return {
    generated, claims, product,
    request: (method: string, locale = "en") => exports[method]({ nextUrl: new URL(`https://example.invalid/api/product-translations?slug=jordan&locale=${locale}`) }),
  };
}

test("missing translation table no longer prevents translation, caching or source edits", async () => {
  const api = setup({ missingTable: true });
  assert.equal((await (await api.request("GET")).json()).status, "missing");
  assert.equal((await (await api.request("POST")).json()).description, "A kangaroo pocket");
  assert.equal((await (await api.request("GET")).json()).status, "ready");
  assert.equal((await (await api.request("POST", "fr")).json()).locale, "fr");
  assert.deepEqual(api.generated, ["en", "fr"]);
  api.product.description = "Une nouvelle description";
  assert.equal((await (await api.request("GET")).json()).status, "missing");
  assert.equal(api.claims.length, 0);
});

test("pending requests poll without generating or claiming again", async () => {
  const api = setup({ pending: true });
  for (const method of ["GET", "POST"]) {
    const response = await api.request(method);
    assert.equal(response.status, 202);
    assert.equal((await response.json()).status, "pending");
  }
  assert.equal(api.generated.length, 0);
  assert.equal(api.claims.length, 0);
});

test("missing bilingual RPC uses fallback; invalid locales and unpublished products cannot generate", async () => {
  const api = setup({ missingRpc: true });
  assert.equal((await api.request("POST", "fr")).status, 200);
  assert.equal(api.claims[0].p_locale, "fr");
  assert.equal((await api.request("POST", "de")).status, 400);
  const hidden = setup({ hidden: true });
  assert.equal((await hidden.request("POST")).status, 404);
  assert.equal(hidden.generated.length, 0);
});
