import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const base = 'https://lecomax.com';
const removed = ['a-lenovo-gm2-pro-ecouteurs', 'a-lenovo-lp40-pro-ecouteurs'];
const active = 'a-lenovo-k3-pro-enceinte';
const results = [];
for (const agent of ['Mozilla/5.0', 'Googlebot']) {
  for (const slug of [...removed, active]) {
    const url = `${base}/produit/${slug}/`;
    const response = await fetch(url, { headers: { 'User-Agent': agent }, signal: AbortSignal.timeout(45000) });
    const html = await response.text();
    const tags = html.match(/<(?:meta|link)\b[^>]*>/gi) ?? [];
    const robots = tags.filter(tag => /name="(?:robots|googlebot)"/i.test(tag));
    const canonical = tags.filter(tag => /rel="canonical"/i.test(tag));
    const noindex = robots.some(tag => /noindex/i.test(tag)) || /noindex/i.test(response.headers.get('x-robots-tag') ?? '');
    results.push({ url, agent, status: response.status, robots, canonical });
    if (removed.includes(slug)) {
      assert.ok([200, 404].includes(response.status), `Unexpected removed product status: ${response.status}`);
      assert.ok(noindex, `${slug} must be noindex`);
      assert.doesNotMatch(html, /<h1[^>]*>[^<]*Écouteurs Lenovo/);
      assert.doesNotMatch(html, /"@type"\s*:\s*"Product"/);
    } else {
      assert.equal(response.status, 200);
      assert.equal(noindex, false);
      assert.ok(canonical.length === 1 && canonical[0].includes(url), 'Active product must have its own canonical');
      assert.match(html, /Lenovo K3 Pro/);
    }
  }
}
const sitemapResponse = await fetch(`${base}/sitemap.xml`, { signal: AbortSignal.timeout(45000) });
assert.equal(sitemapResponse.status, 200);
const sitemap = await sitemapResponse.text();
for (const slug of removed) assert.ok(!sitemap.includes(`/produit/${slug}/`));
assert.ok(sitemap.includes(`/produit/${active}/`));
await fs.writeFile('docs/product-indexing-live-verification-20260915.json', JSON.stringify(results, null, 2) + '\n');
console.log(JSON.stringify(results, null, 2));
console.log('PASS: removed product noindex, active product canonical, and sitemap for normal and Googlebot requests.');
