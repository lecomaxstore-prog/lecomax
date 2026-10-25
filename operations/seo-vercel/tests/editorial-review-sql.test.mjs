import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { source, bundle } from './editorial-fixture.mjs';

test('v3 review persists immutable decisions, fences old workers and rejects stale or foreign drafts without publication', async () => {
  const db = new PGlite();
  try {
    await db.exec('create role anon;create role authenticated;create role service_role;create table products(id text primary key,name text,slug text,category text,brand text,description text,active boolean,stock integer);create table categories(id text primary key,name text,slug text,active boolean);');
    await db.query('insert into products values($1,$2,$3,$4,$5,$6,true,5)', ['one',source.name,source.slug,source.category,source.brand,source.description]);
    for (const file of ['supabase/alternatives/202610180002_seo_decoupled.sql','operations/seo-vercel/supabase/migrations/20261018193508_seo_worker_run_control.sql','operations/seo-vercel/supabase/migrations/202610190001_seo_ai_budget.sql','operations/seo-vercel/supabase/migrations/202610190002_seo_editorial.sql','operations/seo-vercel/supabase/migrations/202610190003_seo_editorial_review.sql']) await db.exec(readFileSync(new URL('../../../'+file,import.meta.url),'utf8'));
    const rpc = async (name,args=[]) => (await db.query(`select ${name}(${args.map((_,i)=>'$'+(i+1)).join(',')}) result`,args)).rows[0].result;
    await db.exec("select sync_seo_document('product',to_jsonb(p)) from products p");
    const before = (await db.query('select * from products')).rows;
    const job = await rpc('seo_ai_enqueue_v3',['product','one','editorial-sol','Offline migration review test','owner']);
    assert.equal((await db.query('select editorial_revision from seo_ai_jobs')).rows[0].editorial_revision,3);
    for (const role of ['anon','authenticated','service_role']) {
      assert.equal((await db.query("select has_function_privilege($1,'seo_ai_claim_editorial(uuid,numeric)','EXECUTE') ok",[role])).rows[0].ok,false);
      assert.equal((await db.query("select has_table_privilege($1,'seo_ai_editorial_reviews','UPDATE') ok",[role])).rows[0].ok,false);
    }
    await rpc('seo_ai_set_budget',[true,5,false,'owner']);
    await rpc('seo_ai_authorize',[job.id,0.05,'owner']);
    const token=await rpc('begin_seo_run');
    const claimed=await rpc('seo_ai_claim_editorial_v3',[token,0]);
    assert.equal(claimed.editorial_revision,3);
    const result={...bundle(),editorialVersion:3,reviewRequired:true};
    assert.equal(await rpc('seo_ai_finish',[token,job.id,result,'openai',[]]),true);
    const version=(await db.query("select version from seo_documents where entity_id='one'")).rows[0].version;
    const review=(decision='approved_for_publication',overrides={})=>rpc('seo_ai_review',[job.id,'product',overrides.id??'one',overrides.version??version,overrides.result??result,decision,overrides.checklist??{facts:true,french:true,arabic:true,duplicates:true},'Offline review notes','owner']);
    await assert.rejects(review('approved_for_publication',{id:'other'}),/RESULT_CHANGED/);
    await assert.rejects(review('approved_for_publication',{version:version+1}),/SOURCE_CHANGED/);
    await assert.rejects(review('approved_for_publication',{result:{...result,changed:true}}),/RESULT_CHANGED/);
    await assert.rejects(review('approved_for_publication',{checklist:{}}),/CHECKLIST/);
    assert.equal(await review(),true);
    assert.equal(await review('changes_requested'),true);
    const dashboard=await rpc('seo_ai_dashboard_v3',['product','one']);
    assert.equal(dashboard.jobs[0].reviews.length,2);
    await assert.rejects(rpc('seo_ai_approve',[job.id,version,'owner']),/HUMAN_REVIEW_REQUIRED/);
    assert.deepEqual((await db.query('select * from products')).rows,before);
    assert.equal((await db.query("select published from seo_documents where entity_id='one'")).rows[0].published,null);
    await db.query("update products set name='Changed source' where id='one'");
    await assert.rejects(review(),/SOURCE_CHANGED/);
  } finally { await db.close(); }
});
