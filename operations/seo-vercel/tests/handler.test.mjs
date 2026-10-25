import { workerEnv } from './environment-fixture.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHandler } from '../lib/handler.mjs';

const env = workerEnv({ CRON_SECRET: 'offline-test-secret-with-at-least-32-characters', VERCEL_ENV: 'production',
  SEO_SYNC_ENABLED: 'true', SEO_SYNC_SUPABASE_URL: 'https://yddqwgdgeljkzfsmtein.supabase.co',
  SEO_SYNC_SERVICE_ROLE_KEY: 'offline-fixture-service-key' });
test('AI queue is capped at three and stops claiming when time reserve is exhausted', async () => {
  for (const slow of [false,true]) {
    let aiClaims=0,time=0;
    const handler=createHandler({env:{...env,SEO_AI_ENABLED:'true'},now:()=>time,log:()=>{},fetcher:async(url,init)=>{
      if(url.endsWith('begin_seo_run'))return Response.json('run');
      if(url.endsWith('finish_seo_run'))return Response.json(true);
      if(url.endsWith('seo_ai_claim')){aiClaims++;return Response.json({id:String(aiClaims),payload:{name:'Fixture'},tier:'routine',primary_reserve:.01,allow_fallback:false});}
      if(url.endsWith('seo_ai_finish')){if(slow)time=20_000;return Response.json(true);}
      const args=JSON.parse(init.body);return Response.json(args.p_operation==='reconcile_seo_queue'?0:null);
    }});
    const res={setHeader(){},status(code){this.code=code;return this;},json(body){this.body=body;}};
    await handler({method:'GET',headers:{authorization:`Bearer ${env.CRON_SECRET}`}},res);
    assert.equal(res.code,200);assert.equal(aiClaims,slow?1:3);assert.equal(res.body.ai.processed,aiClaims);
  }
});
test('portable production opt-in does not bypass a Vercel preview guard', async () => {
  const portable=await invoke({env:{...env,VERCEL_ENV:undefined,SEO_RUNTIME_ENV:'production'}});
  assert.equal(portable.res.code,200);
  const preview=await invoke({env:{...env,VERCEL_ENV:'preview',SEO_RUNTIME_ENV:'production'}});
  assert.equal(preview.res.code,503);assert.equal(preview.calls.length,0);
});
async function invoke(options = {}, req = {}) {
  const calls = [], logs = [];
  const res = { headers: {}, setHeader(k,v) { this.headers[k]=v; }, status(s) { this.code=s; return this; }, json(b) { this.body=b; return this; } };
  const stepFetcher = options.fetcher ?? (async (url, init) => {
    calls.push({ url, init });
    return Response.json(url.endsWith('reconcile_seo_queue') ? 0 : null);
  });
  const handler = createHandler({ env, log: e => logs.push(e), ...options, fetcher: options.controlFetcher ?? (async (url, init) => {
    if (url.endsWith('begin_seo_run')) return Response.json('fixture-run-token');
    if (url.endsWith('finish_seo_run')) return Response.json(true);
    const body=JSON.parse(init.body);
    return stepFetcher(url.replace('seo_run_step',body.p_operation),{...init,body:JSON.stringify(body.p_args)});
  }) });
  await handler({ method: 'GET', headers: { authorization: `Bearer ${env.CRON_SECRET}` }, ...req }, res);
  return { res, calls, logs };
}
test('unauthorized and unsupported requests cannot reach the database', async () => {
  for (const req of [{ headers: {} }, { headers: { authorization: 'Bearer wrong' } }, { method: 'POST' }]) {
    const r = await invoke({}, req);
    assert.ok([401,405].includes(r.res.code)); assert.equal(r.calls.length,0);
  }
});
test('disabled, preview, missing-secret and wrong-target deployments fail closed', async () => {
  for (const patch of [{ SEO_SYNC_ENABLED:'false' }, { VERCEL_ENV:'preview' }, { CRON_SECRET:'' },
    { SEO_SYNC_SUPABASE_URL:'https://untrusted.invalid' }, { SEO_SYNC_SERVICE_ROLE_KEY:'' }]) {
    const r=await invoke({ env:{...env,...patch} });
    assert.equal(r.res.code,503); assert.equal(r.calls.length,0);
  }
});
test('empty queue performs only authenticated reconciliation and claim', async () => {
  const r=await invoke(); assert.equal(r.res.code,200); assert.equal(r.calls.length,2);
  assert.equal(r.res.headers['Cache-Control'],'private, no-store');
  assert.equal(r.calls[0].init.method,'POST'); assert.equal(r.calls[0].init.redirect,'error');
  assert.equal(r.calls[0].init.headers.apikey,env.SEO_SYNC_SERVICE_ROLE_KEY);
  assert.ok(r.calls[0].init.signal instanceof AbortSignal);
  assert.equal(JSON.stringify(r.logs).includes(env.SEO_SYNC_SERVICE_ROLE_KEY),false);
});
test('successful job is acknowledged and queue processing stops when empty', async () => {
  const names=[]; let claimed=false;
  const r=await invoke({fetcher:async url=>{
    const name=url.split('/').at(-1); names.push(name);
    if(name==='claim_seo_job') { if(claimed)return Response.json(null); claimed=true; return Response.json({kind:'product',entity_id:'fixture',lease_token:'token'}); }
    return Response.json(name==='reconcile_seo_queue'?1:true);
  }});
  assert.equal(r.res.code,200); assert.equal(r.res.body.completed,1);
  assert.deepEqual(names,['reconcile_seo_queue','claim_seo_job','complete_seo_job','claim_seo_job']);
});
test('generation failure is acknowledged for durable retry with sanitized output', async () => {
  const names=[]; let claimed=false;
  const r=await invoke({fetcher:async url=>{
    const name=url.split('/').at(-1); names.push(name);
    if(name==='claim_seo_job') { if(claimed)return Response.json(null); claimed=true; return Response.json({kind:'product',entity_id:'fixture',lease_token:'token'}); }
    if(name==='complete_seo_job')return new Response('secret error details',{status:500});
    return Response.json(true);
  }});
  assert.equal(r.res.code,503); assert.equal(r.res.body.failed,1); assert.ok(names.includes('fail_seo_job'));
  assert.equal(JSON.stringify(r).includes('secret error details'),false);
});
test('deadline prevents further RPCs and leaves durable leases to recover', async () => {
  let time=0, count=0;
  const r=await invoke({ now:()=>time, budgetMs:100, fetcher:async()=>{count++;time=101;return Response.json(0);} });
  assert.equal(count,1); assert.equal(r.res.code,503); assert.equal(r.res.body.error,'SEO_SYNC_RUN_FAILED');
});
test('upstream exceptions never expose secrets', async () => {
  const r=await invoke({fetcher:async()=>{throw Error(env.SEO_SYNC_SERVICE_ROLE_KEY);}});
  assert.equal(r.res.code,503); assert.equal(JSON.stringify(r).includes(env.SEO_SYNC_SERVICE_ROLE_KEY),false);
});
test('package remains unscheduled and orchestration matches reviewed original', () => {
  const config=JSON.parse(readFileSync(new URL('../vercel.json',import.meta.url)));
  assert.deepEqual(config.crons,[]); assert.equal(config.functions['api/sync.mjs'].maxDuration,60);
  const schedule=JSON.parse(readFileSync(new URL('../schedule.hobby.json',import.meta.url)));
  assert.equal(schedule.enabled,false); assert.equal(schedule.cron.schedule,'0 3 * * *');
  const original=readFileSync(new URL('../../../scripts/seo-sync-worker.mjs',import.meta.url),'utf8');
  const core=readFileSync(new URL('../lib/seo-sync-worker.mjs',import.meta.url),'utf8');
  assert.equal(core,original.slice(original.indexOf('// A separate scheduler'),original.indexOf('if (process.argv[1]')));
});

test('bounded batch leaves additional jobs for the next invocation', async () => {
  let claims=0, completions=0;
  const r=await invoke({fetcher:async url=>{
    if(url.endsWith('claim_seo_job')) { claims++; return Response.json({kind:'product',entity_id:String(claims),lease_token:'fixture'}); }
    if(url.endsWith('complete_seo_job'))completions++;
    return Response.json(true);
  }});
  assert.equal(r.res.code,200); assert.equal(claims,100); assert.equal(completions,100);
  assert.equal(r.res.body.batchLimitReached,true);
});

test('near deadline stops before claiming a lease and reports deferred work', async () => {
  let time=0, calls=0;
  const r=await invoke({now:()=>time,fetcher:async()=>{calls++;time=16_000;return Response.json(38);}});
  assert.equal(calls,1); assert.equal(r.res.code,200); assert.equal(r.res.body.budgetExhausted,true);
  assert.equal(r.res.body.completed,0);
});

test('lost completion response cannot acknowledge a superseded lease as success', async () => {
  let claimed=false;
  const r=await invoke({fetcher:async url=>{
    if(url.endsWith('claim_seo_job')) { if(claimed)return Response.json(null);claimed=true;return Response.json({kind:'product',entity_id:'fixture',lease_token:'old-token'}); }
    if(url.endsWith('complete_seo_job'))return Response.json(false);
    return Response.json(0);
  }});
  assert.equal(r.res.body.completed,0);assert.equal(r.res.body.superseded,1);
});

test('a concurrent run is rejected before reconciliation', async () => {
  const names=[];
  const r=await invoke({controlFetcher:async url=>{names.push(url.split('/').at(-1));return Response.json(null);}});
  assert.equal(r.res.code,409);assert.deepEqual(names,['begin_seo_run']);
});

test('unavailable run control fails closed', async () => {
  const names=[];
  const r=await invoke({controlFetcher:async url=>{names.push(url.split('/').at(-1));return new Response('',{status:500});}});
  assert.equal(r.res.code,503);assert.deepEqual(names,['begin_seo_run']);
});
