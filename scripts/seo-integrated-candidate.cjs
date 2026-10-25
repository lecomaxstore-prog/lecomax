const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),out=path.join(root,'artifacts/seo-fix-integration-20261021'),target=path.resolve(root,"../L'ecomax-seo-staging"),source=path.join(out,'source');
const deps=path.join(root,'artifacts/seo-dependency-remediation-20261021/node_modules'),node=path.join(root,'artifacts/seo-node24/node-v24.22.0.exe');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const mode=process.argv[2];
if(mode==='prepare'){
 const dir=path.join(root,'artifacts/seo-staging-rc-20261020');
 const latest=fs.readdirSync(dir).filter(f=>/^upload-inventory-\d+\.json$/.test(f)).sort().at(-1);
 const inventory=JSON.parse(fs.readFileSync(path.join(dir,latest)));
 assert.equal(inventory.problems.length,0);assert.equal(inventory.files.length,2124);
 assert(!fs.existsSync(source),'Snapshot already exists');fs.mkdirSync(source);
 for(const x of inventory.files){const b=fs.readFileSync(path.join(target,x.file));assert.equal(sha(b),x.sha256);const p=path.join(source,x.file);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,b,{flag:'wx'});}
 assert.equal(sha(fs.readFileSync(path.join(source,'package-lock.json'))),sha(fs.readFileSync(path.join(root,'artifacts/seo-dependency-remediation-20261021/package-lock.json'))));
 fs.symlinkSync(deps,path.join(source,'node_modules'),'junction');
 fs.writeFileSync(path.join(out,'source-manifest.json'),JSON.stringify({...inventory,source,target,dependencies:deps,sourceInventory:latest},null,2),{flag:'wx'});
 console.log(JSON.stringify({source,files:inventory.files.length,lockfile:sha(fs.readFileSync(path.join(source,'package-lock.json')))}));process.exit();
}
const env={};for(const [k,v]of Object.entries(process.env))if(/^(PATH|SystemRoot|windir|ComSpec|TEMP|TMP|USERPROFILE|APPDATA|LOCALAPPDATA|ProgramFiles|ProgramFiles\(x86\)|NUMBER_OF_PROCESSORS|PROCESSOR_ARCHITECTURE)$/i.test(k))env[k]=v;
Object.assign(env,{APP_ENV:'development',NEXT_PUBLIC_APP_ENV:'development',NODE_ENV:'production',NEXT_PUBLIC_SITE_URL:'http://127.0.0.1:31848',NEXT_PUBLIC_SUPABASE_URL:'http://127.0.0.1:9',NEXT_PUBLIC_SUPABASE_ANON_KEY:'synthetic-anon',SUPABASE_SERVICE_ROLE_KEY:'synthetic-service',NEXT_PUBLIC_SUPABASE_KEY_BINDING:'local:'+sha('synthetic-anon'),SUPABASE_SERVICE_KEY_BINDING:'local:'+sha('synthetic-service'),ADMIN_SESSION_SECRET:'synthetic-session-secret-for-isolated-build-only',SEO_AI_ENABLED:'false',SEO_EDITORIAL_ENABLED:'false',SEO_SYNC_ENABLED:'false',SEO_MANUAL_SYNC_ENABLED:'false',SEO_MIRAI_FALLBACK_ENABLED:'false',INDEXNOW_ENABLED:'false',PAYPAL_ENABLED:'false',NEXT_TELEMETRY_DISABLED:'1'});
env.NODE_OPTIONS=`--require ${JSON.stringify(path.join(out,'fixture-fetch.cjs'))}`;
let args;
if(mode==='build')args=[path.join(deps,'next/dist/bin/next'),'build'];
else if(mode==='serve'||mode==='serve-recheck')args=[path.join(deps,'next/dist/bin/next'),'start','--hostname','127.0.0.1','--port',mode==='serve'?'31848':'31849'];
else if(mode==='types')args=[path.join(deps,'typescript/bin/tsc'),'--noEmit','--incremental','false'];
else if(mode==='lint')args=[path.join(deps,'eslint/bin/eslint.js'),'app/layout.tsx','components/CategoryTiles.tsx'];
else if(mode==='tests')args=['--test','tests/storefront-catalogue.test.ts','tests/storefront-loading-performance.test.ts','tests/product-indexing.test.ts','tests/seo-sitemap.test.ts','tests/staging-outbound.test.ts'];
else throw Error('Unknown mode');
const log=path.join(out,`${mode}-${Date.now()}.log`),fd=fs.openSync(log,'wx'),startedAt=new Date().toISOString();
const r=cp.spawnSync(node,args,{cwd:source,env,windowsHide:true,stdio:['ignore',fd,fd]});fs.closeSync(fd);
const result={startedAt,finishedAt:new Date().toISOString(),mode,exitCode:r.status,log,source,node,syntheticFixtures:true,hosted:false};
fs.writeFileSync(path.join(out,`${mode}-result.json`),JSON.stringify(result,null,2),{flag:'wx'});console.log(JSON.stringify(result));process.exitCode=r.status??1;
