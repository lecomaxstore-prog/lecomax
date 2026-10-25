// Real Next HTTP/cache paths with synthetic signed owner and storage adapter.
const fs=require('fs'),crypto=require('crypto'),assert=require('assert/strict');
const origin='http://127.0.0.1:31943',dir='artifacts/seo-e-final-20261022';
const report={at:new Date().toISOString(),synthetic:true,hostedLoginTested:false,checks:[]};
(async()=>{
 const payload=Date.now()+':contact@lecomax.com:'+(Date.now()+3600000),sig=crypto.createHmac('sha256','synthetic-session-secret-for-isolated-build-only').update(payload).digest('hex'),cookie='admin_session='+Buffer.from(payload+'.'+sig).toString('base64url');
 const page=async(locale)=>{const r=await fetch(origin+'/produit/seo-fixture-'+locale+'/');assert.equal(r.status,200);const html=await r.text();assert(!html.includes('PRIVATE_DRAFT_SENTINEL'));return html;};
 let html=await page('fr');assert(!html.includes('<title>APPROVED_E_fr'));report.checks.push('Unpublished private draft absent from rendered HTML');
 for(const [action,published]of [['approve',true],['reset',false]]){
  const state=JSON.parse(fs.readFileSync(dir+'/reader-state.json'));
  const r=await fetch(origin+'/api/admin/seo',{method:'POST',headers:{Origin:origin,Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify({kind:'product',id:'seo-fixture-fr',version:state.version,action})});assert.equal(r.status,200);assert(!(await r.json()).warning);
  html=await page('fr');assert.equal(html.includes('<title>APPROVED_E_fr'),published);report.checks.push(action+' invalidates real Next cache and updates next page response');
 }
 html=await page('ar');assert(html.includes('<title>APPROVED_E_ar'));report.checks.push('Approved public metadata remains active with SEO flags false');
 report.passed=true;report.limitations=['Synthetic signed cookie; no upstream identity login or real hosted actor lifecycle.','Storage mutations use a loopback-only adapter; native PostgreSQL/PostgREST verified separately.','Cache invalidation success tested; failure fallback can retain old approved content for the configured cache interval.'];
})().catch(e=>{report.passed=false;report.error=e.message;process.exitCode=1;}).finally(()=>{fs.writeFileSync(dir+'/reader-runtime-'+Date.now()+'.json',JSON.stringify(report,null,2),{flag:'wx'});console.log(JSON.stringify(report));});
