// Local CPU/output regression check; never contacts the database.
// The in-memory cache adapter measures saved rendering work, not Vercel cache I/O.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const product = {
  slug: 'benchmark', name: 'Produit de référence', category: 'Accessoires',
  price: 199, oldPrice: 249, discount: 20, stock: 3, description: '',
  image: '/images/ecoclub-community.jpg', imageUrl: 'https://lecomax.com/images/ecoclub-community.jpg',
};
let conversions = 0;
let current;
function load(source) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText, {
    exports, Buffer, process, URL, Response, fetch,
    require(name) {
      if (name === 'server-only') return {};
      if (name === './product-og-renderer') return current;
      if (name === './product-share-copy') return load(readFileSync(new URL('../lib/product-share-copy.ts', import.meta.url), 'utf8'));
      if (name === '@/lib/product-share') return { getProductShareData: async () => product };
      if (name === 'next/cache') return { unstable_cache(fn) {
        const entries = new Map();
        return (...args) => {
          const key = JSON.stringify(args);
          if (!entries.has(key)) entries.set(key, fn(...args));
          return entries.get(key);
        };
      } };
      if (name === 'sharp') return (...args) => { conversions++; return require('sharp')(...args); };
      return require(name);
    },
  });
  return exports;
}
async function measure(label, fn) {
  const before = process.cpuUsage();
  const start = performance.now();
  const bytes = Buffer.from(await (await fn()).arrayBuffer());
  const cpu = process.cpuUsage(before);
  console.log(JSON.stringify({ label, cpuMs: (cpu.user + cpu.system) / 1000,
    wallMs: Math.round(performance.now() - start), bytes: bytes.length, conversions }));
  return bytes;
}
current = load(readFileSync(new URL('../lib/product-og-renderer.tsx', import.meta.url), 'utf8'));
const output = await measure('current-cold', () => current.renderProductOgImage(product));
const reference = output;
const dimensions = await require('sharp')(output).metadata();
assert.equal(dimensions.width, 1200);
assert.equal(dimensions.height, 630);
await measure('changed-price-cached-photo', () => current.renderProductOgImage({ ...product, price: 189 }));
assert.equal(conversions, 1, 'Price changes must reuse the converted photograph');
console.log('PASS: 1200x630 PNG; source conversion reused after price change.');
const pngCache = load(readFileSync(new URL('../lib/product-og-cache.ts', import.meta.url), 'utf8'));
await measure('final-png-cache-cold', async () => new Response(await pngCache.getProductOgPng(product)));
const cached = await measure('final-png-cache-hit', async () => new Response(await pngCache.getProductOgPng(product)));
assert.deepEqual(cached, reference);
assert.deepEqual(await pngCache.getProductOgPng({ ...product, stock: 2 }), reference);
assert.notDeepEqual(await pngCache.getProductOgPng({ ...product, stock: 0 }), reference);
assert.equal(conversions, 1);
console.log('PASS: final-PNG reuse, positive stock normalization, sold-out invalidation.');
