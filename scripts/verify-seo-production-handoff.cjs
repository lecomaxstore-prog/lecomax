// Read-only checkpoint verification. Never exports credential values or mutates hosting.
const fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const {vercelApiFetch}=require('./vercel-cli-api.cjs');
const project='prj_g5xbDC0WX1RSXf6znHsAS7XvhLBb',team='team_yFLUcpSvgQi8EQuvuorOZW7w';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const report={at:new Date().toISOString(),readOnly:true,valuesExported:false};
const literals={APP_ENV:'production',NEXT_PUBLIC_APP_ENV:'production',SEO_RUNTIME_ENV:'production',NEXT_PUBLIC_SITE_URL:'https://lecomax.com',SEO_SYNC_ENABLED:'false',SEO_MANUAL_SYNC_ENABLED:'false',SEO_AI_ENABLED:'false',SEO_EDITORIAL_ENABLED:'false',SEO_MIRAI_FALLBACK_ENABLED:'false',INDEXNOW_ENABLED:'false'};
async function get(route){const u=new URL(route,'https://api.vercel.com');u.searchParams.set('teamId',team);const r=await vercelApiFetch(u);if(!r.ok)throw Error('HTTP_'+r.status);return r.json();}
const safe=e=>({id:e.id,name:e.key,scopes:e.target,type:e.type,gitBranch:e.gitBranch||null,customEnvironmentIds:e.customEnvironmentIds||[],createdAt:e.createdAt,updatedAt:e.updatedAt});
(async()=>{
 const p=await get('/v9/projects/'+project);if(p.id!==project||p.name!=='lecomax'||p.accountId!==team)throw Error('IDENTITY');
 const before=(await get('/v10/projects/'+project+'/env?decrypt=false')).envs;
 const select=k=>before.filter(e=>e.key===k&&e.target?.includes('production')&&!e.gitBranch);
 const env={NODE_ENV:'production',VERCEL_ENV:'production'};report.variables=[];
 const names=[...Object.keys(literals),'NEXT_PUBLIC_SUPABASE_KEY_BINDING','SUPABASE_SERVICE_KEY_BINDING','OWNER_DATABASE_BINDING','ADMIN_SESSION_SECRET'];
 for(const key of [...names,'NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_ANON_KEY','SUPABASE_SERVICE_ROLE_KEY','OWNER_DATABASE_URL']){
  const entries=select(key),e=entries[0];let readable=false;
  if(entries.length===1){const v=await get('/v1/projects/'+project+'/env/'+e.id);readable=typeof v.value==='string'&&v.value.length>0;if(readable)env[key]=v.value;}
  report.variables.push({key,count:entries.length,productionOnly:!!e&&e.target.length===1&&!e.customEnvironmentIds?.length,type:e?.type,readable,...(key in literals?{matches:env[key]===literals[key]}:{})});
 }
 report.verified=report.variables.filter(e=>e.key in literals&&e.matches&&e.count===1&&e.productionOnly).length;
 report.missing=names.filter(k=>select(k).length===0);
 const policy=await import(pathToFileURL(path.resolve('artifacts/seo-production-handoff-20261021/source/operations/seo-vercel/lib/environment-target.mjs')));
 try{await policy.applicationEnvironment(env);report.environmentValidation='PASS';}catch{report.environmentValidation='FAIL_INCOMPLETE_VERIFIABLE_PRODUCTION_CONFIGURATION';}
 const prior=JSON.parse(fs.readFileSync('artifacts/seo-production-env-applied-1792604023618.json'));
 report.checkpointMetadataPreserved=prior.after.every(e=>before.some(x=>JSON.stringify(safe(x))===JSON.stringify(e)));
 const alias=await get('/v4/aliases/lecomax.com');report.productionDeployment=alias.deploymentId||alias.deployment?.id;
 const deployment=await get('/v13/deployments/'+report.productionDeployment);report.revision=deployment.meta?.githubCommitSha;report.productionUnchanged=report.productionDeployment===prior.productionDeployment;
 const manifest=JSON.parse(fs.readFileSync('operations/seo/production-handoff-20261021/source-manifest.json'));
 report.candidate={count:manifest.files.length,sha256:sha(fs.readFileSync('operations/seo/production-handoff-20261021/source-manifest.json')),mismatches:manifest.files.filter(e=>!fs.existsSync(e.source)||sha(fs.readFileSync(e.source))!==e.sha256).map(e=>e.file)};
 const old=JSON.parse(fs.readFileSync('operations/seo/production-readiness-20261021/source-manifest-final.json'));
 report.originalCandidate={count:old.files.length,mismatches:old.files.filter(e=>![e.source,'artifacts/seo-production-review-20261021/source/'+e.file].some(f=>fs.existsSync(f)&&sha(fs.readFileSync(f))===e.sha256)).map(e=>e.file)};
 const migration=JSON.parse(fs.readFileSync('operations/seo/production-readiness-20261021/migration-plan.json'));
 report.migrations={count:migration.migrations.length,mismatches:migration.migrations.filter(e=>sha(fs.readFileSync(e.file))!==e.sha256).map(e=>e.file)};
 const pairs=x=>x.map(e=>({path:e.path,schedule:e.schedule})).sort((a,b)=>a.path.localeCompare(b.path));
 report.cronsPreserved=JSON.stringify(pairs(p.crons.definitions))===JSON.stringify(pairs(JSON.parse(fs.readFileSync('artifacts/seo-production-handoff-20261021/source/vercel.json')).crons));
 const backup=JSON.parse(fs.readFileSync('artifacts/seo-encrypted-backup-1792602387119.json')),restore=JSON.parse(fs.readFileSync('artifacts/seo-encrypted-local-restore-1792602598909.json'));
 const archive=path.join(backup.archive.directory,'production.dump.aes256gcm');
 report.recovery={backupPassed:backup.passed,restorePassed:restore.passed,ciphertextMatches:sha(fs.readFileSync(archive))===backup.archive.ciphertextSha256,restoreMatchesArchive:restore.archive.ciphertextSha256===backup.archive.ciphertextSha256,snapshotAt:backup.snapshotAt,ageHours:(Date.now()-Date.parse(backup.snapshotAt))/3600000,releaseWindowRpoApproved:false,limitations:[...backup.limitations,...restore.limitations]};
 const after=(await get('/v10/projects/'+project+'/env?decrypt=false')).envs;
 report.allEnvironmentEntriesUnchanged=sha(JSON.stringify(before))===sha(JSON.stringify(after));
})().catch(e=>{report.failure=/^[A-Z0-9_]+$/.test(e.message)?e.message:'VERIFICATION_FAILED';process.exitCode=1;}).finally(()=>{const file='artifacts/seo-production-handoff-verification-'+Date.now()+'.json';fs.writeFileSync(file,JSON.stringify(report,null,2),{flag:'wx'});console.log(JSON.stringify({file,...report}));});
