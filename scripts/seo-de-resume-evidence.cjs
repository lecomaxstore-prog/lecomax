// Read-only recovery inventory. Does not load env files, deploy, or execute SQL.
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'artifacts/seo-advanced-final-20261022');
const base = '9692b1b51778c90a8a3f6fcfcac412771899032d';
const hash = b => crypto.createHash('sha256').update(b).digest('hex');
const git = (cwd, ...args) => cp.execFileSync('git', ['-c','core.quotepath=false',...args], {cwd,encoding:'utf8',stdio:['ignore','pipe','ignore'],windowsHide:true}).trim();
const write = (name, data) => fs.writeFileSync(path.join(out,name), JSON.stringify(data,null,2)+'\n', {flag:'wx'});
async function main() {
 if (process.argv[2] === 'urls') {
  const urls = ['http://lecomax.com/boutique?seo_probe=1','https://www.lecomax.com/','https://www.lecomax.com/boutique?seo_probe=1','https://lecomax.com/boutique','https://lecomax.com/boutique/','https://lecomax.com/homme','https://lecomax.com/homme/','https://lecomax.com/fr','https://lecomax.com/ar'];
  const results=[];
  for(const url of urls) {
   try {
    const response=await fetch(url,{redirect:'manual',signal:AbortSignal.timeout(20000)});
    const body=await response.text();
    results.push({url,status:response.status,location:response.headers.get('location'),canonical:body.match(/<link[^>]*rel="canonical"[^>]*href="([^"]+)"/)?.[1]||null,lang:body.match(/<html[^>]*lang="([^"]+)"/)?.[1]||null,hreflang:[...body.matchAll(/hrefLang="([^"]+)"/gi)].map(m=>m[1])});
   } catch { results.push({url,error:'REQUEST_FAILED'}); }
  }
  write('url-policy-'+Date.now()+'.json',{at:new Date().toISOString(),readOnly:true,results});console.log(JSON.stringify(results));return;
 }
 const result={at:new Date().toISOString(),base,candidates:{}};
 const pinned=JSON.parse(fs.readFileSync(path.join(root,'artifacts/seo-write-guard-20261021/release-manifest.json')));
 const stageRoot=path.join(root,'artifacts/seo-security-resume-20261021/source');
 for(const f of pinned.files) assert.equal(hash(fs.readFileSync(path.join(stageRoot,f.file))),f.sha256,f.file);
 result.pinnedStagingFilesVerified=pinned.files.length;
 for(const stage of ['d','e']) {
  const cwd=path.join(root,`release/seo-advanced-${stage}-20261022`);
  const head=git(cwd,'rev-parse','HEAD');
  if(head!==base) assert.equal(git(cwd,'rev-parse','HEAD^'),base,'Candidate must preserve released C as direct parent');
  const files=[...new Set((git(cwd,'diff','--name-only',base)+'\n'+git(cwd,'ls-files','--others','--exclude-standard')).split('\n').filter(Boolean))].sort();
  assert(files.length>0);
  const whitespace=cp.spawnSync('git',['diff','--check',base],{cwd,encoding:'utf8',windowsHide:true});
  const entries=files.map(file=>({file,sha256:hash(fs.readFileSync(path.join(cwd,file)))}));
  const recovered=JSON.parse(fs.readFileSync(path.join(out,stage,'recovered.json')));
  const recoveredDifferences=recovered.files.filter(f=>hash(fs.readFileSync(path.join(cwd,f.file)))!==f.sha256).map(f=>f.file);
  const preservation=['vercel.json','package.json','package-lock.json','middleware.ts','next.config.js','app/sitemap.xml/route.ts','app/sitemaps/[kind]/[page]/route.ts','app/sitemaps/static/route.ts','lib/sitemap-data.ts'];
  for(const file of preservation) assert.equal(git(cwd,'diff',base,'--',file),'',file);
  const pkg=JSON.parse(fs.readFileSync(path.join(cwd,'package.json'))),lock=JSON.parse(fs.readFileSync(path.join(cwd,'package-lock.json')));
  const dependencies=Object.entries({...pkg.dependencies,...pkg.devDependencies}).map(([name,range])=>{const actual=JSON.parse(fs.readFileSync(path.join(cwd,'node_modules',name,'package.json'))).version;const locked=lock.packages['node_modules/'+name]?.version;return {name,range,locked,actual,matchesLock:locked===actual};});
  const evidence=fs.readdirSync(path.join(out,stage)).filter(f=>/^(tests|types|lint|build|worker-tests)-.*\.json$/.test(f)).map(file=>({file,...JSON.parse(fs.readFileSync(path.join(out,stage,file)))}));
  result.candidates[stage]={branch:git(cwd,'branch','--show-current'),head,releaseCommit:head===base?null:head,files:entries,scopeSha256:hash(JSON.stringify(entries)),recoveredDifferences,preserved:preservation,dependencies,evidence,whitespace:{exitCode:whitespace.status,findings:whitespace.stdout.trim()}};
 }
 const plan=JSON.parse(fs.readFileSync(path.join(root,'operations/seo/production-readiness-20261021/migration-plan.json')));
 for(const m of plan.migrations) assert.equal(hash(fs.readFileSync(path.join(root,'release/seo-advanced-e-20261022',m.file))),m.sha256,m.file);
 result.migrations=plan.migrations;
 const inventory=JSON.parse(fs.readFileSync(path.join(out,'inventory.json')));
 result.inventory=inventory.changes.map(f=>({...f,candidates:['d','e'].filter(s=>result.candidates[s].files.some(x=>x.file===f.file))}));
 const name='resume-snapshot-'+Date.now()+'.json';write(name,result);
 console.log(JSON.stringify({file:name,stagingVerified:result.pinnedStagingFilesVerified,candidates:Object.fromEntries(Object.entries(result.candidates).map(([s,c])=>[s,{files:c.files.length,scopeSha256:c.scopeSha256,recoveredDifferences:c.recoveredDifferences,dependencyMismatches:c.dependencies.filter(d=>!d.matchesLock)}])),migrationsVerified:plan.migrations.length}));
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
