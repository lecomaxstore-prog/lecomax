// Offline packaging only. No credentials, network, deployment, or SQL execution.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),source=path.join(root,'release/seo-advanced-d-20261022');
const out=path.join(root,'artifacts/seo-advanced-final-20261022/d');
const base='9692b1b51778c90a8a3f6fcfcac412771899032d';
const original='32cbebd0a916346e0533409996fdf18e29536cef';
const git=(...args)=>cp.execFileSync('git',args,{cwd:source,encoding:'utf8',windowsHide:true,stdio:['ignore','pipe','pipe']}).trim();
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const expected=['app/api/indexnow/route.ts','lib/indexnow.mjs','lib/product-discovery.ts','operations/seo-vercel/lib/environment-target.mjs','scripts/sitemap-release-urls.mjs','scripts/verify-storefront-release.mjs','tests/indexnow-safety.test.ts','tests/seo-advanced-indexnow.test.ts'].sort();
assert.equal(git('status','--porcelain'),'','Candidate must be clean');
assert.equal(git('merge-base',base,'HEAD'),base);
assert.equal(git('merge-base',original,'HEAD'),original);
assert.deepEqual(git('diff','--name-only',base,'HEAD').split('\n').sort(),expected);
git('diff','--check',base,'HEAD');
const commit=git('rev-parse','HEAD');
const files=git('ls-files','-z').split('\0').filter(Boolean).map(file=>({file,sha256:hash(fs.readFileSync(path.join(source,file)))}));
const evidence=fs.readdirSync(out).filter(f=>/^(tests|build|lint|types)-\d+\.json$/.test(f)).map(file=>({file,...JSON.parse(fs.readFileSync(path.join(out,file)))}));
const latest={};
for(const kind of ['tests','types','lint','build']) {
 const records=evidence.filter(e=>e.file.startsWith(kind+'-')).sort((a,b)=>b.at.localeCompare(a.at));
 assert.equal(records[0]?.exitCode,0,kind+' must pass');latest[kind]=records[0];
}
const stamp=Date.now(),archive='release-d-'+commit.slice(0,8)+'-'+stamp+'.zip';
git('archive','--format=zip','--output='+path.join(out,archive),'HEAD');
const manifest={at:new Date().toISOString(),base,commit,original,branch:git('branch','--show-current'),scope:expected,files,validation:latest,archive:{file:archive,sha256:hash(fs.readFileSync(path.join(out,archive)))},rollback:{deployment:'dpl_EXrVzU58gZvV2pACLtsGLaKZhce1',commit:base,requiresAuthorization:true,restoresLegacyIndexNow:true},productionConfigChanged:false,migrationsRequired:false,flagPolicy:'Keep INDEXNOW_ENABLED=false; activation is separate',deploymentAuthorized:false};
const file='release-manifest-'+stamp+'.json';fs.writeFileSync(path.join(out,file),JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({file,sha256:hash(fs.readFileSync(path.join(out,file))),commit,sourceFiles:files.length,archive}));
