const fs=require('node:fs'),cp=require('node:child_process'),path=require('node:path');
const env={...process.env,NEXT_PUBLIC_SUPABASE_URL:'https://preview-build-placeholder.supabase.co',NEXT_PUBLIC_SUPABASE_ANON_KEY:'preview-build-placeholder-anon-key',SUPABASE_SERVICE_ROLE_KEY:'preview-build-placeholder-service-key',RESEND_API_KEY:'re_preview_build_placeholder',NEXT_TELEMETRY_DISABLED:'1'};
for(const key of ['OWNER_DATABASE_URL','SEO_WORKER_URL','SEO_WORKER_CRON_SECRET','SEO_SYNC_SERVICE_ROLE_KEY','SEO_MANUAL_SYNC_ENABLED','SEO_SYNC_ENABLED'])delete env[key];
const log=fs.openSync('artifacts/seo-manual-build.log','w');
const result=cp.spawnSync(process.execPath,[path.resolve('node_modules/next/dist/bin/next'),'build'],{cwd:'release/seo-manual-20261018',env,windowsHide:true,stdio:['ignore',log,log]});
fs.closeSync(log);fs.writeFileSync('artifacts/seo-manual-build-result.json',JSON.stringify({at:new Date().toISOString(),exitCode:result.status,node:process.version,placeholderBuild:true,deployed:false},null,2));
console.log(JSON.stringify({exitCode:result.status,node:process.version}));process.exitCode=result.status??1;
