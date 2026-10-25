// Execute existing candidate GET handlers locally against staging REST only.
// This is NOT a hosted Next/Vercel HTTP or browser acceptance claim.
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const assert = require('node:assert/strict'), ts = require('typescript');
const { createClient } = require('@supabase/supabase-js');
const root = path.resolve(__dirname, "../../L'ecomax-seo-staging");
const origin = 'https://tyltharlnbxrxibuxyye.supabase.co';
const key = process.env.STAGING_RUNTIME_SERVICE_KEY;
if (!key) throw Error('STAGING_KEY_REQUIRED');
const client = createClient(origin, key, {
 auth: { persistSession: false, autoRefreshToken: false },
 global: { fetch: (url, init) => {
  const target = new URL(url);
  if (target.origin !== origin || !target.pathname.startsWith('/rest/v1/') || !['GET','HEAD'].includes(init?.method || 'GET')) throw Error('READ_ONLY_STAGING_REQUIRED');
  return fetch(url, { ...init, redirect: 'error', signal: AbortSignal.timeout(15000) });
 } },
});
const forbidden = () => { throw Error('SIDE_EFFECT_FORBIDDEN'); };
function load(file) {
 const exports = {};
 const code = ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 vm.runInNewContext(code, {exports,URL,Response,Request,process:{env:{}},require(name) {
  if(name==='server-only')return {};
  if(name==='next/server')return {NextResponse:Response};
  if(name==='@supabase/supabase-js')return {createClient:()=>client};
  if(name==='@/lib/seo')return {SITE_URL:'https://lecomax.com'};
  if(name==='@/lib/sitemap-data')return load('lib/sitemap-data.ts');
  if(name==='./supabase-server')return {createPublicSupabaseClient:()=>client};
  if(name==='@/mobile/src/lib/catalog-availability')return load('mobile/src/lib/catalog-availability.ts');
  if(file.startsWith('mobile/src/lib/')&&name.startsWith('./'))return load(path.posix.join(path.posix.dirname(file),name));
  return new Proxy({}, {get:()=>forbidden});
 }});
 return exports;
}
(async()=>{
 const checks=[];
 const index=await load('app/sitemap.xml/route.ts').GET();
 assert.equal(index.status,200);
 const xml=await index.text();
 assert.match(xml,/sitemaps\/products\/0\//);assert.match(xml,/sitemaps\/categories\/0\//);
 assert.doesNotMatch(xml,/sitemaps\/(pages|posts)\/0/);
 checks.push({handler:'sitemap index',status:200});
 for(const kind of ['products','categories']){
  const response=await load('app/sitemaps/[kind]/[page]/route.ts').GET(null,{params:Promise.resolve({kind,page:'0'})});
  assert.equal(response.status,200);const body=await response.text();
  assert.match(body,/seo-fixture-/);assert.doesNotMatch(body,/seo-fixture-inactive|<lastmod>/);
  checks.push({handler:`sitemap ${kind}`,status:200});
 }
 const products=await load('app/api/products/route.ts').GET(new Request('https://staging.invalid/api/products?active=true'));
 assert.equal(products.status,200);assert.equal((await products.json()).length,2);
 checks.push({handler:'public products',status:200,count:2});
 const categories=await load('app/api/categories/route.ts').GET();
 assert.equal(categories.status,200);assert.equal((await categories.json()).length,2);
 checks.push({handler:'categories',status:200,count:2});
 const report={at:new Date().toISOString(),checks,source:root,hostedDatabase:true,hostedHttp:false,browser:false,readOnly:true};
 const file=path.join(__dirname,`../artifacts/seo-staging-runtime-handlers-${Date.now()}.json`);
 fs.writeFileSync(file,JSON.stringify(report,null,2),{flag:'wx'});
 console.log(JSON.stringify({file,passed:checks.length,hostedHttp:false}));
})().catch(()=>{console.error('STAGING_HANDLER_VERIFICATION_FAILED');process.exitCode=1;});
