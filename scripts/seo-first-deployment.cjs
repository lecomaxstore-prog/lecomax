// Only the explicitly authorized dedicated staging project may be deployed.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..'),candidate=path.resolve(root,"../L'ecomax-seo-staging");
const node=path.join(root,'artifacts/seo-node24/node-v24.22.0.exe');
const cli='C:/Users/Ziko/AppData/Roaming/npm/node_modules/vercel/dist/index.js';
const env={};
for(const [k,v] of Object.entries(process.env)) if(/^(PATH|SystemRoot|windir|ComSpec|TEMP|TMP|USERPROFILE|APPDATA|LOCALAPPDATA|ProgramFiles|NUMBER_OF_PROCESSORS|PROCESSOR_ARCHITECTURE)$/i.test(k))env[k]=v;
env.VERCEL_PROJECT_ID='prj_jPniwpH4s81bhISVReUKTQN0GwvD';env.VERCEL_ORG_ID='team_yFLUcpSvgQi8EQuvuorOZW7w';env.VERCEL_TELEMETRY_DISABLED='1';
for(const script of ['verify-seo-staging-environment.cjs','seo-first-deployment-audit.cjs']){
 const check=cp.spawnSync(node,[path.join(__dirname,script)],{cwd:root,env,windowsHide:true,encoding:'utf8'});
 if(check.status!==0)throw Error('PREDEPLOY_CHECK_FAILED_'+script);
}
if(fs.existsSync(path.join(candidate,'.vercel/project.json'))) {
 const p=JSON.parse(fs.readFileSync(path.join(candidate,'.vercel/project.json')));
 if(p.projectId!==env.VERCEL_PROJECT_ID||p.orgId!==env.VERCEL_ORG_ID)throw Error('LOCAL_LINK_MISMATCH');
}
const log=path.join(root,`artifacts/seo-first-source-deployment-${Date.now()}.log`);
const fd=fs.openSync(log,'wx');
console.log(JSON.stringify({log,projectId:env.VERCEL_PROJECT_ID,applicationEnvironment:'staging',source:candidate}));
const child=cp.spawn(node,[cli,'deploy',candidate,'--target','production','--scope',env.VERCEL_ORG_ID,'--yes','--no-wait','--format','json'],{cwd:candidate,env,windowsHide:true,stdio:['ignore',fd,fd]});
child.on('exit',code=>{fs.closeSync(fd);console.log(JSON.stringify({exitCode:code,log}));process.exitCode=code||0;});
