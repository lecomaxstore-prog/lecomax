const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { PGlite } = require('@electric-sql/pglite');
const sql = fs.readFileSync(path.join(__dirname, '../operations/seo/staging-runtime-repair.sql'), 'utf8');
const base = fs.readFileSync(path.join(__dirname, '../operations/seo/staging-approval-package-20261021/prerequisites.sql.review'), 'utf8')
  .replace("DO $$ BEGIN RAISE EXCEPTION 'REVIEW_DRAFT_NOT_APPROVED'; END $$;", '');

test('synthetic runtime repair executes real catalogue/sitemap queries and preserves isolation', async () => {
 const db = new PGlite();
 try {
  await db.exec('CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;');
  await db.exec(base);
  await assert.rejects(db.exec(sql), /STAGING_TARGET_REQUIRED/);
  await db.exec('ROLLBACK');
  await db.exec("SET lecomax.staging_target = 'tyltharlnbxrxibuxyye'");
  await db.exec(sql);
  const tables = ['products','categories','pages','ecomedia_posts','settings','banners','promotions','reviews'];
  for (const table of tables) {
   const result = await db.query(`SELECT relrowsecurity FROM pg_class WHERE oid='public.${table}'::regclass`);
   assert.equal(result.rows[0].relrowsecurity, true);
   for (const role of ['anon','authenticated','service_role']) {
    for (const privilege of ['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','TRIGGER','REFERENCES']) {
     const { rows } = await db.query('SELECT has_table_privilege($1,$2,$3) AS allowed', [role, `public.${table}`, privilege]);
     assert.equal(rows[0].allowed, role === 'service_role' && privilege === 'SELECT', `${table}/${role}/${privilege}`);
    }
   }
  }
  await db.exec('SET ROLE service_role');
  const fields = fs.readFileSync(path.join(__dirname, '../app/api/products/route.ts'), 'utf8').match(/const PUBLIC_FIELDS\s*=\s*"([^"]+)"/)[1];
  const products = await db.query(`SELECT ${fields} FROM products WHERE active=true ORDER BY created_at DESC`);
  assert.equal(products.rows.length, 2);
  assert(products.rows.every(p => Number(p.price) === 100 && p.category.startsWith('seo-fixture-category-')));
  for (const [table, active, count] of [['products','active',2],['categories','active',2],['pages','active',0],['ecomedia_posts','is_published',0]]) {
   assert.equal(Number((await db.query(`SELECT count(id) FROM ${table} WHERE ${active}=true`)).rows[0].count), count);
   await db.query(`SELECT slug,updated_at FROM ${table} WHERE ${active}=true ORDER BY id LIMIT 1000 OFFSET 0`);
  }
  await db.query('SELECT * FROM categories ORDER BY sort_order');
  await db.query("SELECT key,value FROM settings WHERE key LIKE 'category_media:%'");
  await db.query('SELECT product_slug,rating FROM reviews WHERE verified_purchase=true');
  await db.query('SELECT * FROM banners ORDER BY sort_order,created_at');
  await db.query('SELECT * FROM promotions ORDER BY created_at DESC');
  await assert.rejects(db.exec("UPDATE products SET price=1"), /permission denied/);
  await db.exec('RESET ROLE; SET ROLE anon');
  await assert.rejects(db.query('SELECT * FROM products'), /permission denied/);
  await db.exec('RESET ROLE');
  assert.equal((await db.query("SELECT count(*)::int AS n FROM pg_trigger WHERE NOT tgisinternal AND tgrelid IN (SELECT oid FROM pg_class WHERE relnamespace='public'::regnamespace)")).rows[0].n, 0);
 } finally { await db.close(); }
});

test('fixture-boundary guard refuses non-synthetic rows before DDL', async () => {
 const db = new PGlite();
 try {
  await db.exec("CREATE TABLE products(id text); CREATE TABLE categories(id integer); SET lecomax.staging_target='tyltharlnbxrxibuxyye'");
  await assert.rejects(db.exec(sql), /SYNTHETIC_FIXTURE_BOUNDARY_REQUIRED/);
  await db.exec('ROLLBACK');
  assert.equal((await db.query("SELECT count(*)::int AS n FROM information_schema.columns WHERE table_name='products' AND column_name='price'")).rows[0].n, 0);
 } finally { await db.close(); }
});

for (const dir of ['node_modules', 'artifacts/seo-dependency-remediation-20261021/node_modules']) {
 test(`Nodemailer offline MIME compatibility: ${dir}`, async () => {
  const mail = require(path.join(__dirname, '..', dir, 'nodemailer'));
  const transporter = mail.createTransport({ streamTransport: true, buffer: true, newline: 'unix' });
  const result = await transporter.sendMail({ from:'owner@staging.invalid',to:'viewer@staging.invalid',subject:'Test UTF-8 سماعة',text:'Synthetic message — never delivered',inReplyTo:'<fixture@staging.invalid>',references:'<fixture@staging.invalid>' });
  assert(Buffer.isBuffer(result.message));
  const mime = result.message.toString();
  assert.match(mime, /To: viewer@staging.invalid/);
  assert.match(mime, /In-Reply-To: <fixture@staging.invalid>/);
  assert.match(mime, /References: <fixture@staging.invalid>/);
  assert.match(mime, /Content-Type: text\/plain; charset=utf-8/);
  transporter.close();
 });
}
