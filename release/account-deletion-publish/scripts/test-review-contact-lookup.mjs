import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
const db = new PGlite();
await db.exec(`create role anon; create role authenticated; create role service_role;
create table orders (id uuid primary key default gen_random_uuid(), items jsonb, status text, customer jsonb, created_at timestamptz default now());
grant select on orders to service_role;`);
await db.exec(readFileSync(new URL('../supabase/migrations/20260915000000_review_contact_lookup.sql', import.meta.url), 'utf8'));
for (const phone of ['06 12 34 56 78', '+212612345678', '00212 612345678']) {
  await db.query(`insert into orders(items,status,customer) values ('[{"slug":"shoe"}]','delivered',$1)`, [JSON.stringify({ phone, email: 'Buyer@Example.com' })]);
}
await db.exec('set role service_role');
for (const [type, contact] of [['phone', '212612345678'], ['email', 'buyer@example.com']]) {
  assert.equal((await db.query('select * from find_review_orders_by_contact($1,$2,$3)', [type, contact, 'shoe'])).rows.length, 3);
  assert.equal((await db.query('select * from find_review_orders_by_contact($1,$2,$3)', [type, contact, 'other'])).rows.length, 0);
}
assert.equal((await db.query("select * from find_review_orders_by_contact('phone','212712345678','shoe')")).rows.length, 0);
for (const role of ['anon', 'authenticated']) {
  await db.exec(`reset role; set role ${role}`);
  await assert.rejects(db.query("select * from find_review_orders_by_contact('phone','212612345678','shoe')"), /permission denied/);
}
await db.close();
console.log('Review contact lookup: formatting, email, product filtering and permissions passed.');
