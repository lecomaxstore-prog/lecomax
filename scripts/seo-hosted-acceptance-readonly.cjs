// Defaults to a plan. --execute-readonly performs only fixed-origin GETs.
// Supply genuine sessions securely via environment; never mint or print cookies.
const fs=require('node:fs');
// Production is NO-GO. Retain the historical plan/implementation for review,
// but require a separately reviewed change before production execution.
if (process.argv.length > 2 && !(process.argv.length === 3 && process.argv[2] === '--plan')) {
 console.error('PRODUCTION_ACCEPTANCE_DISABLED_USE_STAGING_RUNNER');
 process.exit(1);
}
const actors=[
 ['anonymous',null,401],['invalid','invalid-readonly-probe',401],
 ['owner','SEO_ACCEPTANCE_OWNER_SESSION',200],
 ['catalogue-editor','SEO_ACCEPTANCE_EDITOR_SESSION',200],
 ['view-only','SEO_ACCEPTANCE_VIEWER_SESSION',403],
 ['product-only','SEO_ACCEPTANCE_PRODUCT_EDITOR_SESSION',403],
 ['suspended','SEO_ACCEPTANCE_SUSPENDED_SESSION',401],
];
const plan={url:'https://lecomax.com/api/admin/seo/sync',method:'GET',productionWrites:false,rpcMutations:false,
 prerequisites:['Reviewed candidate deployed with manual activation disabled','Both approved migrations and SQL postflights passed','Genuine sessions supplied by authorized testers; no synthetic production accounts'],
 actors:actors.map(([name,key,expected])=>({name,sessionEnvironment:key?.startsWith('SEO_')?key:null,expected})),
 excluded:['POST admin sync','GET worker sync','Mutation RPCs','Staff/role changes','Login attempts','Provider calls']};
if(!process.argv.includes('--execute-readonly')){console.log(JSON.stringify(plan,null,2));process.exit(0);}
(async()=>{
 const results=[];
 for(const [name,key,expected] of actors){
  const cookie=key?.startsWith('SEO_')?process.env[key]:key;
  if(key?.startsWith('SEO_')&&!cookie){results.push({name,result:'not-run',reason:'Genuine session not supplied'});continue;}
  if(cookie&&/[\r\n;]/.test(cookie))throw Error('SESSION_FORMAT_REJECTED');
  const r=await fetch(plan.url,{method:'GET',redirect:'manual',headers:cookie?{Cookie:'admin_session='+cookie}:{},signal:AbortSignal.timeout(15000)});
  const entry={name,expected,status:r.status,result:r.status===expected?'passed':'failed'};
  if(expected===200&&r.status===200){
   let body;try{body=await r.json();}catch{body=null;}
   entry.disabled=body?.enabled===false;
   entry.runState=typeof body?.run?.state==='string'?body.run.state:null;
   entry.noToken=body?.run&&!('token'in body.run)&&!('lease_token'in body.run);
   entry.noStore=/no-store/i.test(r.headers.get('cache-control')||'');
   if(!entry.disabled||!entry.noToken||!entry.noStore)entry.result='failed';
  }
  results.push(entry);
 }
 const report={at:new Date().toISOString(),...plan,results,complete:results.every(e=>e.result==='passed')};
 fs.mkdirSync('artifacts/seo-final-preparation',{recursive:true});
 const file=`artifacts/seo-final-preparation/hosted-acceptance-${Date.now()}.json`;
 fs.writeFileSync(file,JSON.stringify(report,null,2),{flag:'wx'});
 console.log(JSON.stringify({file,complete:report.complete,results}));if(!report.complete)process.exitCode=1;
})().catch(e=>{console.error(e.cause?.code||e.code||'HOSTED_ACCEPTANCE_FAILED');process.exitCode=1;});
