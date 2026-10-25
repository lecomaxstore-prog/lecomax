// Local packaging only. Preserve the earlier reviewed candidate and all backups.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto');
const out='release/seo-decoupled-20261018';
if(fs.existsSync(out))throw Error('Refusing to replace an existing candidate');
const previous=JSON.parse(fs.readFileSync('artifacts/seo-migration/isolated-release-manifest.json','utf8'));
fs.mkdirSync(out,{recursive:true});
cp.execFileSync('C:/Windows/System32/tar.exe',['-xf',path.resolve('artifacts/seo-migration/production-source-for-seo-20261018.tar'),'-C',out]);
const files=[...new Set([...previous.files.map(e=>e.file).filter(f=>!f.startsWith('supabase/')),
  'supabase/alternatives/202610180002_seo_decoupled.sql','scripts/seo-sync-worker.mjs',
  'supabase/audit/202610180001_seo_engine.sql','supabase/verification/seo-decoupled-postflight.sql',
  'scripts/test-seo-decoupled.mjs','scripts/test-preorder-sql.mjs','tests/seo-sync.test.ts',
  'scripts/test-seo-concurrency.cjs','scripts/smoke-seo-dashboard.mjs',
  'docs/seo-decoupled-rollout-20261018.md'])].sort();
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const changed=new Set(['app/api/admin/seo/route.ts','app/admin/seo/page.tsx','lib/seo-store.ts','lib/product-share.ts']);
const entries=files.map(file=>{
  const source=file==='supabase/audit/202610180001_seo_engine.sql'?'supabase/migrations/202610180001_seo_engine.sql':previous.files.some(e=>e.file===file)&&!changed.has(file)?path.join(previous.directory,file):file;
  const prior=previous.files.find(e=>e.file===file);
  if(prior&&!changed.has(file)&&sha(fs.readFileSync(source))!==prior.candidateSha256)throw Error('Earlier candidate changed: '+file);
  const dest=path.join(out,file);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(source,dest);
  return {file,sha256:sha(fs.readFileSync(dest))};
});
fs.writeFileSync('artifacts/seo-decoupled-candidate.json',JSON.stringify({createdAt:new Date().toISOString(),baseCommit:previous.baseCommit,directory:out,files:entries,deployed:false},null,2),{flag:'wx'});
console.log(JSON.stringify({directory:out,files:entries.length,deployed:false}));
