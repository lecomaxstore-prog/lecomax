const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto');
const previous=JSON.parse(fs.readFileSync('artifacts/seo-decoupled-candidate-final.json','utf8'));
const directory='release/seo-manual-20261018';
if(fs.existsSync(directory))throw Error('Candidate already exists');
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
for(const e of previous.files)if(hash(path.join(previous.directory,e.file))!==e.sha256)throw Error('Previous candidate changed');
fs.mkdirSync(directory,{recursive:true});
cp.execFileSync('C:/Windows/System32/tar.exe',['-xf',path.resolve('artifacts/seo-migration/production-source-for-seo-20261018.tar'),'-C',directory]);
for(const e of previous.files){const target=path.join(directory,e.file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(previous.directory,e.file),target);}
const changed=['app/admin/seo/page.tsx','app/admin/seo/SeoSyncControl.tsx','app/api/admin/seo/sync/route.ts','tests/seo-manual-sync.test.ts'];
for(const file of changed){const target=path.join(directory,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(file,target);}
const files=[...new Set([...previous.files.map(e=>e.file),...changed])].map(file=>({file,sha256:hash(path.join(directory,file))}));
fs.writeFileSync('artifacts/seo-manual-candidate.json',JSON.stringify({at:new Date().toISOString(),directory,baseCommit:previous.baseCommit,files,deployed:false},null,2),{flag:'wx'});
console.log(JSON.stringify({directory,files:files.length,deployed:false}));
