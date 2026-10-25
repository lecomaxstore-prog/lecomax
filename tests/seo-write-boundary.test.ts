import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {seoWritesAllowed} from '../operations/seo-vercel/lib/environment-target.mjs';
import {createHandler} from '../operations/seo-vercel/lib/handler.mjs';

const denied = [ {}, {APP_ENV:'staging'}, {APP_ENV:'preview'}, {APP_ENV:'unknown'},
  {APP_ENV:'Production'}, {APP_ENV:' production '}, {VERCEL_ENV:'preview'},
  {APP_ENV:'production',VERCEL_ENV:'preview'}, {APP_ENV:'staging',VERCEL_ENV:'production'},
  {APP_ENV:'production',NEXT_PUBLIC_APP_ENV:'staging'}, {APP_ENV:'production',SEO_RUNTIME_ENV:'staging'},
  {APP_ENV:'production',VERCEL_ENV:'production',VERCEL_TARGET_ENV:'staging'},
  {APP_ENV:'production',VERCEL:'1'}, {APP_ENV:'development',VERCEL_ENV:'production'},
  {APP_ENV:'production',NODE_ENV:'development'}];
test('fail-closed environment matrix, independent of generation and sync flags',()=>{
  for(const env of denied) for(const flag of ['false','true']) assert.equal(seoWritesAllowed({...env,
    SEO_EDITORIAL_ENABLED:flag,SEO_AI_ENABLED:flag,SEO_SYNC_ENABLED:flag}),false,JSON.stringify(env));
  for(const env of [{APP_ENV:'production'}, {APP_ENV:'production',VERCEL:'1',VERCEL_ENV:'production',VERCEL_TARGET_ENV:'production'},
    {APP_ENV:'development'}]) assert.equal(seoWritesAllowed(env),true);
});

// Run real route and shared guard code. Everything beyond the boundary is a
// counted trap, so a caught exception cannot masquerade as a successful denial.
function fixture(file:string, env:Record<string,string|undefined>, authenticated=true) {
  let effects=0;
  const trap=()=>{effects++;throw Error('SIDE_EFFECT_REACHED');};
  const modules:Record<string,any>={};
  const mocks:Record<string,any>={
    'server-only':{}, 'next/server':{NextResponse:Response},
    '@/operations/seo-vercel/lib/environment-target.mjs':{seoWritesAllowed},
    '@/lib/request-auth':{isAdminRequest:async()=>authenticated},
    './request-origin':{sameRequestOrigin:()=>true},
    '@/lib/admin-access':{getAdminAccess:trap}, '@/lib/admin-policy':{hasAdminPermission:trap},
    '@/lib/supabase-server':{createServerSupabaseClient:trap},
    '@/lib/request-body':{readJsonLimited:trap}, 'next/cache':{revalidateTag:trap,revalidatePath:trap},
    '@/lib/seo-ai':{suggestSeo:trap}, '@/lib/seo-engine':{}, '@/lib/seo-editorial':{},
    '@/operations/seo-vercel/lib/seo-editorial-quality.mjs':{},
  };
  function load(file:string):any {
    if(modules[file])return modules[file];const exports={};modules[file]=exports;
    const code=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
    new Function('exports','require','process','globalThis','fetch',code)(exports,(name:string)=>{
      if(name==='@/lib/api-security')return load('lib/api-security.ts');
      assert.ok(name in mocks,name);return mocks[name];
    },{env},{},trap);return exports;
  }
  return {route:load(file),effects:()=>effects};
}
const endpoints = [
  ['','generate','draft','approve','reset'],
  ['/editorial','save','approved','changes_requested','publish','rollback'],
  ['/ai','enqueue','approve','review','budget','authorize'], ['/sync','sync'],
];
test('all legacy/editorial/AI/sync actions deny before body, database, provider or cache work',async()=>{
  for(const [suffix,...actions] of endpoints) for(const env of denied) for(const action of actions) {
    const f=fixture(`app/api/admin/seo${suffix}/route.ts`,env);
    const res=await f.route.POST(new Request(`https://lecomax.com/api/admin/seo${suffix}`,{method:'POST',body:JSON.stringify({action})}));
    assert.equal(res.status,503,JSON.stringify({suffix,env,action}));
    assert.match((await res.json()).error,/disabled/);assert.equal(f.effects(),0);
    assert.equal(res.headers.get('Cache-Control'),'private, no-store');
  }
});
test('anonymous writes remain unauthorized',async()=>{
  for(const [suffix] of endpoints){const f=fixture(`app/api/admin/seo${suffix}/route.ts`,{APP_ENV:'staging'},false);
    assert.equal((await f.route.POST(new Request('https://lecomax.com',{method:'POST'}))).status,401);assert.equal(f.effects(),0);}
});
test('read guard and unrelated admin mutations retain existing behavior',async()=>{
  const f=fixture('lib/api-security.ts',{APP_ENV:'staging'});
  const req=new Request('https://lecomax.com');
  assert.equal(await f.route.protectAdminRead(req,{key:'seo:read'}),null);
  assert.equal(await f.route.protectAdminMutation(req,{key:'products:write'}),null);
  assert.equal(f.effects(),0);
});
test('worker denies even with valid bearer and sync enabled before any outbound request',async()=>{
  for(const env of denied){let calls=0;let status=0;
    const handler=createHandler({env:{...env,CRON_SECRET:'x'.repeat(32),SEO_SYNC_ENABLED:'true'},fetcher:async()=>{calls++;throw Error('OUTBOUND');}});
    const res={setHeader(){},status(n:number){status=n;return this;},json(body:any){return body;}};
    await handler({method:'GET',headers:{authorization:'Bearer '+'x'.repeat(32)}},res);
    assert.equal(status,503);assert.equal(calls,0);
  }
});
