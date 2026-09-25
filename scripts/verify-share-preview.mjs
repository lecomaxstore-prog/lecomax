import assert from "node:assert/strict";
import sharp from "sharp";

const base = process.argv[2] || "http://localhost:3012";
const response = await fetch(base, {
  headers: { "user-agent": "facebookexternalhit/1.1" },
  signal: AbortSignal.timeout(60_000),
});
assert.equal(response.status, 200);
const html = await response.text();
const tags = [...html.matchAll(/<meta\s[^>]*>/g)].map(([tag]) => {
  const attributes = Object.fromEntries([...tag.matchAll(/([\w:]+)="([^"]*)"/g)].map(([, key, value]) => [key, value]));
  return [attributes.property || attributes.name, attributes.content];
});
const metadata = Object.fromEntries(tags);
assert.equal(metadata["og:title"], "L’ecomax — Sublimez votre quotidien.");
assert.match(metadata["og:image"], /^https?:\/\/.+\/images\/social\/lecomax-share-v3\.jpg$/);
assert.equal(metadata["og:image:width"], "1200");
assert.equal(metadata["og:image:height"], "630");
assert.equal(metadata["og:image:type"], "image/jpeg");
assert.equal(metadata["twitter:card"], "summary_large_image");
assert.equal(metadata["twitter:image"], metadata["og:image"]);
assert.ok(metadata["og:image:alt"]);
assert.ok(metadata["og:description"]);
// Fetch from the tested deployment, even when metadata uses the canonical host.
const assetUrl = new URL(new URL(metadata["og:image"]).pathname, base);
const asset = await fetch(assetUrl, { signal: AbortSignal.timeout(15_000) });
assert.equal(asset.status, 200);
assert.match(asset.headers.get("content-type"), /image\/jpeg/);
const bytes = Buffer.from(await asset.arrayBuffer());
const dimensions = await sharp(bytes).metadata();
assert.equal(dimensions.width, 1200);
assert.equal(dimensions.height, 630);
console.log(`Verified crawler-visible title, description, Open Graph, Twitter and JPEG (${bytes.length} bytes) at ${base}`);
