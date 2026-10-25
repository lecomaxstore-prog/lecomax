// GET-only metadata review; no environment values, tokens or cookies are saved.
const fs=require('node:fs');
const {vercelApiFetch}=require('./vercel-cli-api.cjs');
const team='team_yFLUcpSvgQi8EQuvuorOZW7w';
const projects={staging:'prj_jPniwpH4s81bhISVReUKTQN0GwvD',production:'prj_g5xbDC0WX1RSXf6znHsAS7XvhLBb'};
const report={createdAt:new Date().toISOString(),readOnly:true,projects:{}};
async function get(route){const url=new URL(route,'https://api.vercel.com');url.searchParams.set('teamId',team);
 const r=await vercelApiFetch(url,{method:'GET',redirect:'error',signal:AbortSignal.timeout(30000)});
 if(!r.ok)throw Error('HTTP_'+r.status);return r.json();}
(async()=>{
 for(const [name,id] of Object.entries(projects)){
  const p=await get('/v9/projects/'+id);if(p.id!==id||p.accountId!==team)throw Error('IDENTITY');
  const alias=name==='staging'?'lecomax-seo-staging.vercel.app':'lecomax.com';
  const a=await get('/v4/aliases/'+alias);const deploymentId=a.deploymentId||a.deployment?.id;
  const d=await get('/v13/deployments/'+deploymentId);if(d.projectId!==id)throw Error('IDENTITY');
  const e=await get('/v10/projects/'+id+'/env?decrypt=false');
  report.projects[name]={id,alias,deployment:{id:d.id,url:d.url,readyState:d.readyState,revision:d.meta?.githubCommitSha||null},
   protection:p.ssoProtection?.deploymentType,crons:p.crons?.definitions||[],
   environment:e.envs.map(x=>({name:x.key,scopes:x.target||[],customEnvironmentIds:x.customEnvironmentIds||[]})),valuesVerified:false};
 }
 report.completed=true;
})().catch(e=>{report.completed=false;report.error=/^HTTP_\d+$/.test(e.message)?e.message:'READONLY_METADATA_FAILED';process.exitCode=1;})
.finally(()=>{const file=`artifacts/seo-write-guard-20261021/hosting-${Date.now()}.json`;fs.writeFileSync(file,JSON.stringify(report,null,2),{flag:'wx'});console.log(JSON.stringify({file,completed:report.completed,error:report.error}));});
