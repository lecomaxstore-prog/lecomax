import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';

const base = 'https://lecomax.com';
const get = async path => {
  const response = await fetch(base + path, { signal: AbortSignal.timeout(45000) });
  assert.equal(response.status, 200, `${path} status`);
  return response;
};
const home = await (await get('/')).text();
assert.match(home, /L’ecomax \| Votre marketplace lifestyle au Maroc/);
assert.match(home, /favicon\.ico\?v=7/);
assert.match(home, /manifest\.json\?v=7/);
assert.match(home, /icons\/icon-512\.png\?v=7/);
assert.match(home, /rel="canonical" href="https:\/\/lecomax\.com\/?"/);
assert.doesNotMatch(home, /\{\{shipping\}\}/);
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const liveIcon = Buffer.from(await (await get('/favicon.ico?v=7')).arrayBuffer());
assert.equal(digest(liveIcon), digest(await fs.readFile('public/favicon.ico')));
const manifest = await (await get('/manifest.json?v=7')).json();
assert.ok(manifest.icons.every(icon => icon.src.endsWith('?v=7')));
assert.match(await (await get('/robots.txt')).text(), /Sitemap: https:\/\/lecomax.com\/sitemap.xml/);
assert.match(await (await get('/sitemap.xml')).text(), /<urlset[\s>]/);
console.log('Verified live homepage title, canonical, structured logo, favicon bytes, manifest, robots and sitemap.');
