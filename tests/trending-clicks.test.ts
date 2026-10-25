import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

type Row = { product_id: string; product_views: number };
async function request(metrics: Row[], products: any[], failTable = '', limit = 4) {
  const calls: any[] = [];
  const client = {from(table: string) {
    let from = 0, to = Infinity, slugs: string[] | undefined;
    const query: any = {
      select() { return query; }, eq() { return query; },
      gte(column: string, value: string) { calls.push(['gte', column, value]); return query; },
      lte() {return query;}, gt() {return query;}, order() {return query;},
      range(start: number, end: number) {from=start;to=end;calls.push(['range',start,end]);return query;},
      in(_column: string, values: string[]) {slugs=values;return query;},
      then(resolve: any) {return Promise.resolve({data: table === failTable ? null : table === 'products'
        ? products.filter(p=>p.active !== false && slugs?.includes(p.slug))
        : metrics.slice(from,to+1),error:table===failTable?{message:'unavailable'}:null}).then(resolve);},
    };return query;
  }};
  const exports: any = {};
  vm.runInNewContext(ts.transpileModule(readFileSync('app/api/recommendations/route.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{
    exports,URL,require:(name:string)=>({
      'next/server':{NextResponse:{json:(body:any,options:any)=>({body,status:options?.status??200})}},
      '@/lib/supabase-server':{createServerSupabaseClient:()=>client},
      '@/lib/api-security':{enforceRateLimit:()=>null},
    }[name]),
  });
  const response=await exports.GET({url:`http://localhost/api/recommendations?mode=most-viewed&limit=${limit}`});
  return {body:JSON.parse(JSON.stringify(response.body)),status:response.status,calls};
}
const product=(slug:string,stock=1)=>({slug,stock,active:true,featured:true});
test('ranks total recorded views, ignores featured filler and caps at four',async()=>{
 const metrics=[{product_id:'a',product_views:9},{product_id:'b',product_views:7},{product_id:'b',product_views:8},...['c','d','e'].map(product_id=>({product_id,product_views:2}))];
 const result=await request(metrics,['e','d','c','b','a','unclicked'].map(s=>product(s)), '',80);
 assert.deepEqual(result.body.slugs,['b','a','c','d']);assert.equal(result.body.strategy,'most-viewed');
});
test('does not pad sparse/empty data; excludes sold-out, inactive and invalid counts',async()=>{
 const result=await request([{product_id:'sold',product_views:99},{product_id:'hidden',product_views:80},{product_id:'ok',product_views:1},{product_id:'zero',product_views:0},{product_id:'bad',product_views:NaN}],[product('sold',0),{...product('hidden'),active:false},product('ok'),product('zero'),product('bad')]);
 assert.deepEqual(result.body.slugs,['ok']);assert.deepEqual((await request([], [product('filler')])).body.slugs,[]);
});
test('aggregates all analytics pages before selecting the winner',async()=>{
 const rows=Array.from({length:1000},()=>({product_id:'a',product_views:1}));rows.push({product_id:'b',product_views:1001});
 const result=await request(rows,[product('a'),product('b')]);assert.deepEqual(result.body.slugs,['b','a']);assert.equal(result.calls.filter(c=>c[0]==='range').length,2);
});
test('query failures return unavailable instead of fabricated trending products',async()=>{
 for(const table of ['products','product_intelligence_daily'])assert.equal((await request([{product_id:'a',product_views:1}],[product('a')],table)).status,503);
});
