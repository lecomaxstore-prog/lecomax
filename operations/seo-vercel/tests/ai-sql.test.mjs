import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { deterministicBundle } from '../lib/seo-ai-provider.mjs';
import { runSeoAi } from '../lib/seo-ai-worker.mjs';

test('durable AI deduplication, reservation limits, approvals, fencing and role isolation',async()=>{
  const db=new PGlite();
  try {
    await db.exec(`create role anon;create role authenticated;create role service_role;
      create table products(id text primary key,name text,slug text,active boolean,stock integer);
      create table categories(id text primary key,name text,slug text,active boolean);
      insert into products values('one','Casque','casque',true,5),('two','Clavier','clavier',true,4);`);
    for(const file of ['supabase/alternatives/202610180002_seo_decoupled.sql','operations/seo-vercel/supabase/migrations/20261018193508_seo_worker_run_control.sql','operations/seo-vercel/supabase/migrations/202610190001_seo_ai_budget.sql'])await db.exec(readFileSync(new URL('../../../'+file,import.meta.url),'utf8'));
    const rpc=async(name,args=[]) => (await db.query(`select ${name}(${args.map((_,i)=>'$'+(i+1)).join(',')}) result`,args)).rows[0].result;
    const request=async(name,args)=>{try{return {data:await rpc(name,Object.values(args)),error:null};}catch{return {data:null,error:'SQL'};}};
    const first=await rpc('seo_ai_enqueue',['product','one','routine','Routine','owner']);
    assert.equal((await rpc('seo_ai_enqueue',['product','one','routine','Again','owner'])).id,first.id);
    await assert.rejects(rpc('seo_ai_enqueue',['product','one','advanced','short','owner']),/SEO_AI_INPUT/);
    const token=await rpc('begin_seo_run');
    assert.equal(await rpc('seo_ai_claim',[token,0]),null,'default disabled');
    await rpc('seo_ai_set_budget',[true,0.01,false,'owner']);
    const claim=await rpc('seo_ai_claim',[token,0]);assert.equal(claim.id,first.id);
    await rpc('seo_ai_enqueue',['product','two','routine','Routine','owner']);
    assert.equal(await rpc('seo_ai_claim',[token,0]),null,'pending reservation consumes cap');
    const bundle=deterministicBundle(claim.payload);
    const usage=[{provider:'openai',model:'gpt-6-luna',input:1000,output:400,cached:0,usd:0.0003,uncertain:false}];
    assert.equal(await rpc('seo_ai_finish',[token,claim.id,bundle,'openai',usage]),true);
    assert.equal(await rpc('seo_ai_finish',[token,claim.id,bundle,'openai',usage]),false,'duplicate completion cannot charge twice');
    const cached=await rpc('seo_ai_enqueue',['product','one','routine','Again','owner']);assert.equal(cached.reused,true);assert.deepEqual(cached.result,bundle);
    assert.equal(await rpc('seo_ai_claim',[token,0]),null,'remaining .0097 is below reservation');
    const summary=await rpc('seo_ai_dashboard',['product','one']);assert.equal(Number(summary.estimatedUsd),0.0003);assert.equal(summary.inputTokens,1000);
    await rpc('seo_run_step',[token,'reconcile_seo_queue',{}]);
    for(let i=0;i<2;i++){const j=await rpc('seo_run_step',[token,'claim_seo_job',{}]);await rpc('seo_run_step',[token,'complete_seo_job',{p_kind:j.kind,p_entity_id:j.entity_id,p_token:j.lease_token}]);}
    let version=(await db.query("select version from seo_documents where entity_id='one'")).rows[0].version;
    await rpc('seo_ai_approve',[first.id,version,'owner']);
    assert.equal((await db.query('select count(*)::int n from seo_ai_approvals')).rows[0].n,1);
    assert.equal((await db.query("select published->>'title' title from seo_documents where entity_id='one'")).rows[0].title,bundle.fr.title);
    await db.exec("update products set name='Changed' where id='one'");
    await assert.rejects(rpc('seo_ai_approve',[first.id,version,'owner']),/SEO_SOURCE_CHANGED/);
    assert.equal((await db.query('select result from seo_ai_approvals')).rows[0].result.ar.title,bundle.ar.title,'approval archive retained');
    await rpc('seo_ai_set_budget',[true,1,false,'owner']);
    const worked=await runSeoAi(request,token,{env:{},generate:async job=>({bundle:deterministicBundle(job.payload),provider:'deterministic',usage:[]})});
    assert.equal(worked.processed,1);
    await db.exec("update seo_worker_control set lease_until=now()-interval '1 second'");
    await assert.rejects(rpc('seo_ai_claim',[token,0]),/SEO_RUN_EXPIRED/);
    for(const role of ['anon','authenticated','service_role']) {
      await db.exec(`set role ${role}`);
      await assert.rejects(db.query('select * from seo_ai_jobs'),/permission denied/);
      if(role!=='service_role')await assert.rejects(rpc('seo_ai_dashboard',[null,null]),/permission denied/);
      await db.exec('reset role');
    }
    assert.equal((await db.query("select count(*)::int n from pg_trigger where not tgisinternal and tgrelid in ('products'::regclass,'categories'::regclass)")).rows[0].n,0);
    assert.equal((await db.query("select stock from products where id='one'")).rows[0].stock,5);
  }finally{await db.close();}
});
