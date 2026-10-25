import test from "node:test";
import assert from "node:assert/strict";
import { fallbackSeo, validSeoContent, auditSeo, auditCatalogue, sourceChanged, internalLinks, seoSlug, seoPath, type SeoDocument } from "../lib/seo-engine.ts";

const source = { name: "Écouteurs", slug: "ecouteurs", description: "<p>Bluetooth &amp; USB</p>", category: "accessoires", images: ["/photo.jpg"] };
const doc: SeoDocument = { kind: "product", entity_id: "1", slug: source.slug, active: true, source, fallback: fallbackSeo(source), draft: null, published: null, draft_source: null, published_source: null, version: 1, updated_at: "2026-10-18T00:00:00Z", published_at: null, provider: null };
test("duplicate audits agree for canonical French and Arabic Unicode without merging distinct words", () => {
  for (const title of ["Écouteurs", "أحذية"]) {
    const first = {...doc, published: {...doc.fallback, title, description: title}};
    const second = {...first, entity_id: "2", published: {...first.published, title: title.normalize("NFD"), description: title.normalize("NFD")}};
    const documents = [first, second];
    const batch = auditCatalogue(documents);
    for (const item of documents) {
      assert.deepEqual(batch.get(`product:${item.entity_id}`), auditSeo(item, documents));
      assert.ok(batch.get(`product:${item.entity_id}`)!.includes("Titre dupliqué"));
      assert.ok(batch.get(`product:${item.entity_id}`)!.includes("Description dupliquée"));
    }
    assert.ok(!auditSeo(first, [first, {...second, active: false}]).includes("Titre dupliqué"));
    const distinct = {...second, published: {...second.published, title: title.normalize("NFD").replace(/\p{M}/gu, "")}};
    assert.ok(!auditSeo(first, [first, distinct]).includes("Titre dupliqué"));
  }
});
test("related categories may share a product ID while self and inactive links remain excluded", () => {
  const category = {...doc, kind: "category" as const, slug: "accessoires"};
  assert.deepEqual(internalLinks(doc, [doc, category, {...category, entity_id: "2", active: false}]), [{name: source.name, path: "/accessoires/"}]);
});
test("fallback is deterministic, French and factual without inventing commercial data", () => {
  const result = fallbackSeo(source);
  assert.deepEqual(result, fallbackSeo(source));
  assert.match(result.description, /Bluetooth & USB/);
  assert.doesNotMatch(result.description, /<|stock|livraison|garanti|MAD|étoile/);
  assert.equal(result.imageAlt, source.name);
  assert.ok(validSeoContent(result));
});
test("metadata validates shape, HTML, control characters and limits", () => {
  for(const value of [null, {}, {...doc.fallback,title:" "}, {...doc.fallback,description:"<script>"}, {...doc.fallback,title:"x".repeat(141)}, {...doc.fallback,title:"a\nb"}, {...doc.fallback,secret:"no"}]) assert.equal(validSeoContent(value),false);
});
test("audit finds duplicates and stale approved content; drafts stay private", () => {
  const other={...doc,entity_id:"2",slug:"autre"};
  assert.ok(auditSeo(doc,[doc,other]).includes("Titre dupliqué"));
  assert.ok(auditSeo({...doc,published:doc.fallback,published_source:{...source,name:"Ancien"}},[doc]).some(issue=>issue.includes("revalider")));
  assert.equal(sourceChanged({...source},source),false);
  assert.equal(sourceChanged({...source,images:[]},source),true);
});
test("internal recommendations only link active related entries and URLs are encoded", () => {
  const category={...doc,kind:"category" as const,entity_id:"c",slug:"accessoires"};
  assert.deepEqual(internalLinks(doc,[doc,category,{...doc,entity_id:"2",active:false}]),[{name:source.name,path:"/accessoires/"}]);
  assert.equal(seoSlug("Écouteurs & Étui"),"ecouteurs-etui");
  assert.equal(seoPath("product","test?x=1"),"/produit/test%3Fx%3D1/");
});
