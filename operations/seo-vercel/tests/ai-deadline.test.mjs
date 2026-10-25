import { workerEnv } from './environment-fixture.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { runSeoAi } from '../lib/seo-ai-worker.mjs';
import { createHandler } from '../lib/handler.mjs';

test('slow AI claim cannot start generation or acknowledge an ungenerated result', async () => {
  let generated = 0;
  const calls = [];
  await assert.rejects(runSeoAi(async name => {
    calls.push(name); return {data:{id:'synthetic-job'},error:null};
  }, 'synthetic-token', {env:{}, canGenerate:()=>false, generate:async()=>{generated++;}}), /SEO_AI_TIME_BOUND/);
  assert.equal(generated,0);
  assert.deepEqual(calls,['seo_ai_claim']);
});

const env = workerEnv({CRON_SECRET:'synthetic-secret-at-least-thirty-two-characters',SEO_RUNTIME_ENV:'production',SEO_SYNC_ENABLED:'true',SEO_AI_ENABLED:'true',SEO_SYNC_SUPABASE_URL:'https://yddqwgdgeljkzfsmtein.supabase.co',SEO_SYNC_SERVICE_ROLE_KEY:'synthetic-key'});
async function scenario({claimMs=0,finishMs=0,empty=false}={}) {
  let time=0,claims=0;const calls=[];
  const handler=createHandler({env,now:()=>time,log:()=>{},fetcher:async(url,init)=>{
    const name=url.split('/').at(-1),body=JSON.parse(init.body);calls.push({name,body});
    if(name==='begin_seo_run')return Response.json('synthetic-token');
    if(name==='finish_seo_run')return Response.json(true);
    if(name==='seo_ai_claim'){
      claims++;time+=claimMs;
      return Response.json(empty?null:{id:'synthetic-job',payload:{name:'Fixture'},tier:'routine',primary_reserve:.01,allow_fallback:false});
    }
    if(name==='seo_ai_finish'){time+=finishMs;return Response.json(true);}
    return Response.json(body.p_operation==='reconcile_seo_queue'?0:null);
  }});
  const res={setHeader(){},status(code){this.code=code;return this;},json(body){this.body=body;}};
  await handler({method:'GET',headers:{authorization:`Bearer ${env.CRON_SECRET}`}},res);
  return {res,calls,claims,final:calls.find(c=>c.name==='finish_seo_run').body};
}

test('post-claim reserve exhaustion finalizes as failed/budget-bounded without generation settlement',async()=>{
  const r=await scenario({claimMs:21_000});
  assert.equal(r.res.code,503);assert.equal(r.final.p_failed,true);assert.equal(r.final.p_budget,true);
  assert.equal(r.claims,1);assert.equal(r.calls.some(c=>c.name==='seo_ai_finish'),false);
  assert.doesNotMatch(JSON.stringify(r.res.body),/synthetic-key|synthetic-token/);
});

test('AI time and batch limits persist partial status; a known empty queue stays complete',async()=>{
  const timed=await scenario({finishMs:20_000});
  assert.equal(timed.res.code,200);assert.equal(timed.claims,1);
  assert.equal(timed.final.p_budget,true);assert.equal(timed.res.body.ai.budgetExhausted,true);
  const capped=await scenario();
  assert.equal(capped.claims,3);assert.equal(capped.final.p_limit,true);
  assert.equal(capped.res.body.ai.batchLimitReached,true);
  const empty=await scenario({empty:true});
  assert.equal(empty.claims,1);assert.equal(empty.final.p_budget,false);assert.equal(empty.final.p_limit,false);
});
