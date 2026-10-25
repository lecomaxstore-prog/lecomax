// Read-only production schema compatibility; independent of Vercel credentials.
// No data export, mutation RPC, migration execution, dotenv output or remote target override.
const fs = require('node:fs');
const crypto = require('node:crypto');
const path = require('node:path');
const assert = require('node:assert/strict');
const { Client } = require('pg');
const ref = 'yddqwgdgeljkzfsmtein';
const report = { at: new Date().toISOString(), projectRef: ref, readOnly: true, productionWrites: false, issues: [] };
const sha = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
async function main() {
  assert.equal(process.argv.length, 2, 'NO_TARGET_OVERRIDES');
  const plan = JSON.parse(fs.readFileSync('operations/seo/editorial-six-migration-plan.json', 'utf8'));
  assert.equal(plan.migrations.length, 6);
  report.migrations = plan.migrations.map(m => ({ ...m, matches: sha(m.file) === m.sha256 }));
  assert(report.migrations.every(m => m.matches), 'MIGRATION_DRIFT');
  require('@next/env').loadEnvConfig(process.cwd(), false, { info() {}, error() {} });
  const url = new URL(process.env.OWNER_DATABASE_URL);
  assert.equal(process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, ''), `https://${ref}.supabase.co`, 'API_TARGET_MISMATCH');
  const user = decodeURIComponent(url.username);
  assert(['postgres:', 'postgresql:'].includes(url.protocol) && url.pathname === '/postgres' &&
    (!url.port || url.port === '5432') && (url.hostname === `db.${ref}.supabase.co` && user === 'postgres' ||
      /^[a-z0-9.-]+\.pooler\.supabase\.com$/.test(url.hostname) && user === `postgres.${ref}`), 'DATABASE_TARGET_MISMATCH');
  const client = new Client({ host: url.hostname, port: 5432, user, password: decodeURIComponent(url.password),
    database: 'postgres', ssl: { rejectUnauthorized: true, servername: url.hostname, ca: fs.readFileSync('supabase/prod-ca-2021.crt', 'utf8') },
    options: '-c default_transaction_read_only=on', connectionTimeoutMillis: 10000,
    query_timeout: 15000, application_name: 'seo-final-schema-readonly' });
  client.on('error', () => {});
  try {
    await client.connect();
    await client.query('begin isolation level repeatable read read only');
    await client.query("set local statement_timeout='10s'");
    report.identity = (await client.query("select current_database() database,current_setting('transaction_read_only') read_only,current_setting('server_version') version")).rows[0];
    assert(client.connection.stream.authorized && report.identity.read_only === 'on' && report.identity.database === 'postgres', 'READONLY_TLS_REQUIRED');
    report.tlsVerified = true;
    const rows = async sql => (await client.query(sql)).rows;
    report.relations = await rows("select relname from pg_class where relnamespace='public'::regnamespace and relname like 'seo_%' order by 1");
    report.functions = await rows("select oid::regprocedure::text signature from pg_proc where pronamespace='public'::regnamespace and proname ~ '(seo_|_seo)' order by 1");
    report.ledger = (await client.query("select version from supabase_migrations.schema_migrations where version = any($1::text[]) order by version", [plan.migrations.map(m => path.basename(m.file).split('_')[0]).concat('202610180001')])).rows;
    report.catalogueColumns = await rows("select table_name,column_name,udt_name,is_nullable from information_schema.columns where table_schema='public' and table_name in ('products','categories') and column_name in ('id','name','slug','active') order by 1,2");
    report.catalogueIntegrity = await rows("select 'products' kind,count(*)::int total,count(*) filter(where id is null or name is null or slug is null or trim(name)='' or trim(slug)='')::int invalid from products union all select 'categories',count(*)::int,count(*) filter(where id is null or name is null or slug is null or trim(name)='' or trim(slug)='')::int from categories");
    report.duplicateActiveSlugs = await rows("select 'products' kind,count(*)::int duplicates from (select slug from products where active group by slug having count(*)>1) p union all select 'categories',count(*)::int from (select slug from categories where active group by slug having count(*)>1) c");
    report.commerceTriggers = await rows("select c.relname,t.tgname,t.tgenabled,md5(pg_get_triggerdef(t.oid)) definition_hash,pg_get_functiondef(p.oid) ~* '(seo_sync|seo_document|seo_queue|claim_seo|reconcile_seo)' references_seo from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_proc p on p.oid=t.tgfoid where c.relnamespace='public'::regnamespace and c.relname in ('products','categories','orders') and not t.tgisinternal order by 1,2");
    await client.query('rollback');
    if (report.relations.length || report.functions.length || report.ledger.length) report.issues.push('Existing SEO objects or migration ledger entries require reconciliation');
    if (report.catalogueColumns.length !== 8 || report.catalogueColumns.some(c => c.column_name === 'active' && c.udt_name !== 'bool')) report.issues.push('Catalogue schema differs from migration prerequisites');
    if (report.catalogueIntegrity.some(r => r.invalid) || report.duplicateActiveSlugs.some(r => r.duplicates)) report.issues.push('Catalogue integrity failure');
    if (report.commerceTriggers.some(t => t.references_seo)) report.issues.push('Commerce trigger depends on SEO');
    report.completed = true;
    report.compatiblePreflight = report.issues.length === 0;
    report.limitations = ['Schema preflight is not migration execution or a production restore rehearsal.', 'Current deployment revision and hosted environment values are not certified here.', 'Backups, managed services, full commerce acceptance and release approval remain separate gates.'];
  } finally { await client.end().catch(() => {}); }
}
main().catch(error => {
  report.completed = false;
  report.failure = /^[A-Z0-9_]+$/.test(error.code || '') ? error.code : 'READONLY_PREFLIGHT_FAILED';
  process.exitCode = 1;
}).finally(() => {
  const file = `artifacts/seo-final-database-preflight-${Date.now()}.json`;
  fs.writeFileSync(file, JSON.stringify(report, null, 2), { flag: 'wx' });
  console.log(JSON.stringify({ file, ...report }));
  if (report.issues.length) process.exitCode = 1;
});
