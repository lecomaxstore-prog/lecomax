const { vercelApiFetch } = require('./vercel-cli-api.cjs');
const fs=require('node:fs'),path=require('node:path');
const {environmentEvidence}=require('./seo-hosting-evidence.cjs');
// GET-only Vercel metadata. Never decrypt/download environment values.
(async()=>{
  const project=JSON.parse(fs.readFileSync('.vercel/project.json','utf8'));
  const get=async route=>{const u=new URL(route,'https://api.vercel.com');u.searchParams.set('teamId',project.orgId);const r=await vercelApiFetch(u,{method:'GET',redirect:'error',headers:{},signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('HOSTING_GET_'+r.status);return r.json();};
  const alias=await get('/v4/aliases/lecomax.com');
  const id=alias.deploymentId||alias.deployment?.id;if(!id)throw Error('ALIAS_DEPLOYMENT_MISSING');
  const [deployment,settings,environment]=await Promise.all([get('/v13/deployments/'+id),get('/v9/projects/'+project.projectId),get('/v10/projects/'+project.projectId+'/env?decrypt=false')]);
  if(deployment.projectId!==project.projectId)throw Error('PROJECT_MISMATCH');
  if(settings.id!==project.projectId)throw Error('PROJECT_MISMATCH');
  const wanted=['ADMIN_EMAIL','ADMIN_SESSION_SECRET','NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_ANON_KEY','SUPABASE_SERVICE_ROLE_KEY','SEO_AI_BASE_URL','SEO_AI_API_KEY','SEO_AI_MODEL','SEO_SYNC_ENABLED','SEO_SYNC_SUPABASE_URL','SEO_SYNC_SERVICE_ROLE_KEY'];
  const names=(environment.envs||[]).filter(e=>e.target?.includes('production')).map(e=>e.key);
  const report={at:new Date().toISOString(),readOnly:true,projectId:project.projectId,alias:'lecomax.com',deploymentId:id,state:deployment.readyState,gitSha:deployment.gitSource?.sha||deployment.meta?.githubCommitSha,nodeVersion:settings.nodeVersion,framework:settings.framework,
    deploymentNodeVersion:deployment.projectSettings?.nodeVersion??null,
    environmentScopes:environmentEvidence(environment),
    productionEnvironmentPresence:Object.fromEntries(wanted.map(k=>[k,names.includes(k)])),environmentValuesPrinted:false,externalWorkerRunnerVerified:false};
  const file=`artifacts/seo-migration/decoupled-hosting-${Date.now()}.json`;fs.writeFileSync(file,JSON.stringify(report,null,2),{flag:'wx'});console.log(JSON.stringify({file,...report},null,2));
})().catch(e=>{console.error('Hosting read-only check failed:',/^HOSTING_GET_\d+$/.test(e.message)?e.message:e.code||'CHECK_FAILED');process.exitCode=1;});
