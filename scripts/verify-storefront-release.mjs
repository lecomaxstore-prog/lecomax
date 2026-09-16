import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const base = 'https://lecomax.com';
async function get(path, headers = {}) {
  const response = await fetch(base + path, { headers, signal: AbortSignal.timeout(45000) });
  assert.equal(response.status, 200, `${path} must be public`);
  return response;
}

const homeResponse = await get('/');
const home = await homeResponse.text();
assert.match(home, /Découvrez L’ecomax/);
assert.match(home, /rel="canonical" href="https:\/\/lecomax\.com\/?"/);
assert.doesNotMatch(homeResponse.headers.get('x-robots-tag') ?? '', /noindex/i);
assert.ok(homeResponse.headers.get('content-security-policy'), 'CSP must be present');
assert.equal(homeResponse.headers.get('x-content-type-options'), 'nosniff');
const jsonLd = [...home.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)];
assert.ok(jsonLd.length, 'Homepage structured data must be present');
for (const match of jsonLd) JSON.parse(match[1]);
const robots = await (await get('/robots.txt')).text();
assert.match(robots, /User-agent: OAI-SearchBot/);
assert.match(robots, /User-agent: Googlebot/);
assert.match(robots, /Sitemap: https:\/\/lecomax.com\/sitemap.xml/);
assert.equal(await (await get('/llms.txt')).text(), await fs.readFile('public/llms.txt', 'utf8'));
const sitemap = await (await get('/sitemap.xml')).text();
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1].replaceAll('&amp;', '&'));
assert.ok(urls.length > 20, 'Sitemap must contain the live catalogue');
assert.ok(urls.every(url => new URL(url).origin === base), 'Sitemap must use the canonical domain');
for (const agent of ['Googlebot', 'OAI-SearchBot']) await get('/', { 'User-Agent': agent });
for (const path of ['/api/admin/dashboard', '/api/orders']) {
  const response = await fetch(base + path, { signal: AbortSignal.timeout(45000) });
  assert.ok([401, 403].includes(response.status), `${path} must reject anonymous requests (${response.status})`);
}
const cssPaths = [...new Set([...home.matchAll(/href="([^" ]+\.css[^" ]*)"/g)].map(match => match[1]))];
const css = (await Promise.all(cssPaths.map(async path => (await get(path)).text()))).join('\n');
assert.match(css, /eco-chat-icon-nudge/);
assert.match(css, /eco-chat-launcher-icon:?:before/);
console.log(`Live release verified: SEO metadata, structured data, crawler access, ${urls.length} sitemap URLs, help animation and anonymous API protection.`);

if (process.argv.includes('--submit-indexnow')) {
  const source = await fs.readFile('lib/product-discovery.ts', 'utf8');
  const key = source.match(/INDEXNOW_KEY\s*=.*?\?\?\s*"([a-z0-9]+)"/)?.[1];
  assert.ok(key, 'IndexNow public verification key must be configured');
  assert.equal((await (await get(`/${key}.txt`)).text()).trim(), key);
  const response = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ host: 'lecomax.com', key, keyLocation: `${base}/${key}.txt`, urlList: urls }),
    signal: AbortSignal.timeout(45000),
  });
  assert.ok(response.ok, `IndexNow submission failed (${response.status})`);
  console.log(`IndexNow accepted ${urls.length} URLs (HTTP ${response.status}). This is a crawl notification, not confirmation of indexing.`);
}
