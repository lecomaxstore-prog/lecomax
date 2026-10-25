// Isolated in-memory PostgreSQL only; never loads .env or opens a production connection.
import { PGlite } from '@electric-sql/pglite';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const db = new PGlite();
const migration = readFileSync('supabase/migrations/202610180001_seo_engine.sql', 'utf8');
const sha256 = createHash('sha256').update(migration).digest('hex');
assert.equal(sha256, '958e8727fb9d5f32df6702b00cd17e1e0a2e71b98674f1523ae29e439af3332f');
try {
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create table products(id uuid primary key default gen_random_uuid(),slug text,name text,description text,category text,brand text,images text[],active boolean,price numeric,stock integer);
    create table categories(id uuid primary key default gen_random_uuid(),slug text,name text,description text,image text,active boolean);
    insert into products(slug,name,active,stock) select 'p-'||n,'Product '||n,true,10 from generate_series(1,34) n;
    insert into categories(slug,name,active) select 'c-'||n,'Category '||n,true from generate_series(1,4) n;
    set transaction_timeout='120s'; set idle_in_transaction_session_timeout='15s';`);
  const server = (await db.query('select version() version')).rows[0].version;
  const started = performance.now(); await db.exec(migration); const elapsedMs = performance.now() - started;
  assert.ok(elapsedMs < 120000);
  assert.equal(Number((await db.query('select count(*) n from seo_documents')).rows[0].n),38);
  await db.exec(`create table business_inventory_events(slug text);
    create function business_stock_audit() returns trigger language plpgsql as $$begin insert into business_inventory_events values(new.slug);return new;end$$;
    create trigger business_stock_audit after update of stock on products for each row execute function business_stock_audit();
    create or replace function sync_seo_document(p_kind text,p_row jsonb) returns void language plpgsql as $$begin raise exception 'SYNTHETIC_SEO_FAILURE';end$$;`);
  let failed = false;
  try { await db.exec("update products set stock=stock-1 where slug='p-1'"); } catch (e) { failed = String(e.message).includes('SYNTHETIC_SEO_FAILURE'); }
  assert.ok(failed, 'A failing SEO trigger must reject this synthetic stock write');
  assert.equal((await db.query("select stock from products where slug='p-1'")).rows[0].stock,10);
  await db.exec("set transaction_timeout='30s';set idle_in_transaction_session_timeout='10s';");
  await db.exec(readFileSync('supabase/rollback/20261018_seo_engine_disable_bounded.sql','utf8'));
  const triggers = (await db.query("select tgname,tgenabled from pg_trigger where not tgisinternal order by tgname")).rows;
  assert.equal(triggers.find(t=>t.tgname==='business_stock_audit').tgenabled,'O');
  for(const name of ['products_seo_sync','categories_seo_sync']) assert.equal(triggers.find(t=>t.tgname===name).tgenabled,'D');
  await db.exec("update products set stock=stock-1 where slug='p-1'");
  assert.equal((await db.query("select stock from products where slug='p-1'")).rows[0].stock,9);
  assert.equal(Number((await db.query('select count(*) n from business_inventory_events')).rows[0].n),1);
  assert.equal((await db.query("select has_function_privilege('service_role','save_seo_document(text,text,integer,text,jsonb,text,text,text)','EXECUTE') allowed")).rows[0].allowed,false);
  const result = {at:new Date().toISOString(),localOnly:true,server,migrationSha256:sha256,exactMigrationCommitted:true,migrationElapsedMs:Math.round(elapsedMs),backfill:38,
    seoFailureRejectsStockWrite:true,recoveryPreservesUnrelatedBusinessTrigger:true,stockWriteAndBusinessAuditWorkAfterDisable:true,seoRpcDeniedAfterDisable:true,
    limitations:['Synthetic in-memory data, not hosted load or real checkout.','Successful local timing does not guarantee production completion.','Recovery deliberately stops SEO synchronization and editing until reconciliation/re-enable.']};
  const file=`artifacts/seo-migration/transaction-recovery-${Date.now()}.json`;
  writeFileSync(file,JSON.stringify(result,null,2),{flag:'wx'});console.log(JSON.stringify({file,...result}));
} finally { await db.close(); }
