import { workerEnv } from './environment-fixture.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHandler } from '../lib/handler.mjs';
import { createWorkerServer } from '../node-server.mjs';

const env = workerEnv({CRON_SECRET:'test-only-secret-longer-than-thirty-two-characters',SEO_RUNTIME_ENV:'production',SEO_SYNC_ENABLED:'true',SEO_SYNC_SUPABASE_URL:'https://yddqwgdgeljkzfsmtein.supabase.co',SEO_SYNC_SERVICE_ROLE_KEY:'fixture'});
test('38-entity workload uses one invocation and 80 RPCs; unchanged run uses four',async()=>{
  for(const jobs of [38,0,3]) {
    let count=0,claimed=0,time=0;
    const handler=createHandler({env,now:()=>time,log:()=>{},fetcher:async(url,init)=>{
      count++;time+=100; // Model 100ms/RPC, not a hosted benchmark.
      if(url.endsWith('begin_seo_run'))return Response.json('token');
      if(url.endsWith('finish_seo_run'))return Response.json(true);
      const {p_operation}=JSON.parse(init.body);
      if(p_operation==='reconcile_seo_queue')return Response.json(jobs);
      if(p_operation==='claim_seo_job')return Response.json(claimed++<jobs?{kind:'product',entity_id:String(claimed),lease_token:'lease'}:null);
      assert.equal(p_operation,'complete_seo_job');return Response.json(true);
    }});
    const res={setHeader(){},status(code){this.code=code;return this;},json(body){this.body=body;}};
    await handler({method:'GET',headers:{authorization:`Bearer ${env.CRON_SECRET}`}},res);
    assert.equal(res.code,200);assert.equal(res.body.completed,jobs);assert.equal(count,4+2*jobs);
  }
});
test('portable HTTP adapter routes exactly and denies unauthorized requests without database calls',async()=>{
  let calls=0;
  const server=createWorkerServer({env,fetcher:async()=>{calls++;throw Error('must not call');}});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  try {
    const base=`http://127.0.0.1:${server.address().port}`;
    assert.equal((await fetch(base+'/api/sync')).status,401);
    assert.equal((await fetch(base+'/api/sync',{method:'POST'})).status,405);
    assert.equal((await fetch(base+'/api/sync?anything=1')).status,404);
    assert.equal(calls,0);
  } finally {server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});
