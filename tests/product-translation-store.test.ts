import assert from "node:assert/strict";
import test from "node:test";
import { ensureProductTranslation } from "../lib/product-translation-store.ts";

function setup(t: any, options: { missingTable?: boolean; missingRpc?: boolean; failedSaves?: number } = {}) {
  const original = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = "test";
  t.after(() => { if (original === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = original; });
  let generations = 0;
  let writes = 0;
  const rows = new Map<string, any>();
  const key = (match: any) => [match.product_id, match.locale, match.source_hash].join(":");
  const db: any = {
    from() {
      let match: any;
      let update: any;
      const query: any = {
        select: () => query,
        match: (value: any) => { match = value; return query; },
        update: (value: any) => { update = value; return query; },
        maybeSingle: async () => ({ data: rows.get(key(match)), error: options.missingTable ? { code: "PGRST205" } : null }),
        single: async () => {
          writes++;
          if (writes <= (options.failedSaves ?? 0)) return { error: { code: "503" } };
          rows.set(key(match), { ...rows.get(key(match)), ...update });
          return { data: rows.get(key(match)), error: null };
        },
      };
      return query;
    },
    async rpc(_name: string, args: any) {
      if (options.missingRpc) return { error: { code: "PGRST202" } };
      const rowKey = key({ product_id: args.p_product_id, locale: args.p_locale, source_hash: args.p_source_hash });
      if (rows.has(rowKey)) return { data: false };
      rows.set(rowKey, { status: "pending", retry_after: new Date(Date.now() + 90000).toISOString() });
      return { data: true };
    },
  };
  t.mock.method(globalThis, "fetch", async () => {
    generations++;
    await new Promise(resolve => setTimeout(resolve, 10));
    return Response.json({ status: "completed", output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify({ description: "A cotton jacket with 2 pockets" }) }] }] });
  });
  return { db, rows, calls: () => generations, writes: () => writes };
}
const product = { id: "id", name: "Veste", description: "Une veste en coton avec 2 poches" };

test("concurrent visitors share one generation; subsequent visits reuse durable rows", async t => {
  const api = setup(t);
  const results = await Promise.all(Array.from({ length: 5 }, () => ensureProductTranslation(api.db, product, "en")));
  assert.equal(results.filter(result => result.status === "ready").length, 1);
  assert.equal(api.calls(), 1);
  assert.equal((await ensureProductTranslation(api.db, product, "en")).status, "ready");
  assert.equal((await ensureProductTranslation(api.db, product, "en", false)).status, "ready");
  assert.equal(api.calls(), 1);
  await ensureProductTranslation(api.db, { ...product, description: "Une nouvelle veste en coton avec 2 poches" }, "en");
  assert.equal(api.calls(), 2);
});

test("storage or locking failures never spend on OpenAI", async t => {
  for (const option of [{ missingTable: true }, { missingRpc: true }]) {
    const api = setup(t, option);
    await assert.rejects(ensureProductTranslation(api.db, product, "en"), /unavailable/);
    assert.equal(api.calls(), 0);
  }
});

test("transient persistence failures retry saving, not translation", async t => {
  const api = setup(t, { failedSaves: 2 });
  assert.equal((await ensureProductTranslation(api.db, product, "en")).status, "ready");
  assert.equal(api.writes(), 3);
  assert.equal(api.calls(), 1);
});

test("failed persistence is not reported as a saved translation", async t => {
  const api = setup(t, { failedSaves: 3 });
  await assert.rejects(ensureProductTranslation(api.db, product, "en"), /persistence/);
  assert.equal((await ensureProductTranslation(api.db, product, "en")).status, "pending");
  assert.equal(api.calls(), 1);
});
