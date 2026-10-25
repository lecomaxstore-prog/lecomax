// Local synthetic fixtures and real session/permission modules; NOT a hosted HTTP test.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),ts=require('typescript');
const {Client}=require('pg');
const root='C:\\Users\\Ziko\\Backups\\LECOMAX\\restore-test-20261018',db='lecomax_synthetic_stage_'+Date.now();
const config={host:'localhost',port:55439,user:'postgres',password:fs.readFileSync(path.join(root,'password.txt'),'utf8').trim(),ssl:{rejectUnauthorized:true,ca:fs.readFileSync(path.join(root,'localhost.crt'),'utf8')}};
async function connect(database){const c=new Client({...config,database});await c.connect();const r=(await c.query("select current_database() db,host(inet_server_addr()) host,current_setting('data_directory') dir")).rows[0];assert.equal(r.db,database);assert.equal(r.host,'127.0.0.1');assert.equal(path.resolve(r.dir).toLowerCase(),path.resolve(root,'data').toLowerCase());return c;}
const testEnv={ADMIN_EMAIL:'owner@staging.invalid',ADMIN_SESSION_SECRET:crypto.randomBytes(48).toString('hex'),NEXT_PUBLIC_SUPABASE_URL:'https://staging.invalid',SUPABASE_SERVICE_ROLE_KEY:'synthetic-key-never-sent'};
const modules={};let databaseClient;
function load(file){if(modules[file])return modules[file];const exports={};modules[file]=exports;const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
 new Function('exports','require','process','fetch',code)(exports,name=>{if(name==='server-only')return {};if(name.endsWith('/supabase-headers.mjs'))return require('../operations/seo-vercel/lib/supabase-headers.mjs');if(name.startsWith('./'))return load(path.posix.join(path.posix.dirname(file),name+'.ts'));throw Error('Unexpected import');},{env:testEnv},async url=>{
  // Deliberately substitutes only the transport, using the real synthetic staff tables.
  const u=new URL(url);assert.equal(u.origin,'https://staging.invalid');let rows;
  if(u.pathname==='/rest/v1/admin_staff')rows=(await databaseClient.query('select role_id from public.admin_staff where email=$1 and status=$2 limit 1',[u.searchParams.get('email').slice(3),u.searchParams.get('status').slice(3)])).rows;
  else if(u.pathname==='/rest/v1/admin_role_permissions')rows=(await databaseClient.query('select permission_slug from public.admin_role_permissions where role_id=$1',[u.searchParams.get('role_id').slice(3)])).rows;
  else throw Error('Unapproved transport target');return Response.json(rows);
 });return exports;
}
(async()=>{
 const admin=await connect('postgres');try{await admin.query(`CREATE DATABASE "${db}" TEMPLATE template0`);}finally{await admin.end();}
 const c=databaseClient=await connect(db);try{
  await c.query('CREATE SCHEMA extensions; CREATE EXTENSION pgcrypto WITH SCHEMA extensions');
  const authRole=fs.readFileSync(path.join(root,'archive-schema.sql'),'utf8').split(/\n--\n-- Name: /).find(b=>b.startsWith('role(); Type: FUNCTION; Schema: auth;'));assert(authRole);await c.query('CREATE SCHEMA auth');await c.query('-- Name: '+authRole);
  await c.query("SET lecomax.staging_only='synthetic-seo-test'");
  await c.query(fs.readFileSync('artifacts/seo-staging/synthetic-baseline.sql','utf8'));
  await c.query(fs.readFileSync('supabase/migrations/202610180001_seo_engine.sql','utf8'));
  assert.equal((await c.query('select count(*)::int n from public.seo_documents')).rows[0].n,2);
  const session=load('lib/admin-session.ts'),access=load('lib/admin-access.ts'),policy=load('lib/admin-policy.ts');
  const req=token=>({cookies:{get:()=>token?{value:token}:undefined}});
  const as=async email=>access.getAdminAccess(req(await session.createSessionToken(email)));
  const checks=[];function check(name,value){assert(value,name);checks.push(name);}
  check('anonymous denied',(await access.getAdminAccess(req()))===null);
  check('owner authorized',policy.hasAdminPermission(await as(testEnv.ADMIN_EMAIL),'categories.edit'));
  const viewer=await as('viewer@staging.invalid');check('viewer can read',policy.hasAdminPermission(viewer,'products.view'));check('viewer cannot edit',!policy.hasAdminPermission(viewer,'products.edit'));
  const editor=await as('editor@staging.invalid');check('editor can create',policy.hasAdminPermission(editor,'products.create'));check('editor can edit',policy.hasAdminPermission(editor,'products.edit'));check('product editor cannot edit categories',!policy.hasAdminPermission(editor,'categories.edit'));
  check('unknown staff denied',(await as('unknown@staging.invalid'))===null);
  const token=await session.createSessionToken('editor@staging.invalid');check('tampered token denied',(await access.getAdminAccess(req(token.slice(0,-4)+'AAAA')))===null);
  await c.query("update public.admin_staff set status='suspended' where email='editor@staging.invalid'");check('suspended staff denied',(await as('editor@staging.invalid'))===null);
  const report={at:new Date().toISOString(),database:db,syntheticBaselineExecuted:true,baselineSeoDocuments:2,realSessionAndPermissionModules:true,authorizationChecksPassed:checks,transport:'SQL adapter replacing REST transport; no network requests',hostedSupabaseTested:false,httpMiddlewareAndLoginTested:false};
  fs.writeFileSync('artifacts/seo-staging/local-validation.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
 }finally{await c.end();}
})().catch(e=>{console.error('Synthetic staging test failed: '+(e.code||'ERROR')+' '+e.message);process.exitCode=1;});
