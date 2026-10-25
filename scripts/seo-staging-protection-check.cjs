const fs=require('node:fs');
(async()=>{
 const origins=['https://lecomax-seo-staging.vercel.app','https://lecomax-seo-staging-mqw687ba5-lecomaxstore-4321s-projects.vercel.app'];
 const routes=['/','/admin/seo','/api/admin/seo','/sitemap.xml','/robots.txt','/produit/seo-fixture-fr'];
 const checks=[];
 for(const origin of origins)for(const route of routes){const start=performance.now();const r=await fetch(origin+route,{redirect:'manual',signal:AbortSignal.timeout(20000)});const body=await r.text();checks.push({origin,route,status:r.status,ms:Math.round(performance.now()-start),server:r.headers.get('server'),noindex:r.headers.get('x-robots-tag'),locationOrigin:r.headers.get('location')?new URL(r.headers.get('location'),origin).origin:null,vercelAuthPage:/Authentication Required|Log in to Vercel|Vercel Authentication/i.test(body),bodySaved:false});}
 const report={at:new Date().toISOString(),authenticated:false,checks,passed:checks.every(c=>c.vercelAuthPage&&(c.status===401||c.status===302&&c.locationOrigin==='https://vercel.com'))};
 const file=`artifacts/seo-staging-protection-${Date.now()}.json`;fs.writeFileSync(file,JSON.stringify(report,null,2),{flag:'wx'});console.log(JSON.stringify({file,...report},null,2));if(!report.passed)process.exitCode=1;
})().catch(()=>{console.error('PROTECTION_CHECK_FAILED');process.exitCode=1;});
