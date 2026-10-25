import {seoWritesAllowed} from '../operations/seo-vercel/lib/environment-target.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { assessEditorial } from '../operations/seo-vercel/lib/seo-editorial-quality.mjs';
import { shoeFixture } from '../operations/seo-vercel/tests/editorial-quality-fixtures.mjs';
function fixture(access: {owner:boolean;permissions:string[];email?:string}|null, jobs: any[] = [], rpcError=false) {
  const modules:Record<string,any>={},calls:any[]=[],isolatedGlobal={};
  const links:Record<string,string>={'@/lib/api-security':'lib/api-security.ts','@/lib/request-auth':'lib/request-auth.ts','@/lib/admin-policy':'lib/admin-policy.ts','./admin-policy':'lib/admin-policy.ts','./request-origin':'lib/request-origin.ts'};
  function load(file:string):any {
    if(modules[file])return modules[file];
    const exports:any={};modules[file]=exports;
    const mocks:Record<string,unknown>={'@/operations/seo-vercel/lib/environment-target.mjs':{seoWritesAllowed},'server-only':{},'next/server':{NextResponse:Response},'next/cache':{revalidateTag(){},revalidatePath(){}},
      '@/lib/admin-access':{getAdminAccess:async()=>access},'./admin-access':{getAdminAccess:async()=>access},'@/lib/ecomedia-auth':{getEcomediaUser:async()=>null},
      './admin-session':{verifySessionToken:async()=>null},'./security-log':{securityLog(){}},'@/lib/request-body':{readJsonLimited:(r:any)=>r.json()},'@/lib/seo-engine':{seoPath:()=>'/fixture'},
      '@/operations/seo-vercel/lib/seo-editorial-quality.mjs':{assessEditorial},
      '@/lib/supabase-server':{createServerSupabaseClient:()=>({rpc:async(name:string,args:unknown)=>{calls.push({name,args});return {data:name==='seo_ai_dashboard_v3'?{jobs,monthlyLimit:0}:name==='seo_ai_review'?true:{id:'fixture',state:'pending',reused:false},error:rpcError?{message:'offline fixture failure'}:null};}})}};
    const code=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
    new Function('exports','require','process','globalThis',code)(exports,(name:string)=>{if(name in mocks)return mocks[name];assert.ok(links[name],name);return load(links[name]);},{env:{APP_ENV:'production'}},isolatedGlobal);
    return exports;
  }
  const route=load('app/api/admin/seo/ai/route.ts');
  const request=(body={},origin='https://lecomax.com')=>({method:'POST',url:'https://lecomax.com/api/admin/seo/ai',nextUrl:new URL('https://lecomax.com/api/admin/seo/ai'),headers:new Headers({origin,host:'lecomax.com'}),cookies:{get:()=>access?{value:'fixture'}:undefined},json:async()=>body});
  return {route,request,calls};
}
const owner={owner:true,permissions:[],email:'owner@example.invalid'},staff={owner:false,permissions:['products.view','products.edit','categories.edit'],email:'staff@example.invalid'};
test('product-only suggestion access does not grant global AI dashboard or category/budget mutation access',async()=>{
  const f=fixture({owner:false,permissions:['products.view','products.edit'],email:'product@example.invalid'});
  assert.equal((await f.route.GET(f.request())).status,403);
  for(const body of [{action:'budget',enabled:true,limit:1,mirai:false},{action:'enqueue',kind:'category',id:'one',tier:'routine',reason:'test'}]) {
    assert.equal((await f.route.POST(f.request(body))).status,403);
  }
  assert.equal(f.calls.length,0);
});
test('AI real guard chain denies missing sessions, incomplete roles and cross-origin mutations',async()=>{
  for(const actor of [null,{owner:false,permissions:['products.view']}]) {
    const f=fixture(actor);assert.equal((await f.route.POST(f.request({action:'budget'}))).status,actor?403:401);assert.equal(f.calls.length,0);
  }
  const f=fixture(owner);assert.equal((await f.route.POST(f.request({action:'budget'},'https://evil.invalid'))).status,403);assert.equal(f.calls.length,0);
});
test('review needs all acknowledgements and valid saved facts, never invokes publication',async()=>{
  const {source,draft}=shoeFixture();
  const job={id:'00000000-0000-4000-8000-000000000001',tier:'editorial-sol',state:'completed',source_current:true,payload:source,result:{...draft,editorialVersion:3,reviewRequired:true}};
  const body={action:'review',kind:'product',id:'1',job:job.id,version:1,decision:'approved_for_publication',notes:'All source facts and both languages reviewed.',checklist:{facts:true,french:true,arabic:true,duplicates:true}};
  let f=fixture(staff,[job]);
  assert.equal((await f.route.POST(f.request({...body,checklist:{facts:true}}))).status,409);
  assert.equal(f.calls.some(c=>c.name==='seo_ai_review'),false);
  f=fixture(staff,[job]);const response=await f.route.POST(f.request(body));assert.equal(response.status,200);assert.equal((await response.json()).published,false);
  assert.deepEqual(f.calls.map(c=>c.name),['seo_ai_dashboard_v3','seo_ai_review']);
  assert.deepEqual(f.calls[1].args.p_result,job.result);
  f=fixture(staff,[{...job,source_current:false}]);assert.equal((await f.route.POST(f.request(body))).status,409);
  const invalid=structuredClone(job);invalid.result.fr.productDescription+=' Cuir véritable.';
  f=fixture(staff,[invalid]);assert.equal((await f.route.POST(f.request(body))).status,409);
  f=fixture(staff,[invalid]);assert.equal((await f.route.POST(f.request({...body,decision:'changes_requested'}))).status,200);
  f=fixture(staff,[job]);assert.equal((await f.route.POST(f.request({...body,action:'approve'}))).status,409);
  assert.equal(f.calls.some(c=>c.name==='seo_ai_approve'),false);
  f=fixture(staff,[job],true);assert.equal((await f.route.POST(f.request(body))).status,503);
});
test('only owner can set spending limit; input validation precedes SQL',async()=>{
  const f=fixture(staff);assert.equal((await f.route.POST(f.request({action:'budget',enabled:true,limit:1,mirai:false}))).status,403);assert.equal(f.calls.length,0);
  const o=fixture(owner);assert.equal((await o.route.POST(o.request({action:'budget',enabled:true,limit:-1,mirai:false}))).status,400);
  assert.equal((await o.route.POST(o.request({action:'budget',enabled:false,limit:0,mirai:false}))).status,200);assert.equal(o.calls.length,1);
});
test('staff enqueue only validated routine/advanced jobs; never invokes a provider',async()=>{
  const f=fixture(staff),body={action:'enqueue',kind:'product',id:'1',tier:'routine',reason:'Routine'};
  const response=await f.route.POST(f.request(body));assert.equal(response.status,202);assert.equal(response.headers.get('Cache-Control'),'private, no-store');
  assert.equal(f.calls[0].name,'seo_ai_enqueue');assert.equal((await f.route.POST(f.request({...body,tier:'advanced',reason:'short'}))).status,400);
  assert.equal(f.calls.length,1);
});
test('premium selection is product-only and paid authorization is owner-only with explicit consent',async()=>{
  const f=fixture(staff),body={action:'enqueue',kind:'product',id:'1',tier:'premium',reason:'Professional factual bilingual optimization'};
  assert.equal((await f.route.POST(f.request(body))).status,202);
  assert.equal((await f.route.POST(f.request({...body,kind:'category'}))).status,400);
  assert.equal((await f.route.POST(f.request({action:'authorize',job:'00000000-0000-4000-8000-000000000001',ceiling:0.2,confirmed:true}))).status,403);
  const o=fixture(owner);
  assert.equal((await o.route.POST(o.request({action:'budget',enabled:true,limit:5.01,mirai:false}))).status,400);
  assert.equal((await o.route.POST(o.request({action:'authorize',job:'00000000-0000-4000-8000-000000000001',ceiling:0.2,confirmed:false}))).status,400);
  assert.equal(o.calls.length,0);
});
