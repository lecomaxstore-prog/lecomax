import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
const db = new PGlite();
try {
  await db.exec(`create role anon; create role authenticated; create role service_role;
    create table products(id uuid primary key default gen_random_uuid(),slug text,name text,active boolean,category text,price numeric,original_price numeric,stock int,color_stock jsonb,tags text[]);
    insert into products(slug,name,active,category,price,stock,tags) values('kayano','Kayano',true,'chaussures',200,9,array['__sstock:44.5:9']);`);
  const migration=readFileSync(new URL('../supabase/migrations/20260908170000_product_bulk_changes.sql',import.meta.url),'utf8');
  await db.exec(migration); await db.exec(migration);
  const read=async()=>(await db.query('select to_jsonb(p) row from products p')).rows[0]?.row;
  const initial=await read();
  const change=(expected,patch,remove=false)=>db.query('select apply_product_bulk_change($1,$2,$3,$4) result',[initial.id,expected,patch,remove]);
  await change(initial,{active:false,tags:[...initial.tags,'__archived']});
  assert.equal((await read()).stock,9);
  await assert.rejects(change(initial,{stock:100}),/PRODUCT_CHANGED/);
  const current=await read();
  await assert.rejects(change(current,{stock:-1}),/INVALID_BULK_PATCH/);
  await assert.rejects(change(current,{id:'00000000-0000-0000-0000-000000000001'}),/INVALID_BULK_PATCH/);
  assert.deepEqual(await read(),current);
  for (const role of ['anon','authenticated']) {
    await db.exec(`set role ${role}`);
    await assert.rejects(change(current,{active:true}),/permission denied/);
    await db.exec('reset role');
  }
  await change(current,{},true); assert.equal(await read(),undefined);
  console.log('Bulk SQL passed: repeatable migration, stale-write rejection, validation rollback, role isolation, archive and deletion.');
} finally { await db.close(); }
