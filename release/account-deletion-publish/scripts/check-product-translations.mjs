import { createClient } from '@supabase/supabase-js';
import { generateProductTranslation } from '../lib/product-translation.ts';

// Read-only diagnostics. --provider additionally translates two small samples.
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  global: { fetch: (url, options) => fetch(url, { ...options, signal: AbortSignal.timeout(15000) }) },
});
const { error } = await db.from('product_translations').select('locale').limit(0);
console.log(JSON.stringify({ persistentStorage: !error, error: error?.code }));
const sql = await db.rpc('exec_sql', { query: "select to_regclass('public.product_translations') is not null as translation_storage_available" });
console.log(JSON.stringify({ sqlAccess: !sql.error, error: sql.error?.code }));
if (process.argv.includes('--provider')) {
  for (const locale of ['en', 'fr']) {
    try {
      const result = await generateProductTranslation({
        name: 'Jordan hoodie', brand: 'Jordan', locale,
        description: locale === 'en'
          ? 'Ce sweat à capuche Jordan gris charbon possède une poche kangourou, des poignets côtelés et un logo brodé. Il ne possède pas de cordons. Composition : 80 % coton, 20 % polyester.'
          : 'This charcoal grey Jordan hoodie has a kangaroo pocket, ribbed cuffs and an embroidered logo. It has no drawstrings. Composition: 80% cotton, 20% polyester.',
      });
      console.log(JSON.stringify({ locale, ...result }));
    } catch (error) {
      console.error(JSON.stringify({ locale, error: error.message }));
      process.exitCode = 1;
    }
  }
}
