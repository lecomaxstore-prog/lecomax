const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict'),cp=require('child_process');
const {vercelApiFetch}=require('./vercel-cli-api.cjs');
const root=path.resolve(__dirname,'..'),project='prj_jPniwpH4s81bhISVReUKTQN0GwvD',team='team_yFLUcpSvgQi8EQuvuorOZW7w';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
async function get(route){const u=new URL(route,'https://api.vercel.com');u.searchParams.set('teamId',team);const r=await vercelApiFetch(u);assert(r.ok,'API_FAILED');return r.json();}
(async()=>{
 const manifest=path.join(root,'artifacts/seo-fix-integration-20261021/source-manifest.json');assert.equal(sha(fs.readFileSync(manifest)),'58bd96cbb310dcef3e0bc0eb0432e92ba146070f145dc4049e0fd060b9a7e0b6');const inv=JSON.parse(fs.readFileSync(manifest));assert.equal(inv.files.length,2124);
 const p=await get('/v9/projects/'+project);assert(p.id===project&&p.accountId===team&&p.name==='lecomax-seo-staging');assert(p.ssoProtection?.deploymentType==='all'&&!p.link&&!p.crons?.definitions?.length);
 const ds=await get('/v6/deployments?projectId='+project+'&limit=20');assert(ds.deployments.every(d=>['dpl_9PVLNqN3YRoSmDgi4T5D9o81Svcv','dpl_A2Zu5TrCJ787DskFvBvtXb3jU9oG'].includes(d.uid||d.id)),'NEW_DEPLOYMENT_REQUIRES_INSPECTION');
 const dir=path.join(root,'artifacts/seo-approved-fix-deployment-'+Date.now());fs.mkdirSync(dir);const source=path.join(dir,'source');fs.mkdirSync(source);
 for(const f of inv.files){assert(!f.file.split('/').includes('..')&&!path.isAbsolute(f.file));const b=fs.readFileSync(path.join(root,'artifacts/seo-fix-integration-20261021/source',f.file));assert.equal(sha(b),f.sha256);const dest=path.join(source,f.file);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,b,{flag:'wx'});}
 fs.writeFileSync(path.join(dir,'preflight.json'),JSON.stringify({at:new Date().toISOString(),project,team,manifestSha256:sha(fs.readFileSync(manifest)),files:inv.files.length,source,protection:'all',priorDeployment:'dpl_9PVLNqN3YRoSmDgi4T5D9o81Svcv'},null,2));
 const env=Object.fromEntries(Object.entries(process.env).filter(([k])=>/^(PATH|SystemRoot|windir|ComSpec|TEMP|TMP|USERPROFILE|APPDATA|LOCALAPPDATA|ProgramFiles|NUMBER_OF_PROCESSORS|PROCESSOR_ARCHITECTURE)$/i.test(k)));Object.assign(env,{VERCEL_PROJECT_ID:project,VERCEL_ORG_ID:team,VERCEL_TELEMETRY_DISABLED:'1'});
 const fd=fs.openSync(path.join(dir,'source-upload.log'),'wx');console.log(JSON.stringify({dir,submitting:true}));
 const result=cp.spawnSync(path.join(root,'artifacts/seo-node24/node-v24.22.0.exe'),['C:/Users/Ziko/AppData/Roaming/npm/node_modules/vercel/dist/index.js','deploy',source,'--target','production','--scope',team,'--yes','--no-wait','--format','json'],{cwd:source,env,windowsHide:true,stdio:['ignore',fd,fd]});fs.closeSync(fd);
 console.log(JSON.stringify({dir,exitCode:result.status,inspectBeforeAnyRetry:true}));
})().catch(e=>{console.error('FIX_DEPLOYMENT_STOPPED: '+(e.code||e.message).slice(0,120));process.exitCode=1;});

