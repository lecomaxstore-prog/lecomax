// Preserve all earlier release candidates. Local source packaging only.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const prior=JSON.parse(fs.readFileSync('artifacts/seo-hybrid/candidate.json'));
for(const e of prior.files)if(hash(path.join(prior.directory,e.file))!==e.sha256)throw Error('BASE_DRIFT');
const directory='release/seo-openai-20261019',workerDirectory='release/seo-worker-openai-20261019';
if(fs.existsSync(directory)||fs.existsSync(workerDirectory))throw Error('Refusing to overwrite release');
fs.cpSync('artifacts/seo-final-preparation/scope-1792359592212/baseline',directory,{recursive:true,errorOnExist:true,force:false});
for(const e of prior.files){const target=path.join(directory,e.file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(prior.directory,e.file),target);}
const changes=['lib/seo-ai.ts','lib/admin-policy.ts','app/api/admin/seo/route.ts','app/api/admin/seo/ai/route.ts','app/admin/seo/page.tsx','app/admin/seo/SeoAiControl.tsx','app/admin/seo/seo.module.css','tests/seo-api.test.ts','tests/seo-ai-api.test.ts'];
for(const file of changes){fs.mkdirSync(path.dirname(path.join(directory,file)),{recursive:true});fs.copyFileSync(file,path.join(directory,file));}
const files=[...new Set([...prior.files.map(e=>e.file),...changes])].map(file=>({file,sha256:hash(path.join(directory,file))}));
fs.writeFileSync('artifacts/seo-openai/candidate.json',JSON.stringify({at:new Date().toISOString(),directory,baseCommit:prior.baseCommit,previousCandidate:prior.directory,files,deployed:false},null,2),{flag:'wx'});
const runtime=['package.json','package-lock.json','vercel.json','api/sync.mjs','node-server.mjs','lib/handler.mjs','lib/seo-sync-worker.mjs','lib/seo-ai-provider.mjs','lib/seo-ai-worker.mjs'];
for(const file of runtime){const target=path.join(workerDirectory,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync('operations/seo-vercel/'+file,target);}
const sql='operations/seo-vercel/supabase/migrations/202610190001_seo_ai_budget.sql';
fs.writeFileSync('artifacts/seo-openai/worker-package.json',JSON.stringify({at:new Date().toISOString(),directory:workerDirectory,files:runtime.map(file=>({file,sha256:hash(path.join(workerDirectory,file))})),migration:{file:sql,sha256:hash(sql)},deployed:false,paidRequests:0},null,2),{flag:'wx'});
console.log(JSON.stringify({directory,overlayFiles:files.length,workerDirectory,runtimeFiles:runtime.length,productionWrites:false}));
