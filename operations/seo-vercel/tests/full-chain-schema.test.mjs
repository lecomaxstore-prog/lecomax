import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import planner from '../../../scripts/prepare-seo-minimal-staging.cjs';

// No URLs, credentials, filesystem database or network adapter: memory only.
const plan = planner.prepare();
const migrations = plan.migrations.map(({file}) => readFileSync(new URL('../../../'+file,import.meta.url),'utf8'));
async function fixture() {
  const db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create role service_role;
    create table products(id text primary key,name text,slug text,active boolean,description text,brand text,category text,images jsonb,stock integer);
    create table categories(id integer primary key,name text,slug text,active boolean,image text);
    insert into products values('p-fr','Casque Atlas','casque-atlas',true,'Casque audio filaire','Atlas','Audio','[]',7),
      ('p-ar','سماعة أطلس','atlas-ar',true,'سماعة سلكية','Atlas','Audio','[]',3);
    insert into categories values(1,'Audio','audio',true,null),(2,'الصوت','sound',true,'/synthetic.png');`);
  return db;
}
async function install(db) { for (const sql of migrations) await db.exec(sql); }
const rows = async (db,sql,args=[]) => (await db.query(sql,args)).rows;
const rpc = async (db,name,args=[]) => (await rows(db,`select ${name}(${args.map((_,i)=>'$'+(i+1)).join(',')}) value`,args))[0].value;
const rejectsCode = (db,sql,code) => assert.rejects(db.query(sql),error=>error.code===code);

test('full chain has exactly 11 RLS tables, valid indexes, three foreign keys and constrained defaults',async()=>{
  const db=await fixture();
  try {
    await install(db);
    const tables=await rows(db,"select relname,relrowsecurity from pg_class where relnamespace='public'::regnamespace and relkind='r' and relname like 'seo_%' order by relname");
    assert.deepEqual(tables.map(r=>r.relname),plan.createsSeoTables);
    assert.ok(tables.every(r=>r.relrowsecurity));
    const keys=await rows(db,"select c.relname,con.contype,con.convalidated from pg_constraint con join pg_class c on c.oid=con.conrelid where c.relnamespace='public'::regnamespace and c.relname like 'seo_%'");
    assert.equal(keys.filter(k=>k.contype==='p').length,11);
    assert.ok(keys.every(k=>k.convalidated));
    const fk=await rows(db,"select conrelid::regclass::text child,confrelid::regclass::text parent from pg_constraint where contype='f' order by child");
    assert.deepEqual(fk.map(r=>r.child),['seo_ai_approvals','seo_ai_editorial_reviews','seo_ai_request_authorizations']);
    assert.ok(fk.every(r=>r.parent==='seo_ai_jobs'));
    const indexes=await rows(db,"select c.relname,i.indisvalid,i.indisready from pg_index i join pg_class c on c.oid=i.indexrelid join pg_class t on t.oid=i.indrelid where t.relnamespace='public'::regnamespace and t.relname like 'seo_%'");
    assert.ok(indexes.every(i=>i.indisvalid&&i.indisready));
    for(const name of ['seo_documents_slug','seo_events_document','seo_sync_due','seo_ai_pending']) assert.ok(indexes.some(i=>i.relname===name));
    const settings=(await rows(db,'select * from seo_ai_settings'))[0];
    assert.equal(settings.enabled,false); assert.equal(settings.mirai_enabled,false);
    assert.equal(Number(settings.monthly_limit),0); assert.equal(Number(settings.lifetime_limit),50);
    for(const role of ['anon','authenticated','service_role']) {
      for(const {relname} of tables) {
        const grants=(await rows(db,'select has_table_privilege($1,$2,\'INSERT,UPDATE,DELETE,TRUNCATE\') writable',[role,relname]))[0];
        assert.equal(grants.writable,false,`${role} cannot write ${relname}`);
      }
      await db.exec(`set role ${role}`);
      try {
        await rejectsCode(db,'update seo_ai_settings set enabled=true','42501');
        if(role!=='service_role') await rejectsCode(db,'select * from seo_documents','42501');
        await rejectsCode(db,'select * from seo_ai_editorial_reviews','42501');
      } finally { await db.exec('reset role'); }
    }
    for(const sql of ['update seo_ai_settings set monthly_limit=5.01','update seo_ai_settings set monthly_limit=-1','update seo_ai_settings set lifetime_limit=50.01','update seo_ai_settings set external_spend=-1',"update seo_worker_control set state='invalid'",'update seo_sync_health set singleton=false']) await rejectsCode(db,sql,'23514');
    await rejectsCode(db,'insert into seo_ai_settings(singleton) values(true)','23505');
    await rejectsCode(db,"insert into seo_ai_approvals(job_id,actor,result) values('00000000-0000-0000-0000-000000000001','fixture','{}')",'23503');
    await rejectsCode(db,"insert into seo_ai_request_authorizations(job_id,actor,ceiling) values('00000000-0000-0000-0000-000000000001','fixture',0.05)",'23503');
    await rejectsCode(db,"insert into seo_ai_editorial_reviews(job_id,actor,decision,source,result,document_version,checklist,notes) values('00000000-0000-0000-0000-000000000001','fixture','changes_requested','{}','{}',1,'{}','fixture notes')",'23503');
    await rejectsCode(db,"insert into seo_documents(kind,entity_id,slug,source,fallback) values('invalid','x','x','{}','{}')",'23514');
    await rejectsCode(db,"insert into seo_documents(kind,entity_id,slug,source,fallback) values('product','x',null,'{}','{}')",'23502');
  } finally { await db.close(); }
});

test('synthetic French/Arabic products and integer category IDs synchronize without commerce changes',async()=>{
  const db=await fixture();
  try {
    const before=await rows(db,'select * from products order by id');
    const categories=await rows(db,'select * from categories order by id');
    await install(db);
    const token=await rpc(db,'begin_seo_run');
    assert.equal(await rpc(db,'seo_run_step',[token,'reconcile_seo_queue',{}]),4);
    for(let i=0;i<4;i++) {
      const job=await rpc(db,'seo_run_step',[token,'claim_seo_job',{}]);
      assert.ok(job);
      assert.equal(await rpc(db,'seo_run_step',[token,'complete_seo_job',{p_kind:job.kind,p_entity_id:job.entity_id,p_token:job.lease_token}]),true);
    }
    assert.equal(await rpc(db,'seo_run_step',[token,'claim_seo_job',{}]),null);
    assert.equal((await rows(db,'select count(*)::int n from seo_documents'))[0].n,4);
    assert.deepEqual(await rows(db,'select * from products order by id'),before);
    assert.deepEqual(await rows(db,'select * from categories order by id'),categories);
    const categorySource=await rpc(db,'seo_ai_source',['category','2']);
    assert.equal(categorySource.name,'الصوت');
    assert.equal(categorySource.image,'/synthetic.png');
    assert.equal(await rpc(db,'seo_run_step',[token,'reconcile_seo_queue',{}]),0);
    await db.exec("update products set stock=6 where id='p-fr'");
    assert.equal(await rpc(db,'seo_run_step',[token,'reconcile_seo_queue',{}]),0,'stock is excluded from metadata payload');
    const job=await rpc(db,'seo_ai_enqueue_v3',['product','p-fr','editorial-sol','Synthetic editorial request for tests','fixture']);
    await rejectsCode(db,"update seo_ai_jobs set editorial_revision=4",'23514');
    await rejectsCode(db,"update seo_ai_jobs set tier='invalid'",'23514');
    await rejectsCode(db,"update seo_ai_jobs set state='invalid'",'23514');
    const reused=await rpc(db,'seo_ai_enqueue_v3',['product','p-fr','editorial-sol','Synthetic repeated request for tests','fixture']);
    assert.equal(reused.id,job.id);
    await rejectsCode(db,"insert into seo_ai_jobs(kind,entity_id,source_key,payload,tier,reason,actor) select kind,entity_id,source_key,payload,tier,reason,actor from seo_ai_jobs",'23505');
    await db.query('insert into seo_ai_request_authorizations(job_id,actor,ceiling) values($1,$2,$3)',[job.id,'fixture',0.05]);
    await rejectsCode(db,'delete from seo_ai_jobs','23503');
    assert.equal((await rows(db,'select paid_authorized from seo_ai_jobs'))[0].paid_authorized,false);
    assert.equal(await rpc(db,'seo_ai_claim_editorial_v3',[token,0]),null);
  } finally { await db.close(); }
});

test('missing predecessor and repeated migrations fail atomically; full ordered chain recovers',async()=>{
  for(let i=1;i<migrations.length;i++) {
    const db=await fixture();
    try {
      await assert.rejects(db.exec(migrations[i]));
      await db.exec('rollback');
      assert.equal((await rows(db,"select count(*)::int n from pg_tables where schemaname='public' and tablename like 'seo_%'"))[0].n,0);
      await install(db);
      await assert.rejects(db.exec(migrations[i]));
      await db.exec('rollback');
      assert.equal((await rows(db,"select count(*)::int n from pg_tables where schemaname='public' and tablename like 'seo_%'"))[0].n,11);
    } finally { await db.close(); }
  }
});
