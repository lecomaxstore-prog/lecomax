import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {sourceChanged} from '../lib/seo-engine.ts';
import {validEditorialDraft} from '../lib/seo-editorial.ts';
import {shoeFixture} from '../operations/seo-vercel/tests/editorial-quality-fixtures.mjs';
const {source:fixtureSource,draft}=shoeFixture();
const source={...fixtureSource,slug:'fixture',images:[]};
const row={source,published_source:source,published:{title:draft.fr.title,description:draft.fr.description},editorial_source:source,editorial_published:draft};
function store(data:any,error:any=null){
  const q:any={select:()=>q,eq:()=>q,maybeSingle:async()=>({data,error})};const exports:any={};
  const mocks:Record<string,any>={'server-only':{},react:{cache:(f:any)=>f},'./supabase-server':{createPublicSupabaseClient:()=>({from:()=>q})},'./seo-engine':{sourceChanged},'./seo-editorial':{validEditorialDraft}};
  new Function('exports','require',ts.transpileModule(readFileSync('lib/seo-editorial-store.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(exports,(name:string)=>mocks[name]);
  return exports.getPublishedEditorial;
}
test('only coherent current published editorial is returned with both languages intact',async()=>{
  assert.deepEqual(await store(row)(source),draft);
  for(const value of [null,{...row,editorial_published:null},{...row,editorial_source:null},{...row,published:null},{...row,published:{...row.published,title:'Other approval'}},{...row,published_source:{...source,name:'Old name'}},{...row,editorial_source:{...source,description:'Old facts'}}])assert.equal(await store(value)(source),null);
  assert.equal(await store(row)({...source,name:'New name'}),null);
  assert.equal(await store(row)({...source,images:['new image']}),null);
});
test('missing migration or outage falls back without exposing drafts',async()=>{
  assert.equal(await store(null,{message:'missing column'})(source),null);
  assert.equal(await store({source,draft,published_source:source})(source),null);
});
