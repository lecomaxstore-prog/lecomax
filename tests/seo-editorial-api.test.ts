import {seoWritesAllowed} from '../operations/seo-vercel/lib/environment-target.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {validEditorialDraft, blankEditorial} from '../lib/seo-editorial.ts';
import {assessEditorial} from '../operations/seo-vercel/lib/seo-editorial-quality.mjs';
import {shoeFixture} from '../operations/seo-vercel/tests/editorial-quality-fixtures.mjs';
const {source,draft}=shoeFixture();
const owner={owner:true,permissions:[],email:'owner@example.invalid'}, editor={owner:false,permissions:['products.view','products.edit'],email:'editor@example.invalid'};
const state={version:7,revision:2,source,head:{content:draft},revisions:[],events:[]};
function fixture(access:any=owner, options:{error?:string; state?:any; jobs?:any[]; cacheFailure?:boolean; suggestionsError?:boolean; env?:Record<string,string>}={}) {
  const modules:Record<string,any>={},calls:any[]=[],securityGlobal={};let invalidations=0;
  const links:Record<string,string>={'@/lib/api-security':'lib/api-security.ts','@/lib/request-auth':'lib/request-auth.ts','@/lib/admin-policy':'lib/admin-policy.ts','./admin-policy':'lib/admin-policy.ts','./request-origin':'lib/request-origin.ts'};
  function load(file:string):any{
    if(modules[file])return modules[file];const exports:any={};modules[file]=exports;
    const mocks:Record<string,any>={'@/operations/seo-vercel/lib/environment-target.mjs':{seoWritesAllowed},'server-only':{},'next/server':{NextResponse:Response},'next/cache':{revalidateTag(){invalidations++;if(options.cacheFailure)throw Error('cache failure');},revalidatePath(){}},
      '@/lib/admin-access':{getAdminAccess:async()=>access},'./admin-access':{getAdminAccess:async()=>access},'@/lib/ecomedia-auth':{getEcomediaUser:async()=>null},'./admin-session':{verifySessionToken:async()=>null},'./security-log':{securityLog(){}},
      '@/lib/request-body':{readJsonLimited:async(r:any,limit:number)=>{const body=await r.json();if(new TextEncoder().encode(JSON.stringify(body)).length>limit)throw Error('too large');return body;}},
      '@/lib/seo-editorial':{validEditorialDraft},'@/lib/seo-engine':{seoPath:()=>'/produit/fixture/'},'@/operations/seo-vercel/lib/seo-editorial-quality.mjs':{assessEditorial},
      '@/lib/supabase-server':{createServerSupabaseClient:()=>({rpc:async(name:string,args:any)=>{calls.push({name,args});return {data:name==='seo_ai_dashboard_v3'?{jobs:options.jobs??[]}:options.state===null?null:options.state??state,error:options.error?{message:options.error}:options.suggestionsError&&name==='seo_ai_dashboard_v3'?{message:'private provider detail'}:null};}})}};
    const code=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
    new Function('exports','require','process','globalThis',code)(exports,(name:string)=>name in mocks?mocks[name]:load(links[name]??name),{env:options.env??{APP_ENV:'production'}},securityGlobal);
    return exports;
  }
  const route=load('app/api/admin/seo/editorial/route.ts');
  const request=(body:any={},origin='https://lecomax.com',query='?id=one')=>({method:'POST',url:'https://lecomax.com/api/admin/seo/editorial'+query,nextUrl:new URL('https://lecomax.com/api/admin/seo/editorial'+query),headers:new Headers({origin,host:'lecomax.com'}),cookies:{get:()=>access?{value:'fixture'}:undefined},json:async()=>body});
  return {route,request,calls,invalidations:()=>invalidations};
}
const body=(action='save',extra:any={})=>({id:'one',version:7,revision:2,source,action,content:draft,notes:'Both languages and source reviewed.',checklist:{facts:true,french:true,arabic:true,duplicates:true},...extra});

test('hosted test environments reject authorized editorial mutations before any RPC',async()=>{
  for(const APP_ENV of ['staging','preview']) for(const access of [owner,editor,{owner:false,permissions:['products.view'],email:'viewer@example.invalid'}]) {
    for(const action of ['save','approved','changes_requested','publish','rollback']) {
      const f=fixture(access,{env:{APP_ENV,SEO_EDITORIAL_ENABLED:'false'}});
      assert.equal((await f.route.POST(f.request(body(action,{confirmed:true,event:'12'})))).status,503);
      assert.equal(f.calls.length,0);assert.equal(f.invalidations(),0);
    }
    const read=fixture(access,{env:{APP_ENV}});
    assert.equal((await read.route.GET(read.request())).status,200);
  }
  const production=fixture(owner,{env:{APP_ENV:'production',SEO_EDITORIAL_ENABLED:'false'}});
  assert.equal((await production.route.POST(production.request(body()))).status,200);
});

test('editorial real guards reject anonymous, incomplete permission and cross-origin writes',async()=>{
  for(const access of [null,{owner:false,permissions:['products.view']}]){
    const f=fixture(access);assert.equal((await f.route.POST(f.request(body()))).status,access?403:401);assert.equal(f.calls.length,0);
  }
  const f=fixture();assert.equal((await f.route.POST(f.request(body(),'https://evil.invalid'))).status,403);assert.equal(f.calls.length,0);
});
test('owner alone may publish/rollback, with explicit confirmation and valid target',async()=>{
  for(const action of ['publish','rollback']){
    const f=fixture(editor);assert.equal((await f.route.POST(f.request(body(action,{confirmed:true,event:'12'})))).status,403);assert.equal(f.calls.length,0);
    const o=fixture();assert.equal((await o.route.POST(o.request(body(action,{event:'12'})))).status,400);assert.equal(o.calls.length,0);
  }
  const f=fixture();assert.equal((await f.route.POST(f.request(body('rollback',{confirmed:true,event:'1;drop table'})))).status,400);assert.equal(f.calls.length,0);
});
test('editor saves incomplete bilingual draft with server actor and exact expected version',async()=>{
  const f=fixture(editor);const response=await f.route.POST(f.request(body('save',{content:blankEditorial(),actor:'forged'})));
  assert.equal(response.status,200);assert.equal(response.headers.get('Cache-Control'),'private, no-store');
  assert.equal(f.calls[0].args.p_actor,editor.email);assert.equal(f.calls[0].args.p_version,7);assert.equal(f.calls[0].args.p_revision,2);
  assert.deepEqual(f.calls[0].args.p_content,blankEditorial());assert.equal(f.invalidations(),0);
});
test('malformed content, HTML, controls, excess body and invalid versions fail before RPC',async()=>{
  for(const extra of [{version:0},{revision:-1},{revision:1.5},{content:[]},{content:{...draft,fr:{...draft.fr,title:'<script>'}}},{content:{...draft,ar:{...draft.ar,title:'مرحبا\u202e'}}},{notes:'x'.repeat(50000)}]){
    const f=fixture();assert.equal((await f.route.POST(f.request(body('save',extra)))).status,400);assert.equal(f.calls.length,0);
  }
});
test('approval validates persisted revision and bilingual quality, never client replacement content',async()=>{
  for(const options of [{state:{...state,version:8}},{state:{...state,revision:3}},{state:{...state,head:{content:blankEditorial()}}}]){
    const f=fixture(editor,options);assert.equal((await f.route.POST(f.request(body('approved')))).status,409);assert.equal(f.calls.length,1);
  }
  const f=fixture(editor);assert.equal((await f.route.POST(f.request(body('approved',{content:blankEditorial()})))).status,200);
  assert.equal(f.calls.at(-1).args.p_content,null);
  const missing=fixture(editor);assert.equal((await missing.route.POST(missing.request(body('approved',{checklist:{facts:true}})))).status,409);
});
test('publish and rollback invalidate cache only after success; cache failure is committed success',async()=>{
  for(const action of ['publish','rollback']){
    const f=fixture(owner,{cacheFailure:true});const response=await f.route.POST(f.request(body(action,{confirmed:true,event:'12'})));
    assert.equal(response.status,200);assert.match((await response.json()).warning,/enregistrée/);assert.equal(f.invalidations(),1);
  }
  const f=fixture(owner,{error:'SEO_EDITORIAL_CONFLICT'});assert.equal((await f.route.POST(f.request(body('rollback',{confirmed:true,event:'12'})))).status,409);assert.equal(f.invalidations(),0);
});
test('SQL conflicts remain conflicts and operational errors are sanitized',async()=>{
  for(const [error,status] of [['SEO_EDITORIAL_SOURCE_CHANGED',409],['SEO_EDITORIAL_REVIEW_REQUIRED',409],['credential-secret',503]] as const){
    const f=fixture(editor,{error});const response=await f.route.POST(f.request(body()));assert.equal(response.status,status);assert.doesNotMatch(await response.text(),/credential-secret/);
  }
});
test('explicit AI import uses stored output, rejects stale/missing jobs and never calls providers',async()=>{
  const id='00000000-0000-4000-8000-000000000001';
  const job={id,state:'completed',source_current:true,result:{...draft,editorialVersion:3}};
  const f=fixture(editor,{jobs:[job]});assert.equal((await f.route.POST(f.request(body('save',{job:id,content:blankEditorial()})))).status,200);
  assert.deepEqual(f.calls.at(-1).args.p_content,draft);assert.equal(f.calls.at(-1).args.p_job,id);
  for(const jobs of [[],[{...job,source_current:false}],[{...job,state:'processing'}]]){
    const x=fixture(editor,{jobs});assert.equal((await x.route.POST(x.request(body('save',{job:id})))).status,409);assert.equal(x.calls.length,1);
  }
});
test('reads enforce permissions, validate pagination and expose owner capabilities only from session',async()=>{
  const denied=fixture({owner:false,permissions:[]});assert.equal((await denied.route.GET(denied.request())).status,403);
  const f=fixture(editor);const response=await f.route.GET(f.request({},undefined,'?id=one&before=9&eventBefore=123'));assert.equal(response.status,200);assert.equal((await response.json()).canPublish,false);
  assert.deepEqual(f.calls[0].args,{p_id:'one',p_before:9,p_event_before:'123'});
  const invalid=fixture();assert.equal((await invalid.route.GET(invalid.request({},undefined,'?id=one&before=0'))).status,400);assert.equal(invalid.calls.length,0);
  const missing=fixture(owner,{state:null});assert.equal((await missing.route.GET(missing.request())).status,404);
});
test('product-only editors see only current completed editorial suggestion IDs without category or budget access',async()=>{
  const ready={id:'ready',tier:'editorial-sol',state:'completed',source_current:true,result:{...draft,editorialVersion:3},payload:{private:'never returned'}};
  const f=fixture(editor,{jobs:[ready,{...ready,id:'stale',source_current:false},{...ready,id:'pending',state:'processing'},{...ready,id:'routine',result:{...draft}}]});
  const response=await f.route.GET(f.request());assert.equal(response.status,200);
  const data=await response.json();assert.deepEqual(data.suggestions,[{id:'ready',tier:'editorial-sol',content:draft}]);assert.equal(data.canPublish,false);
  assert.deepEqual(f.calls[1].args,{p_kind:'product',p_id:'one'});assert.doesNotMatch(JSON.stringify(data),/never returned|private/);
});
test('suggestion lookup failures preserve manual drafting and pagination never reloads suggestions',async()=>{
  const f=fixture(editor,{suggestionsError:true});const response=await f.route.GET(f.request());
  assert.equal(response.status,200);const data=await response.json();assert.equal(data.suggestionsUnavailable,true);assert.equal(data.version,7);assert.doesNotMatch(JSON.stringify(data),/private provider detail/);
  const p=fixture(editor);await p.route.GET(p.request({},undefined,'?id=one&before=2'));assert.equal(p.calls.length,1);
  const view=fixture({owner:false,permissions:['products.view']});const v=await view.route.GET(view.request());assert.equal(v.status,200);assert.equal(view.calls.length,1);assert.equal((await v.json()).canEdit,false);
});

test('suggestion reads deny anonymous/category-only actors before SQL and missing products before jobs',async()=>{
  for(const access of [null,{owner:false,permissions:['categories.view','categories.edit']},{owner:false,permissions:['products.edit']}]) {
    const f=fixture(access);assert.equal((await f.route.GET(f.request())).status,access?403:401);assert.equal(f.calls.length,0);
  }
  const f=fixture(editor,{state:null,jobs:[{id:'secret'}]});assert.equal((await f.route.GET(f.request())).status,404);assert.equal(f.calls.length,1);
  const ok=fixture(editor);const response=await ok.route.GET(ok.request({},undefined,'?id=other-product&kind=category'));
  assert.equal(response.status,200);assert.deepEqual(ok.calls[1].args,{p_kind:'product',p_id:'other-product'});
  const result=await response.json();assert.equal(result.draftScope,editor.email);assert.equal(response.headers.get('Cache-Control'),'private, no-store');
});
