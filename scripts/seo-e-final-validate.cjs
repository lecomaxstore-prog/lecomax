// Isolated cumulative candidate only; synthetic data and no production credentials.
const fs=require('fs'),path=require('path'),cp=require('child_process');
const root=path.resolve(__dirname,'..'),source=path.join(root,'release/seo-e-cumulative-20261022'),out=path.join(root,'artifacts/seo-e-final-20261022'),node=path.join(root,'artifacts/seo-node24/node-v24.22.0.exe');
const mode=process.argv[2],deps=path.join(source,'node_modules');
const env=Object.fromEntries(Object.entries(process.env).filter(([k])=>/^(PATH|SystemRoot|windir|ComSpec|TEMP|TMP|USERPROFILE|APPDATA|LOCALAPPDATA|ProgramFiles|ProgramFiles\(x86\)|NUMBER_OF_PROCESSORS|PROCESSOR_ARCHITECTURE)$/i.test(k)));
Object.assign(env,{NODE_ENV:'production',APP_ENV:'production',NEXT_PUBLIC_APP_ENV:'production',SEO_RUNTIME_ENV:'production',NEXT_PUBLIC_SITE_URL:'https://lecomax.com',NEXT_PUBLIC_SUPABASE_URL:'http://127.0.0.1:9',NEXT_PUBLIC_SUPABASE_ANON_KEY:'synthetic-anon',SUPABASE_SERVICE_ROLE_KEY:'synthetic-service',ADMIN_SESSION_SECRET:'synthetic-session-secret-for-isolated-build-only',RESEND_API_KEY:'re_synthetic_local_no_delivery',NEXT_TELEMETRY_DISABLED:'1',SEO_AI_ENABLED:'false',SEO_EDITORIAL_ENABLED:'false',SEO_SYNC_ENABLED:'false',SEO_MANUAL_SYNC_ENABLED:'false',SEO_MIRAI_FALLBACK_ENABLED:'false',INDEXNOW_ENABLED:'false'});
const previous=JSON.parse(fs.readFileSync(path.join(root,'artifacts/seo-advanced-final-20261022/e/tests-1792692376461.json'))).tests;
const tests=[...new Set([...previous,'tests/indexnow-safety.test.ts','tests/seo-advanced-indexnow.test.ts',...(fs.existsSync(path.join(source,'tests/seo-e-auth-acceptance.test.ts'))?['tests/seo-e-auth-acceptance.test.ts']:[])])];
let args;
if(mode==='tests')args=['--test',...tests];
else if(mode==='worker-tests')args=['--test',...fs.readdirSync(path.join(source,'operations/seo-vercel/tests')).filter(x=>x.endsWith('.test.mjs')).map(x=>'operations/seo-vercel/tests/'+x)];
else if(mode==='types')args=[path.join(deps,'typescript/bin/tsc'),'--noEmit','--incremental','false'];
else if(['build','lint','serve'].includes(mode)){args=[path.join(deps,'next/dist/bin/next'),mode==='serve'?'start':mode==='lint'?'lint':'build',...(mode==='serve'?['--hostname','127.0.0.1','--port','31943']:[])];if(mode!=='lint')env.NODE_OPTIONS='--require '+JSON.stringify(path.join(root,mode==='serve'?'scripts/seo-e-reader-fixture.cjs':'artifacts/seo-fix-integration-20261021/fixture-fetch.cjs'));}
else throw Error('UNKNOWN_MODE');
const stamp=Date.now(),log=mode+'-'+stamp+'.log',fd=fs.openSync(path.join(out,log),'wx'),at=new Date().toISOString();
const r=cp.spawnSync(node,args,{cwd:source,env,windowsHide:true,stdio:['ignore',fd,fd]});fs.closeSync(fd);
const result={at,finishedAt:new Date().toISOString(),mode,exitCode:r.status,log,node,source,synthetic:true,cleanDependencies:true,tests:mode==='tests'?tests:undefined};fs.writeFileSync(path.join(out,mode+'-'+stamp+'.json'),JSON.stringify(result,null,2),{flag:'wx'});console.log(JSON.stringify(result));process.exitCode=r.status??1;
