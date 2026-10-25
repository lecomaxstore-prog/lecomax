// Read-only catalog inspection. Never loads or runs the migration itself.
import env from '@next/env';
import pg from 'pg';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
env.loadEnvConfig(process.cwd());
const mode = process.argv.includes('--postflight') ? 'postflight' : 'preflight';
const connection = process.env.OWNER_DATABASE_URL;
if (!connection) throw Error('OWNER_DATABASE_URL is required for catalog inspection.');
const url = new URL(connection);
const project = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split('.')[0];
if (!(url.hostname === `db.${project}.supabase.co` ||
    /\.supabase\.(co|com)$/.test(url.hostname) && decodeURIComponent(url.username).endsWith(`.${project}`))) {
  throw Error('SQL connection does not match the configured Supabase project.');
}
url.searchParams.delete('sslmode'); url.searchParams.delete('ssl');
const client = new pg.Client({ connectionString: url.toString(),
  ssl: { rejectUnauthorized: true, ca: await readFile('supabase/prod-ca-2021.crt','utf8') },
  connectionTimeoutMillis: 10000, statement_timeout: 15000,
  options: '-c default_transaction_read_only=on',
});
try {
  await client.connect();
  const result = await client.query(await readFile(`supabase/verification/seo-${mode}.sql`,'utf8'));
  const results = (Array.isArray(result) ? result : [result]).filter(r => r.command === 'SELECT').map(r => r.rows);
  if (mode === 'preflight') {
    // Poolers can ignore startup options: protect this second phase explicitly,
    // just as both verification SQL files protect their own transactions.
    await client.query('begin transaction read only');
    const ledger = await client.query("select to_regclass('supabase_migrations.schema_migrations') is not null as available");
    if (ledger.rows[0].available) {
      results.push((await client.query("select 'migration_ledger' as check_name, version from supabase_migrations.schema_migrations where version=$1",['202610180001'])).rows);
    } else results.push([{check_name:'migration_ledger',available:false}]);
    await client.query('rollback');
  }
  await mkdir('artifacts/seo-migration',{recursive:true});
  const filename = `artifacts/seo-migration/${mode}-${Date.now()}.json`;
  await writeFile(filename,JSON.stringify({at:new Date().toISOString(),mode,readOnly:true,results},null,2));
  console.log(JSON.stringify({filename,results},null,2));
  if (results.flat().some(row => 'passed' in row && row.passed !== true)) process.exitCode=1;
} catch(error) {
  // Do not print connection strings, credentials or arbitrary server error details.
  console.error('Read-only SEO inspection failed.', {code:error.code ?? 'CONNECTION_OR_QUERY_ERROR'});
  process.exitCode=1;
} finally { await client.end(); }
