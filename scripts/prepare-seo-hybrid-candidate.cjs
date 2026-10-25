// Local source packaging only. Preserve all earlier candidates and manifests.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const prior=JSON.parse(fs.readFileSync('artifacts/seo-final-preparation/candidate.json'));
for(const e of prior.files)if(hash(path.join(prior.directory,e.file))!==e.sha256)throw Error('BASE_DRIFT');
const directory='release/seo-hybrid-20261019';
if(fs.existsSync(directory))throw Error('Refusing to overwrite candidate');
fs.cpSync('artifacts/seo-final-preparation/scope-1792359592212/baseline',directory,{recursive:true,errorOnExist:true,force:false});
for(const e of prior.files){const target=path.join(directory,e.file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(prior.directory,e.file),target);}
const changes=['app/api/admin/seo/route.ts','app/api/admin/seo/sync/route.ts','tests/seo-api.test.ts','tests/seo-manual-sync.test.ts','tests/seo-hybrid-store.test.ts'];
for(const file of changes)fs.copyFileSync(file,path.join(directory,file));
const files=[...new Set([...prior.files.map(e=>e.file),...changes])].map(file=>({file,sha256:hash(path.join(directory,file))}));
fs.writeFileSync('artifacts/seo-hybrid/candidate.json',JSON.stringify({at:new Date().toISOString(),directory,baseCommit:prior.baseCommit,previousCandidate:prior.directory,files,deployed:false},null,2),{flag:'wx'});
const workerDirectory='release/seo-worker-hybrid-20261019';
if(fs.existsSync(workerDirectory))throw Error('Refusing to overwrite worker');
const workerFiles=['package.json','package-lock.json','vercel.json','api/sync.mjs','lib/handler.mjs','lib/seo-sync-worker.mjs','node-server.mjs'];
for(const file of workerFiles){const target=path.join(workerDirectory,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync('operations/seo-vercel/'+file,target);}
fs.writeFileSync('artifacts/seo-hybrid/worker-package.json',JSON.stringify({at:new Date().toISOString(),directory:workerDirectory,files:workerFiles.map(file=>({file,sha256:hash(path.join(workerDirectory,file))})),deployed:false},null,2),{flag:'wx'});
console.log(JSON.stringify({directory,files:files.length,workerDirectory,productionWrites:false}));
