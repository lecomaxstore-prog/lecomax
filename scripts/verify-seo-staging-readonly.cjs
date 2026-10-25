// Read only: no dotenv loading from production, no restore/migration/worker calls.
const fs=require('node:fs'),path=require('node:path'),{parseEnv}=require('node:util'),{Client}=require('pg');
const file='C:/Users/Ziko/Backups/LECOMAX/staging-connection-20261019T105639966Z/seo-staging.env';
const staging='tyltharlnbxrxibuxyye',production='yddqwgdgeljkzfsmtein';
const report={at:new Date().toISOString(),staging,production,readOnly:true,productionConnected:false};
(async()=>{
 const env=parseEnv(fs.readFileSync(file,'utf8')),u=new URL(env.STAGING_DATABASE_URL);
 const user=decodeURIComponent(u.username),direct=u.hostname===`db.${staging}.supabase.co`&&user==='postgres';
 const session=/^[a-z0-9.-]+\.pooler\.supabase\.com$/.test(u.hostname)&&user===`postgres.${staging}`;
 if(env.STAGING_PROJECT_REF!==staging||staging===production||!['postgresql:','postgres:'].includes(u.protocol)||!(direct||session)||u.port!=='5432'||u.pathname!=='/postgres'||u.searchParams.get('sslmode')!=='verify-full'||!u.password)throw Error('TARGET_GUARD');
 const caPath=path.resolve(env.STAGING_SSL_ROOT_CERT);
 if(path.dirname(caPath)!==path.dirname(path.resolve(file)))throw Error('CERT_PATH_GUARD');
 report.configuration={expectedTargetMatched:true,distinctFromProduction:true,connectionType:direct?'direct':'session-pooler',credentialValuesPrinted:false};
 const c=new Client({host:u.hostname,port:5432,user,password:decodeURIComponent(u.password),database:'postgres',ssl:{ca:fs.readFileSync(caPath,'utf8'),rejectUnauthorized:true,servername:u.hostname},connectionTimeoutMillis:12000,statement_timeout:10000,options:'-c default_transaction_read_only=on',application_name:'lecomax-staging-readonly-verification'});
 c.on('error',()=>{});
 try{
  await c.connect();report.tls={authorized:c.connection.stream.authorized===true,protocol:c.connection.stream.getProtocol()};
  if(!report.tls.authorized)throw Error('TLS_UNVERIFIED');
  await c.query('begin read only');await c.query("set local statement_timeout='10s'");
  report.identity=(await c.query("select current_database() database,current_user role,current_setting('server_version') version,current_setting('transaction_read_only') read_only")).rows[0];
  if(report.identity.database!=='postgres'||report.identity.read_only!=='on')throw Error('SESSION_GUARD');
  report.extensions=(await c.query('select extname,extversion from pg_extension order by extname')).rows;
  report.schemaInventory=(await c.query("select n.nspname schema,(select count(*)::int from pg_class c where c.relnamespace=n.oid and c.relkind in ('r','p')) tables,(select count(*)::int from pg_proc p where p.pronamespace=n.oid) functions from pg_namespace n where n.nspname not like 'pg_%' and n.nspname<>'information_schema' order by 1")).rows;
  report.functionInventory=(await c.query("select n.nspname schema,p.proname name,p.oid::regprocedure::text signature,p.prosecdef security_definer from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname not like 'pg_%' and n.nspname<>'information_schema' order by 1,2,3")).rows;
  report.requiredAvailability=(await c.query("select name,default_version,installed_version from pg_available_extensions where name in ('pg_cron','pg_net','supabase_vault','pg_graphql','pgcrypto','uuid-ossp') order by name")).rows;
  report.publicTables=(await c.query("select c.relname,c.relrowsecurity,pg_get_userbyid(c.relowner) owner from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind in ('r','p') order by 1")).rows;
  report.rolePrivileges=(await c.query("select rolname,rolsuper,rolbypassrls,rolcreaterole,rolcreatedb,has_schema_privilege(rolname,'public','CREATE') public_create from pg_roles where rolname in (current_user,'anon','authenticated','service_role') order by 1")).rows;
  // Counts only: never return function bodies, connection strings, cron commands or Vault data.
  report.integrationCounts=(await c.query("select (select count(*)::int from pg_subscription) subscriptions,(select count(*)::int from pg_foreign_server) foreign_servers,(select count(*)::int from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and not t.tgisinternal) public_triggers,(select count(*)::int from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public') public_functions")).rows[0];
  report.optionalCounts={};
  for(const [key,table,filter]of [['cronJobs','cron.job',''],['activeCronJobs','cron.job',' where active'],['httpQueue','net.http_request_queue',''],['vaultSecrets','vault.secrets','']]){
   const present=(await c.query('select to_regclass($1) is not null present',[table])).rows[0].present;
   report.optionalCounts[key]=present?(await c.query(`select count(*)::int count from ${table}${filter}`)).rows[0].count:null;
  }
  if(report.publicTables.some(t=>t.relname==='seo_ai_settings')) {
   report.aiSettings=(await c.query('select enabled,mirai_enabled,monthly_limit,lifetime_limit,external_spend from public.seo_ai_settings')).rows;
   report.apiTableGrants=(await c.query("select count(*)::int count from information_schema.role_table_grants where table_schema='public' and grantee in ('anon','authenticated')")).rows[0];
   report.apiFunctionGrants=(await c.query("select count(*)::int count from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and (has_function_privilege('anon',p.oid,'EXECUTE') or has_function_privilege('authenticated',p.oid,'EXECUTE'))")).rows[0];
   if(report.aiSettings.some(s=>s.enabled||s.mirai_enabled||Number(s.monthly_limit)!==0||Number(s.lifetime_limit)!==0||Number(s.external_spend)!==0)||report.apiTableGrants.count||report.apiFunctionGrants.count)throw Error('STAGING_BUDGET_OR_GRANT_GUARD');
  }
  await c.query('rollback');report.databaseChecksCompleted=true;
 }finally{await c.end().catch(()=>{});}
})().catch(e=>{report.failure={code: /^[A-Z0-9_]+$/.test(e.code||'')?e.code: ['TARGET_GUARD','CERT_PATH_GUARD','TLS_UNVERIFIED','SESSION_GUARD'].includes(e.message)?e.message:'CONNECTION_OR_QUERY_FAILED'};process.exitCode=1;}).finally(()=>{
 report.finishedAt=new Date().toISOString();const output=`artifacts/seo-quality/staging-readonly-${Date.now()}.json`;fs.writeFileSync(output,JSON.stringify(report,null,2),{flag:'wx'});console.log(JSON.stringify({output,...report,functionInventory:report.functionInventory?{recorded:report.functionInventory.length}:undefined}));
});
