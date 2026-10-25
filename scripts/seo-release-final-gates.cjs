// Execute final read-only gates. Never changes approval flags or deploys on failed gates.
const fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path'),cp=require('node:child_process');
const {pathToFileURL}=require('node:url');
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const dir='operations/seo/production-readiness-20261021', source='artifacts/seo-production-review-20261021/source';
const report={at:new Date().toISOString(),ownerAuthorization:{received:true,scope:'User explicitly authorizes named production candidate, reviewed migrations and production deployment only after all critical gates pass',effectiveExecution:false},productionMutations:false};
(async()=>{
 const manifest=JSON.parse(fs.readFileSync(dir+'/source-manifest-final.json'));
 report.candidate={manifest:dir+'/source-manifest-final.json',sha256:hash(dir+'/source-manifest-final.json'),count:manifest.files.length,missingOrChanged:manifest.files.filter(e=>!fs.existsSync(source+'/'+e.file)||hash(source+'/'+e.file)!==e.sha256).map(e=>e.file),historicalApprovalFlagUnchanged:manifest.productionDeploymentAuthorized===false};
 const hosting=JSON.parse(fs.readFileSync('artifacts/seo-write-guard-20261021/hosting-1792602983802.json')).projects.production;
 const contract=JSON.parse(fs.readFileSync(dir+'/environment-contract.json'));
 const names=new Set(hosting.environment.filter(e=>e.scopes.includes('production')).map(e=>e.name));
 report.environment={missingRequired:[...Object.keys(contract.requiredPublicConfiguration),...Object.keys(contract.requiredSecretsAndBindings),'SEO_RUNTIME_ENV'].filter((n,i,a)=>a.indexOf(n)===i&&!names.has(n)),valuesVerified:false};
 report.rollback=hosting.deployment;
 const expected=JSON.parse(fs.readFileSync(source+'/vercel.json')).crons;
 const pairs=a=>a.map(e=>e.path+' '+e.schedule).sort();
 report.cronsPreserved=JSON.stringify(pairs(expected))===JSON.stringify(pairs(hosting.crons));
 const backup=JSON.parse(fs.readFileSync('artifacts/seo-encrypted-backup-1792602387119.json'));
 report.backup={snapshotAt:backup.snapshotAt,ageMinutes:(Date.now()-Date.parse(backup.snapshotAt))/60000,checksumVerified:hash(path.join(backup.archive.directory,'production.dump.aes256gcm'))===backup.archive.ciphertextSha256,isolatedApplicationRestorePassed:JSON.parse(fs.readFileSync('artifacts/seo-encrypted-local-restore-1792602598909.json')).passed,fullPlatformRecovery:false,releaseRpoSpecified:false};
 report.databasePreflight=JSON.parse(fs.readFileSync('artifacts/seo-final-database-preflight-1792603011001.json')).compatiblePreflight;
 const policy=await import(pathToFileURL(path.resolve(source,'operations/seo-vercel/lib/environment-target.mjs')));
 // The first build gate requires both selectors. Metadata proves absence, so no secret readback is needed to reproduce this failure.
 try { await policy.applicationEnvironment({VERCEL_ENV:'production',NODE_ENV:'production'});report.buildConfigurationGuard={passed:true}; }
 catch(e){report.buildConfigurationGuard={passed:false,error:e.message==='ENVIRONMENT_ISOLATION_REQUIRED'?e.message:'POLICY_REJECTED',basis:'Observed production APP_ENV and NEXT_PUBLIC_APP_ENV are absent; exact first build-policy prerequisite executed',compilationRun:false};}
 const test=cp.spawnSync(process.execPath,['--import',pathToFileURL(path.resolve('scripts/seo-release-test-fixture-loader.mjs')).href,'--test','tests/seo-editorial-api.test.ts'],{cwd:source,encoding:'utf8',windowsHide:true,timeout:120000});
 const log=`artifacts/seo-release-security-${Date.now()}.log`;fs.writeFileSync(log,(test.stdout||'')+(test.stderr||''),{flag:'wx'});
 report.securityTests={exitCode:test.status,log,passed:test.status===0};
 const disk=fs.statfsSync('.');report.freeBytes=disk.bavail*disk.bsize;
 report.decision='BLOCKED';report.migrationsExecuted=0;report.deploymentCreated=false;
 report.blockers=['Production environment contract missing required values; build configuration policy rejected.','Sensitive hosted secret bytes/bindings and owner reauthentication not verified.','Authenticated staging security acceptance incomplete for current release.','Production compilation not run after failed configuration gate; limited local disk headroom.'];
})().catch(()=>{report.decision='BLOCKED';report.gateRunnerFailed=true;process.exitCode=1;}).finally(()=>{const file=`artifacts/seo-release-execution-gates-${Date.now()}.json`;fs.writeFileSync(file,JSON.stringify(report,null,2),{flag:'wx'});console.log(JSON.stringify({file,...report}));});
