import { securityIo } from "./helpers/security-io.ts";
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

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

    "@/lib/product-translation-store": {
      ensureProductTranslation: async (_db: unknown, _product: unknown, locale: string, generate = true) => {
        if (options.missingTable || options.missingRpc) throw new Error("Storage unavailable");
        if (options.pending) return { status: "pending" };
        if (!generate) return { status: "missing" };
        generated.push(locale);
        return { status: "ready", locale, description: locale === "fr" ? "Une poche kangourou" : "A kangaroo pocket" };
      },
    },
  };
  const exports: any = {};
  vm.runInNewContext(ts.transpileModule(readFileSync("app/api/product-translations/route.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, {
    exports, console, process: { env: { NEXT_PUBLIC_SUPABASE_URL: "https://example.invalid", SUPABASE_SERVICE_ROLE_KEY: "test", OPENAI_API_KEY: "test" } },
    require: (name: string) => {
      const securityModule = securityIo(name); if (securityModule) return securityModule; if (!(name in mocks)) throw new Error(name); return mocks[name]; },
  });
  return {
    generated, claims, product,
    request: (method: string, locale = "en") => exports[method]({ nextUrl: new URL(`https://example.invalid/api/product-translations?slug=jordan&locale=${locale}`) }),
  };
}

test("missing storage returns an error without generating", async () => {
  for (const options of [{ missingTable: true }, { missingRpc: true }]) {
    const api = setup(options);
    assert.equal((await api.request("POST")).status, 503);
    assert.equal(api.generated.length, 0);
  }
});

test("pending translations return 202 without generation", async () => {
  const api = setup({ pending: true });
  for (const method of ["GET", "POST"]) {
    const response = await api.request(method);
    assert.equal(response.status, 202);
    assert.equal((await response.json()).status, "pending");
  }
  assert.equal(api.generated.length, 0);
});

test("only POST generates; invalid languages and hidden products are rejected", async () => {
  const api = setup();
  assert.equal((await (await api.request("GET")).json()).status, "missing");
  assert.equal(api.generated.length, 0);
  assert.equal((await (await api.request("POST", "fr")).json()).locale, "fr");
  assert.deepEqual(api.generated, ["fr"]);
  assert.equal((await api.request("POST", "de")).status, 400);
  const hidden = setup({ hidden: true });
  assert.equal((await hidden.request("POST")).status, 404);
  assert.equal(hidden.generated.length, 0);
});
