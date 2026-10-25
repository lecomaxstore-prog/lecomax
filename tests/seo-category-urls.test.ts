import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import { seoPath, fallbackSeo } from "../lib/seo-engine.ts";
import { serializeJsonLd } from "../lib/seo.ts";

function pageFixture(slug: string, cms = false) {
  const exports: any = {};
  const element = (type: unknown, props: unknown) => ({ type, props });
  const source = readFileSync(new URL("../app/[category]/page.tsx", import.meta.url), "utf8");
  vm.runInNewContext(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, {
    exports,
    require(name: string) {
      if (name === "react") return { cache: (fn: unknown) => fn };
      if (name === "react/jsx-runtime") return { jsx: element, jsxs: element };
      if (name === "next/navigation") return { notFound() { throw Error("NOT_FOUND"); } };
      if (name === "@/lib/seo-engine") return { seoPath };
      if (name === "@/lib/seo") return { serializeJsonLd };
      if (name === "@/lib/products") return { categories: [], subCategoriesFor: () => [] };
      if (name === "@/lib/db-server") return { getDbProducts: async () => [], getReviewStats: async () => ({}) };
      if (name === "@/lib/seo-store") return { getSeoContent: async (_kind: string, data: any) => fallbackSeo(data, "category") };
      if (name === "@/lib/shipping-config-server") return { getServerShippingConfig: async () => ({ cost: 40 }) };
      if (name === "@/lib/shipping-config") return { formatShippingAmount: () => "40" };
      if (name === "@/lib/supabase-server") return { createPublicSupabaseClient: () => ({
        from(table: string) {
          const query: any = {
            select() { return query; }, eq() { return query; },
            async maybeSingle() {
              return { data: table === "categories" && !cms ? { slug, name: "Fixture", description: "Fixture", image: "/fixture.jpg" }
                : table === "pages" && cms ? { slug, title: "Fixture CMS" } : null };
            },
          };
          return query;
        },
      }) };
      return {};
    },
  });
  return exports;
}

for (const slug of ["accessoires", "été", "أحذية", "offers?sort=new#top", "part/one", "literal%2Fvalue"]) {
  test(`category and CMS metadata preserve one slug segment: ${slug}`, async () => {
    const expected = `https://lecomax.com/${encodeURIComponent(slug)}/`;
    for (const cms of [false, true]) {
      const metadata = await pageFixture(slug, cms).generateMetadata({ params: Promise.resolve({ category: slug }) });
      assert.equal(metadata.alternates.canonical, expected);
      assert.equal(metadata.openGraph.url, expected);
      const url = new URL(metadata.alternates.canonical);
      assert.equal(url.search, "");
      assert.equal(url.hash, "");
      assert.equal(decodeURIComponent(url.pathname.slice(1, -1)), slug);
    }
  });
}

test("category JSON-LD uses the same encoded canonical as metadata and sitemap", async () => {
  const slug = "été?lang=ar#أحذية", fixture = pageFixture(slug);
  const props = { params: Promise.resolve({ category: slug }) };
  const metadata = await fixture.generateMetadata(props);
  const tree = await fixture.default(props);
  const scripts: any[] = [];
  function visit(node: any) {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) { node.forEach(visit); return; }
    if (node.type === "script") scripts.push(JSON.parse(node.props.dangerouslySetInnerHTML.__html));
    visit(node.props?.children);
  }
  visit(tree);
  const breadcrumb = scripts.find(s => s["@type"] === "BreadcrumbList");
  const collection = scripts.find(s => s["@type"] === "CollectionPage");
  assert.equal(collection.url, metadata.alternates.canonical);
  assert.equal(breadcrumb.itemListElement[1].item, collection.url);
  assert.equal(collection.breadcrumb["@id"], `${collection.url}#breadcrumb`);
  assert.equal(breadcrumb["@id"], collection.breadcrumb["@id"]);
  assert.equal(collection.url, `https://lecomax.com/${encodeURIComponent(slug)}/`);
});
