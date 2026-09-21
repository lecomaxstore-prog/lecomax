import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';
import { products } from '../lib/products.ts';
import { serviceRoleKey, supabaseUrl } from './supabase-admin-env.mjs';

const slugs = ['a-lenovo-lp40-pro-ecouteurs', 'a-lenovo-gm2-pro-ecouteurs'];
const sb = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
const { data: existing, error } = await sb.from('products').select('slug').in('slug', slugs);
if (error) throw error;
assert.equal(existing.length, 0, 'Stop: one of the products already exists.');
const rows = [];
for (const slug of slugs) {
  const product = products.find(product => product.slug === slug);
  assert.ok(product);
  const images = [product.image, ...product.gallery];
  for (const source of [...images, ...product.descriptionImages]) {
    const response = await fetch(new URL(source, 'https://lecomax.com'));
    assert.equal(response.status, 200, source);
    await sharp(Buffer.from(await response.arrayBuffer())).raw().toBuffer();
  }
  rows.push({
    slug, name: product.name, category: product.category, brand: 'Lenovo',
    price: product.price, description: product.description,
    images, description_images: product.descriptionImages, video: product.video,
    colors: product.colors, sizes: product.sizes,
    active: true, featured: true,
    // Quantities must come from the owner; never invent available inventory.
    stock: 0, color_stock: { Blanc: 0, Noir: 0 },
    tags: ['audio', 'ecouteurs', 'bluetooth', ...Object.entries(product.colorImages).map(([color, image]) =>
      `__cimages:${JSON.stringify([color, [image]])}`)],
  });
}
await fs.mkdir('out', { recursive: true });
await fs.writeFile('out/lenovo-product-restoration.json', JSON.stringify(rows, null, 2));
console.log(JSON.stringify(rows.map(({slug, price, stock, images}) => ({slug, price, stock, images: images.length})), null, 2));
if (process.argv.includes('--apply')) {
  const { data, error } = await sb.from('products').insert(rows).select('slug,active,price,stock');
  if (error) throw error;
  console.log(JSON.stringify(data, null, 2));
}
