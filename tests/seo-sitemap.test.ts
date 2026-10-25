import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

function load(file: string, result: any) {
  const exports: any = {};
  let range: number[] = [];
  const selections: string[] = [];
  const tables = { products: { table: 'products', active: 'active', prefix: '/produit/' }, categories: { table: 'categories', active: 'active', prefix: '/' } };
  vm.runInNewContext(ts.transpileModule(readFileSync(file,'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText, {
    exports, URL, Object, Date,
    require(name: string) {
      if(name==='next/server')return {NextResponse:Response};
      if(name==='@/lib/seo')return {SITE_URL:'https://lecomax.com'};
      if(name==='@/lib/sitemap-data')return {SITEMAP_PAGE_SIZE:1000,sitemapTables:tables,xmlEscape:(s:string)=>s.replace(/&/g,'&amp;'),sitemapDb:()=>({from(table:string){const query:any={select(columns:string){selections.push(columns);return query},order(){return query},eq(){return query},range(a:number,b:number){range=[a,b];return Promise.resolve(typeof result==='function'?result(selections.at(-1)):result)},then(resolve:any){resolve(table==='products'?result:{count:0,error:null,data:[]})}};return query;}})};
      throw Error(name);
    }
  });
  return {get:exports.GET,range:()=>range,selections};
}
test('sitemap index scales beyond the PostgREST row cap',async()=>{
  const r=load('app/sitemap.xml/route.ts',{count:2501,error:null});const response=await r.get();
  assert.equal(response.status,200);const xml=await response.text();assert.match(xml,/sitemapindex/);assert.match(xml,/products\/2\//);assert.doesNotMatch(xml,/products\/3\//);assert.match(xml,/sitemaps\/static/);
});
test('empty catalogue has no product shards',async()=>{
  const r=load('app/sitemap.xml/route.ts',{count:0,error:null});assert.doesNotMatch(await(await r.get()).text(),/sitemaps\/products/);
});
test('outage returns retryable 503 instead of inventing fallback URLs',async()=>{
  for(const file of ['app/sitemap.xml/route.ts','app/sitemaps/[kind]/[page]/route.ts']){
    const r=load(file,{count:null,data:null,error:{message:'secret'}});const response=await r.get(null,{params:Promise.resolve({kind:'products',page:'0'})});assert.equal(response.status,503);assert.equal(response.headers.get('Cache-Control'),'no-store');assert.doesNotMatch(await response.text(),/secret|old-product/);
  }
});
test('shard paginates, encodes URLs, and uses actual last modification dates',async()=>{
  const r=load('app/sitemaps/[kind]/[page]/route.ts',{data:[{slug:'a&b',updated_at:'2026-09-10'},{slug:'unknown-date',updated_at:'bad'}],error:null});
  const response=await r.get(null,{params:Promise.resolve({kind:'products',page:'2'})});assert.equal(response.status,200);assert.deepEqual(r.range(),[2000,2999]);const xml=await response.text();assert.match(xml,/a%26b/);assert.match(xml,/2026-09-10T00:00:00.000Z/);assert.doesNotMatch(xml,/Invalid Date/);
});
test('invalid shard routes and nonexistent pages return 404',async()=>{
  const r=load('app/sitemaps/[kind]/[page]/route.ts',{data:[],error:null});
  for(const [kind,page] of [['bad','0'],['products','-1'],['products','2']]) assert.equal((await r.get(null,{params:Promise.resolve({kind,page})})).status,404);
});
test('noncanonical shard numbers are rejected before querying the catalogue',async()=>{
  const r=load('app/sitemaps/[kind]/[page]/route.ts',{data:[{slug:'fixture'}],error:null});
  for(const page of ['00','01','000002','+1','1.0','1e2','1000000']) {
    assert.equal((await r.get(null,{params:Promise.resolve({kind:'products',page})})).status,404);
  }
  assert.equal(r.selections.length,0);
  assert.equal((await r.get(null,{params:Promise.resolve({kind:'products',page:'0'})})).status,200);
});

test('legacy categories without updated_at remain crawlable without fabricated dates',async()=>{
  const r=load('app/sitemaps/[kind]/[page]/route.ts',(columns:string)=>columns.includes('updated_at')
    ? {data:null,error:{code:'42703',message:'column categories.updated_at does not exist'}}
    : {data:[{slug:'accessoires'}],error:null});
  const response=await r.get(null,{params:Promise.resolve({kind:'categories',page:'0'})});
  assert.equal(response.status,200);
  const xml=await response.text();assert.match(xml,/https:\/\/lecomax.com\/accessoires\//);assert.doesNotMatch(xml,/lastmod/);
  assert.deepEqual(r.selections,['slug,updated_at','slug']);
});

test('other schema errors never become a successful incomplete sitemap',async()=>{
  const r=load('app/sitemaps/[kind]/[page]/route.ts',{data:null,error:{code:'42703',message:'column categories.active does not exist'}});
  assert.equal((await r.get(null,{params:Promise.resolve({kind:'categories',page:'0'})})).status,503);
  assert.equal(r.selections.length,1);
});
