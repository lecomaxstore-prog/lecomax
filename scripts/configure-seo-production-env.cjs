// Owner-authorized additions only. No overwrites, rotation, deployment or SQL.
const fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {vercelApiFetch}=require('./vercel-cli-api.cjs');
const id='prj_g5xbDC0WX1RSXf6znHsAS7XvhLBb',team='team_yFLUcpSvgQi8EQuvuorOZW7w',ref='yddqwgdgeljkzfsmtein';
const literals={APP_ENV:'production',NEXT_PUBLIC_APP_ENV:'production',SEO_RUNTIME_ENV:'production',NEXT_PUBLIC_SITE_URL:'https://lecomax.com',SEO_SYNC_ENABLED:'false',SEO_MANUAL_SYNC_ENABLED:'false',SEO_AI_ENABLED:'false',SEO_EDITORIAL_ENABLED:'false',SEO_MIRAI_FALLBACK_ENABLED:'false',INDEXNOW_ENABLED:'false'};
const bindings={NEXT_PUBLIC_SUPABASE_KEY_BINDING:'NEXT_PUBLIC_SUPABASE_ANON_KEY',SUPABASE_SERVICE_KEY_BINDING:'SUPABASE_SERVICE_ROLE_KEY',OWNER_DATABASE_BINDING:'OWNER_DATABASE_URL'};
const report={at:new Date().toISOString(),project:id,team,productionOnly:true,deployed:false,migrationsExecuted:false,added:[],verified:[],blocked:[],credentialsPrinted:false};
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const safe=e=>({id:e.id,name:e.key,scopes:e.target,type:e.type,gitBranch:e.gitBranch||null,customEnvironmentIds:e.customEnvironmentIds||[],createdAt:e.createdAt,updatedAt:e.updatedAt});
async function api(route,method='GET',body){const u=new URL(route,'https://api.vercel.com');u.searchParams.set('teamId',team);const r=await vercelApiFetch(u,{method,headers:{'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});if(!r.ok)throw Error('HTTP_'+r.status);return r.json();}
const list=async()=> (await api(`/v10/projects/${id}/env?decrypt=false`)).envs;
const prod=(entries,key)=>entries.filter(e=>e.key===key&&e.target?.includes('production')&&!e.gitBranch);
async function readable(e){const data=await api(`/v1/projects/${id}/env/${e.id}`);return typeof data.value==='string'&&data.value.length?data.value:null;}
async function ensure(key,value){
 const entries=await list(),existing=prod(entries,key);
 if(existing.length){if(existing.length!==1){report.blocked.push({key,reason:'AMBIGUOUS_SCOPE'});return false;}const actual=await readable(existing[0]);if(actual!==value){report.blocked.push({key,reason:actual===null?'EXISTING_VALUE_WITHHELD':'EXISTING_VALUE_DIFFERS_REQUIRES_APPROVAL'});return false;}report.verified.push(key);return true;}
 // No upsert; a concurrent creation fails closed rather than overwriting.
 await api(`/v10/projects/${id}/env`,'POST',{key,value,type:'encrypted',target:['production']});
 report.added.push(key);
 const after=prod(await list(),key);assert(after.length===1&&after[0].target.length===1&&!after[0].customEnvironmentIds?.length);
 assert.equal(await readable(after[0]),value,'READBACK_MISMATCH');report.verified.push(key);return true;
}
(async()=>{
 const p=await api(`/v9/projects/${id}`),t=await api(`/v2/teams/${team}`);
 assert(p.id===id&&p.name==='lecomax'&&p.accountId===team&&t.slug==='lecomaxstore-4321s-projects');
 const alias=await api('/v4/aliases/lecomax.com');const deployment=await api('/v13/deployments/'+(alias.deploymentId||alias.deployment?.id));assert.equal(deployment.projectId,id);
 report.targetVerified=true;report.productionDeployment=deployment.id;report.productionRevision=deployment.meta?.githubCommitSha||null;
 const before=await list();report.before=before.map(safe);
 // Compare all existing metadata and ciphertext/value bytes in memory; never export values.
 const fingerprints=new Map(before.map(e=>[e.id,sha(JSON.stringify(e))]));
 const shared=await api('/v1/env');assert(Array.isArray(shared.data)&&shared.data.length===0&&!shared.pagination?.next,'SHARED_ENV_REVIEW_REQUIRED');
 for(const [key,value]of Object.entries(literals))await ensure(key,value);
 const values={...literals};
 for(const [binding,input]of Object.entries(bindings)){
  const entries=prod(await list(),input);if(entries.length!==1){report.blocked.push({key:binding,reason:'INPUT_SCOPE_AMBIGUOUS'});continue;}
  const value=await readable(entries[0]);
  if(!value){report.blocked.push({key:binding,reason:'EXACT_EXISTING_PRODUCTION_CREDENTIAL_WITHHELD',input,storageType:entries[0].type});continue;}
  if(input==='OWNER_DATABASE_URL'){
   const u=new URL(value);assert((u.hostname===`db.${ref}.supabase.co`&&decodeURIComponent(u.username)==='postgres'||u.hostname.endsWith('.pooler.supabase.com')&&decodeURIComponent(u.username)===`postgres.${ref}`)&&u.port==='5432'&&u.pathname==='/postgres'&&u.search==='?sslmode=verify-full');
  }else{
   // Independently verify key project/role for legacy JWTs; opaque keys need separate provenance.
   const parts=value.split('.');if(parts.length!==3){report.blocked.push({key:binding,reason:'OPAQUE_KEY_PROVENANCE_REQUIRED'});continue;}
   const claims=JSON.parse(Buffer.from(parts[1],'base64url'));assert.equal(claims.ref,ref);assert.equal(claims.role,input==='NEXT_PUBLIC_SUPABASE_ANON_KEY'?'anon':'service_role');
  }
  const bound=`${ref}:${sha(value)}`;if(await ensure(binding,bound)){values[input]=value;values[binding]=bound;}
 }
 // Production revision uses ADMIN_SESSION_SECRET || SUPABASE_SERVICE_ROLE_KEY.
 // A new independent key changes the signer and invalidates existing tokens on next deployment.
 report.blocked.push({key:'ADMIN_SESSION_SECRET',reason:'NEW_SIGNER_INVALIDATES_EXISTING_SESSIONS_ON_NEXT_DEPLOYMENT_REQUIRES_EXPLICIT_REAUTHORIZATION_APPROVAL'});
 const after=await list();report.after=after.map(safe);
 report.unrelatedPreserved=before.every(e=>{const current=after.find(x=>x.id===e.id);return current&&sha(JSON.stringify(current))===fingerprints.get(e.id);});
 const afterProject=await api(`/v9/projects/${id}`),afterAlias=await api('/v4/aliases/lecomax.com');
 report.cronsPreserved=JSON.stringify(p.crons)===JSON.stringify(afterProject.crons);
 report.deploymentUnchanged=(afterAlias.deploymentId||afterAlias.deployment?.id)===deployment.id;
 report.nonProductionPreserved=before.filter(e=>!e.target?.includes('production')).every(e=>after.some(x=>x.id===e.id&&sha(JSON.stringify(x))===fingerprints.get(e.id)));
 report.literalCount=Object.keys(literals).filter(k=>report.verified.includes(k)).length;
 report.bindingCount=Object.keys(bindings).filter(k=>report.verified.includes(k)).length;
 report.requiredMissing=[...Object.keys(literals),...Object.keys(bindings),'ADMIN_SESSION_SECRET'].filter(k=>prod(after,k).length===0);
 report.environmentValidation='FAIL';report.build='NOT_RUN_CONFIGURATION_INCOMPLETE';
 assert(report.unrelatedPreserved&&report.cronsPreserved&&report.deploymentUnchanged&&report.nonProductionPreserved,'PRESERVATION_CHECK_FAILED');
 report.completed=true;
})().catch(e=>{report.failure=/^[A-Z0-9_]+$/.test(e.message)?e.message:'CONFIGURATION_FAILED';process.exitCode=1;}).finally(()=>{const file=`artifacts/seo-production-env-applied-${Date.now()}.json`;fs.writeFileSync(file,JSON.stringify(report,null,2),{flag:'wx'});console.log(JSON.stringify({file,...report,before:undefined,after:undefined}));});
