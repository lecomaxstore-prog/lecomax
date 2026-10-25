const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),target=path.resolve(root,"../L'ecomax-seo-staging"),out=path.join(root,'artifacts/seo-fix-integration-20261021');
fs.mkdirSync(out,{recursive:true});
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const git=args=>cp.execFileSync('git',['-c',`safe.directory=${target.replaceAll('\\','/')}`,'-C',target,...args],{encoding:'utf8',maxBuffer:20e6});
const old=JSON.parse(fs.readFileSync(path.join(root,'artifacts/seo-staging-rc-20261020/upload-inventory-1792539666572.json')));
const drift=old.files.filter(x=>!fs.existsSync(path.join(target,x.file))||sha(fs.readFileSync(path.join(target,x.file)))!==x.sha256).map(x=>x.file);
assert.deepEqual(drift,[],'Pinned source changed; inspect before integration');
fs.writeFileSync(path.join(out,'before-status.txt'),git(['status','--short']),{flag:'wx'});
const files=['app/layout.tsx','components/CategoryTiles.tsx'];
const before=files.map(file=>({file,bytes:fs.readFileSync(path.join(target,file))}));
const replacement=(text,from,to)=>{assert.equal(text.split(from).length,2,'Expected exactly one reviewed source anchor');return text.replace(from,to)};
const layout=before[0].bytes.toString();
const modifiedLayout=replacement(replacement(layout,'  manifest: "/manifest.json?v=12",',''),'<head>','<head>\n        {/* Protected deployments use the browser\'s existing authorized session. */}\n        <link rel="manifest" href="/manifest.json?v=12" crossOrigin="use-credentials" />');
const modifiedTiles=replacement(before[1].bytes.toString(),'srcSet={desktop}','srcSet={desktop.replace(/[\\s,]/g, encodeURIComponent)}');
const asset=fs.readFileSync(path.join(root,'public/images/placeholder.png'));
assert.equal(sha(asset),'2f12eb2197ed4fe89685ab4c323de05b0bf942e50dd2aff40a7aee3481e3e935');
assert(!fs.existsSync(path.join(target,'public/images/placeholder.png')),'Do not overwrite an existing asset');
for(const b of before){const p=path.join(out,'before',b.file);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,b.bytes,{flag:'wx'});}
for(const [file,bytes] of [[files[0],modifiedLayout],[files[1],modifiedTiles],['public/images/placeholder.png',asset]])fs.writeFileSync(path.join(target,file),bytes);
const changes=[...files,'public/images/placeholder.png'].map(file=>({file,beforeSha256:old.files.find(x=>x.file===file)?.sha256||null,sha256:sha(fs.readFileSync(path.join(target,file)))}));
const unexpected=old.files.filter(x=>!files.includes(x.file)&&sha(fs.readFileSync(path.join(target,x.file)))!==x.sha256);
assert.deepEqual(unexpected,[]);
fs.writeFileSync(path.join(out,'integration.json'),JSON.stringify({at:new Date().toISOString(),target,base:git(['rev-parse','HEAD']).trim(),pinnedFilesVerified:old.files.length,changes,unrelatedPinnedFilesUnchanged:true,deployed:false},null,2),{flag:'wx'});
const report={id:'seo-three-fixes-integrated-prepared-20261021',createdAt:new Date().toISOString(),title:'Three browser fixes integrated into isolated staging source',summary:'Only manifest credentials, category srcset escaping and the missing placeholder were integrated. Staging guards, dependencies and unrelated source remain unchanged; validation pending.',status:'needs-testing',pages:['Storefront shared layout','Category tiles','Product images'],components:['RootLayout','CategoryTiles','Placeholder asset'],files:changes.map(x=>x.file),changes:[{kind:'fixed',detail:'Explicit credentialed manifest link and encoded single-URL srcset.'},{kind:'added',detail:'Reviewed 640x640 neutral placeholder asset.'}],validation:[{name:'Pinned source and bounded transfer',result:'passed',detail:`All ${old.files.length} baseline hashes matched before integration; only two existing uploaded files changed and one asset was added.`},{name:'Candidate tests/build/browser',result:'not-run',detail:'Pending. No hosted deployment or write authorized.'}]};
const reportPath=path.join(out,'prepared-report.json');fs.writeFileSync(reportPath,JSON.stringify(report,null,2),{flag:'wx'});
for(const cwd of [root,target]){const r=cp.spawnSync(process.execPath,['lecomax-learning-app/scripts/change-report.cjs','--append',reportPath],{cwd,stdio:'inherit',windowsHide:true});assert.equal(r.status,0,'History append');}
console.log(JSON.stringify({target,changes,pinnedFilesVerified:old.files.length}));
