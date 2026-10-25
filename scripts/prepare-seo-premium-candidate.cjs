// Local packaging only; never overwrites any previous candidate.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const prior=JSON.parse(fs.readFileSync('artifacts/seo-openai/candidate.json'));
for(const entry of prior.files)if(hash(path.join(prior.directory,entry.file))!==entry.sha256)throw Error('PRIOR_CANDIDATE_DRIFT');
const directory='release/seo-premium-20261019',workerDirectory='release/seo-worker-premium-20261019';
if(fs.existsSync(directory)||fs.existsSync(workerDirectory))throw Error('REFUSE_OVERWRITE');
fs.cpSync(prior.directory,directory,{recursive:true,force:false,errorOnExist:true,filter:source=>!['.next','.next-dev','.source-library','node_modules'].some(segment=>source.split(path.sep).includes(segment))});
const changes=['app/admin/seo/SeoAiControl.tsx','app/api/admin/seo/ai/route.ts','tests/seo-ai-api.test.ts'];
for(const file of changes)fs.copyFileSync(file,path.join(directory,file));
const files=[...new Set([...prior.files.map(e=>e.file),...changes])].map(file=>({file,sha256:hash(path.join(directory,file))}));
fs.writeFileSync('artifacts/seo-premium/candidate.json',JSON.stringify({at:new Date().toISOString(),directory,previousCandidate:prior.directory,baseCommit:prior.baseCommit,files,deployed:false},null,2),{flag:'wx'});
const runtime=['package.json','package-lock.json','vercel.json','api/sync.mjs','node-server.mjs','lib/handler.mjs','lib/seo-sync-worker.mjs','lib/seo-ai-provider.mjs','lib/seo-ai-worker.mjs','lib/seo-editorial.mjs'];
for(const file of runtime){const target=path.join(workerDirectory,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync('operations/seo-vercel/'+file,target);}
const migration='operations/seo-vercel/supabase/migrations/202610190002_seo_editorial.sql';
fs.writeFileSync('artifacts/seo-premium/worker-package.json',JSON.stringify({at:new Date().toISOString(),directory:workerDirectory,files:runtime.map(file=>({file,sha256:hash(path.join(workerDirectory,file))})),migration:{file:migration,sha256:hash(migration)},deployed:false,paidRequests:0},null,2),{flag:'wx'});
console.log(JSON.stringify({directory,workerDirectory,overlayFiles:files.length,runtimeFiles:runtime.length,deployed:false}));
