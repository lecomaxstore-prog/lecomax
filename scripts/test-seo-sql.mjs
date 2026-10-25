import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

// Real PostgreSQL semantics in memory. Never connects to the user's database.
const db = new PGlite();
try {
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    alter default privileges grant all on tables to service_role;
    alter default privileges grant update on sequences to anon,authenticated,service_role;
    alter default privileges grant execute on functions to anon,authenticated,service_role;
    create table products(id uuid primary key default gen_random_uuid(),slug text,name text,description text,category text,brand text,images text[],active boolean,price numeric,stock integer);
    create table categories(id uuid primary key default gen_random_uuid(),slug text,name text,description text,image text,active boolean);
    create table customers(id integer primary key, marker text);
    create table orders(id integer primary key, marker text);
    create schema auth;
    create table auth.users(id integer primary key, marker text);
    insert into customers values(1,'unchanged customer');
    insert into orders values(1,'unchanged order');
    insert into auth.users values(1,'unchanged authentication record');
    insert into products(slug,name,description,category,images,active,price,stock) values('casque','Casque','Description réelle','accessoires',array['/casque.jpg'],true,120,4);
    insert into categories(slug,name,active) values('accessoires','Accessoires',true);`);
  const before = (await db.query('select * from products')).rows;
  const unchanged = {};
  for(const table of ['categories','customers','orders','auth.users']) unchanged[table]=(await db.query(`select * from ${table}`)).rows;
  await db.exec(readFileSync(new URL('../supabase/verification/seo-preflight.sql', import.meta.url),'utf8'));
  await db.exec(readFileSync(new URL('../supabase/migrations/202610180001_seo_engine.sql', import.meta.url),'utf8'));
  assert.deepEqual((await db.query('select * from products')).rows, before, 'backfill never mutates products');
  for(const table of Object.keys(unchanged)) assert.deepEqual((await db.query(`select * from ${table}`)).rows,unchanged[table],`${table} unchanged`);
  const verification=await db.exec(readFileSync(new URL('../supabase/verification/seo-postflight.sql', import.meta.url),'utf8'));
  for(const result of verification) for(const row of result.rows ?? []) {
    if('passed' in row) assert.equal(row.passed,true,JSON.stringify(row));
  }
  const get = async () => (await db.query("select * from seo_documents where kind='product'")).rows[0];
  const change = async (doc, action, content=null) => (await db.query('select save_seo_document($1,$2,$3,$4,$5,$6) result', ['product',doc.entity_id,doc.version,action,content,'test@example.invalid'])).rows[0].result;
  let doc=await get();
  assert.match(doc.fallback.title,/Casque.*Maroc/);
  assert.equal(doc.published,null);
  const content={title:'Casque | L’ecomax Maroc',description:'Consultez ce casque dans la boutique L’ecomax au Maroc.',imageAlt:'Casque'};
  await assert.rejects(change(doc,'approve'),/SEO_DRAFT_REQUIRED/);
  await assert.rejects(change(doc,'draft',{...content,title:'<script>'}),/SEO_CONTENT_INVALID/);
  let draft=await change(doc,'draft',content);
  assert.equal(draft.published,null,'draft is not published');
  await assert.rejects(change(doc,'draft',content),/SEO_CONFLICT/);
  doc=await change(draft,'approve');
  assert.deepEqual(doc.published,content);
  const approvedVersion=doc.version;
  await db.exec("update products set price=130,stock=3");
  assert.equal((await get()).version,approvedVersion,'volatile stock/price do not invalidate text');
  draft=await change(doc,'draft',{...content,title:'Autre titre'});
  await db.exec("update products set name='Casque révisé'");
  doc=await get();
  assert.deepEqual(doc.published,content,'approved metadata retained across catalogue updates');
  assert.match(doc.fallback.title,/révisé/);
  await assert.rejects(change(doc,'approve'),/SEO_SOURCE_CHANGED/);
  await assert.rejects(change(draft,'approve'),/SEO_CONFLICT/);
  doc=await change(doc,'reset');
  assert.equal(doc.published,null);
  assert.ok((await db.query("select content from seo_events where action='reset'")).rows[0].content,'reset archives previous approved content');
  await db.exec('delete from products');
  assert.equal((await get()).active,false,'deleted product SEO archived');
  assert.ok((await get()).draft,'draft not deleted');
  assert.equal((await db.query('select count(*)::int n from seo_events')).rows[0].n,4);
  for(const role of ['anon','authenticated']) {
    await db.exec(`set role ${role}`);
    await assert.rejects(db.query('select * from seo_documents'),/permission denied/);
    await assert.rejects(db.query("select save_seo_document('product','x',1,'reset',null,'x')"),/permission denied/);
    await db.exec('reset role');
  }
  for(const role of ['anon','authenticated','service_role']) {
    await db.exec(`set role ${role}`);
    await assert.rejects(db.query("select setval('public.seo_events_id_seq',1)"),/permission denied/);
    await assert.rejects(db.query("select sync_seo_document('product','{}'::jsonb)"),/permission denied/);
    await db.exec('reset role');
  }
  await db.exec('set role service_role');
  assert.equal((await db.query('select count(*)::int n from seo_documents')).rows[0].n,2,'service role can read SEO');
  const archived=await get();
  await change(archived,'draft',content);
  await assert.rejects(db.query("delete from seo_events"),/permission denied/);
  await db.exec('reset role');
  const retained=(await db.query('select * from seo_documents order by kind,entity_id')).rows;
  const retainedEvents=(await db.query('select * from seo_events order by id')).rows;
  await assert.rejects(db.exec(readFileSync(new URL('../supabase/migrations/202610180001_seo_engine.sql', import.meta.url),'utf8')),/already exists/);
  await db.exec('rollback');
  assert.deepEqual((await db.query('select * from seo_documents order by kind,entity_id')).rows,retained,'a rerun fails without replacing SEO records');
  assert.deepEqual((await db.query('select * from seo_events order by id')).rows,retainedEvents,'a rerun preserves audit events');
  console.log('PASS: read-only SQL pre/postflight, non-destructive backfill, triggers, approval, concurrency, archive, service RPC and table/function/sequence isolation.');
} finally { await db.close(); }
