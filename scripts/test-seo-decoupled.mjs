import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';
import { runSeoSync } from './seo-sync-worker.mjs';

// No env loading, network calls or hosted credentials. Execute actual SQL/RPCs.
const db = new PGlite();
const migration = readFileSync('supabase/alternatives/202610180002_seo_decoupled.sql','utf8');
const query = async (sql,args=[]) => (await db.query(sql,args)).rows;
const rpc = async (name,args={}) => {
  assert.match(name,/^[a-z_]+$/);
  const values=Object.values(args);
  try { return {data:(await query(`select public.${name}(${values.map((_,i)=>'$'+(i+1)).join(',')}) result`,values))[0].result,error:null}; }
  catch(error) { return {data:null,error}; }
};
const call = async (name,args={}) => { const r=await rpc(name,args); if(r.error) throw r.error; return r.data; };
const jobArgs = job => ({p_kind:job.kind,p_entity_id:job.entity_id,p_token:job.lease_token});
const queue = async () => (await query("select * from seo_sync_queue where kind='product' and entity_id='1'"))[0];
const doc = async () => (await query("select * from seo_documents where kind='product' and entity_id='1'"))[0];
try {
  const original=existsSync('supabase/audit/202610180001_seo_engine.sql')?'supabase/audit/202610180001_seo_engine.sql':'supabase/migrations/202610180001_seo_engine.sql';
  assert.equal(createHash('sha256').update(readFileSync(original)).digest('hex'),'958e8727fb9d5f32df6702b00cd17e1e0a2e71b98674f1523ae29e439af3332f');
  await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
    alter default privileges grant all on tables to anon,authenticated,service_role;
    alter default privileges grant all on sequences to anon,authenticated,service_role;
    alter default privileges grant execute on functions to anon,authenticated,service_role;
    create table products(id text primary key,name text,slug text,description text,category text,brand text,images text[],active boolean,stock integer);
    create table categories(id text primary key,name text,slug text,description text,image text,active boolean);
    create table inventory_audit(stock integer);
    create function inventory_audit() returns trigger language plpgsql as $$begin insert into inventory_audit values(new.stock); return new;end$$;
    create trigger business_inventory_audit after update of stock on products for each row execute function inventory_audit();
    insert into products values('1','Casque','casque','Audio','audio',null,array['/photo.jpg'],true,10);
    insert into categories values('c','Audio','audio','Accessoires',null,true);`);
  const before=await query('select * from products');
  await db.exec(migration);
  const postflight=await db.exec(readFileSync('supabase/verification/seo-decoupled-postflight.sql','utf8'));
  for(const result of postflight)for(const row of result.rows ?? [])if('passed' in row)assert.equal(row.passed,true,row.check_name);
  assert.deepEqual(await query('select * from products'),before);
  assert.deepEqual((await query("select tgname from pg_trigger where not tgisinternal order by tgname")).map(r=>r.tgname),['business_inventory_audit']);
  assert.equal((await query('select count(*)::int n from seo_documents'))[0].n,0,'installation does not backfill in a commerce transaction');
  let result=await runSeoSync(rpc);
  assert.equal(result.completed,2);assert.equal(result.failed,0);
  assert.equal((await doc()).source.name,'Casque');
  const version=(await doc()).version;
  result=await runSeoSync(rpc);assert.equal(result.completed,0);assert.equal(result.reconciled,0);
  await db.exec('update products set stock=stock-1');
  assert.equal(await call('reconcile_seo_queue'),0,'stock does not enqueue SEO work');
  assert.equal((await doc()).version,version);
  await db.exec("update products set name='Casque nouveau'");
  assert.equal((await doc()).source.name,'Casque','catalogue write does no SEO work');
  await call('reconcile_seo_queue');
  const first=await call('claim_seo_job');
  assert.equal(await call('claim_seo_job'),null,'leased work cannot be claimed twice');
  await db.exec("update products set name='Casque dernier'");
  await call('reconcile_seo_queue');
  assert.equal(await call('complete_seo_job',jobArgs(first)),false,'superseded token cannot acknowledge newer work');
  const second=await call('claim_seo_job');
  assert.equal(await call('complete_seo_job',jobArgs(second)),true);
  assert.equal(await call('complete_seo_job',jobArgs(second)),false,'duplicate completion is harmless');
  assert.equal((await doc()).source.name,'Casque dernier');
  assert.equal((await query("select count(*)::int n from seo_documents where kind='product' and entity_id='1'"))[0].n,1);

  // Permanent publication persists; stale source cannot approve an old draft.
  const content={title:'Titre approuvé',description:'Description vérifiée',imageAlt:'Casque'};
  let d=await doc();
  d=await call('save_seo_document',{kind:'product',id:'1',version:d.version,action:'draft',content,actor:'local-test'});
  d=await call('save_seo_document',{kind:'product',id:'1',version:d.version,action:'approve',content:null,actor:'local-test'});
  assert.deepEqual(d.published,content);
  await call('save_seo_document',{kind:'product',id:'1',version:d.version,action:'draft',content,actor:'local-test'});
  await db.exec("update products set description='Description changée'");await runSeoSync(rpc);
  d=await doc();assert.deepEqual(d.published,content,'approved history preserved');
  await assert.rejects(call('save_seo_document',{kind:'product',id:'1',version:d.version,action:'approve',content:null,actor:'local-test'}),/SEO_SOURCE_CHANGED/);

  // Inject a real SQL generation failure, then run the actual worker orchestrator.
  const originalSync=migration.slice(migration.indexOf('create function public.sync_seo_document'),migration.indexOf('create function public.save_seo_document')).trim();
  await db.exec(`create or replace function public.sync_seo_document(p_kind text,p_row jsonb) returns void language plpgsql as $$begin raise exception 'INJECTED_FAILURE';end$$;`);
  await db.exec("update products set name='Retry product',stock=stock-1");
  result=await runSeoSync(rpc);assert.equal(result.failed,1);
  assert.equal((await queue()).state,'retry');assert.equal((await queue()).attempts,1);
  assert.equal(await call('claim_seo_job'),null,'backoff prevents immediate busy retry');
  let q=await queue();assert.ok(Date.parse(q.available_at)-Date.parse(q.updated_at)>=14900);
  for(let attempt=2;attempt<=8;attempt++) {
    await db.exec("update seo_sync_queue set available_at=now()-interval '1 second' where state='retry'");
    result=await runSeoSync(rpc);assert.equal(result.failed,1);
    q=await queue();assert.equal(q.attempts,attempt);
    assert.ok(Date.parse(q.available_at)-Date.parse(q.updated_at)>=15*2**(attempt-1)*1000-100);
  }
  assert.equal((await queue()).state,'failed');assert.equal(await call('claim_seo_job'),null);
  assert.equal((await call('seo_sync_status')).failed,1);
  await db.exec(originalSync.replace('create function','create or replace function'));
  assert.equal(await call('retry_failed_seo_jobs'),1);await runSeoSync(rpc);
  assert.equal((await queue()).state,'completed');assert.equal((await doc()).source.name,'Retry product');

  // Worker death: reclaim expired lease; old worker can no longer commit.
  await db.exec("update products set name='Lease product'");await call('reconcile_seo_queue');
  const lost=await call('claim_seo_job');
  await db.exec("update seo_sync_queue set lease_until=now()-interval '1 second' where state='processing'");
  const reclaimed=await call('claim_seo_job');assert.notEqual(reclaimed.lease_token,lost.lease_token);
  assert.equal(await call('complete_seo_job',jobArgs(lost)),false);
  assert.equal(await call('complete_seo_job',jobArgs(reclaimed)),true);
  await db.exec("delete from products where id='1'");await runSeoSync(rpc);
  assert.equal((await doc()).active,false);assert.deepEqual((await doc()).published,content);
  await db.exec("insert into products(id,name,slug,active,stock) values('1','Restored','restored',true,2)");await runSeoSync(rpc);
  assert.equal((await doc()).active,true);assert.equal((await doc()).slug,'restored');

  // Queue failures do not affect product creation, edits or stock/business triggers.
  await db.exec(`create function test_queue_failure() returns trigger language plpgsql as $$begin raise exception 'QUEUE_OFFLINE';end$$;
    create trigger test_queue_failure before insert or update on seo_sync_queue for each row execute function test_queue_failure();
    insert into products(id,name,slug,active,stock) values('2','New product','new',true,4);
    update products set name='Edited',stock=stock-1 where id='2';`);
  await assert.rejects(call('reconcile_seo_queue'),/QUEUE_OFFLINE/);
  assert.equal((await query("select stock from products where id='2'"))[0].stock,3);
  assert.ok((await query('select count(*)::int n from inventory_audit'))[0].n>=3);
  await db.exec('drop trigger test_queue_failure on seo_sync_queue');await runSeoSync(rpc);
  assert.equal((await query("select source->>'name' name from seo_documents where entity_id='2'"))[0].name,'Edited');

  for(const role of ['anon','authenticated']) {
    await db.exec(`set role ${role}`);
    for(const table of ['seo_documents','seo_events','seo_sync_queue','seo_sync_health']) await assert.rejects(query(`select * from ${table}`),/permission denied/);
    for(const fn of ['reconcile_seo_queue','claim_seo_job','retry_failed_seo_jobs','seo_sync_status']) await assert.rejects(call(fn),/permission denied/);
    await assert.rejects(call('complete_seo_job',jobArgs(reclaimed)),/permission denied/);
    await assert.rejects(call('fail_seo_job',jobArgs(reclaimed)),/permission denied/);
    await assert.rejects(call('save_seo_document',{kind:'product',id:'1',version:1,action:'reset',content:null,actor:'attacker'}),/permission denied/);
    await db.exec('reset role');
  }
  await db.exec('set role service_role');
  await assert.rejects(query('delete from seo_sync_queue'),/permission denied/);
  await assert.rejects(query("select sync_seo_document('product','{}')"),/permission denied/);
  await assert.rejects(query("select setval('seo_events_id_seq',1)"),/permission denied/);
  await call('reconcile_seo_queue');await call('seo_sync_status');await db.exec('reset role');
  const saved=await query('select * from seo_documents order by kind,entity_id');
  await assert.rejects(db.exec(migration),/already exists/);await db.exec('rollback');
  assert.deepEqual(await query('select * from seo_documents order by kind,entity_id'),saved);
  assert.equal((await query("select count(*)::int n from pg_class where relname in ('seo_documents','seo_events','seo_sync_queue','seo_sync_health') and relrowsecurity"))[0].n,4);
  console.log('PASS: trigger-free installation, original hash, bulk backfill, create/update/delete, stock isolation, queue failure catch-up, worker retries/backoff/exhaustion/recovery, leases, stale tokens, duplicate prevention, permanent SEO, approval conflicts, RLS/grants and atomic migration rerun.');
} finally { await db.close(); }
