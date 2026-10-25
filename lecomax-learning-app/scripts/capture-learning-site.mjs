import fs from 'node:fs/promises';
import { sanitizePreview } from './site-preview.mjs';

const origin = 'https://lecomax.com';
const home = await fetch(origin).then(r => { if (!r.ok) throw Error(r.status); return r.text(); });
const routes = new Set(['/', '/boutique', '/panier', '/checkout', '/connexion', '/inscription', '/aide']);
for (const match of home.matchAll(/href="([^"]+)"/g)) {
  const url = new URL(match[1].replaceAll('&amp;', '&'), origin);
  if (url.origin === origin && !url.search && /^\/(?:produit\/[^/]+|homme|femme|chaussures|accessoires|nouveautes|promotions|bestsellers|nous-contacter|a-propos|guide-des-tailles|retours|suivre-commande|ecomedia|ecoclub|boutiques|download)$/.test(url.pathname)) routes.add(url.pathname);
}
const styles = new Map();
const pages = {};
for (const path of routes) {
  const response = path === '/' ? null : await fetch(origin + path);
  if (response && (!response.ok || new URL(response.url).pathname !== path)) continue;
  const result = sanitizePreview(path === '/' ? home : await response.text());
  for (const url of result.css) if (!styles.has(url)) {
    const response = await fetch(url);
    if (!response.ok) throw Error(`Stylesheet ${response.status}`);
    styles.set(url, (await response.text()).replace(/url\((['"]?)([^)'"\s]+)\1\)/g, (_all, _quote, value) => {
      const absolute = new URL(value, url);
      return absolute.protocol === 'https:' ? `url("${absolute.href}")` : 'none';
    }));
  }
  pages[path] = { html: result.html, files: result.files };
}
await fs.writeFile(new URL('../data/site-pages.json', import.meta.url), JSON.stringify({
  origin, capturedAt: new Date().toISOString(), css: [...styles.values()].join('\n'), pages,
}));
console.log(`Captured ${Object.keys(pages).length} public learning pages.`);
