import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import * as engine from '../lib/seo-engine.ts';

const source={name:'Casque',slug:'casque',description:'Connexion Bluetooth.',images:['/image.jpg']};
const published={title:'Casque approuvé',description:'Connexion Bluetooth. Découvrez ce casque.',imageAlt:'Casque Bluetooth'};
function store(data: unknown, error: unknown = null) {
  let reads=0;
  const q:any={select:()=>q,eq:()=>q,maybeSingle:async()=>{reads++;return {data,error};}};
  const mocks:any={'server-only':{},react:{cache:(f:unknown)=>f},'./seo-engine':engine,'./supabase-server':{createPublicSupabaseClient:()=>({from:()=>q})}};
  const exports:any={};
  const code=ts.transpileModule(readFileSync('lib/seo-store.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
  new Function('exports','require',code)(exports,(name:string)=>{assert.ok(name in mocks);return mocks[name];});
  return {...exports,reads:()=>reads};
}
test('missing schema and database errors yield deterministic current metadata without worker or AI',async()=>{
  for(const error of [null,{message:'unavailable'}]) {
    const s=store(null,error);assert.deepEqual(await s.getSeoContent('product',source),engine.fallbackSeo(source));assert.equal(s.reads(),1);
  }
});
test('worker outage preserves current approved metadata; changed facts get fallback without overwriting approval',async()=>{
  const data={source,published,published_source:source,fallback:engine.fallbackSeo(source)};
  const before=JSON.stringify(data),s=store(data);
  assert.deepEqual(await s.getSeoContent('product',source),published);
  const changed={...source,name:'Nouveau casque'};
  assert.deepEqual(await s.getSeoContent('product',changed),engine.fallbackSeo(changed));
  assert.equal(JSON.stringify(data),before);
});
