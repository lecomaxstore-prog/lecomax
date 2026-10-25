import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {createWorkerServer} from '../artifacts/seo-e-final-20261022/worker-runtime/node-server.mjs';
let fetchCalls=0;const secret='synthetic-worker-secret-32-characters-only';
const server=createWorkerServer({env:{APP_ENV:'production',NEXT_PUBLIC_APP_ENV:'production',SEO_RUNTIME_ENV:'production',SEO_SYNC_ENABLED:'false',CRON_SECRET:secret},fetcher:async()=>{fetchCalls++;throw Error('UNEXPECTED_NETWORK');},log(){}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
const checks=[];try{for(const [route,method,authorization,status]of [['/api/sync','GET','',401],['/api/sync','GET','Bearer '+secret,503],['/api/sync','POST','Bearer '+secret,405],['/missing','GET','',404]]){const r=await fetch(origin+route,{method,headers:{authorization}});assert.equal(r.status,status);await r.body?.cancel();checks.push({route,method,status});}assert.equal(fetchCalls,0);writeFileSync('artifacts/seo-e-final-20261022/worker-runtime.json',JSON.stringify({at:new Date().toISOString(),passed:true,checks,fetchCalls,scheduled:false,deployed:false},null,2),{flag:'wx'});console.log(JSON.stringify({passed:true,fetchCalls,checks}));}finally{await new Promise(r=>server.close(r));}
