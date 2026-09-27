import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
import { learningDestination, elementLesson } from "../lib/site-learning.ts";
const require = createRequire(import.meta.url);
const loader = require("../scripts/source-inspector-loader.cjs");

test("development markers preserve original file and line for nested elements", () => {
  const source = '"use client";\nexport default function Demo() {\n return <section>\n  <button onClick={() => 1}>Open</button>\n  <Image src="/photo.jpg" alt="Photo" />\n </section>;\n}';
  const transformed = loader.call({ rootContext: process.cwd(), resourcePath: path.join(process.cwd(), "components/Demo.tsx") }, source);
  assert.match(transformed, /"use client"/);
  assert.match(transformed, /<button[^\n]*data-source-file="components\/Demo.tsx" data-source-line="4"/);
  assert.match(transformed, /<Image[^>]*data-source-line="5"/);
  assert.match(transformed, /onClick=\{\(\) => 1\}/);
  assert.equal(loader.call({ rootContext: process.cwd(), resourcePath: path.join(process.cwd(), "app/admin/demo/page.tsx") }, source), source);
});

test("existing component markers are not duplicated", () => {
  const output = loader.call({ rootContext: process.cwd(), resourcePath: path.join(process.cwd(), "components/Header.tsx") }, '<header data-source-file="components/Header.tsx">Hello</header>');
  assert.equal(output.match(/data-source-file=/g)?.length, 1);
});

test("lesson navigation only opens supported storefront destinations", () => {
  assert.equal(learningDestination("/produit/shoe")?.file, "app/produit/[slug]/page.tsx");
  assert.equal(learningDestination("/panier/")?.file, "app/panier/page.tsx");
  for (const href of ["//evil.example", "/api/orders", "/admin/settings", "javascript:alert(1)", "/\\evil.example", "/auth/callback"]) assert.equal(learningDestination(href), null);
});

test("lessons explain purpose and practice in all three languages", () => {
  for (const lang of ["fr", "en", "ar"] as const) {
    for (const tag of ["a", "img", "button", "h1"]) {
      const lesson = elementLesson({ path: "components/Header.tsx", anchor: "", tag }, lang);
      for (const part of [lesson.title, lesson.what, lesson.why, lesson.challenge, lesson.answer]) assert.ok(part.length > 10);
    }
  }
  assert.match(elementLesson({ path: "test", anchor: "", tag: "a" }, "en").what, /href/);
});
