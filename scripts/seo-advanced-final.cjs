// Local release preparation and read-only evidence. No deployment/migration modes.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),out=path.join(root,'artifacts/seo-advanced-final-20261022');
const base='9692b1b51778c90a8a3f6fcfcac412771899032d',staging=path.join(root,'artifacts/seo-security-resume-20261021/source');
const manifestPath=path.join(root,'artifacts/seo-write-guard-20261021/release-manifest.json');
const manifest=JSON.parse(fs.readFileSync(manifestPath)),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const node=path.join(root,'artifacts/seo-node24/node-v24.22.0.exe'),deps=path.join(root,'release/brands-20261018/node_modules');
const mode=process.argv[2],stage=process.argv[3]||'d',source=path.join(root,`release/seo-advanced-${stage}-20261022`),dir=path.join(out,stage);
fs.mkdirSync(out,{recursive:true});
const git=(...args)=>cp.execFileSync('git',args,{cwd:root,encoding:'utf8',windowsHide:true}).trim();
const save=(name,data)=>fs.writeFileSync(path.join(out,name),JSON.stringify(data,null,2),{flag:'wx'});
const env=()=>({...Object.fromEntries(Object.entries(process.env).filter(([k])=>/^(PATH|SystemRoot|windir|ComSpec|TEMP|TMP|USERPROFILE|APPDATA|LOCALAPPDATA|ProgramFiles|ProgramFiles\(x86\)|NUMBER_OF_PROCESSORS|PROCESSOR_ARCHITECTURE)$/i.test(k))),NODE_ENV:'production',APP_ENV:'production',NEXT_PUBLIC_APP_ENV:'production',SEO_RUNTIME_ENV:'production',NEXT_PUBLIC_SITE_URL:'https://lecomax.com',NEXT_PUBLIC_SUPABASE_URL:'http://127.0.0.1:9',NEXT_PUBLIC_SUPABASE_ANON_KEY:'synthetic-anon',SUPABASE_SERVICE_ROLE_KEY:'synthetic-service',ADMIN_SESSION_SECRET:'synthetic-session-secret-for-isolated-build-only',RESEND_API_KEY:'re_synthetic_local_no_delivery',NEXT_TELEMETRY_DISABLED:'1',SEO_AI_ENABLED:'false',SEO_EDITORIAL_ENABLED:'false',SEO_SYNC_ENABLED:'false',SEO_MANUAL_SYNC_ENABLED:'false',SEO_MIRAI_FALLBACK_ENABLED:'false',INDEXNOW_ENABLED:'false'});
function history(suffix,status,summary,validation){const files=git('-C',source,'diff','--name-only',base).split('\n').filter(Boolean);const report={id:`seo-advanced-${stage}-${suffix}-20261022`,createdAt:new Date().toISOString(),...(suffix==='prepared'?{}:{relatedId:`seo-advanced-${stage}-prepared-20261022`}),title:`Advanced SEO ${stage.toUpperCase()}: ${suffix}`,summary,status,pages:['Product','Category/CMS','SEO administration','Change History'],components:['Recovered advanced SEO candidate'],files:files.map(f=>path.relative(root,path.join(source,f))),changes:[{kind:'modified',detail:summary}],validation};const file=path.join(dir,`history-${suffix}.json`);fs.writeFileSync(file,JSON.stringify(report,null,2),{flag:'wx'});cp.execFileSync(process.execPath,[path.join(root,'lecomax-learning-app/scripts/change-report.cjs'),'--append',file],{cwd:root,stdio:'inherit'});}
async function main(){
if(mode==='inventory'){
 assert.equal(hash(fs.readFileSync(manifestPath)),'044d3bd8ef1f96c8af6b05a2d44a0a2a5f954fb70eaeb26ad3a73122628a326b');
 const live=path.join(root,'release/seo-official-2-c-20261022');assert.equal(git('-C',live,'rev-parse','HEAD'),base);
 const changes=[];for(const f of manifest.files){const bytes=fs.readFileSync(path.join(staging,f.file));assert.equal(hash(bytes),f.sha256,f.file);const p=path.join(live,f.file),prior=fs.existsSync(p)?fs.readFileSync(p):null;if(prior&&hash(prior)===f.sha256)continue;const textEqual=prior&&prior.toString().replace(/\r\n/g,'\n')===bytes.toString().replace(/\r\n/g,'\n');const category=textEqual?'newline-only':/^(app\/(admin\/seo|api\/admin\/seo)|lib\/seo|components\/ProductGallery)/.test(f.file)?'metadata/editorial/application':/indexnow|product-discovery|verify-storefront-release/.test(f.file)?'guarded-indexnow':/^(operations\/seo-vercel|supabase\/alternatives)/.test(f.file)?'worker/schema':/^(tests\/seo|tests\/indexnow)/.test(f.file)?'seo-validation':/^(app\/\[category\]|app\/produit)/.test(f.file)?'metadata-reader-integration':'infrastructure/security/non-SEO-review';changes.push({file:f.file,stagingSha256:f.sha256,productionSha256:prior?hash(prior):null,change:prior?'modified':'added',category});}
 const plan=JSON.parse(fs.readFileSync(path.join(root,'operations/seo/production-readiness-20261021/migration-plan.json')));for(const m of plan.migrations)assert.equal(hash(fs.readFileSync(path.join(root,m.file))),m.sha256,m.file);
 save('inventory.json',{at:new Date().toISOString(),base,stagingManifestSha256:hash(fs.readFileSync(manifestPath)),verifiedStagingFiles:manifest.files.length,changes,counts:Object.fromEntries([...new Set(changes.map(x=>x.category))].map(c=>[c,changes.filter(x=>x.category===c).length])),migrations:plan.migrations,missingFromStagingAreNotDeletions:true});console.log(JSON.stringify({verified:manifest.files.length,differences:changes.length}));return;
}
if(mode==='provider'){
 const {vercelApiFetch}=require('./vercel-cli-api.cjs');const team='team_yFLUcpSvgQi8EQuvuorOZW7w',project='prj_g5xbDC0WX1RSXf6znHsAS7XvhLBb';
 const get=async route=>{const u=new URL(route,'https://api.vercel.com');u.searchParams.set('teamId',team);const r=await vercelApiFetch(u);assert(r.ok,'PROVIDER_'+r.status);return r.json();};
 const a=await get('/v4/aliases/lecomax.com'),d=await get('/v13/deployments/'+a.deployment.id);assert.equal(d.meta.githubCommitSha,base);assert.equal(d.readyState,'READY');assert.equal(d.projectId,project);
 const entries=(await get('/v10/projects/'+project+'/env?decrypt=false')).envs.filter(e=>e.target?.includes('production')&&!e.gitBranch);const flags={};for(const key of ['SEO_SYNC_ENABLED','SEO_MANUAL_SYNC_ENABLED','SEO_AI_ENABLED','SEO_EDITORIAL_ENABLED','SEO_MIRAI_FALLBACK_ENABLED','INDEXNOW_ENABLED']){const es=entries.filter(e=>e.key===key);assert.equal(es.length,1);flags[key]={value:(await get('/v1/projects/'+project+'/env/'+es[0].id)).value,updatedAt:es[0].updatedAt};}
 const sa=await get('/v4/aliases/lecomax-seo-staging.vercel.app'),sd=await get('/v13/deployments/'+sa.deployment.id);
 const result={at:new Date().toISOString(),production:{id:d.id,state:d.readyState,commit:d.meta.githubCommitSha,crons:d.crons},staging:{id:sd.id,state:sd.readyState,gitLabel:sd.meta.githubCommitSha},flags,secretValuesRead:false};save('provider-'+Date.now()+'.json',result);console.log(JSON.stringify(result));return;
}
if(mode==='prepare'){
 assert(['d','e'].includes(stage));assert(!fs.existsSync(source));fs.mkdirSync(dir,{recursive:true});
 git('worktree','add','-b',`prepare/seo-advanced-${stage}-20261022`,source,base);
 let files=stage==='d'?['lib/indexnow.mjs','lib/product-discovery.ts','operations/seo-vercel/lib/environment-target.mjs','app/api/indexnow/route.ts','scripts/verify-storefront-release.mjs','tests/indexnow-safety.test.ts']:manifest.files.map(x=>x.file).filter(f=>/^(app\/admin\/seo\/|app\/api\/admin\/seo\/|lib\/seo-(engine|store|ai|editorial|editorial-store)\.ts$|operations\/seo-vercel\/lib\/|tests\/seo-(engine|api|ai-api|ai-dashboard|editorial-api|editorial-store|editorial-workspace|hybrid-store|manual-sync|sync-authorization|sync|category-urls)\.test\.ts$)/.test(f)).concat(['app/[category]/page.tsx','app/produit/[slug]/page.tsx','components/ProductGallery.tsx','app/admin/layout.tsx','lib/admin-policy.ts','lib/api-security.ts','tests/product-indexing.test.ts']);
 for(const file of files){const entry=manifest.files.find(x=>x.file===file);assert(entry,file);const bytes=fs.readFileSync(path.join(staging,file));assert.equal(hash(bytes),entry.sha256,file);const target=path.join(source,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes);}
 fs.symlinkSync(deps,path.join(source,'node_modules'),'junction');fs.copyFileSync(path.join(root,'release/seo-official-2-c-20261022/next-env.d.ts'),path.join(source,'next-env.d.ts'));
 save(stage+'/recovered.json',{at:new Date().toISOString(),base,files:files.map(file=>({file,sha256:hash(fs.readFileSync(path.join(source,file)))})),stagingManifestSha256:hash(fs.readFileSync(manifestPath)),deploymentAuthorized:false});
 // Include untracked recovered files in diff/report without creating a release commit yet.
 git('-C',source,'add','-N','--',...files);
 history('prepared','needs-testing',`Recovered ${stage==='d'?'guarded IndexNow transport and entrypoints':'metadata, editorial dashboard/readers/APIs and worker libraries'} onto verified A+B+C. No deployment, migration, flag activation or paid call.`,[{name:'Provenance',result:'passed',detail:'Recovered exact pinned staging files; unrelated application/authentication/configuration changes excluded.'},{name:'Validation',result:'not-run',detail:'Integration checks pending; E additionally requires schema and real authenticated workflow acceptance.'}]);console.log(JSON.stringify({source,files:files.length}));return;
}
if(mode==='worker-package'){
 assert.equal(stage,'e');const files=[];
 const copy=(file,from)=>{const bytes=fs.readFileSync(path.join(from,file)),target=path.join(source,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes);files.push({file,from:path.relative(root,from),sha256:hash(bytes)});};
 const plan=JSON.parse(fs.readFileSync(path.join(root,'operations/seo/production-readiness-20261021/migration-plan.json')));
 for(const m of plan.migrations){assert.equal(hash(fs.readFileSync(path.join(root,m.file))),m.sha256);copy(m.file,root);}
 for(const file of ['operations/seo-vercel/package.json','operations/seo-vercel/package-lock.json','operations/seo-vercel/run-tests.mjs','operations/seo-vercel/vercel.json','operations/seo-vercel/schedule.hobby.json','operations/seo/editorial-six-migration-plan.json','scripts/prepare-seo-minimal-staging.cjs'])copy(file,staging);
 // Tests and the dedicated worker entrypoint were excluded from the storefront
 // upload. Preserve their actual local hashes as distinct recovery provenance.
 for(const file of fs.readdirSync(path.join(root,'operations/seo-vercel/tests')))if(/\.(mjs|json)$/.test(file))copy('operations/seo-vercel/tests/'+file,root);
 copy('operations/seo-vercel/api/sync.mjs',root);
 save('e/worker-package.json',{at:new Date().toISOString(),files,migrationsExecuted:false,workerDeployed:false});console.log(JSON.stringify({files:files.length}));return;
}
if(['tests','types','lint','build','serve','worker-tests'].includes(mode)){
 fs.mkdirSync(dir,{recursive:true});const names=['storefront-catalogue','storefront-loading-performance','cart-stock-limit','checkout-delivery','payment-methods','preorder','preorder-api','preorder-retry','owner-auth','owner-session','web-google-auth','admin-access','security-hardening','product-indexing','seo-sitemap','seo-category-urls','seo-stock-schema'];
 const extra=stage==='d'?['indexnow-safety','seo-advanced-indexnow']:['seo-engine','seo-api','seo-ai-api','seo-ai-dashboard','seo-editorial-api','seo-editorial-store','seo-editorial-workspace','seo-hybrid-store','seo-manual-sync','seo-sync-authorization','seo-sync'];
 const tests=[...new Set([...names,...extra])].map(n=>'tests/'+n+'.test.ts');const args=mode==='worker-tests'?['--test',...fs.readdirSync(path.join(source,'operations/seo-vercel/tests')).filter(f=>f.endsWith('.test.mjs')).map(f=>'operations/seo-vercel/tests/'+f)]:mode==='tests'?['--test',...tests]:mode==='types'?[path.join(deps,'typescript/bin/tsc'),'--noEmit','--incremental','false']:[path.join(deps,'next/dist/bin/next'),mode==='serve'?'start':mode==='build'?'build':'lint',...(mode==='serve'?['--hostname','127.0.0.1','--port',stage==='d'?'31941':'31942']:[])];
 const variables=env();if(['build','serve'].includes(mode))variables.NODE_OPTIONS='--require '+JSON.stringify(path.join(root,'artifacts/seo-fix-integration-20261021/fixture-fetch.cjs'));
 const at=new Date().toISOString(),stamp=Date.now(),log=mode+'-'+stamp+'.log',fd=fs.openSync(path.join(dir,log),'wx');const r=cp.spawnSync(node,args,{cwd:source,env:variables,windowsHide:true,stdio:['ignore',fd,fd]});fs.closeSync(fd);const result={at,finishedAt:new Date().toISOString(),exitCode:r.status,log,synthetic:true,tests:mode==='tests'?tests:undefined};save(stage+'/'+mode+'-'+stamp+'.json',result);console.log(JSON.stringify(result));process.exitCode=r.status??1;return;
}
throw Error('UNKNOWN_MODE');
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
