// Explicitly authorized three-stage release. Every mutation is a separate mode.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {vercelApiFetch}=require('./vercel-cli-api.cjs');
const root=path.resolve(__dirname,'..'),out=path.join(root,'artifacts/seo-release2-20261022');
const project='prj_g5xbDC0WX1RSXf6znHsAS7XvhLBb',team='team_yFLUcpSvgQi8EQuvuorOZW7w',base='1f17d9e8c54f960b8ba873dfe0974075ed8a9e4a',initial='dpl_6MURfA7hrYn5qZh5awX2hrMHkNJo';
const stage=process.argv[2],mode=process.argv[3];assert(['a','b','c'].includes(stage));
const dir=path.join(out,stage);fs.mkdirSync(dir,{recursive:true});
const source=path.join(root,stage==='a'?'release/seo-sitemap-candidate-20261022':`release/seo-official-2-${stage}-20261022`);
const candidates=JSON.parse(fs.readFileSync(path.join(root,'artifacts/seo-release-inventory-20261022/candidate-releases.json'))).releases;
const index=['a','b','c'].indexOf(stage),candidate=candidates[index];
const node=path.join(root,'artifacts/seo-node24/node-v24.22.0.exe'),deps=path.join(root,'release/brands-20261018/node_modules'),cli=path.join(process.env.APPDATA,'npm/node_modules/vercel/dist/index.js');
const git=(...args)=>cp.execFileSync('git',args,{cwd:root,encoding:'utf8',windowsHide:true}).trim();
const hash=b=>crypto.createHash('sha256').update(b).digest('hex'),read=n=>JSON.parse(fs.readFileSync(path.join(dir,n))),save=(n,r)=>fs.writeFileSync(path.join(dir,n),JSON.stringify(r,null,2),{flag:'wx'});
const safeEnv=()=>Object.fromEntries(Object.entries(process.env).filter(([k])=>/^(PATH|SystemRoot|windir|ComSpec|TEMP|TMP|USERPROFILE|APPDATA|LOCALAPPDATA|ProgramFiles|ProgramFiles\(x86\)|NUMBER_OF_PROCESSORS|PROCESSOR_ARCHITECTURE)$/i.test(k)));
async function get(p){const u=new URL(p,'https://api.vercel.com');u.searchParams.set('teamId',team);const r=await vercelApiFetch(u);assert(r.ok,'PROVIDER_HTTP_'+r.status);return r.json();}
function predecessor(){if(!index)return {commit:base,id:initial};const prev=JSON.parse(fs.readFileSync(path.join(out,['a','b'][index-1],'verified.json')));assert(prev.passed);return {commit:prev.commit,id:prev.deployment};}
function integrity(){const m=read('manifest.json');assert.equal(git('-C',source,'rev-parse','HEAD'),m.commit);assert.equal(git('-C',source,'status','--porcelain'),'','DIRTY_SOURCE');for(const f of m.files)assert.equal(hash(fs.readFileSync(path.join(source,f.file))),f.sha256,f.file);return m;}
function history(suffix,status,summary,validation){const m=read('manifest.json');const r={id:`seo-release2-${stage}-${suffix}-20261022`,...(suffix==='prepared'?{}:{relatedId:`seo-release2-${stage}-prepared-20261022`}),createdAt:new Date().toISOString(),title:`Official SEO Release 2${stage.toUpperCase()}: ${suffix}`,summary,status,pages:['Sitemap','Category/CMS','Product SEO','Change History'],components:['Sequential production release','Source and deployment verification'],files:m.changedFiles.map(f=>path.relative(root,path.join(source,f))).concat(['scripts/seo-release2.cjs','scripts/seo-release2-live.cjs']),changes:[{kind:'modified',detail:summary+' No database migration, configuration or unrelated feature activation.'}],validation};const p=path.join(dir,`history-${suffix}.json`);fs.writeFileSync(p,JSON.stringify(r,null,2),{flag:'wx'});cp.execFileSync(process.execPath,[path.join(root,'lecomax-learning-app/scripts/change-report.cjs'),'--append',p],{cwd:root,stdio:'inherit'});}
(async()=>{
if(mode==='prepare'){
 const previous=predecessor();const original=JSON.parse(fs.readFileSync(path.join(root,'artifacts/seo-release-inventory-20261022',candidate.manifest)));
 assert.equal(hash(fs.readFileSync(path.join(root,'artifacts/seo-release-inventory-20261022',candidate.manifest))),candidate.manifestSha256);
 assert.equal(git('-C',original.source,'status','--porcelain'),'');for(const f of original.files)assert.equal(hash(fs.readFileSync(path.join(original.source,f.file))),f.sha256,f.file);
 if(index){
  if(!fs.existsSync(source)){git('worktree','add','-b',`release/seo-official-2-${stage}-20261022`,source,previous.commit);git('-C',source,'cherry-pick',candidate.commit);}
  assert.equal(git('-C',source,'branch','--show-current'),`release/seo-official-2-${stage}-20261022`);assert.equal(git('-C',source,'rev-parse','HEAD^'),previous.commit);assert.equal(git('-C',source,'status','--porcelain'),'');
  assert.deepEqual(git('-C',source,'diff','--name-only',previous.commit,'HEAD').split('\n').sort(),candidate.changedFiles.slice().sort());
  // core.autocrlf can alter checkout bytes. Restore exact verified source bytes,
  // never changing Git content or configuration and never touching prior trees.
  const prevManifest=JSON.parse(fs.readFileSync(path.join(out,['a','b'][index-1],'manifest.json')));
  const tree=folder=>new Map(git('-C',folder,'ls-tree','-rz','HEAD').split('\0').filter(Boolean).map(row=>{const i=row.indexOf('\t');return [row.slice(i+1),row.slice(0,i).split(' ')[2]];}));
  const targetTree=tree(source),previousTree=tree(prevManifest.source),originalTree=tree(original.source);
  for(const file of git('-C',source,'ls-files','-z').split('\0').filter(Boolean)){
   const from=candidate.changedFiles.includes(file)?original.source:prevManifest.source;
   assert.equal(targetTree.get(file),(candidate.changedFiles.includes(file)?originalTree:previousTree).get(file),'CONTENT_MISMATCH_'+file);
   const bytes=fs.readFileSync(path.join(from,file));if(!fs.readFileSync(path.join(source,file)).equals(bytes))fs.writeFileSync(path.join(source,file),bytes);
  }
  git('-C',source,'add','-u');git('-C',source,'diff','--cached','--exit-code');assert.equal(git('-C',source,'status','--porcelain'),'');
  if(!fs.existsSync(path.join(source,'node_modules')))fs.symlinkSync(deps,path.join(source,'node_modules'),'junction');
  if(!fs.existsSync(path.join(source,'next-env.d.ts')))fs.copyFileSync(path.join(root,'release/seo-sitemap-candidate-20261022/next-env.d.ts'),path.join(source,'next-env.d.ts'));
 }
 const commit=git('-C',source,'rev-parse','HEAD');assert.equal(git('-C',source,'rev-parse','HEAD^'),previous.commit);
 const delta=git('-C',source,'diff','--name-only',previous.commit,commit).split('\n');assert.deepEqual(delta.slice().sort(),candidate.changedFiles.slice().sort());
 const all=candidates.slice(0,index+1).flatMap(c=>c.changedFiles);assert.deepEqual(git('-C',source,'diff','--name-only',base,commit).split('\n').sort(),all.slice().sort());
 for(const c of candidates.slice(0,index+1)){const cm=JSON.parse(fs.readFileSync(path.join(root,'artifacts/seo-release-inventory-20261022',c.manifest)));for(const f of c.changedFiles)assert.equal(hash(fs.readFileSync(path.join(source,f))),cm.files.find(x=>x.file===f).sha256,f);}
 git('-C',source,'diff','--check',base,commit);
 const files=git('-C',source,'ls-files','-z').split('\0').filter(Boolean).map(file=>({file,sha256:hash(fs.readFileSync(path.join(source,file)))}));
 save('manifest.json',{at:new Date().toISOString(),stage,source,commit,branch:git('-C',source,'branch','--show-current'),parent:previous.commit,rollback:previous.id,originalCandidate:candidate.commit,changedFiles:delta,cumulativeFiles:all,files,authorized:true});
 fs.writeFileSync(path.join(dir,'cumulative.patch'),cp.execFileSync('git',['-C',source,'diff','--binary',base,commit]),{flag:'wx'});
 history('prepared','needs-testing',`Recovered approved ${stage.toUpperCase()} changes on ${previous.commit}; candidate ${commit}. Fresh release checks and live deployment verification pending.`,[{name:'Source scope and preservation',result:'passed',detail:'Exact approved delta and cumulative candidate hashes; original branches preserved.'},{name:'Release validation',result:'not-run',detail:'Fresh tests, types, lint, build and live checks pending.'}]);console.log(JSON.stringify({stage,commit,parent:previous.commit,files:delta}));return;
}
if(['tests','types','lint','build'].includes(mode)){
 const m=integrity();const env={...safeEnv(),NODE_ENV:'production',APP_ENV:'production',NEXT_PUBLIC_APP_ENV:'production',NEXT_PUBLIC_SITE_URL:'https://lecomax.com',NEXT_PUBLIC_SUPABASE_URL:'http://127.0.0.1:9',NEXT_PUBLIC_SUPABASE_ANON_KEY:'synthetic-anon',SUPABASE_SERVICE_ROLE_KEY:'synthetic-service',ADMIN_SESSION_SECRET:'synthetic-session-secret-for-isolated-build-only',RESEND_API_KEY:'re_synthetic_local_no_delivery',NEXT_TELEMETRY_DISABLED:'1',SEO_AI_ENABLED:'false',SEO_EDITORIAL_ENABLED:'false',SEO_SYNC_ENABLED:'false',SEO_MANUAL_SYNC_ENABLED:'false',INDEXNOW_ENABLED:'false'};
 const names=['storefront-catalogue','storefront-loading-performance','cart-stock-limit','checkout-delivery','payment-methods','preorder','preorder-api','preorder-retry','owner-auth','owner-session','web-google-auth','admin-access','security-hardening','product-indexing'];
 const tests=[...new Set([...names.map(n=>'tests/'+n+'.test.ts'),...m.cumulativeFiles.filter(f=>f.startsWith('tests/'))])];
 if(mode==='build')env.NODE_OPTIONS='--require '+JSON.stringify(path.join(root,'artifacts/seo-fix-integration-20261021/fixture-fetch.cjs'));
 const args=mode==='tests'?['--test',...tests]:mode==='types'?[path.join(deps,'typescript/bin/tsc'),'--noEmit','--incremental','false']:[path.join(deps,'next/dist/bin/next'),mode==='build'?'build':'lint'];
 const stamp=Date.now(),log=mode+'-'+stamp+'.log',fd=fs.openSync(path.join(dir,log),'wx'),start=new Date().toISOString();const r=cp.spawnSync(node,args,{cwd:source,env,windowsHide:true,stdio:['ignore',fd,fd]});fs.closeSync(fd);
 const result={at:start,finishedAt:new Date().toISOString(),commit:m.commit,mode,exitCode:r.status,log,synthetic:true,tests:mode==='tests'?tests:undefined};save(mode+'-'+stamp+'.json',result);console.log(JSON.stringify(result));process.exitCode=r.status??1;return;
}
if(mode==='preflight'){
 const m=integrity(),previous=predecessor(),a=await get('/v4/aliases/lecomax.com'),d=await get('/v13/deployments/'+a.deployment.id),p=await get('/v9/projects/'+project);
 assert.equal(d.id,previous.id);assert.equal(d.meta.githubCommitSha,previous.commit);assert.equal(d.readyState,'READY');assert.equal(d.projectId,project);assert.equal(p.accountId,team);assert.deepEqual(d.crons,JSON.parse(fs.readFileSync(path.join(source,'vercel.json'))).crons);
 const entries=(await get('/v10/projects/'+project+'/env?decrypt=false')).envs.filter(e=>e.target?.includes('production')&&!e.gitBranch);
 const versions=entries.map(e=>({id:e.id,key:e.key,type:e.type,updatedAt:e.updatedAt,createdAt:e.createdAt})).sort((a,b)=>a.key.localeCompare(b.key));
 const config={};for(const key of ['OWNER_DATABASE_URL','OWNER_DATABASE_BINDING','ADMIN_SESSION_SECRET','APP_ENV','NEXT_PUBLIC_APP_ENV','SEO_RUNTIME_ENV','SEO_SYNC_ENABLED','SEO_MANUAL_SYNC_ENABLED','SEO_AI_ENABLED','SEO_EDITORIAL_ENABLED','SEO_MIRAI_FALLBACK_ENABLED','INDEXNOW_ENABLED']){const es=entries.filter(e=>e.key===key);assert.equal(es.length,1,'ENV_MISSING_OR_AMBIGUOUS_'+key);const e=es[0];assert((e.updatedAt||e.createdAt)<=(d.createdAt||d.created),'CONFIG_CHANGED_SINCE_LIVE_'+key);config[key]={present:true,updatedAt:e.updatedAt};if(key.endsWith('_ENABLED')||['APP_ENV','NEXT_PUBLIC_APP_ENV','SEO_RUNTIME_ENV'].includes(key)){const expected=key.endsWith('_ENABLED')?'false':'production';assert.equal((await get('/v1/projects/'+project+'/env/'+e.id)).value,expected,'UNEXPECTED_FLAG_'+key);config[key].verifiedValue=expected;}}
 if(index){const prev=JSON.parse(fs.readFileSync(path.join(out,['a','b'][index-1],'preflight.json')));assert.deepEqual(versions,prev.versions,'ENV_CONFIGURATION_DRIFT');}
 save('preflight.json',{at:new Date().toISOString(),commit:m.commit,rollback:previous.id,baseline:previous.commit,config,versions,crons:d.crons,secretValuesRead:false});console.log(JSON.stringify({stage,preflight:'passed',rollback:previous.id,flags:'six false',configDrift:false}));return;
}
if(mode==='deploy'){
 const m=integrity(),pre=read('preflight.json');assert.equal(pre.commit,m.commit);assert(!fs.existsSync(path.join(dir,'submission.json')),'ALREADY_SUBMITTED_INSPECT_STATUS');
 for(const check of ['tests','types','lint','build']){const file=fs.readdirSync(dir).filter(f=>new RegExp('^'+check+'-\\d+\\.json$').test(f)).sort().at(-1);assert(file,'MISSING_'+check);const r=read(file);assert.equal(r.exitCode,0,'FAILED_'+check);assert.equal(r.commit,m.commit);}
 const a=await get('/v4/aliases/lecomax.com');assert.equal(a.deployment.id,pre.rollback,'PRODUCTION_MOVED');
 const env={...safeEnv(),VERCEL_PROJECT_ID:project,VERCEL_ORG_ID:team,VERCEL_TELEMETRY_DISABLED:'1'};
 save('submission.json',{at:new Date().toISOString(),commit:m.commit,manifestSha256:hash(fs.readFileSync(path.join(dir,'manifest.json'))),rollback:pre.rollback});const fd=fs.openSync(path.join(dir,'deployment.log'),'wx');
 const r=cp.spawnSync(node,[cli,'deploy',source,'--target','production','--scope',team,'--yes','--no-wait','--format','json','--meta','githubCommitSha='+m.commit,'--meta',`releaseCandidate=seo-official-release2-${stage}-20261022`],{cwd:source,env,windowsHide:true,stdio:['ignore',fd,fd]});fs.closeSync(fd);save('submission-result.json',{at:new Date().toISOString(),exitCode:r.status});console.log(JSON.stringify({stage,exitCode:r.status,inspectBeforeRetry:true}));process.exitCode=r.status??1;return;
}
if(mode==='status'){
 const s=read('submission.json'),list=await get('/v6/deployments?projectId='+project+'&limit=20');const matches=list.deployments.filter(d=>d.meta?.githubCommitSha===s.commit&&d.created>=Date.parse(s.at)-5000);assert.equal(matches.length,1,'DEPLOYMENT_COUNT');
 const d=await get('/v13/deployments/'+(matches[0].uid||matches[0].id)),a=await get('/v4/aliases/lecomax.com');assert.equal(d.projectId,project);
 const r={at:new Date().toISOString(),id:d.id,state:d.readyState,url:d.url,commit:d.meta?.githubCommitSha,aliasDeployment:a.deployment.id,crons:d.crons,errorCode:d.errorCode};save('status-'+Date.now()+'.json',r);console.log(JSON.stringify(r));return;
}
if(mode==='build-progress'){
 const statuses=fs.readdirSync(dir).filter(f=>/^status-\d+\.json$/.test(f)).sort();const latest=read(statuses.at(-1));
 const r=cp.spawnSync(node,[cli,'inspect',latest.id,'--logs','--scope',team],{cwd:source,env:{...safeEnv(),NO_UPDATE_NOTIFIER:'1',VERCEL_TELEMETRY_DISABLED:'1'},windowsHide:true,encoding:'utf8',timeout:45000,maxBuffer:8*1024*1024});
 const logs=(r.stdout||'')+(r.stderr||'');const markers=['Installing dependencies','Running build','Creating an optimized production build','Compiled successfully','Collecting page data','Generating static pages','Finalizing page optimization','Build Completed','Deploying outputs','Error:'].filter(s=>logs.includes(s));const result={at:new Date().toISOString(),deployment:latest.id,exitCode:r.status,markers,timedOut:r.error?.code==='ETIMEDOUT'};save('build-progress-'+Date.now()+'.json',result);console.log(JSON.stringify(result));return;
}
if(mode==='receipt'){
 const m=integrity(),a=await get('/v4/aliases/lecomax.com'),d=await get('/v13/deployments/'+a.deployment.id);assert.equal(d.meta.githubCommitSha,m.commit);assert.equal(d.readyState,'READY');assert.deepEqual(d.crons,read('preflight.json').crons);
 const files=[];function walk(ns,base=''){for(const n of ns){const f=base+n.name;if(n.type==='directory')walk(n.children||[],f+'/');else files.push({file:f.replace(/^src\//,''),uid:n.uid});}}walk(await get('/v6/deployments/'+d.id+'/files'));
 const known=new Set(m.files.map(f=>f.file));const extras=files.filter(f=>!known.has(f.file));save('receipt-inspection-'+Date.now()+'.json',{at:new Date().toISOString(),deployment:d.id,files,extras:extras.map(f=>f.file)});
 // Vercel's files endpoint includes a separate generated out/ tree after build.
 // These provider artifact IDs are not uploaded-source SHA-1 identifiers.
 const generated=extras.filter(f=>f.file.startsWith('out/'));
 assert(generated.every(f=>f.uid.startsWith(team+'-')),'UNEXPECTED_GENERATED_ID');
 assert(!fs.existsSync(path.join(source,'out')),'LOCAL_OUT_UNEXPECTED');
 assert(fs.readFileSync(path.join(source,'.vercelignore'),'utf8').split(/\r?\n/).includes('out/'));
 assert(extras.every(f=>f.file==='next-env.d.ts'||generated.includes(f)),'UNEXPECTED_SOURCE_UPLOAD: '+extras.filter(f=>!generated.includes(f)).map(f=>f.file).join(', '));
 for(const f of files.filter(f=>!generated.includes(f)))assert.equal(crypto.createHash('sha1').update(fs.readFileSync(path.join(source,f.file))).digest('hex'),f.uid,f.file);
 for(const f of m.cumulativeFiles)assert(files.some(x=>x.file===f),'MISSING_APPROVED_FILE_'+f);
 const previousFiles=[];function previousWalk(ns,base=''){for(const n of ns){const f=base+n.name;if(n.type==='directory')previousWalk(n.children||[],f+'/');else if(!f.startsWith('out/'))previousFiles.push({file:f.replace(/^src\//,''),uid:n.uid});}}previousWalk(await get('/v6/deployments/'+m.rollback+'/files'));
 const previousMap=new Map(previousFiles.map(f=>[f.file,f.uid])),sourceFiles=files.filter(f=>!generated.includes(f)),currentMap=new Map(sourceFiles.map(f=>[f.file,f.uid]));
 const changed=sourceFiles.filter(f=>previousMap.has(f.file)&&previousMap.get(f.file)!==f.uid).map(f=>f.file),added=sourceFiles.filter(f=>!previousMap.has(f.file)).map(f=>f.file),removed=previousFiles.filter(f=>!currentMap.has(f.file)).map(f=>f.file);
 assert.deepEqual([...changed,...added,...removed].sort(),m.changedFiles.slice().sort(),'REMOTE_SOURCE_SCOPE_MISMATCH');
 save('receipt.json',{at:new Date().toISOString(),passed:true,deployment:d.id,commit:m.commit,uploadedFiles:files.length-generated.length,generatedOutputFiles:generated.length,extras:extras.filter(f=>!generated.includes(f)).map(f=>f.file),remoteDelta:{changed,added,removed},crons:d.crons,files,assessment:'Source SHA-1 and exact incremental remote source delta verified. Provider-generated out/ tree has provider artifact IDs, is absent locally and excluded from source upload. It is not a source hash mismatch.'});console.log(JSON.stringify({stage,deployment:d.id,uploadedFiles:files.length-generated.length,generatedOutputFiles:generated.length,remoteDelta:{changed,added,removed},passed:true}));return;
}
if(mode==='verify'){
 const m=integrity(),receipt=read('receipt.json'),live=read('live.json');assert(receipt.passed&&live.passed);const a=await get('/v4/aliases/lecomax.com');assert.equal(a.deployment.id,receipt.deployment);
 save('verified.json',{at:new Date().toISOString(),passed:true,stage,deployment:receipt.deployment,commit:m.commit,rollback:m.rollback,liveEvidence:'live.json',receiptEvidence:'receipt.json'});
 history('verified','successful',`Release ${stage.toUpperCase()} deployed and verified: ${receipt.deployment}, commit ${m.commit}. Cumulative approved improvements retained.`,[{name:'Fresh preflight',result:'passed',detail:'Focused/critical tests, TypeScript, full ESLint and production-mode synthetic build passed; exact source/upload hashes and four crons verified.'},{name:'Live checks',result:'passed',detail:'See per-stage live.json: XML sitemap shards, canonical/schema, catalogue, images, variants/cart/checkout entry and anonymous authorization checks.'},{name:'Limits',result:'not-run',detail:'No order/payment, authenticated admin lifecycle, separate owner DB/TLS, Google indexing or manufactured unknown-stock fixture in production.'}]);console.log(JSON.stringify(read('verified.json')));return;
}
if(mode==='rollback'){
 const m=read('manifest.json'),target=await get('/v13/deployments/'+m.rollback);assert.equal(target.projectId,project);assert.equal(target.readyState,'READY');assert.equal(target.meta.githubCommitSha,m.parent);
 const current=await get('/v4/aliases/lecomax.com'),live=await get('/v13/deployments/'+current.deployment.id);assert.equal(live.meta.githubCommitSha,m.commit,'DO_NOT_ROLL_BACK_UNRELATED_RELEASE');
 assert(fs.existsSync(path.join(dir,'confirmed-regression.json')),'REQUIRES_CONFIRMED_REGRESSION_EVIDENCE');
 const fd=fs.openSync(path.join(dir,'rollback-'+Date.now()+'.log'),'wx');const r=cp.spawnSync(node,[cli,'rollback',m.rollback,'--yes','--scope',team,'--timeout','3m'],{cwd:source,env:{...safeEnv(),VERCEL_PROJECT_ID:project,VERCEL_ORG_ID:team,VERCEL_TELEMETRY_DISABLED:'1'},windowsHide:true,stdio:['ignore',fd,fd]});fs.closeSync(fd);
 const a=await get('/v4/aliases/lecomax.com');const result={at:new Date().toISOString(),exitCode:r.status,target:m.rollback,active:a.deployment.id,passed:a.deployment.id===m.rollback};save('rollback-result.json',result);console.log(JSON.stringify(result));assert(result.passed,'ROLLBACK_NOT_CONFIRMED');return;
}
throw Error('UNKNOWN_MODE');
})().catch(e=>{console.error('RELEASE2_STOPPED '+String(e.code||'ERROR')+' '+String(e.message).slice(0,220));process.exitCode=1;});
