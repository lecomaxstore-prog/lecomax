// Build a new source snapshot without dotenv, hosting links or credentials.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
if(process.argv.length>3 || process.argv[2] && process.argv[2]!=='--resume-local')throw Error('NO_TARGET_OVERRIDES');
const root=path.resolve(__dirname,'..');
let directory=path.join(root,'release','seo-editorial-check-'+Date.now());
if(process.argv[2]) {
  const reports=fs.readdirSync(path.join(root,'artifacts/seo-resume-20261019')).filter(n=>/^build-result-\d+\.json$/.test(n)).sort();
  const previous=JSON.parse(fs.readFileSync(path.join(root,'artifacts/seo-resume-20261019',reports.at(-1)),'utf8'));
  directory=path.resolve(previous.directory);
  if(path.dirname(directory)!==path.join(root,'release') || !/^seo-editorial-check-\d+$/.test(path.basename(directory)) || fs.realpathSync(directory)!==directory || previous.deployed!==false)throw Error('UNSAFE_BUILD_SNAPSHOT');
}
fs.mkdirSync(directory,{recursive:true});
const space=fs.statfsSync(directory);if(space.bavail*space.bsize<1_000_000_000)throw Error('INSUFFICIENT_BUILD_DISK_SPACE');
const skip=new Set(['node_modules','.git','.next','.next-dev','.temp','artifacts']);
const filter=src=>!path.relative(root,src).split(path.sep).some(p=>skip.has(p)||p.startsWith('.env'));
for(const name of ['app','components','lib','operations/seo-vercel/lib','scripts','tests','public','mobile/src','lecomax-learning-app/utils','lecomax-learning-app/features','lecomax-learning-app/data'])fs.cpSync(path.join(root,name),path.join(directory,name),{recursive:true,filter});
for(const name of ['package.json','package-lock.json','next.config.js','next-env.d.ts','tsconfig.json','tailwind.config.js','postcss.config.js','middleware.ts','instrumentation.ts','.eslintrc.json'])fs.copyFileSync(path.join(root,name),path.join(directory,name));
// Task-owned disposable configuration only; preserve the repository config.
fs.appendFileSync(path.join(directory,'next.config.js'),`\nconst isolatedOriginalConfig=module.exports;module.exports=async(...args)=>{const config=await isolatedOriginalConfig(...args),webpack=config.webpack;return {...config,webpack:(value,...rest)=>{const result=webpack?webpack(value,...rest):value;result.cache=false;return result;}};};\n`);
// Block runtime fetches during prerendering. No database/provider credentials
// exist in this snapshot or child environment. Google font CSS is build input.
const guard=path.join(directory,'offline-build.cjs');
fs.writeFileSync(guard,`globalThis.fetch=async()=>{throw Error('ISOLATED_BUILD_NETWORK_DISABLED')};\n`);
const env={};
for(const [k,v] of Object.entries(process.env))if(/^(PATH|SystemRoot|windir|ComSpec|TEMP|TMP|USERPROFILE|APPDATA|LOCALAPPDATA|ProgramFiles|ProgramFiles\(x86\)|NUMBER_OF_PROCESSORS|PROCESSOR_ARCHITECTURE)$/i.test(k))env[k]=v;
Object.assign(env,{NEXT_PUBLIC_SITE_URL:'http://localhost:3000',APP_ENV:'development',NEXT_PUBLIC_APP_ENV:'development',ADMIN_SESSION_SECRET:'synthetic-session-secret-for-isolated-build-only',NODE_OPTIONS:`--require ${JSON.stringify(guard)}`,NEXT_PUBLIC_SUPABASE_URL:'http://127.0.0.1:9',NEXT_PUBLIC_SUPABASE_ANON_KEY:'synthetic-anon',SUPABASE_SERVICE_ROLE_KEY:'synthetic-service',NEXT_TELEMETRY_DISABLED:'1',SEO_AI_ENABLED:'false',SEO_EDITORIAL_ENABLED:'false',SEO_SYNC_ENABLED:'false',PAYPAL_ENABLED:'false'});
const sha=value=>require('node:crypto').createHash('sha256').update(value).digest('hex');
env.NEXT_PUBLIC_SUPABASE_KEY_BINDING='local:'+sha(env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
env.SUPABASE_SERVICE_KEY_BINDING='local:'+sha(env.SUPABASE_SERVICE_ROLE_KEY);
const stamp=Date.now(),startedAt=new Date().toISOString(),logPath=path.join(root,`artifacts/seo-resume-20261019/build-${stamp}.log`),fd=fs.openSync(logPath,'wx');
const result=cp.spawnSync(process.execPath,[path.join(root,'node_modules/next/dist/bin/next'),'build'],{cwd:directory,env,windowsHide:true,stdio:['ignore',fd,fd]});fs.closeSync(fd);
const report={startedAt,finishedAt:new Date().toISOString(),directory,logPath,exitCode:result.status,error:result.error?.message,syntheticCredentials:true,runtimeFetchBlocked:true,deployed:false};
fs.writeFileSync(path.join(root,`artifacts/seo-resume-20261019/build-result-${stamp}.json`),JSON.stringify(report,null,2),{flag:'wx'});console.log(JSON.stringify(report));process.exitCode=result.status??1;
