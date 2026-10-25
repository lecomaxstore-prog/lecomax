import { workerEnv } from './environment-fixture.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { createHandler } from '../lib/handler.mjs';

// Repository-only integration dependency; it is not part of the worker deployment.
test('HTTP adapter persists SQL jobs, repeats idempotently and isolates generation failure', async () => {
  const db=new PGlite();
  try {
    await db.exec(`create role anon;create role authenticated;create role service_role;
      create table products(id text primary key,name text,slug text,description text,active boolean,stock integer);
      create table categories(id text primary key,name text,slug text,description text,active boolean);
      insert into products values('fixture','Fixture','fixture','Test',true,10);`);
    await db.exec(readFileSync(new URL('../../../supabase/alternatives/202610180002_seo_decoupled.sql',import.meta.url),'utf8'));
    await db.exec(readFileSync(new URL('../supabase/migrations/20261018193508_seo_worker_run_control.sql',import.meta.url),'utf8'));
    const env = workerEnv({CRON_SECRET:'offline-integration-secret-at-least-32-chars',VERCEL_ENV:'production',SEO_SYNC_ENABLED:'true',
      SEO_SYNC_SUPABASE_URL:'https://yddqwgdgeljkzfsmtein.supabase.co',SEO_SYNC_SERVICE_ROLE_KEY:'fixture'});
    const handler=createHandler({env,log:()=>{},fetcher:async(url,init)=>{
      const name=url.split('/').at(-1),args=Object.values(JSON.parse(init.body));
      assert.match(name,/^[a-z_]+$/);
      try {const result=await db.query(`select public.${name}(${args.map((_,i)=>'$'+(i+1)).join(',')}) result`,args);return Response.json(result.rows[0].result);}
      catch {return new Response('SQL_ERROR',{status:500});}
    }});
    async function run(){const res={setHeader(){},status(s){this.code=s;return this;},json(b){this.body=b;return this;}};await handler({method:'GET',headers:{authorization:`Bearer ${env.CRON_SECRET}`}},res);return res;}
    assert.equal((await run()).body.completed,1);
    let status=(await db.query('select seo_run_status() s')).rows[0].s;
    assert.equal(status.state,'completed');assert.equal(status.completed,1);assert.ok(status.finishedAt);
    const before=(await db.query('select * from seo_documents')).rows;
    assert.equal((await run()).body.completed,0);
    assert.deepEqual((await db.query('select * from seo_documents')).rows,before);
    await db.exec(`create or replace function public.sync_seo_document(p_kind text,p_row jsonb) returns void language plpgsql as $$ begin raise exception 'injected'; end $$;
      update products set name='Changed',stock=9 where id='fixture';`);
    const failed=await run();assert.equal(failed.code,503);assert.equal(failed.body.failed,1);
    assert.equal((await db.query('select state from seo_sync_queue')).rows[0].state,'retry');
    await db.exec("update products set stock=8 where id='fixture';insert into products values('new','New','new','Test',true,2)");
    assert.equal((await db.query("select stock from products where id='fixture'")).rows[0].stock,8);
    assert.equal((await db.query('select count(*)::int n from products')).rows[0].n,2);
    status=(await db.query('select seo_run_status() s')).rows[0].s;
    assert.equal(status.state,'failed');assert.equal(status.failed,1);
    const token=(await db.query('select begin_seo_run() token')).rows[0].token;
    assert.ok(token); assert.equal((await db.query('select begin_seo_run() token')).rows[0].token,null);
    assert.equal((await run()).code,409);
    await db.exec("update seo_worker_control set lease_until=now()-interval '1 second'");
    assert.equal((await db.query('select seo_run_status() s')).rows[0].s.state,'interrupted');
    const next=(await db.query('select begin_seo_run() token')).rows[0].token;
    assert.notEqual(next,token);
    await assert.rejects(db.query("select seo_run_step($1,'reconcile_seo_queue')",[token]),/SEO_RUN_EXPIRED/);
    assert.equal((await db.query('select finish_seo_run($1,false,false,false) done',[token])).rows[0].done,false);
    // AI cutoffs use the same durable partial-run flags as catalogue cutoffs.
    assert.equal((await db.query('select finish_seo_run($1,false,true,false) done',[next])).rows[0].done,true);
    assert.equal((await db.query('select seo_run_status() s')).rows[0].s.state,'partial');
    const limited=(await db.query('select begin_seo_run() token')).rows[0].token;
    assert.equal((await db.query('select finish_seo_run($1,false,false,true) done',[limited])).rows[0].done,true);
    assert.equal((await db.query('select seo_run_status() s')).rows[0].s.state,'partial');
    for (const role of ['anon','authenticated','service_role']) {
      const grants=(await db.query("select has_table_privilege($1,'seo_worker_control','SELECT,INSERT,UPDATE,DELETE') direct,has_function_privilege($1,'begin_seo_run()','EXECUTE') start,has_function_privilege($1,'reconcile_seo_queue()','EXECUTE') legacy",[role])).rows[0];
      assert.equal(grants.direct,false);assert.equal(grants.start,role==='service_role');assert.equal(grants.legacy,false);
    }
    assert.equal((await db.query("select relrowsecurity from pg_class where relname='seo_worker_control'")).rows[0].relrowsecurity,true);
    const checks=await db.exec(readFileSync(new URL('../supabase/run-control-postflight.sql',import.meta.url),'utf8'));
    for(const result of checks)for(const row of result.rows)if('passed' in row)assert.equal(row.passed,true,row.check_name);
  } finally {await db.close();}
});
