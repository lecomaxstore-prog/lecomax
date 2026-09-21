import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import sharp from 'sharp';

const base = 'https://lecomax.com';
const response = await fetch(`${base}/api/products?active=true`);
assert.equal(response.status, 200);
const products = (await response.json()).filter(product => product.images.some(image => image.includes('/restored/')));
assert.equal(products.length, 5);
const pages = ['/', ...products.map(product => `/produit/${product.slug}/`)];
const report = [];
for (const page of pages) {
  const response = await fetch(new URL(page, base));
  assert.equal(response.status, 200, page);
  const html = await response.text();
  const sources = [...html.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/g)]
    .map(match => match[1].replaceAll('&amp;', '&'))
    .filter(source => decodeURIComponent(source).includes('/restored/'));
  assert.ok(sources.length, `Page must render restored image URLs: ${page}`);
  for (const source of new Set(sources)) {
    const image = await fetch(new URL(source, base), { signal: AbortSignal.timeout(30000) });
    assert.equal(image.status, 200, source);
    const metadata = await sharp(Buffer.from(await image.arrayBuffer())).metadata();
    assert.ok(metadata.width > 0);
  }
  report.push({ page, restoredImages: sources.length, passed: true });
}
await fs.writeFile('out/restored-product-pages-verification.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
