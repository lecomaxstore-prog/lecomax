const { vercelApiFetch } = require('./vercel-cli-api.cjs');
// Read-only production preparation. GET-only HTTP; read-only SQL; no RPC invocation.
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const { Client } = require('pg');
const ref = 'yddqwgdgeljkzfsmtein';
const baseline = 'dpl_HkgcNHTedgha5XhnjjX1RED3ZwGx';
const output = path.resolve('artifacts/seo-final-preparation', `readonly-${Date.now()}.json`);
const report = { at: new Date().toISOString(), node: process.version, productionWrites: false, rpcInvocations: 0, issues: [] };
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const save = () => { fs.mkdirSync(path.dirname(output), { recursive: true }); fs.writeFileSync(output, JSON.stringify(report, null, 2)); };
const get = async (url, headers = {}) => {
  const r = await fetch(url, { method: 'GET', headers, redirect: 'manual', signal: AbortSignal.timeout(20000) });
  return { response: r, body: await r.text() };
};
async function hosting() {
  const project = JSON.parse(fs.readFileSync('.vercel/project.json', 'utf8'));
  if (project.projectId !== 'prj_g5xbDC0WX1RSXf6znHsAS7XvhLBb') throw Error('PROJECT_MISMATCH');
  const api = async route => {
    const u = new URL(route, 'https://api.vercel.com'); u.searchParams.set('teamId', project.orgId);
    const response = await vercelApiFetch(u);
    const body = await response.text();
    if (!response.ok) throw Error('VERCEL_HTTP_' + response.status);
    return JSON.parse(body);
  };
  const alias = await api('/v4/aliases/lecomax.com');
  const currentId = alias.deploymentId || alias.deployment?.id;
  const [settings, current, rollback, environment, team] = await Promise.all([
    api('/v9/projects/' + project.projectId), api('/v13/deployments/' + currentId),
    api('/v13/deployments/' + baseline), api('/v10/projects/' + project.projectId + '/env?decrypt=false'),
    api('/v2/teams/' + project.orgId),
  ]);
  const deployment = d => ({ id: d.id, projectId: d.projectId, state: d.readyState, url: d.url,
    target: d.target, gitSha: d.gitSource?.sha || d.meta?.githubCommitSha, createdAt: d.createdAt });
  if (current.projectId !== project.projectId || rollback.projectId !== project.projectId) throw Error('DEPLOYMENT_PROJECT_MISMATCH');
  const required = ['NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_ANON_KEY','SUPABASE_SERVICE_ROLE_KEY','ADMIN_EMAIL','ADMIN_SESSION_SECRET','SEO_WORKER_URL','SEO_WORKER_CRON_SECRET','SEO_MANUAL_SYNC_ENABLED'];
  const names = new Set((environment.envs || []).filter(e => e.target?.includes('production')).map(e => e.key));
  const matches = []; let cursor; let pages = 0;
  do {
    const page = await api('/v9/projects?limit=100' + (cursor ? '&until=' + encodeURIComponent(cursor) : ''));
    for (const p of page.projects || []) if (/seo/i.test(p.name || '') || /seo-vercel/.test(p.rootDirectory || '')) {
      matches.push({ id: p.id, name: p.name, rootDirectory: p.rootDirectory, nodeVersion: p.nodeVersion, framework: p.framework });
    }
    cursor = page.pagination?.next; pages++;
  } while (cursor && pages < 10);
  report.hosting = { projectId: project.projectId, name: settings.name, nodeVersion: settings.nodeVersion,
    framework: settings.framework, rootDirectory: settings.rootDirectory,
    fluid: settings.resourceConfig?.fluid ?? settings.fluid ?? null,
    deploymentProtectionConfigured: Boolean(settings.ssoProtection || settings.passwordProtection || settings.trustedIps),
    current: deployment(current), rollback: deployment(rollback), unchangedBaseline: currentId === baseline,
    plan: team.billing?.plan, environmentPresence: Object.fromEntries(required.map(k => [k, names.has(k)])),
    workerProjectCandidates: matches, projectInventoryComplete: !cursor,
    actualWorkerRuntimeVerified: false, environmentValuesOutput: false };
  if (currentId !== baseline || rollback.readyState !== 'READY') report.issues.push('Deployment baseline drift or rollback unavailable');
}
async function database() {
  require('@next/env').loadEnvConfig(process.cwd(), false, { info() {}, error() {} });
  const u = new URL(process.env.OWNER_DATABASE_URL);
  if (process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '') !== `https://${ref}.supabase.co` ||
      !(u.hostname === `db.${ref}.supabase.co` || u.hostname.endsWith('.pooler.supabase.com') && decodeURIComponent(u.username).endsWith('.' + ref)) || u.port === '6543') throw Error('DB_TARGET_MISMATCH');
  const c = new Client({ host: u.hostname, port: Number(u.port || 5432), user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password), database: decodeURIComponent(u.pathname.slice(1)),
    ssl: { rejectUnauthorized: true, ca: fs.readFileSync('supabase/prod-ca-2021.crt', 'utf8') },
    options: '-c default_transaction_read_only=on', connectionTimeoutMillis: 15000 });
  try {
    await c.connect(); await c.query('begin isolation level repeatable read read only');
    await c.query("set local statement_timeout='15s'");
    const rows = async sql => (await c.query(sql)).rows;
    const identity = (await rows("select current_database() database,current_user role,current_setting('transaction_read_only') read_only,current_setting('server_version') version,pg_is_in_recovery() replica"))[0];
    if (c.connection.stream.authorized !== true || identity.read_only !== 'on' || identity.database !== 'postgres' || identity.replica) throw Error('DB_IDENTITY_FAILED');
    const relations = await rows("select relname from pg_class where relnamespace='public'::regnamespace and relname like 'seo_%' order by 1");
    const functions = await rows("select oid::regprocedure::text signature from pg_proc where pronamespace='public'::regnamespace and (proname like '%seo%' or proname in ('begin_seo_run','finish_seo_run')) order by 1");
    const ledger = await rows("select version from supabase_migrations.schema_migrations where version in ('202610180001','202610180002','20261018193508')");
    const catalogue = await rows("select 'products' kind,count(*)::int total,count(*) filter(where active)::int active,count(*) filter(where id is null or name is null or slug is null or trim(name)='' or trim(slug)='')::int invalid from products union all select 'categories',count(*)::int,count(*) filter(where active)::int,count(*) filter(where id is null or name is null or slug is null or trim(name)='' or trim(slug)='')::int from categories");
    const timeouts = (await rows("select r.rolname,unnest(s.setconfig) setting from pg_db_role_setting s join pg_roles r on r.oid=s.setrole where r.rolname in ('authenticator','service_role','postgres')")).filter(r => /^(statement_timeout|lock_timeout|transaction_timeout|idle_in_transaction_session_timeout)=/.test(r.setting));
    const triggers = await rows("select c.relname,t.tgname,p.proname,pg_get_functiondef(p.oid) ~* '(seo_sync|seo_document|seo_queue|claim_seo|reconcile_seo)' references_seo from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_proc p on p.oid=t.tgfoid where c.relnamespace='public'::regnamespace and c.relname in ('products','categories','orders') and not t.tgisinternal");
    const activity = (await rows("select count(*) filter(where xact_start<now()-interval '60 seconds' and pid<>pg_backend_pid())::int long_transactions,count(*) filter(where wait_event_type='Lock')::int lock_waiters from pg_stat_activity where datname=current_database()"))[0];
    await c.query('rollback');
    report.database = { projectRef: ref, tlsVerified: true, identity, relations, functions, ledger, catalogue, timeouts, triggers, activity, measuredRpcTimeout: false };
    if (relations.length || functions.length || ledger.length || catalogue.some(r => r.invalid) || triggers.some(r => r.references_seo)) report.issues.push('Database preflight drift requires review');
  } finally { await c.end(); }
  const api = `https://${ref}.supabase.co`, service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const { supabaseHeaders } = await import('../operations/seo-vercel/lib/supabase-headers.mjs');
  const headers = supabaseHeaders(service);
  const probes = [];
  for (const [name, url, h] of [
    ['PostgREST service catalogue', api + '/rest/v1/products?select=id&limit=0', headers],
    ['Anonymous Admin sync', 'https://lecomax.com/api/admin/seo/sync', {}],
    ['Invalid Admin session', 'https://lecomax.com/api/admin/seo/sync', { Cookie: 'admin_session=invalid-readonly-probe' }],
  ]) { const { response } = await get(url, h); probes.push({ name, status: response.status }); }
  const discovery = await get(api + '/rest/v1/', { ...headers, Accept: 'application/openapi+json' });
  const paths = discovery.response.ok ? JSON.parse(discovery.body).paths || {} : {};
  report.http = { probes, discoveryStatus: discovery.response.status,
    rpcDiscovery: Object.fromEntries(['begin_seo_run','seo_run_step','finish_seo_run','seo_run_status'].map(n => [n, Boolean(paths['/rpc/' + n])])),
    note: 'Absent SEO routes/RPCs before deployment/migration are expected; not hosted acceptance of the candidate.' };
}
function integrity() {
  const candidate = JSON.parse(fs.readFileSync(process.argv[2] || 'artifacts/seo-final-preparation/candidate.json'));
  const worker = JSON.parse(fs.readFileSync('artifacts/seo-account6/worker-manifest.json'));
  const candidateMismatches = candidate.files.filter(e => hash(path.join(candidate.directory, e.file)) !== e.sha256).map(e => e.file);
  const workerMismatches = worker.files.filter(e => hash(e.file) !== e.sha256).map(e => e.file);
  const migration = 'supabase/alternatives/202610180002_seo_decoupled.sql';
  const control = 'operations/seo-vercel/supabase/migrations/20261018193508_seo_worker_run_control.sql';
  report.integrity = { candidateDirectory: candidate.directory, candidateFiles: candidate.files.length, candidateMismatches,
    workerFiles: worker.files.length, workerMismatches, standaloneSha256: hash(migration), runControlSha256: hash(control),
    unsafeMigrationInCandidate: fs.existsSync(path.join(candidate.directory,'supabase/migrations/202610180001_seo_engine.sql')),
    workerCron: JSON.parse(fs.readFileSync('operations/seo-vercel/vercel.json')).crons };
  if (candidateMismatches.length || workerMismatches.length || report.integrity.unsafeMigrationInCandidate || report.integrity.workerCron.length ||
      hash(migration) !== '1f084348a0702a9ae6f5a2a52a59537c544d8b8aa2dc7e86e6fe38c33a725445' || hash(control) !== '39b1ad24d16124cddbb2d49052fd0d185b67681418e4a6dc0a3dd4ea1f2cf079') throw Error('INTEGRITY_DRIFT');
}
(async () => { integrity(); await hosting(); save(); await database(); save(); console.log(JSON.stringify({ file: output, issues: report.issues, productionWrites: false })); if (report.issues.length) process.exitCode = 1; })()
  .catch(e => { report.error = e.cause?.code || e.code || (/^[A-Z_0-9]+$/.test(e.message) ? e.message : 'READONLY_CHECK_FAILED'); save(); console.error(JSON.stringify({ file: output, error: report.error })); process.exitCode = 1; });
