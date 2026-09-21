import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';
import { serviceRoleKey, supabaseUrl } from './supabase-admin-env.mjs';

// Dry run by default. Only restores missing local assets, never substitutes photos.
const apply = process.argv.includes('--apply');
const sb = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
const audit = JSON.parse(await fs.readFile('out/product-image-audit.json', 'utf8'));
const broken = audit.filter(image => image.status === 404 && image.source.startsWith('/images/products/'));
const slugs = [...new Set(broken.flatMap(image => image.products))];
if (!slugs.length) throw new Error('No missing local product images in the audit.');
const { data: products, error } = await sb.from('products').select('id,slug,images,description_images,tags').in('slug', slugs);
if (error) throw error;
const replacements = new Map();
for (const image of broken) {
  const filename = path.resolve('public', `.${decodeURIComponent(image.source)}`);
  const root = path.resolve('public/images/products') + path.sep;
  if (!filename.startsWith(root)) throw new Error('Image path outside product assets');
  const bytes = await fs.readFile(filename);
  await sharp(bytes).raw().toBuffer();
  const hash = createHash('sha256').update(bytes).digest('hex');
  const key = `restored/${hash}.avif`;
  const { data: { publicUrl } } = sb.storage.from('product-images').getPublicUrl(key);
  replacements.set(decodeURIComponent(image.source), publicUrl);
  if (apply) {
    const { error: uploadError } = await sb.storage.from('product-images').upload(key, bytes, {
      contentType: 'image/avif', cacheControl: '31536000', upsert: false,
    });
    if (uploadError && !/already exists|duplicate/i.test(uploadError.message)) throw uploadError;
    const response = await fetch(publicUrl);
    if (!response.ok) throw new Error(`Restored image unavailable: ${response.status}`);
    const restored = Buffer.from(await response.arrayBuffer());
    if (createHash('sha256').update(restored).digest('hex') !== hash) throw new Error('Restored image differs from original');
  }
}
const replace = value => replacements.get(decodeURIComponent(value)) || value;
const plans = products.map(product => ({
  id: product.id, slug: product.slug,
  before: { images: product.images, description_images: product.description_images },
  after: {
    images: product.images?.map(replace) ?? null,
    description_images: product.description_images?.map(replace) ?? null,
  },
}));
// Keep a dated rollback record before touching the database.
await fs.writeFile(`out/product-image-repair-${Date.now()}.json`, JSON.stringify(plans, null, 2));
console.log(JSON.stringify({ apply, files: replacements.size, products: plans.map(({slug}) => slug) }, null, 2));
if (apply) {
  for (const plan of plans) {
    const { data: current, error: readError } = await sb.from('products')
      .select('images,description_images').eq('id', plan.id).single();
    if (readError) throw readError;
    if (JSON.stringify(current) !== JSON.stringify(plan.before)) throw new Error(`Concurrent product edit; stopped: ${plan.slug}`);
    const { data, error: updateError } = await sb.from('products').update(plan.after)
      .eq('id', plan.id).select('id');
    if (updateError) throw updateError;
    if (data?.length !== 1) throw new Error(`Concurrent product edit; stopped: ${plan.slug}`);
    console.log(`Restored ${plan.slug}`);
  }
}
