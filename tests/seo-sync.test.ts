import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { fallbackSeo, sourceChanged, validSeoContent } from '../lib/seo-engine.ts';

function load(file: string, mocks: Record<string, unknown>) {
  const exports: any = {};
  const code=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
  new Function('exports','require',code)(exports,(name:string)=>{if(!(name in mocks))throw Error(name);return mocks[name];});
  return exports;
}
const source={name:'Casque',slug:'casque',description:'Audio',images:['/photo.jpg']};
const published={title:'Titre approuvé',description:'Description approuvée',imageAlt:'Photo approuvée'};
function store(row: any, error: unknown = null) {
  const q:any={select:()=>q,eq:()=>q,maybeSingle:async()=>({data:row,error})};
  return load('lib/seo-store.ts',{'server-only':{},react:{cache:(fn:unknown)=>fn},'./supabase-server':{createPublicSupabaseClient:()=>({from:()=>q})},'./seo-engine':{fallbackSeo,sourceChanged,validSeoContent}});
}
test('stored approved content is used only for current catalogue facts',async()=>{
  const row={source,published,published_source:source,fallback:fallbackSeo(source)};
  assert.deepEqual(await store(row).getSeoContent('product',source),published);
  const changed={...source,name:'Casque révisé'};
  assert.deepEqual(await store(row).getSeoContent('product',changed),fallbackSeo(changed));
  assert.deepEqual(await store({...row,source:changed,fallback:fallbackSeo(changed)}).getSeoContent('product',changed),fallbackSeo(changed));
  assert.deepEqual(await store(null,{message:'offline'}).getSeoContent('product',source),fallbackSeo(source));
});
test('category readers can validate supplied facts without requiring an omitted image',async()=>{
  const category={name:'Audio',slug:'audio',description:'Accessoires'};
  const full={...category,images:['/category.jpg']};
  assert.deepEqual(await store({source:full,published,published_source:full}).getSeoContent('category',category),published);
});
test('dashboard synchronization reads enforce admin access and kind permissions',async()=>{
  for(const permissions of [[],['products.view'],['products.view','categories.edit']]) {
    let scope:unknown='not-called';
    const q:any={select:()=>q,order:()=>q,range:()=>q,eq:()=>q,then:(resolve:any)=>resolve({data:[],error:null})};
    const api=load('app/api/admin/seo/route.ts',{
      'next/server':{NextResponse:Response},'next/cache':{},
      '@/lib/api-security':{protectAdminRead:async()=>null},
      '@/lib/admin-access':{getAdminAccess:async()=>({permissions})},
      '@/lib/admin-policy':{hasAdminPermission:(a:any,p:string)=>a.permissions.includes(p)},
      '@/lib/supabase-server':{createServerSupabaseClient:()=>({from:()=>q,rpc:async(_:string,args:any)=>{scope=args.p_kind;return {data:{pending:2,failed:1,errors:[]},error:null};}})},
      '@/lib/request-body':{},'@/lib/seo-engine':{},'@/lib/seo-ai':{},
    });
    const response=await api.GET({nextUrl:new URL('https://local.invalid/api/admin/seo')});
    assert.equal(response.status,permissions.length?200:403);
    assert.equal(scope,permissions.length?(permissions.includes('categories.edit')?null:'product'):'not-called');
    if(permissions.length)assert.equal((await response.json()).synchronization.failed,1);
  }
});
