const { vercelApiFetch } = require('./vercel-cli-api.cjs');
// Hosted HTTP acceptance with a temporary staging-only automation credential.
// Credential stays in memory, is sent only as a header to verified staging origins,
// and is revoked in finally. Never changes SSO protection or sends real messages.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),dir=path.resolve(process.argv[2]||'');
assert(path.dirname(dir)===path.join(root,'artifacts')&&/^seo-runtime-deployment-\d+$/.test(path.basename(dir)),'FIXED_EVIDENCE_DIRECTORY_REQUIRED');
const project='prj_jPniwpH4s81bhISVReUKTQN0GwvD',team='team_yFLUcpSvgQi8EQuvuorOZW7w';
const deployment=JSON.parse(fs.readFileSync(path.join(dir,'deployment.json')));
assert(deployment.project===project&&deployment.team===team,'STAGING_ONLY');
const origin='https://lecomax-seo-staging.vercel.app',allowed=new Set([origin,new URL(deployment.url).origin]);
async function api(route,body){
 const u=new URL(route,'https://api.vercel.com');u.searchParams.set('teamId',team);
 const response=await vercelApiFetch(u,{method:body?'PATCH':'GET',headers:{'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,redirect:'error',signal:AbortSignal.timeout(30000)});
 if(!response.ok)throw Error(`VERCEL_API_${response.status}`);return response.json();
}
const note='seo-runtime-acceptance-'+Date.now(),secret=crypto.randomBytes(16).toString('hex');
const report={at:new Date().toISOString(),project,team,deploymentId:deployment.id,checks:[],temporaryAutomationNote:note,protection:'all',credentialPrinted:false};
let created=false;
async function check(route,expected,validate=()=>{},method='GET',base=new URL(deployment.url).origin){
 assert(allowed.has(base)&&route.startsWith('/')&&!route.startsWith('//'),'STAGING_ONLY');
 let response;
 for(let attempt=0;attempt<5;attempt++){
  response=await fetch(base+route,{method,redirect:'manual',headers:{'x-vercel-protection-bypass':secret,...(method==='POST'?{'Content-Type':'application/json',Origin:base}:{})},body:method==='POST'?'{}':undefined,signal:AbortSignal.timeout(45000)});
  // Retry only GETs rejected by the authentication edge while a new credential propagates.
  if(method!=='GET'||response.status!==302||!/^https:\/\/vercel.com\//.test(response.headers.get('location')||'')||attempt===4)break;
  await response.body?.cancel();await new Promise(resolve=>setTimeout(resolve,3000));
 }
 const body=await response.text(),item={route,origin:base,method,status:response.status,noindex:response.headers.get('x-robots-tag'),cache:response.headers.get('x-vercel-cache'),requestId:response.headers.get('x-vercel-id'),bytes:Buffer.byteLength(body)};
 try{assert([].concat(expected).includes(response.status),'UNEXPECTED_STATUS');await validate(body,response,item);item.passed=true;}
 catch(e){item.passed=false;item.failure=/^[A-Z_]+$/.test(e.message)?e.message:'CONTENT_ASSERTION_FAILED';}
 report.checks.push(item);
 console.log(JSON.stringify({route,status:item.status,passed:item.passed}));
}
const noindex=(body,response)=>assert.match(response.headers.get('x-robots-tag')||'',/noindex/);
const jsonArray=expected=>(body,response,item)=>{noindex(body,response);const data=JSON.parse(body);assert(Array.isArray(data));if(expected!==undefined)assert.equal(data.length,expected);item.count=data.length;assert(!body.includes('seo-fixture-inactive'));};
function page(slug,type){return(body,response,item)=>{
 noindex(body,response);assert(!body.includes('Sitemap temporarily unavailable'));
 const canonical=body.match(/<link[^>]*rel="canonical"[^>]*href="([^"]+)"/i)?.[1];
 assert.equal(canonical,`https://lecomax.com/${type==='Product'?'produit/':''}${slug}/`);
 const blocks=[...body.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1]));
 const entity=blocks.find(b=>b['@type']===type);assert(entity,'STRUCTURED_DATA_REQUIRED');
 assert.match(body,/<title>[^<]+<\/title>/);assert.match(body,/<meta name="description" content="[^"]+/);
 if(type==='Product'){assert.equal(Number(entity.offers?.price),100);assert.equal(entity.offers?.priceCurrency,'MAD');}
 item.canonical=canonical;item.structuredData=blocks.map(b=>b['@type']);item.ssr=true;
};}
(async()=>{
 try{
  const p=await api('/v9/projects/'+project),d=await api('/v13/deployments/'+deployment.id);
  assert(p.id===project&&p.accountId===team&&p.name==='lecomax-seo-staging'&&p.ssoProtection?.deploymentType==='all'&&!p.link&&!p.crons?.definitions?.length,'PROTECTED_STAGING_REQUIRED');
  assert(d.projectId===project&&d.readyState==='READY'&&d.alias?.includes(new URL(origin).hostname),'READY_STAGING_ALIAS_REQUIRED');
  const before=await fetch(origin+'/sitemap.xml',{redirect:'manual',signal:AbortSignal.timeout(20000)});assert([302,401].includes(before.status),'ANONYMOUS_PROTECTION_REQUIRED');
  report.anonymousBefore=before.status;
  // Record only the credential label for recovery; never the credential itself.
  fs.writeFileSync(path.join(dir,`automation-intent-${Date.now()}.json`),JSON.stringify({at:new Date().toISOString(),project,team,note},null,2),{flag:'wx'});
  const generated=await api('/v1/projects/'+project+'/protection-bypass',{generate:{secret,note}});
  created=true;assert(generated.protectionBypass?.[secret]?.scope==='automation-bypass','AUTOMATION_CREDENTIAL_REQUIRED');
  await new Promise(resolve=>setTimeout(resolve,15000));
  await check('/',200,noindex);
  await check('/sitemap.xml',200,(body,r,item)=>{noindex(body,r);assert.match(r.headers.get('content-type'),/xml/);assert.match(body,/sitemapindex/);assert.match(body,/sitemaps\/products\/0\//);assert.match(body,/sitemaps\/categories\/0\//);item.locCount=[...body.matchAll(/<loc>/g)].length;});
  for(const kind of ['products','categories'])await check(`/sitemaps/${kind}/0/`,200,(body,r,item)=>{noindex(body,r);assert.match(body,/urlset/);assert.match(body,/seo-fixture-/);assert(!body.includes('seo-fixture-inactive'));item.locCount=[...body.matchAll(/<loc>/g)].length;assert.equal(item.locCount,2);});
  await check('/sitemaps/static/',200,(body,r)=>{noindex(body,r);assert.match(body,/urlset/);});
  await check('/robots.txt',200,(body,r,item)=>{noindex(body,r);assert.match(body,/User-agent:/);assert.match(body,/Sitemap: https:\/\/lecomax.com\/sitemap.xml/);item.productionRulesPreserved=true;});
  await check('/api/products?active=true&limit=5',200,jsonArray(2));
  await check('/api/categories',200,jsonArray(2));
  await check('/api/banners',200,jsonArray(0));
  await check('/api/promotions',200,jsonArray(0));
  await check('/api/settings',200,(body,r)=>{noindex(body,r);assert.equal(typeof JSON.parse(body),'object');});
  await check('/api/reviews/stats',200,(body,r)=>{noindex(body,r);assert.equal(typeof JSON.parse(body),'object');});
  for(const lang of ['fr','ar']){
   await check(`/produit/seo-fixture-${lang}/`,200,page(`seo-fixture-${lang}`,'Product'));
   await check(`/seo-fixture-category-${lang}/`,200,page(`seo-fixture-category-${lang}`,'CollectionPage'));
  }
  await check('/produit/seo-fixture-inactive/',404,noindex);
  await check('/api/admin/seo',401,noindex);
  await check('/admin/seo/',[307,308],(body,r)=>assert.equal(new URL(r.headers.get('location'),origin).pathname.replace(/\/$/,''),'/admin'));
  await check('/api/indexnow',401,()=>{},'POST');
  await check('/api/auth/signup',503,(body)=>assert.equal(JSON.parse(body).error,'EMAIL_DISABLED'),'POST');
  await check('/api/cron/mobile-campaigns',503,()=>{});
  await check('/sitemap.xml',200,(body,r)=>{noindex(body,r);assert.match(body,/sitemapindex/);},'GET',origin);
  report.passed=report.checks.every(c=>c.passed);
 }catch(e){report.passed=false;report.failure=/^[A-Z0-9_]+$/.test(e.message)?e.message:'HOSTED_ACCEPTANCE_FAILED';}
 finally{
  if(created){
   try{
    await api('/v1/projects/'+project+'/protection-bypass',{revoke:{secret,regenerate:false}});
    const after=await api('/v9/projects/'+project);assert(!after.protectionBypass?.[secret]&&after.ssoProtection?.deploymentType==='all','CREDENTIAL_REVOCATION_REQUIRED');
    report.temporaryCredentialRevoked=true;
   }catch{report.temporaryCredentialRevoked=false;report.passed=false;}
  }
  const anon=await fetch(origin+'/sitemap.xml',{redirect:'manual',signal:AbortSignal.timeout(20000)}).catch(()=>null);
  report.anonymousAfter=anon?.status;report.protectionRetained=[302,401].includes(anon?.status);if(!report.protectionRetained)report.passed=false;
  report.finishedAt=new Date().toISOString();const file=path.join(dir,`hosted-acceptance-${Date.now()}.json`);fs.writeFileSync(file,JSON.stringify(report,null,2),{flag:'wx'});
  console.log(JSON.stringify({file,passed:report.passed,checks:report.checks.length,temporaryCredentialRevoked:report.temporaryCredentialRevoked,failure:report.failure}));
  if(!report.passed)process.exitCode=1;
 }
})().catch(()=>{console.error('ACCEPTANCE_OR_CLEANUP_FAILED');process.exitCode=1;});
