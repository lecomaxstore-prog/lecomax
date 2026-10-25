const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),out=path.join(root,'artifacts/seo-fix-integration-20261021');
const m=JSON.parse(fs.readFileSync(path.join(out,'source-manifest.json'))),old=JSON.parse(fs.readFileSync(path.join(root,'artifacts/seo-staging-rc-20261020/upload-inventory-1792539666572.json')));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const expected=new Map(old.files.map(f=>[f.file,f.sha256]));
const delta=m.files.filter(f=>expected.get(f.file)!==f.sha256);
assert.deepEqual(delta.map(f=>f.file).sort(),['app/layout.tsx','components/CategoryTiles.tsx','public/images/placeholder.png']);
const missing=old.files.filter(f=>!m.files.some(x=>x.file===f.file));assert.equal(missing.length,0);
for(const f of m.files)for(const base of [m.source,m.target])assert.equal(sha(fs.readFileSync(path.join(base,f.file))),f.sha256,`${base}/${f.file}`);
const dependencyLock=JSON.parse(fs.readFileSync(path.join(m.source,'package-lock.json'))),pkg=JSON.parse(fs.readFileSync(path.join(m.source,'package.json')));
const dependencies=Object.keys({...pkg.dependencies,...pkg.devDependencies}).map(name=>{const actual=JSON.parse(fs.readFileSync(path.join(m.dependencies,name,'package.json'))).version;assert.equal(actual,dependencyLock.packages[`node_modules/${name}`].version,name);return {name,version:actual}});
const deltaDir=path.join(out,'delta');fs.mkdirSync(deltaDir,{recursive:true});
for(const f of delta){const p=path.join(deltaDir,f.file);fs.mkdirSync(path.dirname(p),{recursive:true});fs.copyFileSync(path.join(m.source,f.file),p,fs.constants.COPYFILE_EXCL);}
const report={at:new Date().toISOString(),source:m.source,sourceFileCount:m.files.length,sourceManifestSha256:sha(fs.readFileSync(path.join(out,'source-manifest.json'))),lockfileSha256:sha(fs.readFileSync(path.join(m.source,'package-lock.json'))),delta,removed:[],verifiedDirectDependencies:dependencies,unchangedBaselineFiles:old.files.length-2,sourceMatchesWorktree:true,hosted:false,deployAuthorized:false,rollbackDeployment:'dpl_9PVLNqN3YRoSmDgi4T5D9o81Svcv'};
fs.writeFileSync(path.join(out,'package-verification.json'),JSON.stringify(report,null,2),{flag:'wx'});
console.log(JSON.stringify({files:m.files.length,delta:delta.map(x=>x.file),dependencies:dependencies.length,sourceManifestSha256:report.sourceManifestSha256}));
