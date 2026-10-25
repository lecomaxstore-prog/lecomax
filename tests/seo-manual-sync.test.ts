import { createHash } from 'node:crypto';
import { environment as targetEnvironment, credentialBinding, PROJECTS } from '../operations/seo-vercel/lib/environment-target.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { hasAdminPermission } from '../lib/admin-policy.ts';

function api({ blocked=0, owner=false, permissions=['products.view','products.edit','categories.edit'], patch={}, status=200, throws=false } = {}) {
  const calls: any[]=[];let reads=0;
  const env={APP_ENV: "production", SEO_RUNTIME_ENV: "production", SEO_WORKER_ALLOWED_ORIGIN: "https://dedicated-worker.vercel.app", SEO_WORKER_BINDING: "yddqwgdgeljkzfsmtein:" + createHash("sha256").update("https://dedicated-worker.vercel.app/api/sync\nfixture-secret-at-least-thirty-two-characters").digest("hex"),SEO_WORKER_URL:'https://dedicated-worker.vercel.app/api/sync',SEO_WORKER_CRON_SECRET:'fixture-secret-at-least-thirty-two-characters',SEO_MANUAL_SYNC_ENABLED:'true',VERCEL_ENV:'production',...patch};
  const mocks: Record<string,unknown>={
      '@/operations/seo-vercel/lib/environment-target.mjs': { environment: targetEnvironment, credentialBinding, PROJECTS },
    'next/server':{NextResponse:Response},
    '@/lib/api-security':{protectAdminMutation:async()=>blocked?Response.json({}, {status:blocked}):null,protectAdminRead:async()=>blocked?Response.json({}, {status:blocked}):null},
    '@/lib/admin-access':{getAdminAccess:async()=>({owner,permissions})},
    '@/lib/admin-policy':{hasAdminPermission},
    '@/lib/supabase-server':{createServerSupabaseClient:()=>({rpc:async(name:string)=>{reads++;assert.equal(name,'seo_run_status');return {data:{state:'completed',completed:3},error:null};}})},
  };
  const code=ts.transpileModule(readFileSync('app/api/admin/seo/sync/route.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
  const exports:any={};new Function('exports','require','process','fetch',code)(exports,(name:string)=>{assert.ok(name in mocks,name);return mocks[name];},{env},async(...args:any[])=>{calls.push(args);if(throws)throw Error(env.SEO_WORKER_CRON_SECRET);return Response.json({secret:'never forwarded'},{status});});
  return {...exports,calls,reads:()=>reads};
}
const req={} as any;
test('portable hosting requires explicit production and exact pinned HTTPS origin; previews cannot override',async()=>{
  const patch={VERCEL_ENV:undefined,SEO_RUNTIME_ENV:'production',SEO_WORKER_URL:'https://seo.example.com/api/sync',SEO_WORKER_ALLOWED_ORIGIN:'https://seo.example.com',
    SEO_WORKER_BINDING: 'yddqwgdgeljkzfsmtein:'+createHash('sha256').update('https://seo.example.com/api/sync\nfixture-secret-at-least-thirty-two-characters').digest('hex')};
  const allowed=api({patch});assert.equal((await allowed.POST(req)).status,200);
  for(const change of [{SEO_WORKER_ALLOWED_ORIGIN:'https://other.example.com'},{SEO_RUNTIME_ENV:'preview'},{VERCEL_ENV:'preview'},{SEO_WORKER_URL:'https://seo.example.com/api/sync?redirect=1'}]) {
    const denied=api({patch:{...patch,...change}});assert.equal((await denied.POST(req)).status,503);assert.equal(denied.calls.length,0);
  }
});
test('manual sync enforces session/origin/rate guard and full catalogue permissions',async()=>{
  for(const blocked of [401,403,429]) {const a=api({blocked});assert.equal((await a.POST(req)).status,blocked);assert.equal(a.calls.length,0);}
  for(const permissions of [[],['products.view'],['products.view','products.edit']]) {
    const a=api({permissions});assert.equal((await a.POST(req)).status,403);assert.equal((await a.GET(req)).status,403);assert.equal(a.calls.length+a.reads(),0);
  }
});
test('owner and authorized staff invoke the shared worker once without exposing secret',async()=>{
  for(const owner of [true,false]) {const a=api({owner});const r=await a.POST(req);assert.equal(r.status,200);assert.equal(a.calls.length,1);assert.equal(a.calls[0][1].redirect,'error');assert.equal(a.calls[0][1].method,'GET');assert.doesNotMatch(await r.text(),/secret|Bearer/);}
});
test('disabled/preview and invalid worker URLs fail closed',async()=>{
  for(const patch of [{SEO_MANUAL_SYNC_ENABLED:'false'},{VERCEL_ENV:'preview'},{SEO_WORKER_CRON_SECRET:''},{SEO_WORKER_URL:'http://localhost/api/sync'},{SEO_WORKER_URL:'https://worker.vercel.app/api/sync?key=secret'},{SEO_WORKER_URL:'https://worker.vercel.app.evil.invalid/api/sync'}]) {
    const a=api({patch});assert.equal((await a.POST(req)).status,503);assert.equal(a.calls.length,0);
  }
});
test('duplicate, failure and unknown outcomes are sanitized; reads never start work',async()=>{
  for(const status of [409,503]) {const a=api({status});const r=await a.POST(req);assert.equal(r.status,status);assert.doesNotMatch(await r.text(),/never forwarded/);}
  const a=api({throws:true});assert.equal((await a.POST(req)).status,503);
  const reader=api();const response=await reader.GET(req);assert.equal(response.status,200);assert.equal(reader.calls.length,0);assert.equal(reader.reads(),1);
  assert.equal((await response.json()).run.completed,3);
});
