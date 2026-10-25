const { vercelApiFetch } = require('./vercel-cli-api.cjs');
// Read-only target and pinned-source checks. No credentials are emitted.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const id='prj_jPniwpH4s81bhISVReUKTQN0GwvD',team='team_yFLUcpSvgQi8EQuvuorOZW7w';
const root=path.resolve(__dirname,'..'),candidate=path.resolve(root,"../L'ecomax-seo-staging");
const report={at:new Date().toISOString(),projectId:id,teamId:team,checks:[]};
const check=(ok,name)=>{report.checks.push({name,passed:!!ok});if(!ok)throw Error(name);};
(async()=>{
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'artifacts/seo-staging-rc-20261020/final-manifest.json')));
 check(manifest.candidateChanges.every(x=>crypto.createHash('sha256').update(fs.readFileSync(path.join(candidate,x.file))).digest('hex')===x.sha256),'PINNED_CANDIDATE_HASHES');
 const get=async route=>{const u=new URL(route,'https://api.vercel.com');u.searchParams.set('teamId',team);const r=await vercelApiFetch(u,{headers:{},redirect:'error',signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error('API_'+r.status);return r.json();};
 const p=await get('/v9/projects/'+id);
 check(p.id===id&&p.accountId===team&&p.name==='lecomax-seo-staging','IDENTITY');
 check(!p.link&&p.ssoProtection?.deploymentType==='all','PROTECTED_GIT_DISCONNECTED');
 const domains=await get('/v9/projects/'+id+'/domains');
 report.domains=(domains.domains||[]).map(x=>x.name);
 check(Array.isArray(domains.domains)&&!domains.pagination?.next&&domains.domains.every(x=>x.name==='lecomax-seo-staging.vercel.app'&&!x.redirect),'ONLY_STAGING_DOMAIN');
 report.crons=p.crons?{enabled:p.crons.enabled,definitions:p.crons.definitions}:null;
 check(!p.crons?.definitions?.length,'NO_PROJECT_CRONS');
 const cfg=JSON.parse(fs.readFileSync(path.join(candidate,'vercel.json')));
 check(cfg.crons?.length===0&&cfg.git?.deploymentEnabled===false,'SOURCE_CRONS_AND_GIT_DISABLED');
 const env=(await get('/v10/projects/'+id+'/env?decrypt=false')).envs;
 report.sensitiveMetadata=env.filter(x=>x.type==='sensitive').map(x=>({key:x.key,createdAt:x.createdAt,updatedAt:x.updatedAt}));
 report.passed=true;
})().catch(e=>{report.passed=false;report.failure=/^[A-Z0-9_]+$/.test(e.message)?e.message:'AUDIT_FAILED';process.exitCode=1;}).finally(()=>{const file=path.join(root,`artifacts/seo-first-deployment-audit-${Date.now()}.json`);fs.writeFileSync(file,JSON.stringify(report,null,2),{flag:'wx'});console.log(JSON.stringify({file,...report},null,2));});
