import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import ts from "typescript";
import { validSeoContent, sourceChanged, seoPath, fallbackSeo, plainText } from "../lib/seo-engine.ts";

function load(file: string, mocks: Record<string, unknown>, env = {}, fetcher: unknown = fetch) {
  const exports: any = {};
  const code = ts.transpileModule(readFileSync(file, "utf8"), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
  new Function("exports", "require", "process", "fetch", code)(exports, (name: string) => {
    if (name === "server-only") return {};
    if (name === "next/server") return { NextResponse: Response };
    if (!(name in mocks)) throw Error(name);
    return mocks[name];
  }, { env }, fetcher);
  return exports;
}
const content = { title: "Casque | L'ecomax Maroc", description: "Consultez la fiche du casque au Maroc.", imageAlt: "Casque" };
function api(options: { permissions?: string[]; blocked?: number; rpcError?: string; version?: number; draft?: boolean; stale?: boolean; provider?: string } = {}) {
  let writes = 0, generations = 0;
  const doc = { kind: "product", entity_id: "1", version: options.version ?? 1, slug: "casque", source: { name: "Casque", slug: "casque" } };
  const stored = { ...doc, draft: options.draft ? content : null, draft_source: options.draft ? { ...doc.source, name: options.stale ? "Old" : doc.source.name } : null, provider: options.provider ?? "ai" };
  const db = { from() { const q: any = { select: () => q, eq: () => q, maybeSingle: async () => ({ data: stored, error: null }) }; return q; }, async rpc() { writes++; return { data: doc, error: options.rpcError ? { message: options.rpcError } : null }; } };
  const handler = load("app/api/admin/seo/route.ts", {
    "next/cache": { revalidatePath() {}, revalidateTag() {} },
    "@/lib/api-security": { protectAdminMutation: async () => options.blocked ? Response.json({}, { status: options.blocked }) : null, protectAdminRead: async () => null },
    "@/lib/admin-access": { getAdminAccess: async () => ({ email: "staff@example.invalid", owner: false, permissions: options.permissions ?? ["products.edit"] }) },
    "@/lib/admin-policy": { hasAdminPermission: (a: any, p: string) => a.permissions.includes(p) },
    "@/lib/supabase-server": { createServerSupabaseClient: () => db },
    "@/lib/request-body": { readJsonLimited: (req: Request) => req.json() },
    "@/lib/seo-engine": { validSeoContent, sourceChanged, seoPath },
    "@/lib/seo-ai": { suggestSeo: async () => { generations++; return { content, provider: "deterministic" }; } },
  });
  return { ...handler, writes: () => writes, generations: () => generations };
}
const request = (extra = {}) => new Request("https://lecomax.com/api/admin/seo", { method: "POST", body: JSON.stringify({ kind: "product", id: "1", version: 1, action: "generate", ...extra }) });
test("current AI and manual drafts are reused without generation or writes; stale drafts regenerate", async () => {
  for (const provider of ["ai", "manual"]) {
    const r = api({ draft: true, provider });
    const response = await r.POST(request({ useAI: false }));
    assert.equal((await response.json()).reused, true);
    assert.equal(r.generations(), 0); assert.equal(r.writes(), 0);
  }
  const stale = api({ draft: true, stale: true });
  assert.equal((await stale.POST(request({ useAI: false }))).status, 200);
  assert.equal(stale.generations(), 1);
});
test("auth, origin and rate limits block generation and storage", async () => {
  for (const blocked of [401,403,429]) { const r = api({ blocked }); assert.equal((await r.POST(request())).status, blocked); assert.equal(r.writes(),0); assert.equal(r.generations(),0); }
});
test("view-only staff and product editors cannot edit categories", async () => {
  for (const [permissions,kind] of [[["products.view"],"product"],[["products.edit"],"category"]] as const) {
    const r=api({permissions:[...permissions]});assert.equal((await r.POST(request({kind}))).status,403);assert.equal(r.writes(),0);
  }
});
test("invalid drafts and outdated generation requests are rejected before AI", async () => {
  const r=api();assert.equal((await r.POST(request({action:"draft",content:{...content,title:"<bad>"}}))).status,400);
  const stale=api({version:2});assert.equal((await stale.POST(request())).status,409);assert.equal(stale.generations(),0);
});
test("draft generation persists and conflicts have a safe response", async () => {
  const r=api();const response=await r.POST(request());assert.equal(response.status,200);assert.equal(r.writes(),1);assert.equal(response.headers.get('Cache-Control'),'private, no-store');
  for(const rpcError of ['SEO_CONFLICT','SEO_SOURCE_CHANGED','SEO_EDITORIAL_WORKFLOW_REQUIRED'])assert.equal((await api({rpcError}).POST(request({action:'approve'}))).status,409);
  const failure=await api({rpcError:'secret database failure'}).POST(request());assert.equal(failure.status,503);assert.doesNotMatch(await failure.text(),/secret database/);
});
test("AI absent, unavailable or malformed returns factual deterministic fallback",async()=>{
  for(const mode of ['absent','failure','invalid']) {
    const r=load('lib/seo-ai.ts',{'./seo-engine':{fallbackSeo,plainText}},mode==='absent'?{}:{SEO_AI_API_KEY:'private-key',SEO_AI_MODEL:'model',SEO_AI_BASE_URL:'https://provider.invalid/v1'},async()=>{if(mode==='failure')throw Error('private-key');return Response.json({choices:[{message:{content:'{"title":"invented"}'}}]});});
    const result=await r.suggestSeo({name:'Casque',slug:'casque'},'product',true);
    assert.equal(result.provider,'deterministic');assert.ok(result.warning);assert.doesNotMatch(JSON.stringify(result),/private-key/);
  }
});
test("legacy synchronous AI entry never makes paid requests", async () => {
  for (const excerpt of ["Connexion Bluetooth intégrée.", "Livraison gratuite et garantie à vie."]) {
    const r = load("lib/seo-ai.ts", { "./seo-engine": { fallbackSeo, plainText } },
      { SEO_AI_API_KEY: "private-key", SEO_AI_MODEL: "model", SEO_AI_BASE_URL: "https://provider.invalid/v1" },
      async () => Response.json({ choices: [{ message: { content: JSON.stringify({ excerpt }) } }] }));
    const result = await r.suggestSeo({ name: "Casque", slug: "casque", description: "Connexion Bluetooth intégrée. Port USB." }, "product", true);
    assert.equal(result.provider, "deterministic");
    assert.doesNotMatch(result.content.description, /gratuite|garantie/);
  }
});
