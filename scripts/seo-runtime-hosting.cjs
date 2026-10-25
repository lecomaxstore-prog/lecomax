const { vercelApiFetch } = require('./vercel-cli-api.cjs');
// Approved dedicated staging release only. No arbitrary targets, env overrides or prebuilt uploads.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),candidate=path.resolve(root,"../L'ecomax-seo-staging");
const project='prj_jPniwpH4s81bhISVReUKTQN0GwvD',team='team_yFLUcpSvgQi8EQuvuorOZW7w';
const origin='https://lecomax-seo-staging.vercel.app';
const manifestFile='artifacts/seo-staging-rc-20261020/upload-inventory-1792539666572.json';
const node=path.join(root,'artifacts/seo-node24/node-v24.22.0.exe');
const mode=process.argv[2];
const sha=v=>crypto.createHash('sha256').update(v).digest('hex');
const cleanEnv=()=>Object.fromEntries(Object.entries(process.env).filter(([k])=>/^(PATH|SystemRoot|windir|ComSpec|TEMP|TMP|USERPROFILE|APPDATA|LOCALAPPDATA|ProgramFiles|NUMBER_OF_PROCESSORS|PROCESSOR_ARCHITECTURE)$/i.test(k)));
async function api(route){
 const u=new URL(route,'https://api.vercel.com');u.searchParams.set('teamId',team);
 const r=await vercelApiFetch(u,{headers:{},redirect:'error',signal:AbortSignal.timeout(30000)});
 if(!r.ok)throw Error(`VERCEL_API_${r.status}`);return r.json();
}
async function identity(){
 const p=await api('/v9/projects/'+project),t=await api('/v2/teams/'+team);
 assert(p.id===project&&p.name==='lecomax-seo-staging'&&p.accountId===team&&t.id===team&&t.slug==='lecomaxstore-4321s-projects','STAGING_IDENTITY_REQUIRED');
 assert(p.ssoProtection?.deploymentType==='all'&&!p.link&&!p.crons?.definitions?.length,'PROTECTION_OR_ISOLATION_DRIFT');
 const d=await api('/v9/projects/'+project+'/domains');
 assert(d.domains?.length===1&&d.domains[0].name===new URL(origin).hostname&&!d.domains[0].redirect&&!d.pagination?.next,'ONLY_STAGING_DOMAIN_REQUIRED');
 return p;
}
function write(dir,name,value){fs.writeFileSync(path.join(dir,name),JSON.stringify(value,null,2),{flag:'wx'});}
function existingDir(){
 const dir=path.resolve(process.argv[3]||'');
 assert(path.dirname(dir)===path.join(root,'artifacts')&&/^seo-runtime-deployment-\d+$/.test(path.basename(dir)),'FIXED_EVIDENCE_DIRECTORY_REQUIRED');return dir;
}
async function preflight(){
 const p=await identity();
 const inv=JSON.parse(fs.readFileSync(path.join(root,manifestFile)));
 assert(inv.problems.length===0&&inv.uploadedFiles===2123,'REVIEWED_INVENTORY_REQUIRED');
 for(const e of inv.files)assert.equal(sha(fs.readFileSync(path.join(candidate,e.file))),e.sha256,`SOURCE_DRIFT:${e.file}`);
 const env=cleanEnv();
 for(const script of ['verify-seo-staging-environment.cjs','inventory-seo-staging-rc.cjs']){
  const result=cp.spawnSync(node,[path.join(__dirname,script)],{cwd:root,env,encoding:'utf8',windowsHide:true});
  if(result.status!==0)throw Error('PREFLIGHT_FAILED_'+script);
 }
 const files=fs.readdirSync(path.join(root,'artifacts/seo-staging-rc-20261020')).filter(n=>/^upload-inventory-\d+\.json$/.test(n)).sort();
 const fresh=JSON.parse(fs.readFileSync(path.join(root,'artifacts/seo-staging-rc-20261020',files.at(-1))));
 assert.deepEqual(fresh.files,inv.files,'UPLOAD_SET_DRIFT');
 assert(!fs.readdirSync(candidate).some(n=>/^\.env($|\.)/.test(n)&&n!=='.env.example'),'DOTENV_FORBIDDEN');
 const link=path.join(candidate,'.vercel/project.json');
 if(fs.existsSync(link)){const l=JSON.parse(fs.readFileSync(link));assert(l.projectId===project&&l.orgId===team,'LOCAL_LINK_DRIFT');}
 return {at:new Date().toISOString(),project,team,origin,applicationEnvironment:'staging',manifest:manifestFile,files:inv.files.length,protection:p.ssoProtection.deploymentType,automationAccessPresent:Object.values(p.protectionBypass||{}).some(v=>v.scope==='automation-bypass'),passed:true};
}
(async()=>{
 if(mode==='preflight'){const r=await preflight();const file=path.join(root,`artifacts/seo-runtime-preflight-${Date.now()}.json`);fs.writeFileSync(file,JSON.stringify(r,null,2),{flag:'wx'});console.log(JSON.stringify({file,...r}));return;}
 if(mode==='deploy'){
  const verified=await preflight(),dir=path.join(root,`artifacts/seo-runtime-deployment-${Date.now()}`);fs.mkdirSync(dir);write(dir,'preflight.json',verified);
  const env={...cleanEnv(),VERCEL_PROJECT_ID:project,VERCEL_ORG_ID:team,VERCEL_TELEMETRY_DISABLED:'1'};
  const log=path.join(dir,'source-upload.log'),fd=fs.openSync(log,'wx');
  console.log(JSON.stringify({dir,project,team,origin,uploading:true}));
  // "production" is the stable alias slot OF THIS STAGING-ONLY PROJECT.
  // APP_ENV and both Supabase bindings were independently checked as staging.
  const result=cp.spawnSync(node,['C:/Users/Ziko/AppData/Roaming/npm/node_modules/vercel/dist/index.js','deploy',candidate,'--target','production','--scope',team,'--yes','--no-wait','--format','json'],{cwd:candidate,env,windowsHide:true,stdio:['ignore',fd,fd]});
  fs.closeSync(fd);if(result.status!==0)throw Error('SOURCE_UPLOAD_FAILED');
  const raw=fs.readFileSync(log,'utf8');const match=raw.match(/\{\s*"id":\s*"dpl_[\s\S]*?\n\}/);assert(match,'DEPLOYMENT_RESULT_REQUIRED');
  const d=JSON.parse(match[0]),remote=await api('/v13/deployments/'+d.id);
  assert(remote.projectId===project&&new URL(d.url).hostname.startsWith('lecomax-seo-staging-'),'DEPLOYMENT_TARGET_DRIFT');
  write(dir,'deployment.json',{at:new Date().toISOString(),...d,project,team});console.log(JSON.stringify({dir,id:d.id,url:d.url,state:remote.readyState}));return;
 }
 const dir=existingDir(),d=JSON.parse(fs.readFileSync(path.join(dir,'deployment.json')));assert(d.project===project&&d.team===team,'EVIDENCE_TARGET_DRIFT');
 const p=await identity(),remote=await api('/v13/deployments/'+d.id);assert(remote.projectId===project,'DEPLOYMENT_TARGET_DRIFT');
 if(mode==='status'){
  const report={at:new Date().toISOString(),id:d.id,project,team,state:remote.readyState,errorCode:remote.errorCode,alias:remote.alias,aliasAssigned:remote.aliasAssigned,protection:p.ssoProtection.deploymentType};
  write(dir,`status-${Date.now()}.json`,report);console.log(JSON.stringify(report));return;
 }
 if(mode==='build-log'){
  const events=await api('/v3/deployments/'+d.id+'/events?limit=1000');
  const lines=(Array.isArray(events)?events:events.events||[]).map(e=>e.text||e.payload?.text||'').join('\n').replace(/(?:sbp_|sb_secret_)[A-Za-z0-9_-]+/g,'[REDACTED]').replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,'[REDACTED JWT]');
  const file=path.join(dir,`build-${Date.now()}.log`);fs.writeFileSync(file,lines,{flag:'wx'});console.log(JSON.stringify({file,state:remote.readyState,tail:lines.slice(-2000)}));return;
 }
 if(mode==='files'){
  const tree=await api('/v6/deployments/'+d.id+'/files'),files=[];
  const walk=(items,prefix='')=>{for(const item of items){const name=prefix+item.name;if(item.type==='directory')walk(item.children||[],name+'/');else files.push(name);}};
  walk(tree);
  const expected=new Set(JSON.parse(fs.readFileSync(path.join(root,manifestFile))).files.map(e=>e.file));
  const normalized=files.map(f=>f.replace(/^src\//,''));
  const actual=new Set(normalized),extra=normalized.filter(f=>!expected.has(f)),missing=[...expected].filter(f=>!actual.has(f));
  const report={at:new Date().toISOString(),files:files.length,extra,missing,tree};write(dir,`uploaded-files-${Date.now()}.json`,report);console.log(JSON.stringify({files:files.length,extra:extra.slice(0,30),missing:missing.slice(0,30),extraCount:extra.length,missingCount:missing.length}));return;
 }
 throw Error('UNKNOWN_MODE');
})().catch(e=>{console.error(/^[A-Z0-9_:.-]+$/.test(e.message)?e.message:'STAGING_OPERATION_FAILED');process.exitCode=1;});
