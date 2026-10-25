import { workerEnv } from './environment-fixture.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHandler } from '../lib/handler.mjs';

test('failure diagnostics distinguish execution stage and confirmed versus uncertain finalization without secrets',async()=>{
  for(const stage of ['acquire','synchronize','generate','finalize']) for(const recovery of ['confirmed','false','throw']) {
    const logs=[];let finishCalls=0;
    const env = workerEnv({CRON_SECRET:'synthetic-secret-at-least-32-characters',SEO_RUNTIME_ENV:'production',SEO_SYNC_ENABLED:'true',SEO_AI_ENABLED:'true',SEO_SYNC_SUPABASE_URL:'https://yddqwgdgeljkzfsmtein.supabase.co',SEO_SYNC_SERVICE_ROLE_KEY:'private-key'});
    const handler=createHandler({env,log:e=>logs.push(e),fetcher:async(url,init)=>{
      const name=url.split('/').at(-1);
      if(name==='begin_seo_run'){if(stage==='acquire')throw Error('private-error');return Response.json('private-token');}
      if(name==='seo_run_step'){if(stage==='synchronize')throw Error('private-error');return Response.json(JSON.parse(init.body).p_operation==='reconcile_seo_queue'?0:null);}
      if(name==='seo_ai_claim'){if(stage==='generate')throw Error('private-error');return Response.json(null);}
      if(name==='finish_seo_run'){
        finishCalls++;
        if(stage==='finalize'&&finishCalls===1)throw Error('private-error');
        if(recovery==='throw')throw Error('private-error');
        return Response.json(recovery==='confirmed');
      }
      throw Error('unexpected operation');
    }});
    const res={setHeader(){},status(code){this.code=code;return this;},json(body){this.body=body;}};
    await handler({method:'GET',headers:{authorization:`Bearer ${env.CRON_SECRET}`}},res);
    assert.equal(res.code,503);assert.equal(res.body.stage,stage);
    assert.equal(res.body.finalization,stage==='acquire'?'not-attempted':recovery==='confirmed'?'confirmed':'unconfirmed');
    assert.deepEqual(logs,[res.body]);assert.doesNotMatch(JSON.stringify(logs),/private-/);
    assert.equal(finishCalls,stage==='acquire'?0:stage==='finalize'?2:1);
  }
});

test('throwing, rejected and pending log sinks preserve committed success and sanitized failure', async () => {
  for (const failed of [false, true]) {
    for (const mode of ['throw', 'reject', 'pending']) {
      const calls=[];
      const env = workerEnv({CRON_SECRET:'offline-secret-at-least-32-characters',SEO_RUNTIME_ENV:'production',SEO_SYNC_ENABLED:'true',SEO_SYNC_SUPABASE_URL:'https://yddqwgdgeljkzfsmtein.supabase.co',SEO_SYNC_SERVICE_ROLE_KEY:'fixture-only'});
      const handler=createHandler({env,log:()=>{
        if(mode==='pending')return new Promise(()=>{});
        if(mode==='reject')return Promise.reject(Error('private-log-error'));
        throw Error('private-log-error');
      },fetcher:async(url,init)=>{
        const op=url.split('/').at(-1);calls.push(op);
        if(op==='begin_seo_run')return Response.json('fixture-token');
        if(op==='finish_seo_run')return Response.json(true);
        if(failed)throw Error('private-storage-error');
        return Response.json(JSON.parse(init.body).p_operation==='reconcile_seo_queue'?0:null);
      }});
      const res={setHeader(){},status(code){this.code=code;return this;},json(body){this.body=body;}};
      await handler({method:'GET',headers:{authorization:`Bearer ${env.CRON_SECRET}`}},res);
      assert.equal(res.code,failed?503:200);
      assert.equal(calls.filter(x=>x==='finish_seo_run').length,1);
      assert.doesNotMatch(JSON.stringify(res.body),/private-|fixture-token|fixture-only/);
    }
  }
});
