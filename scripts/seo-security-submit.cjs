// One-shot submission of the approved, hash-pinned staging-only package.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process'),assert=require('node:assert/strict');
const {vercelApiFetch}=require('./vercel-cli-api.cjs');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'artifacts/seo-security-resume-20261021'),source=path.join(dir,'source');
const project='prj_jPniwpH4s81bhISVReUKTQN0GwvD',team='team_yFLUcpSvgQi8EQuvuorOZW7w';
(async()=>{
 const pre=JSON.parse(fs.readFileSync(path.join(dir,'preflight-1792591698760.json')));assert(pre.passed && pre.project===project && Date.now()-Date.parse(pre.at)<1800000);
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'artifacts/seo-write-guard-20261021/release-manifest.json')));
 for(const f of manifest.files)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(source,f.file))).digest('hex'),f.sha256);
 const url=new URL('https://api.vercel.com/v6/deployments');url.searchParams.set('projectId',project);url.searchParams.set('teamId',team);url.searchParams.set('limit','100');
 const r=await vercelApiFetch(url);assert(r.ok);const ds=await r.json();
 assert(ds.deployments.every(d=>['dpl_BTTcn1fzEYdVSxbevGo6njShC7UJ','dpl_9PVLNqN3YRoSmDgi4T5D9o81Svcv','dpl_A2Zu5TrCJ787DskFvBvtXb3jU9oG'].includes(d.uid||d.id)),'NEW_DEPLOYMENT_STOP');
 fs.writeFileSync(path.join(dir,'submission-started.json'),JSON.stringify({at:new Date().toISOString(),project,team,source,files:manifest.files.length,authorization:'Owner request: exact three-file security package to existing staging project only'},null,2),{flag:'wx'});
 const env=Object.fromEntries(Object.entries(process.env).filter(([k])=>/^(PATH|SystemRoot|windir|ComSpec|TEMP|TMP|USERPROFILE|APPDATA|LOCALAPPDATA|ProgramFiles|NUMBER_OF_PROCESSORS|PROCESSOR_ARCHITECTURE)$/i.test(k)));
 Object.assign(env,{VERCEL_PROJECT_ID:project,VERCEL_ORG_ID:team,VERCEL_TELEMETRY_DISABLED:'1'});
 const fd=fs.openSync(path.join(dir,'submission.log'),'wx');
 const result=cp.spawnSync(path.join(root,'artifacts/seo-node24/node-v24.22.0.exe'),['C:/Users/Ziko/AppData/Roaming/npm/node_modules/vercel/dist/index.js','deploy',source,'--target','production','--scope',team,'--yes','--no-wait','--format','json'],{cwd:source,env,windowsHide:true,stdio:['ignore',fd,fd]});fs.closeSync(fd);
 const report={at:new Date().toISOString(),exitCode:result.status,inspectBeforeRetry:true};fs.writeFileSync(path.join(dir,'submission-result.json'),JSON.stringify(report,null,2),{flag:'wx'});console.log(JSON.stringify(report));
})().catch(()=>{console.error('SUBMISSION_STOPPED_INSPECT_BEFORE_RETRY');process.exitCode=1;});
