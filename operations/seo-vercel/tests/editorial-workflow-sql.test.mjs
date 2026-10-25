import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import {shoeFixture} from './editorial-quality-fixtures.mjs';
const files = ['supabase/alternatives/202610180002_seo_decoupled.sql', ...['20261018193508_seo_worker_run_control','202610190001_seo_ai_budget','202610190002_seo_editorial','202610190003_seo_editorial_review','202610190004_seo_editorial_workflow'].map(name=>`operations/seo-vercel/supabase/migrations/${name}.sql`)];
const checks={facts:true,french:true,arabic:true,duplicates:true};
async function fixture() {
  const db=new PGlite();
  const {source,draft}=shoeFixture();
  await db.exec(`create role anon;create role authenticated;create role service_role;
    alter default privileges in schema public grant all on tables to public,anon,authenticated,service_role;
    alter default privileges in schema public grant all on sequences to public,anon,authenticated,service_role;
    create table products(id text primary key,name text,slug text,active boolean,description text,brand text,category text,images jsonb,stock integer);
    create table categories(id text primary key,name text,slug text,active boolean);`);
  await db.query('insert into products values($1,$2,$3,true,$4,$5,$6,\'[]\',7)', ['one',source.name,'fixture',source.description,source.brand,source.category]);
  for(const file of files) await db.exec(readFileSync(new URL('../../../'+file,import.meta.url),'utf8'));
  await db.exec("select sync_seo_document('product',to_jsonb(p)) from products p");
  const rpc=async(name,args=[]) => (await db.query(`select ${name}(${args.map((_,i)=>'$'+(i+1)).join(',')}) value`,args)).rows[0].value;
  const read=()=>rpc('seo_editorial_read',['one']);
  const mutate=async(action,overrides={})=>{
    const state=overrides.state??await read();
    return rpc('seo_editorial_mutate',['one',state.version,state.revision,state.source,action,overrides.content??draft,overrides.job??null,overrides.event??null,overrides.checklist??checks,'Reviewed synthetic fixture only','editor@example.invalid']);
  };
  return {db,draft,rpc,read,mutate};
}
test('drafts persist bilingually, are immutable and fence stale saves and retries',async()=>{
  const f=await fixture();try {
    const initial=await f.read(), before=(await f.db.query('select * from products')).rows;
    const saved=await f.mutate('save');
    assert.equal(saved.revision,1);assert.equal(saved.version,initial.version+1);assert.deepEqual(saved.head.content,f.draft);
    await assert.rejects(f.mutate('save',{state:initial}),/CONFLICT/);
    const next={...f.draft,fr:{...f.draft.fr,title:'Correction française conservée'}};
    await f.mutate('save',{content:next});
    const revisions=(await f.read()).revisions;
    assert.equal(revisions.length,2);assert.deepEqual(revisions[1].content,f.draft);assert.deepEqual(revisions[0].content,next);
    assert.deepEqual((await f.db.query('select * from products')).rows,before);
    assert.equal((await f.db.query('select published from seo_documents')).rows[0].published,null);
    for(const content of [null,[],{}, {...f.draft,fr:{...f.draft.fr,title:'<script>'}}, {...f.draft,evidence:[null]}]) {
      assert.equal(await f.rpc('seo_editorial_draft_valid',[content]),false);
    }
  }finally{await f.db.close();}
});
test('publication requires latest exact revision review; edits and rejection invalidate approval',async()=>{
  const f=await fixture();try{
    await f.mutate('save');await assert.rejects(f.mutate('publish'),/REVIEW_REQUIRED/);
    await assert.rejects(f.mutate('approved',{checklist:{facts:true}}),/CHECKLIST/);
    await f.mutate('approved');await f.mutate('changes_requested');await assert.rejects(f.mutate('publish'),/REVIEW_REQUIRED/);
    await f.mutate('approved');await f.mutate('save');await assert.rejects(f.mutate('publish'),/REVIEW_REQUIRED/);
    await f.mutate('approved');const prior=await f.read();const result=await f.mutate('publish');
    assert.deepEqual(result.published,f.draft);assert.equal(result.version,prior.version+1);
    const d=(await f.db.query('select * from seo_documents')).rows[0];
    assert.equal(d.published.title,f.draft.fr.title);assert.equal(d.editorial_published.ar.productDescription,f.draft.ar.productDescription);
    await assert.rejects(f.mutate('publish',{state:prior}),/CONFLICT/);
    await f.mutate('save',{content:{...f.draft,fr:{...f.draft.fr,title:''}}});
    await assert.rejects(f.mutate('approved'),/CONTENT/);
  }finally{await f.db.close();}
});
test('source drift, deactivation and unsynchronized catalogue facts block mutations',async()=>{
  const f=await fixture();try{
    await f.mutate('save');await f.mutate('approved');const old=await f.read();
    await f.db.exec("update products set name='Changed source'");
    await assert.rejects(f.mutate('publish',{state:old}),/SOURCE_CHANGED/);
    await assert.rejects(f.mutate('save'),/SYNC_REQUIRED/);
    await f.db.exec("select sync_seo_document('product',to_jsonb(p)) from products p");
    await assert.rejects(f.mutate('publish'),/SOURCE_CHANGED/);
    await f.mutate('save');
    await f.db.exec('update products set active=false');await assert.rejects(f.mutate('save'),/SOURCE_CHANGED/);
  }finally{await f.db.close();}
});
test('rollback restores exact prior publication, preserves revisions and rejects wrong events or foreign changes',async()=>{
  const f=await fixture();try{
    await f.mutate('save');await f.mutate('approved');await f.mutate('publish');
    const first=await f.read();const firstEvent=first.events[0].id;
    const changed={...f.draft,fr:{...f.draft.fr,title:f.draft.fr.title+' A'}};
    await f.mutate('save',{content:changed});await f.mutate('approved');await f.mutate('publish');
    const second=await f.read();await assert.rejects(f.mutate('rollback',{event:firstEvent}),/ROLLBACK_CONFLICT/);
    const restored=await f.mutate('rollback',{event:second.events[0].id});
    assert.deepEqual(restored.published,f.draft);assert.deepEqual(restored.head.content,changed);assert.equal(restored.revisions.length,2);
    assert.equal(restored.events[0].related_event,second.events[0].id);
    await assert.rejects(f.mutate('rollback',{state:second,event:second.events[0].id}),/CONFLICT/);
    await assert.rejects(f.rpc('save_seo_document',['product','one',restored.version,'reset',null,'owner']),/WORKFLOW_REQUIRED/);
    // Simulate an out-of-band privileged change: rollback must refuse it too.
    await f.db.exec('update seo_documents set published=null,editorial_published=null');
    await assert.rejects(f.mutate('rollback',{event:restored.events[0].id}),/ROLLBACK_CONFLICT/);
  }finally{await f.db.close();}
});
test('first-publication rollback restores automatic metadata and changed-source snapshots cannot be restored',async()=>{
  const f=await fixture();try{
    await f.mutate('save');await f.mutate('approved');const published=await f.mutate('publish');
    const rolled=await f.mutate('rollback',{event:published.events[0].id});
    assert.equal(rolled.published,null);assert.equal((await f.db.query('select published from seo_documents')).rows[0].published,null);
    await f.db.exec("update products set description=description||' Extra source.';select sync_seo_document('product',to_jsonb(p)) from products p");
    await assert.rejects(f.mutate('rollback',{event:rolled.events[0].id}),/SOURCE_CHANGED/);
  }finally{await f.db.close();}
});
test('generation completion cannot write editorial revisions; explicit AI imports fence newer edits',async()=>{
  const f=await fixture();try{
    const job=await f.rpc('seo_ai_enqueue_v3',['product','one','editorial-sol','Offline editorial fixture','owner']);
    const initial=await f.read();await f.mutate('save');
    await f.rpc('seo_ai_set_budget',[true,5,false,'owner']);await f.rpc('seo_ai_authorize',[job.id,0.05,'owner']);
    const run=await f.rpc('begin_seo_run');await f.rpc('seo_ai_claim_editorial_v3',[run,0]);
    const generated={...f.draft,editorialVersion:3,reviewRequired:true};
    assert.equal(await f.rpc('seo_ai_finish',[run,job.id,generated,'openai',[]]),true);
    assert.equal((await f.read()).revision,1);assert.deepEqual((await f.read()).head.content,f.draft);
    await assert.rejects(f.mutate('save',{state:initial,job:job.id}),/CONFLICT/);
    const imported=await f.mutate('save',{job:job.id});assert.equal(imported.revision,2);
    await assert.rejects(f.mutate('save',{job:job.id,content:{...f.draft,fr:{...f.draft.fr,title:'forged'}}}),/JOB_CHANGED/);
    await assert.rejects(f.rpc('seo_ai_approve',[job.id,imported.version,'owner']),/HUMAN_REVIEW_REQUIRED/);
  }finally{await f.db.close();}
});
test('default grants cannot expose private revisions/events or allow direct writes; history paginates',async()=>{
  const f=await fixture();try{
    for(const role of ['anon','authenticated','service_role']){
      for(const table of ['seo_editorial_revisions','seo_editorial_events']) {
        assert.equal((await f.db.query("select has_table_privilege($1,$2,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') ok",[role,table])).rows[0].ok,false);
      }
      assert.equal((await f.db.query("select has_sequence_privilege($1,'seo_editorial_events_id_seq','USAGE,SELECT,UPDATE') ok",[role])).rows[0].ok,false);
      assert.equal((await f.db.query("select has_function_privilege($1,'seo_editorial_read(text,integer,bigint)','EXECUTE') ok",[role])).rows[0].ok,role==='service_role');
      assert.equal((await f.db.query("select has_function_privilege($1,'seo_editorial_mutate(text,integer,integer,jsonb,text,jsonb,uuid,bigint,jsonb,text,text)','EXECUTE') ok",[role])).rows[0].ok,role==='service_role');
    }
    for(let i=0;i<32;i++)await f.mutate('save');
    const current=await f.read();assert.equal(current.revisions.length,20);assert.equal(current.events.length,30);
    const older=await f.rpc('seo_editorial_read',['one',current.revisions.at(-1).revision,current.events.at(-1).id]);
    assert.equal(older.revisions.length,12);assert.equal(older.events.length,2);assert.equal(older.revision,32);
    const before=await f.read();await f.db.exec('begin');await f.mutate('save');await f.db.exec('rollback');assert.deepEqual(await f.read(),before);
  }finally{await f.db.close();}
});
test('legacy approval cannot bypass editorial review or overwrite editorial publication',async()=>{
  const f=await fixture();try{
    await f.mutate('save');await f.mutate('approved');const published=await f.mutate('publish');
    const manual={title:'Manual metadata title',description:'Manual description',imageAlt:'Manual image'};
    const saved=await f.rpc('save_seo_document',['product','one',published.version,'draft',manual,'owner']);
    assert.deepEqual((await f.read()).published,f.draft);
    await assert.rejects(f.rpc('save_seo_document',['product','one',saved.version,'approve',null,'owner']),/WORKFLOW_REQUIRED/);
    assert.deepEqual((await f.read()).published,f.draft);assert.deepEqual((await f.read()).head.content,f.draft);
    const routine=await f.rpc('seo_ai_enqueue',['product','one','routine','Old suggestion','owner']);
    await f.db.query("update seo_ai_jobs set state='completed',result=$1,provider='deterministic' where id=$2",[{fr:f.draft.fr,ar:f.draft.ar},routine.id]);
    const versionBefore=(await f.read()).version;
    await assert.rejects(f.rpc('seo_ai_approve',[routine.id,versionBefore,'owner']),/WORKFLOW_REQUIRED/);
    assert.equal((await f.read()).version,versionBefore);
    assert.equal((await f.read()).events.length,3);
    await assert.rejects(f.mutate('rollback',{event:published.events[0].id}),/ROLLBACK_CONFLICT/);
    const allBefore=(await f.db.query('select * from seo_editorial_events order by id')).rows;
    await assert.rejects(f.mutate('save',{job:'00000000-0000-4000-8000-000000000001'}),/JOB_CHANGED/);
    assert.deepEqual((await f.db.query('select * from seo_editorial_events order by id')).rows,allBefore);
  }finally{await f.db.close();}
});
test('noneditorial entities retain legacy draft, approval and reset behavior',async()=>{
  const f=await fixture();try{
    const initial=await f.read();const content={title:'Legacy title',description:'Legacy description',imageAlt:'Legacy image'};
    const saved=await f.rpc('save_seo_document',['product','one',initial.version,'draft',content,'owner']);
    const approved=await f.rpc('save_seo_document',['product','one',saved.version,'approve',null,'owner']);
    assert.deepEqual(approved.published,content);assert.equal(approved.editorial_published,null);
    const reset=await f.rpc('save_seo_document',['product','one',approved.version,'reset',null,'owner']);assert.equal(reset.published,null);
    assert.equal((await f.read()).revision,0);
  }finally{await f.db.close();}
});

test('suggestion dashboard filters exact product identity and its RPC remains private',async()=>{
  const f=await fixture();try {
    await f.db.exec("insert into products select 'two',name,'two',active,description,brand,category,images,stock from products where id='one';insert into categories values('one','Fixture category','category',true);select sync_seo_document('product',to_jsonb(p)) from products p where id='two';select sync_seo_document('category',to_jsonb(c)) from categories c;");
    const own=await f.rpc('seo_ai_enqueue_v3',['product','one','editorial-sol','Synthetic editorial request for product one','editor']);
    await f.rpc('seo_ai_enqueue_v3',['product','two','editorial-sol','Synthetic editorial request for product two','editor']);
    await f.rpc('seo_ai_enqueue',['category','one','routine','Synthetic category request','editor']);
    const result=await f.rpc('seo_ai_dashboard_v3',['product','one']);assert.deepEqual(result.jobs.map(j=>j.id),[own.id]);
    for(const role of ['anon','authenticated']) {
      await f.db.exec('set role '+role);await assert.rejects(f.rpc('seo_ai_dashboard_v3',['product','one']),/permission denied/);await f.db.exec('reset role');
    }
  }finally{await f.db.close();}
});
