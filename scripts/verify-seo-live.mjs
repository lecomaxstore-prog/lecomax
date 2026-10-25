// Read-only verification. Never creates an order, changes auth, or writes Supabase.
import nextEnv from '@next/env';
import { supabaseHeaders } from '../operations/seo-vercel/lib/supabase-headers.mjs';
import { mkdir, writeFile } from 'node:fs/promises';
nextEnv.loadEnvConfig(process.cwd());
const dir = 'artifacts/seo-verification';
await mkdir(dir, { recursive: true });
const originArg = process.argv.find(value => value.startsWith('--origin='));
const origin = originArg?.slice(9) || 'http://127.0.0.1:3120';
if (!['127.0.0.1', 'localhost', 'lecomax.com'].includes(new URL(origin).hostname)) throw Error('Unexpected verification host');
const report = { at: new Date().toISOString(), origin, database: {}, pages: [], checks: [], aiConfigured: Boolean(process.env.SEO_AI_API_KEY && process.env.SEO_AI_BASE_URL && process.env.SEO_AI_MODEL) };
const check = (name, pass, detail) => report.checks.push({ name, pass, detail });
const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw Error('Supabase read configuration missing');
const headers = { ...supabaseHeaders(key), Prefer: 'count=exact' };
for (const table of ['products', 'categories', 'orders', 'seo_documents', 'seo_events']) {
  try {
    const r = await fetch(`${url}/rest/v1/${table}?select=${table === 'seo_documents' ? 'entity_id' : 'id'}`, { method: 'HEAD', headers, signal: AbortSignal.timeout(15000) });
    report.database[table] = { status: r.status, count: r.headers.get('content-range')?.split('/').at(-1) ?? null };
  } catch { report.database[table] = { status: 'unreachable' }; }
}
const catalogResponse = await fetch(`${url}/rest/v1/products?select=slug,name,price,stock,active,category&active=eq.true&order=slug&limit=1000`, { headers, signal: AbortSignal.timeout(15000) });
if (!catalogResponse.ok) throw Error('Public catalogue read failed');
const products = await catalogResponse.json();
report.activeProductCount = products.length;
await writeFile(`${dir}/public-products.json`, JSON.stringify(products, null, 2));
if (!process.argv.includes('--database-only')) {
  async function page(path, accept = 'text/html') {
    const r = await fetch(origin + path, { headers: { 'User-Agent': 'Googlebot', Accept: accept }, signal: AbortSignal.timeout(45000), redirect: 'follow' });
    const body = await r.text();
    report.pages.push({ path, status: r.status, type: r.headers.get('content-type'), robots: r.headers.get('x-robots-tag') });
    return { status: r.status, body, headers: r.headers };
  }
  const attr = (tag, name) => new RegExp(`\\b${name}=["']([^"']*)["']`, 'i').exec(tag)?.[1];
  const meta = (html, name) => (html.match(/<meta\b[^>]*>/gi) ?? []).map(tag => ({ name: attr(tag,'name') ?? attr(tag,'property'), content: attr(tag,'content') })).find(item => item.name === name)?.content;
  const decode = value => value?.replace(/&amp;/g,'&').replace(/&#x27;|&#39;/g,"'").replace(/&quot;/g,'"').replace(/&lt;/g,'<').replace(/&gt;/g,'>');
  const sample = process.argv.includes('--all-products') ? products : [...new Map([products[0], products.find(p => p.stock === 0), ...products.slice(1, 3)].filter(Boolean).map(p => [p.slug,p])).values()];
  const titles = new Set(), descriptions = new Set();
  for (const product of sample) {
    const path = `/produit/${encodeURIComponent(product.slug)}/`;
    const r = await page(path);
    check(`${product.slug}: HTTP`,r.status === 200, r.status);
    const title = decode(/<title[^>]*>([^<]*)<\/title>/i.exec(r.body)?.[1]);
    const canonical = (r.body.match(/<link\b[^>]*>/gi) ?? []).find(tag => attr(tag,'rel') === 'canonical');
    check(`${product.slug}: title`,Boolean(title?.includes(product.name.slice(0,50))),title);
    check(`${product.slug}: description`,Boolean(meta(r.body,'description')?.length),decode(meta(r.body,'description')));
    const description=decode(meta(r.body,'description'));
    const normalizedTitle=title?.trim().toLocaleLowerCase('fr');
    const normalizedDescription=description?.trim().toLocaleLowerCase('fr');
    check(`${product.slug}: unique metadata in checked sample`,!titles.has(normalizedTitle)&&!descriptions.has(normalizedDescription));
    titles.add(normalizedTitle);descriptions.add(normalizedDescription);
    check(`${product.slug}: canonical`,attr(canonical ?? '','href') === 'https://lecomax.com'+path,attr(canonical ?? '','href'));
    check(`${product.slug}: Open Graph`,Boolean(meta(r.body,'og:title') && meta(r.body,'og:image') && meta(r.body,'og:url') === 'https://lecomax.com'+path));
    const schemas = [...r.body.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)].map(match => {try{return JSON.parse(match[1]);}catch{return null;}});
    check(`${product.slug}: valid JSON-LD`,schemas.length > 0 && schemas.every(Boolean));
    const schema = schemas.find(item => item?.['@type'] === 'Product');
    check(`${product.slug}: price and currency`,schema?.offers?.price === product.price && schema?.offers?.priceCurrency === 'MAD',schema?.offers && {price:schema.offers.price,currency:schema.offers.priceCurrency});
    const expectedAvailability=product.stock === 0 ? 'https://schema.org/OutOfStock' : typeof product.stock === 'number' && product.stock > 0 ? 'https://schema.org/InStock' : undefined;
    check(`${product.slug}: availability`,schema?.offers?.availability === expectedAvailability,schema?.offers?.availability);
    check(`${product.slug}: breadcrumb`,schemas.some(item => item?.['@type'] === 'BreadcrumbList' && item.itemListElement?.length >= 2));
    // A unique product need not have similar-product cards; the category link
    // still provides crawlable navigation to the rest of the catalogue.
    check(`${product.slug}: crawlable category link`,r.body.includes(`href="/${product.category}/"`) || r.body.includes(`href="/${product.category}"`));
  }
  const index = await page('/sitemap.xml','application/xml');
  check('sitemap index',index.status === 200 && /<sitemapindex\b/.test(index.body));
  if (index.status === 200) {
    const locs = [...index.body.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>decode(m[1]));
    let productUrls=[];
    for (const loc of locs) {
      const parsed=new URL(loc);const r=await page(parsed.pathname,'application/xml');
      check(`sitemap section ${parsed.pathname}`,r.status === 200 && /<urlset\b/.test(r.body));
      if(parsed.pathname.includes('/products/')) productUrls.push(...[...r.body.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>decode(m[1])));
    }
    check('all active products in sitemap',products.every(p=>productUrls.includes(`https://lecomax.com/produit/${encodeURIComponent(p.slug)}/`)),{active:products.length,listed:productUrls.length});
    check('no duplicate product sitemap URLs',new Set(productUrls).size===productUrls.length);
  }
  const robots=await page('/robots.txt','text/plain');
  check('robots rules',robots.status===200 && robots.body.includes('Sitemap: https://lecomax.com/sitemap.xml') && robots.body.includes('Disallow: /admin/') && robots.body.includes('Allow: /api/og/product/'));
  for(const path of ['/boutique/','/panier/','/checkout/','/connexion/',`/${products[0]?.category || 'accessoires'}/`]) {
    const r=await page(path);check(`${path}: reachable`,r.status===200);
    if(path==='/checkout/' || path==='/panier/') check(`${path}: noindex`,Boolean(r.headers.get('x-robots-tag')?.includes('noindex') || meta(r.body,'robots')?.includes('noindex')));
  }
  const missing=await page('/produit/seo-verification-nonexistent-product/');check('missing product is 404',missing.status===404);
}
const name=process.argv.includes('--database-only')?'database':new URL(origin).hostname==='lecomax.com'?'live-site':'local-http';
await writeFile(`${dir}/${name}.json`,JSON.stringify(report,null,2));
console.log(JSON.stringify({origin,database:report.database,checks:report.checks.length,failed:report.checks.filter(c=>!c.pass)},null,2));
if(report.checks.some(c=>!c.pass)) process.exitCode=1;
