import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

const db = new PGlite();
try {
  await db.exec('create role anon; create role authenticated; create role service_role; create table products(id uuid primary key);');
  for (const file of ['20260906180000_product_translations.sql', '20260906200000_bilingual_product_translations.sql']) {
    await db.exec(readFileSync(new URL('../supabase/migrations/' + file, import.meta.url), 'utf8'));
  }
  const id = '11111111-1111-4111-8111-111111111111';
  const hash = 'a'.repeat(64);
  await db.query('insert into products values ($1)', [id]);
  const claim = async (locale, fingerprint = hash) => (await db.query('select claim_product_translation($1,$2,$3) as claimed', [id, fingerprint, locale])).rows[0].claimed;
  assert.equal(await claim('en'), true);
  assert.equal(await claim('en'), false);
  assert.equal(await claim('fr'), true);
  await assert.rejects(claim('de'), /Unsupported/);
  await db.exec("update product_translations set status='failed', retry_after=now()-interval '1 second' where locale='en'");
  assert.equal(await claim('en'), true);
  await db.exec("update product_translations set status='ready',description='Translated',retry_after=now()-interval '1 second' where locale='en'");
  assert.equal(await claim('en'), false);
  assert.equal(await claim('en', 'b'.repeat(64)), true);
  const permissions = (await db.query("select has_table_privilege('anon','product_translations','SELECT') as readable, has_function_privilege('anon','claim_product_translation(uuid,text,text)','EXECUTE') as executable")).rows[0];
  assert.deepEqual(permissions, { readable: false, executable: false });
  console.log('PASS: bilingual storage, leases, recovery, edit invalidation and private access');
} finally {
  await db.close();
}
