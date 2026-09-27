import test from "node:test";
import assert from "node:assert/strict";
import { inspectSourceConnections } from "../lib/source-connections.ts";
import { visibleImagePath } from "../lib/site-source-inspector.ts";

test("source evidence links actual imports, API routes and parent files with line numbers", () => {
  const file = { path: "components/Card.tsx", content: 'import { useSettings } from "@/lib/settings";\nfetch("/api/products?limit=3");\nexport default () => <img src={photo} className="rounded" />;' };
  const files = [file, { path: "lib/settings.ts", content: "" }, { path: "app/api/products/route.ts", content: "" }, { path: "app/page.tsx", content: 'import Card from "../components/Card";' }];
  const result = inspectSourceConnections(file, files, 3);
  assert.deepEqual(result.attributes.map(item => [item.name, item.expression, item.line]), [["src", "{photo}", 3], ["className", '"rounded"', 3]]);
  assert.ok(result.items.some(item => item.kind === "api" && item.target === "app/api/products/route.ts" && item.line === 2));
  assert.ok(result.items.some(item => item.kind === "parent" && item.origin === "app/page.tsx" && item.line === 1));
  assert.ok(result.items.some(item => item.kind === "import" && item.target === "lib/settings.ts"));
});

test("storage evidence ignores comments, examples in strings, unknown receivers and computed names", () => {
  const file = { path: "lib/data.ts", content: [
    '// supabase.from("fake_comment")',
    'const example = `supabase.from("fake_string")`;',
    'supabase.from("products").select("name");',
    'supabase.storage.from("photos");',
    'localStorage.setItem("cart", JSON.stringify(cart));',
    'Array.from("not_a_table");',
    'supabase.from(tableName);',
    'fetch(`${base}/rest/v1/banners?select=*`);',
    'fetch(`${base}/rest/v1/products_${region}?select=*`);',
  ].join("\n") };
  assert.deepEqual(inspectSourceConnections(file, [file]).items.map(item => [item.kind, item.name, item.line]), [
    ["table", "products", 3], ["bucket", "photos", 4], ["browser", "localStorage: cart", 5], ["table", "banners", 8],
  ]);
});

test("unavailable files are not linked and image paths exclude credentials and signed tokens", () => {
  const file = { path: "components/Test.tsx", content: 'import secret from "../.env.local";\nfetch(dynamicUrl);' };
  assert.deepEqual(inspectSourceConnections(file, [file]).items, []);
  assert.equal(visibleImagePath("https://user:password@example.com/storage/v1/object/sign/photos/a.jpg?token=private", "https://lecomax.com"), "/storage/v1/object/sign/photos/a.jpg");
  assert.equal(visibleImagePath("/_next/image?url=%2Fimages%2Fhero.jpg&w=640", "https://lecomax.com"), "/images/hero.jpg");
  assert.equal(visibleImagePath("data:image/png;base64,private", "https://lecomax.com"), undefined);
});
