// Catalog metadata only. No provider calls, mutation RPCs, migrations or worker runs.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {Client}=require('pg');
require('@next/env').loadEnvConfig(process.cwd(),false,{info(){},error(){}});
const report={at:new Date().toISOString(),readOnly:true};
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const migrations=['supabase/alternatives/202610180002_seo_decoupled.sql',...['20261018193508_seo_worker_run_control.sql','202610190001_seo_ai_budget.sql','202610190002_seo_editorial.sql','202610190003_seo_editorial_review.sql'].map(f=>'operations/seo-vercel/supabase/migrations/'+f)];
report.migrations=migrations.map(file=>({file,sha256:sha(file)}));
report.localEnvironmentPresence=Object.fromEntries(['NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_ANON_KEY','SUPABASE_SERVICE_ROLE_KEY','ADMIN_EMAIL','ADMIN_SESSION_SECRET','OWNER_DATABASE_URL','CRON_SECRET','SEO_RUNTIME_ENV','SEO_SYNC_ENABLED','SEO_SYNC_SUPABASE_URL','SEO_SYNC_SERVICE_ROLE_KEY','OPENAI_API_KEY','SEO_AI_ENABLED','SEO_EDITORIAL_ENABLED','SEO_MIRAI_FALLBACK_ENABLED'].map(k=>[k,Boolean(process.env[k])]));
report.localActivation=Object.fromEntries(['SEO_SYNC_ENABLED','SEO_AI_ENABLED','SEO_EDITORIAL_ENABLED','SEO_MIRAI_FALLBACK_ENABLED'].map(k=>[k,process.env[k]==='true']));
(async()=>{
  const u=new URL(process.env.OWNER_DATABASE_URL),ref=new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split('.')[0];
  if(!(u.hostname===`db.${ref}.supabase.co`||u.hostname.endsWith('.pooler.supabase.com')&&decodeURIComponent(u.username).endsWith('.'+ref))||u.port==='6543')throw Error('TARGET_GUARD');
  const c=new Client({host:u.hostname,port:Number(u.port||5432),user:decodeURIComponent(u.username),password:decodeURIComponent(u.password),database:u.pathname.slice(1),ssl:{rejectUnauthorized:true,ca:fs.readFileSync('supabase/prod-ca-2021.crt','utf8')},connectionTimeoutMillis:10000,options:'-c default_transaction_read_only=on'});
  try {
    await c.connect();await c.query('begin read only');await c.query("set local statement_timeout='10s'");
    report.identity=(await c.query("select current_setting('transaction_read_only') read_only,current_setting('server_version') server_version")).rows[0];
    report.seoRelations=(await c.query("select c.relname,c.relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname like 'seo_%' order by c.relname")).rows;
    report.seoFunctions=(await c.query("select p.oid::regprocedure::text signature,p.prosecdef,p.proconfig from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and (p.proname like 'seo_%' or p.proname in ('begin_seo_run','finish_seo_run','save_seo_document','sync_seo_document','reconcile_seo_queue')) order by 1")).rows;
    report.seoMigrationLedger=(await c.query("select version from supabase_migrations.schema_migrations where version in ('202610180001','202610180002','20261018193508','202610190001','202610190002','202610190003') order by version")).rows;
    await c.query('rollback');
  } finally {await c.end();}
  const backup='C:/Users/Ziko/Backups/LECOMAX/lecomax-production-2026-10-18T17-42-58-995Z.dump';
  try {report.backup={file:backup,bytes:fs.statSync(backup).size,checksumMatches:sha(backup)==='256adfcfcfa6e63ea46a574c016effbbc2f945b0fbef31cd66f593b692d47c91'};
    const root=path.join(path.dirname(backup),'restore-test-20261018');
    report.restoreEvidence=['restore-status.json','snapshot-count-comparison.json','object-comparison.json','inventory-before-seo.json','inventory-after-seo.json','seo-test-results.json'].map(file=>({file,exists:fs.existsSync(path.join(root,file))}));
  }catch{report.backup={verified:false,reason:'BACKUP_READ_UNAVAILABLE'};}
  report.anonymousProbes=[];
  for(const route of ['/api/admin/seo','/api/admin/seo/ai','/admin/seo','/sitemap.xml','/robots.txt']){
    try{const r=await fetch('https://lecomax.com'+route,{method:'GET',redirect:'manual',signal:AbortSignal.timeout(10000)});report.anonymousProbes.push({route,status:r.status});await r.body?.cancel();}
    catch{report.anonymousProbes.push({route,error:'NETWORK_UNAVAILABLE'});}
  }
})().catch(e=>{report.error= /^[A-Z0-9_]+$/.test(e.code||'')?e.code:'CHECK_FAILED';process.exitCode=1;}).finally(()=>{const file=`artifacts/seo-quality/resume-readonly-${Date.now()}.json`;fs.writeFileSync(file,JSON.stringify(report,null,2),{flag:'wx'});console.log(JSON.stringify({file,...report}));});
