const { vercelApiFetch } = require('./vercel-cli-api.cjs');
const fs=require('node:fs'),path=require('node:path');
const id='dpl_A2Zu5TrCJ787DskFvBvtXb3jU9oG',project='prj_jPniwpH4s81bhISVReUKTQN0GwvD',team='team_yFLUcpSvgQi8EQuvuorOZW7w';
(async()=>{
 const get=async route=>{const u=new URL(route,'https://api.vercel.com');u.searchParams.set('teamId',team);const r=await vercelApiFetch(u,{headers:{},redirect:'error',signal:AbortSignal.timeout(30000)});if(!r.ok){const body=await r.json().catch(()=>({}));const failure={at:new Date().toISOString(),route,status:r.status,code:body.error?.code,message:String(body.error?.message||'').replace(/Bearer\s+\S+|(?:sbp_|sb_secret_)[A-Za-z0-9_-]+/g,'[REDACTED]')};fs.writeFileSync(`artifacts/seo-hosting-access-failure-${Date.now()}.json`,JSON.stringify(failure,null,2),{flag:'wx'});console.log(JSON.stringify(failure));throw Error('API_'+r.status);}return r.json();};
 const d=await get('/v13/deployments/'+id);if(d.projectId!==project)throw Error('TARGET_MISMATCH');
 const p=await get('/v9/projects/'+project);if(p.accountId!==team||p.ssoProtection?.deploymentType!=='all'||p.link)throw Error('ISOLATION_DRIFT');
 const events=await get('/v3/deployments/'+id+'/events?limit=1000');
 const text=(Array.isArray(events)?events:events.events||[]).map(e=>e.text||e.payload?.text||'').join('\n').replace(/(?:sbp_|sb_secret_)[A-Za-z0-9_-]+/g,'[REDACTED]').replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,'[REDACTED JWT]');
 const stamp=Date.now(),file=`artifacts/seo-first-hosted-status-${stamp}.json`,log=`artifacts/seo-first-hosted-build-${stamp}.log`;
 const report={at:new Date().toISOString(),id,projectId:project,teamId:team,url:d.url,state:d.readyState,errorCode:d.errorCode,errorMessage:d.errorMessage,alias:d.alias,aliasAssigned:d.aliasAssigned,protection:p.ssoProtection?.deploymentType,gitDisconnected:!p.link,crons:p.crons?.definitions||[],log};
 fs.writeFileSync(file,JSON.stringify(report,null,2),{flag:'wx'});fs.writeFileSync(log,text,{flag:'wx'});console.log(JSON.stringify({file,...report,buildTail:text.slice(-5000)},null,2));
})().catch(e=>{console.error(/^[A-Z_0-9]+$/.test(e.message)?e.message:'STATUS_FAILED');process.exitCode=1;});
