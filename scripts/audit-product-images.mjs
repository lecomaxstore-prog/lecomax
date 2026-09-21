import fs from 'node:fs/promises';
import sharp from 'sharp';

const base = process.argv[2] || 'https://lecomax.com';
const response = await fetch(`${base}/api/products?active=true`);
if (!response.ok) throw new Error(`Catalog: ${response.status}`);
const products = await response.json();
const entries = new Map();
for (const product of products) {
  for (const source of [...(product.images || []), ...(product.description_images || [])]) {
    if (!source) continue;
    const entry = entries.get(source) || { source, products: [] };
    entry.products.push(product.slug);
    entries.set(source, entry);
  }
}
const queue = [...entries.values()];
const results = [];
await Promise.all(Array.from({ length: 6 }, async () => {
  while (queue.length) {
    const entry = queue.shift();
    try {
      const image = await fetch(new URL(entry.source, base), { signal: AbortSignal.timeout(30000) });
      const bytes = Buffer.from(await image.arrayBuffer());
      const metadata = image.ok ? await sharp(bytes).metadata() : null;
      results.push({ ...entry, status: image.status, width: metadata?.width, height: metadata?.height });
    } catch (error) {
      results.push({ ...entry, error: error.message });
    }
  }
}));
await fs.mkdir('out', { recursive: true });
await fs.writeFile('out/product-image-audit.json', JSON.stringify(results, null, 2));
const broken = results.filter(image => image.status !== 200 || !image.width);
console.log(JSON.stringify({ products: products.length, images: results.length, broken }, null, 2));
process.exitCode = broken.length ? 1 : 0;
