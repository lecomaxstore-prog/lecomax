import { createClient } from '@supabase/supabase-js';
import { ensureProductTranslation } from '../lib/product-translation-store.ts';

// Safe to resume: every product/language checks the durable cache and atomic lease.
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: { fetch: (url, options) => fetch(url, { ...options, signal: AbortSignal.timeout(15000) }) },
});
const apply = process.argv.includes('--apply');
const summary = { ready: 0, missing: 0, pending: 0, unavailable: 0, failed: 0 };
for (let offset = 0; ; offset += 100) {
  const { data, error } = await db.from('products').select('id,slug,name,brand,description')
    .eq('active', true).order('id').range(offset, offset + 99);
  if (error) throw new Error(`Catalogue unavailable: ${error.code}`);
  for (const product of data) {
    if (!product.description?.trim()) continue;
    for (const locale of ['en', 'fr']) {
      try {
        const result = await ensureProductTranslation(db, product, locale, apply);
        summary[result.status]++;
        console.log(JSON.stringify({ slug: product.slug, locale, status: result.status }));
      } catch (error) {
        summary.failed++;
        console.error(JSON.stringify({ slug: product.slug, locale, error: error.message }));
        // Do not keep spending when the provider or persistence is unavailable.
        console.log(JSON.stringify(summary));
        process.exit(1);
      }
    }
  }
  if (data.length < 100) break;
}
console.log(JSON.stringify(summary));
if (summary.failed || (apply && (summary.missing || summary.pending || summary.unavailable))) process.exitCode = 1;
