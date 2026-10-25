// Rebuild only from the production archive baseline and pinned reviewed overlays.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const previous=JSON.parse(fs.readFileSync('artifacts/seo-manual-candidate.json'));
const directory='release/seo-final-20261018';
if(fs.existsSync(directory))throw Error('Refusing to replace candidate');
const baseline='artifacts/seo-final-preparation/scope-1792359592212/baseline';
if(!fs.existsSync(baseline))throw Error('Verified production baseline missing');
for(const e of previous.files)if(sha(path.join(previous.directory,e.file))!==e.sha256)throw Error('Previous candidate drift');
const oldPolicy=fs.readFileSync(path.join(previous.directory,'lib/admin-policy.ts'),'utf8');
const expected=oldPolicy.replace('if (path === "/api/admin/seo") return null; // handler enforces read/product/category permissions','if (path === "/api/admin/seo" || path === "/api/admin/seo/sync") return null; // handlers enforce read/product/category permissions');
if(fs.readFileSync('lib/admin-policy.ts','utf8')!==expected)throw Error('Unexpected policy changes');
fs.cpSync(baseline,directory,{recursive:true,errorOnExist:true,force:false});
for(const e of previous.files){const dest=path.join(directory,e.file);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(path.join(previous.directory,e.file),dest);}
for(const file of ['lib/admin-policy.ts','tests/seo-sync-authorization.test.ts'])fs.copyFileSync(file,path.join(directory,file));
fs.copyFileSync(path.join(previous.directory,'next-env.d.ts'),path.join(directory,'next-env.d.ts'));
const files=[...new Set([...previous.files.map(e=>e.file),'tests/seo-sync-authorization.test.ts','next-env.d.ts'])].map(file=>({file,sha256:sha(path.join(directory,file))}));
const result={at:new Date().toISOString(),directory,baseCommit:previous.baseCommit,previousCandidate:previous.directory,files,applicationDelta:['lib/admin-policy.ts'],testDelta:['tests/seo-sync-authorization.test.ts'],generatedDeclarationPinned:'next-env.d.ts',deployed:false};
fs.writeFileSync('artifacts/seo-final-preparation/candidate.json',JSON.stringify(result,null,2),{flag:'wx'});console.log(JSON.stringify({directory,files:files.length,deployed:false}));
