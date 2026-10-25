// Owner-authorized Release D only. Mutations are explicit, separate modes.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {vercelApiFetch}=require('./vercel-cli-api.cjs');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'artifacts/seo-release-d-production-20261022');fs.mkdirSync(dir,{recursive:true});
const source=path.join(dir,'source'),candidate=path.join(root,'release/seo-advanced-d-20261022');
const base='9692b1b51778c90a8a3f6fcfcac412771899032d',commit='ddf12f4a916478f80f1ca75a1ca83a193d36ef28',rollback='dpl_EXrVzU58gZvV2pACLtsGLaKZhce1';
const project='prj_g5xbDC0WX1RSXf6znHsAS7XvhLBb',team='team_yFLUcpSvgQi8EQuvuorOZW7w';
const node=path.join(root,'artifacts/seo-node24/node-v24.22.0.exe'),cli=path.join(process.env.APPDATA,'npm/node_modules/vercel/dist/index.js');
const pinned=path.join(root,'artifacts/seo-advanced-final-20261022/d/release-manifest-1792694840952.json');
const hash=(b,alg='sha256')=>crypto.createHash(alg).update(b).digest('hex');
const save=(n,r)=>fs.writeFileSync(path.join(dir,n),JSON.stringify(r,null,2)+'\n',{flag:'wx'}),read=n=>JSON.parse(fs.readFileSync(path.join(dir,n)));
const git=(...args)=>cp.execFileSync('git',args,{cwd:candidate,encoding:'utf8',windowsHide:true,stdio:['ignore','pipe','pipe']}).trim();
const safeEnv=()=>Object.fromEntries(Object.entries(process.env).filter(([k])=>/^(PATH|SystemRoot|windir|ComSpec|TEMP|TMP|USERPROFILE|APPDATA|LOCALAPPDATA|ProgramFiles|ProgramFiles\(x86\)|NUMBER_OF_PROCESSORS|PROCESSOR_ARCHITECTURE)$/i.test(k)));
async function get(p){const u=new URL(p,'https://api.vercel.com');u.searchParams.set('teamId',team);const r=await vercelApiFetch(u);assert(r.ok,'PROVIDER_HTTP_'+r.status);return r.json();}
function original(){assert.equal(hash(fs.readFileSync(pinned)),'e51d8a354d0c7386d755a7ed5521b0a017a79f0a4bb06fcd1b9904b7614fb9ff');const m=JSON.parse(fs.readFileSync(pinned));assert.equal(m.commit,commit);assert.equal(git('rev-parse','HEAD'),commit);assert.equal(git('status','--porcelain'),'');assert.equal(git('merge-base',base,commit),base);assert.deepEqual(git('diff','--name-only',base,commit).split('\n').sort(),m.scope);for(const f of m.files)assert.equal(hash(fs.readFileSync(path.join(candidate,f.file))),f.sha256,f.file);for(const r of Object.values(m.validation))assert.equal(r.exitCode,0);return m;}
function integrity(){original();const m=read('manifest.json');assert.equal(m.commit,commit);for(const f of m.files)assert.equal(hash(fs.readFileSync(path.join(source,f.file))),f.sha256,f.file);assert(!fs.existsSync(path.join(source,'.next')));assert(!fs.existsSync(path.join(source,'node_modules')));return m;}
async function config(){const entries=(await get('/v10/projects/'+project+'/env?decrypt=false')).envs.filter(e=>e.target?.includes('production')&&!e.gitBranch);const versions=entries.map(e=>({id:e.id,key:e.key,type:e.type,updatedAt:e.updatedAt,createdAt:e.createdAt})).sort((a,b)=>a.key.localeCompare(b.key));const flags={};for(const key of ['SEO_SYNC_ENABLED','SEO_MANUAL_SYNC_ENABLED','SEO_AI_ENABLED','SEO_EDITORIAL_ENABLED','SEO_MIRAI_FALLBACK_ENABLED','INDEXNOW_ENABLED','APP_ENV','NEXT_PUBLIC_APP_ENV','SEO_RUNTIME_ENV']){const es=entries.filter(e=>e.key===key);assert.equal(es.length,1,'CONFIG_MISSING_'+key);flags[key]=(await get('/v1/projects/'+project+'/env/'+es[0].id)).value;assert.equal(flags[key],key.endsWith('_ENABLED')?'false':'production','CONFIG_DRIFT_'+key);}return {versions,flags,secretValuesRead:false};}
function walk(nodes,prefix=''){return nodes.flatMap(n=>{const file=prefix+n.name;return n.type==='directory'?walk(n.children||[],file+'/'):[{file:file.replace(/^src\//,''),uid:n.uid}];});}
async function main(){const mode=process.argv[2];
 if(mode==='prepare'){
  const m=original();assert(!fs.existsSync(source));fs.mkdirSync(source);
  const old=JSON.parse(fs.readFileSync(path.join(root,'artifacts/seo-release2-20261022/c/receipt.json')));assert.equal(old.deployment,rollback);assert(old.passed);
  const previous=new Map(old.files.filter(f=>!f.file.startsWith('out/')).map(f=>[f.file,f.uid]));const aligned=[];
  for(const f of m.files){let bytes=fs.readFileSync(path.join(candidate,f.file));if(previous.has(f.file)&&!m.scope.includes(f.file)&&hash(bytes,'sha1')!==previous.get(f.file)){
    const prior=fs.readFileSync(path.join(root,'release/seo-official-2-c-20261022',f.file));assert.equal(hash(prior,'sha1'),previous.get(f.file),f.file);assert.equal(bytes.toString().replace(/\r\n/g,'\n'),prior.toString().replace(/\r\n/g,'\n'),'NON_NEWLINE_DRIFT_'+f.file);bytes=prior;aligned.push(f.file);
   }const target=path.join(source,f.file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes);
  }
  const generated='next-env.d.ts',b=fs.readFileSync(path.join(root,'release/seo-official-2-c-20261022',generated));assert.equal(hash(b,'sha1'),previous.get(generated));fs.writeFileSync(path.join(source,generated),b);
  const files=[...m.files.map(f=>f.file),generated].map(file=>({file,sha256:hash(fs.readFileSync(path.join(source,file)))}));
  save('manifest.json',{at:new Date().toISOString(),commit,base,rollback,project,source,changedFiles:m.scope,files,alignedLineEndings:aligned,reviewedManifestSha256:hash(fs.readFileSync(pinned)),validation:m.validation,authorization:'Owner explicitly authorized exact D deployment; E excluded; flags unchanged'});console.log(JSON.stringify({commit,files:files.length,approvedFiles:m.scope.length,aligned}));return;
 }
 if(mode==='preflight'){
  const m=integrity(),a=await get('/v4/aliases/lecomax.com'),d=await get('/v13/deployments/'+a.deployment.id),p=await get('/v9/projects/'+project);
  assert.equal(d.id,rollback);assert.equal(d.meta.githubCommitSha,base);assert.equal(d.readyState,'READY');assert.equal(d.projectId,project);assert.equal(p.accountId,team);assert.deepEqual(d.crons,JSON.parse(fs.readFileSync(path.join(source,'vercel.json'))).crons);
  const c=await config();const old=JSON.parse(fs.readFileSync(path.join(root,'artifacts/seo-release2-20261022/c/preflight.json')));assert.deepEqual(c.versions,old.versions,'CONFIG_CHANGED_SINCE_C');
  const remote=walk(await get('/v6/deployments/'+rollback+'/files')).filter(f=>!f.file.startsWith('out/'));
  for(const f of remote)if(!m.changedFiles.includes(f.file))assert.equal(hash(fs.readFileSync(path.join(source,f.file)),'sha1'),f.uid,'BASELINE_SOURCE_DRIFT_'+f.file);
  save('preflight.json',{at:new Date().toISOString(),commit,baseline:base,rollback,rollbackState:d.readyState,crons:d.crons,baselineSourceFiles:remote.length,...c});console.log(JSON.stringify({preflight:'passed',rollback,base,flags:c.flags,baselineSourceFiles:remote.length}));return;
 }
 if(mode==='deploy'){
  const m=integrity(),pre=read('preflight.json');assert.equal(pre.commit,commit);assert(!fs.existsSync(path.join(dir,'submission.json')),'ALREADY_SUBMITTED_INSPECT');
  const a=await get('/v4/aliases/lecomax.com');assert.equal(a.deployment.id,rollback,'PRODUCTION_MOVED');const c=await config();assert.deepEqual(c.versions,pre.versions,'CONFIG_DRIFT');
  save('submission.json',{at:new Date().toISOString(),commit,rollback,manifestSha256:hash(fs.readFileSync(path.join(dir,'manifest.json')))});
  const fd=fs.openSync(path.join(dir,'deployment.log'),'wx');const r=cp.spawnSync(node,[cli,'deploy',source,'--target','production','--scope',team,'--yes','--no-wait','--format','json','--meta','githubCommitSha='+commit,'--meta','githubCommitRef=prepare/seo-advanced-d-20261022','--meta','releaseCandidate=seo-official-d-20261022'],{cwd:source,env:{...safeEnv(),VERCEL_PROJECT_ID:project,VERCEL_ORG_ID:team,VERCEL_TELEMETRY_DISABLED:'1'},windowsHide:true,stdio:['ignore',fd,fd]});fs.closeSync(fd);save('submission-result.json',{at:new Date().toISOString(),exitCode:r.status});console.log(JSON.stringify({exitCode:r.status,inspectBeforeRetry:true}));process.exitCode=r.status??1;return;
 }
 if(mode==='status'||mode==='receipt'){
  const sub=read('submission.json'),list=await get('/v6/deployments?projectId='+project+'&limit=20');const hits=list.deployments.filter(d=>d.meta?.githubCommitSha===commit&&d.created>=Date.parse(sub.at)-5000);assert.equal(hits.length,1,'DEPLOYMENT_COUNT');const d=await get('/v13/deployments/'+(hits[0].uid||hits[0].id)),a=await get('/v4/aliases/lecomax.com');assert.equal(d.projectId,project);
  const status={at:new Date().toISOString(),id:d.id,state:d.readyState,url:d.url,commit:d.meta.githubCommitSha,aliasDeployment:a.deployment.id,crons:d.crons,errorCode:d.errorCode};save('status-'+Date.now()+'.json',status);console.log(JSON.stringify(status));if(mode==='status')return;
  const m=integrity(),pre=read('preflight.json');assert.equal(d.readyState,'READY');assert.equal(a.deployment.id,d.id);assert.equal(d.meta.githubCommitSha,commit);assert.deepEqual(d.crons,pre.crons);
  const c=await config();assert.deepEqual(c.versions,pre.versions,'CONFIG_DRIFT');assert.deepEqual(c.flags,pre.flags);
  const files=walk(await get('/v6/deployments/'+d.id+'/files'));const generated=files.filter(f=>f.file.startsWith('out/'));assert(generated.every(f=>f.uid.startsWith(team+'-')));const uploaded=files.filter(f=>!f.file.startsWith('out/'));const allowed=new Set(m.files.map(f=>f.file));for(const f of uploaded){assert(allowed.has(f.file),'UNEXPECTED_UPLOAD_'+f.file);assert.equal(hash(fs.readFileSync(path.join(source,f.file)),'sha1'),f.uid,f.file);}
  const prior=walk(await get('/v6/deployments/'+rollback+'/files')).filter(f=>!f.file.startsWith('out/'));const pm=new Map(prior.map(f=>[f.file,f.uid])),cm=new Map(uploaded.map(f=>[f.file,f.uid]));const changed=uploaded.filter(f=>pm.has(f.file)&&pm.get(f.file)!==f.uid).map(f=>f.file),added=uploaded.filter(f=>!pm.has(f.file)).map(f=>f.file),removed=prior.filter(f=>!cm.has(f.file)).map(f=>f.file);assert.deepEqual([...changed,...added,...removed].sort(),m.changedFiles,'REMOTE_SOURCE_SCOPE_MISMATCH');
  save('receipt.json',{at:new Date().toISOString(),passed:true,deployment:d.id,commit,rollback,uploadedFiles:uploaded.length,generatedOutputFiles:generated.length,remoteDelta:{changed,added,removed},crons:d.crons,flags:c.flags,configurationUnchanged:true,files});console.log(JSON.stringify({receipt:'passed',deployment:d.id,uploadedFiles:uploaded.length,remoteDelta:{changed,added,removed}}));return;
 }
 if(mode==='verify'){
  const r=read('receipt.json'),live=read('live.json');assert(r.passed&&live.passed);const a=await get('/v4/aliases/lecomax.com');assert.equal(a.deployment.id,r.deployment);save('verified.json',{at:new Date().toISOString(),passed:true,deployment:r.deployment,commit,rollback,live:'live.json',receipt:'receipt.json'});console.log(JSON.stringify(read('verified.json')));return;
 }
 if(mode==='rollback'){
  assert(fs.existsSync(path.join(dir,'confirmed-regression.json')),'CONFIRMED_CRITICAL_REGRESSION_REQUIRED');const a=await get('/v4/aliases/lecomax.com'),d=await get('/v13/deployments/'+a.deployment.id),target=await get('/v13/deployments/'+rollback);assert.equal(d.meta.githubCommitSha,commit);assert.equal(target.projectId,project);assert.equal(target.readyState,'READY');assert.equal(target.meta.githubCommitSha,base);
  const fd=fs.openSync(path.join(dir,'rollback-'+Date.now()+'.log'),'wx');const r=cp.spawnSync(node,[cli,'rollback',rollback,'--yes','--scope',team,'--timeout','3m'],{cwd:source,env:{...safeEnv(),VERCEL_PROJECT_ID:project,VERCEL_ORG_ID:team},windowsHide:true,stdio:['ignore',fd,fd]});fs.closeSync(fd);const active=await get('/v4/aliases/lecomax.com');save('rollback-result.json',{at:new Date().toISOString(),exitCode:r.status,active:active.deployment.id,target:rollback,restoresLegacyIndexNow:true});assert.equal(active.deployment.id,rollback);return;
 }
 throw Error('UNKNOWN_MODE');
}
main().catch(e=>{console.error('D_RELEASE_STOPPED '+String(e.message).slice(0,240));process.exitCode=1;});
