// Local packaging only: never calls Vercel, loads credentials or deploys.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const manifest=JSON.parse(fs.readFileSync('artifacts/seo-account6/worker-manifest.json'));
const root='release/seo-worker-20261018';
if(fs.existsSync(root))throw Error('Refusing to replace existing worker package');
for(const item of manifest.files)if(hash(item.file)!==item.sha256)throw Error('REVIEWED_WORKER_DRIFT');
const runtime=['package.json','package-lock.json','vercel.json','api/sync.mjs','lib/handler.mjs','lib/seo-sync-worker.mjs'];
const files=[];
for(const file of runtime){
 const source='operations/seo-vercel/'+file,target=path.join(root,file);
 if(!manifest.files.some(e=>e.file===source))throw Error('UNREVIEWED_FILE');
 fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(source,target);
 files.push({file,sha256:hash(target)});
}
const result={at:new Date().toISOString(),directory:root,sourceManifest:'artifacts/seo-account6/worker-manifest.json',files,hostedProjectCreated:false,deployed:false,containsSecrets:false,containsMigrationSQL:false};
fs.mkdirSync('artifacts/seo-account8',{recursive:true});
fs.writeFileSync('artifacts/seo-account8/worker-package.json',JSON.stringify(result,null,2),{flag:'wx'});
console.log(JSON.stringify(result));
