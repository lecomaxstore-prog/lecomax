// Local application recovery of the latest existing backup, then six pinned migrations.
// Fixed loopback TLS cluster only. Never loads dotenv or accepts target overrides.
const fs = require('node:fs'), path = require('node:path'), cp = require('node:child_process');
const crypto = require('node:crypto'), assert = require('node:assert/strict');
const { Client } = require('pg');
const base = 'C:/Users/Ziko/Backups/LECOMAX';
const cluster = path.join(base, 'restore-test-20261018');
const bin = 'C:/Program Files/PostgreSQL/18/bin';
const stamp = Date.now(), database = `seo_final_recovery_${stamp}`;
const output = path.join(base, `final-application-recovery-${stamp}`);
const report = { at: new Date().toISOString(), localOnly: true, productionConnected: false, database, output, startedCluster: false, stopped: false };
const hash = text => crypto.createHash('sha256').update(text).digest('hex');
const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => /^(PATH|SystemRoot|windir|ComSpec|TEMP|TMP|USERPROFILE|APPDATA|LOCALAPPDATA)$/i.test(k)));
let password;
function run(tool, args, capture = false) {
  const log = fs.openSync(path.join(output, `${tool}.log`), 'a');
  try {
    const r = cp.spawnSync(path.join(bin, `${tool}.exe`), args, { env, windowsHide: true, timeout: 120000,
      encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', capture ? 'pipe' : log, log] });
    assert.equal(r.status, 0, `${tool}_FAILED`);
    return r.stdout;
  } finally { fs.closeSync(log); }
}
async function connect(db) {
  const c = new Client({ host: 'localhost', port: 55439, database: db, user: 'postgres', password,
    ssl: { rejectUnauthorized: true, ca: fs.readFileSync(path.join(cluster, 'localhost.crt'), 'utf8') },
    connectionTimeoutMillis: 10000, query_timeout: 30000 });
  try {
    await c.connect();
    const identity = (await c.query("select current_database() db,host(inet_server_addr()) host,current_setting('data_directory') dir,current_setting('listen_addresses') listen,current_setting('server_version') version")).rows[0];
    assert.equal(identity.db, db); assert.equal(identity.host, '127.0.0.1'); assert.equal(identity.listen, '127.0.0.1');
    assert.equal(path.resolve(identity.dir).toLowerCase(), path.resolve(cluster, 'data').toLowerCase());
    assert(c.connection.stream.authorized); report.version = identity.version;
    return c;
  } catch (e) { await c.end().catch(() => {}); throw e; }
}
function copies(sql) {
  const tables = {}; let table;
  for (const line of sql.split(/\r?\n/)) {
    if (table) { if (line === '\\.') table = null; else tables[table].rows.push(line); }
    else { const m = line.match(/^COPY (\S+) (\(.*\)) FROM stdin;$/); if (m) { table = m[1].replaceAll('"', ''); tables[table] = { columns: m[2], rows: [] }; } }
  }
  return Object.fromEntries(Object.entries(tables).map(([name, t]) => [name, { columns: t.columns, count: t.rows.length, hash: hash(t.rows.sort().join('\n')) }]));
}
async function main() {
  assert.equal(process.argv.length, 2, 'NO_TARGET_OVERRIDES');
  const filename = fs.readdirSync(base).filter(f => /^lecomax-production-.*\.dump$/.test(f)).sort().at(-1);
  assert(filename, 'BACKUP_REQUIRED'); const backup = path.join(base, filename);
  const expected = JSON.parse(fs.readFileSync(backup + '.report.json', 'utf8'));
  assert.equal(hash(fs.readFileSync(backup)), expected.sha256, 'BACKUP_CHECKSUM');
  report.backup = { filename, sha256: expected.sha256, createdAt: expected.startedAt };
  const plan = JSON.parse(fs.readFileSync('operations/seo/editorial-six-migration-plan.json', 'utf8'));
  assert.equal(plan.migrations.length, 6);
  for (const m of plan.migrations) assert.equal(hash(fs.readFileSync(m.file)), m.sha256, 'MIGRATION_DRIFT');
  fs.mkdirSync(output);
  password = fs.readFileSync(path.join(cluster, 'password.txt'), 'utf8').trim();
  Object.assign(env, { PGHOST: 'localhost', PGPORT: '55439', PGDATABASE: database, PGUSER: 'postgres', PGPASSWORD: password,
    PGSSLMODE: 'verify-full', PGSSLROOTCERT: path.join(cluster, 'localhost.crt'), PGOPTIONS: '-c timezone=UTC' });
  if (!fs.existsSync(path.join(cluster, 'data/postmaster.pid'))) {
    report.startedCluster = true;
    run('pg_ctl', ['-D', path.join(cluster, 'data'), '-l', path.join(output, 'server.log'), '-o', '-h 127.0.0.1 -p 55439', '-w', 'start']);
  }
  const admin = await connect('postgres');
  try {
    assert.equal((await admin.query('select 1 from pg_database where datname=$1', [database])).rowCount, 0);
    await admin.query(`create database "${database}" template template0`);
  } finally { await admin.end(); }
  const toc = run('pg_restore', ['--list', backup], true), omitted = [];
  const selected = toc.split(/\r?\n/).filter(line => {
    if (!/^\d+;/.test(line)) return true;
    const excluded = /(?:EXTENSION -|COMMENT - EXTENSION) (pg_cron|pg_net|supabase_vault)(?: |$)/.test(line) ||
      / (cron|net|vault) /.test(line) || /(?:SCHEMA -|ACL - SCHEMA) (cron|net|vault)(?: |$)/.test(line) || / EVENT TRIGGER /.test(line);
    if (excluded) omitted.push(line); return !excluded;
  });
  assert.equal(omitted.filter(x => / EVENT TRIGGER /.test(x)).length, 6);
  const list = path.join(output, 'application.list'); fs.writeFileSync(list, selected.join('\n'));
  fs.writeFileSync(path.join(output, 'omitted.json'), JSON.stringify(omitted, null, 2));
  run('pg_restore', ['--exit-on-error', '--single-transaction', '--use-list', list, '--dbname', database, backup]);
  const archive = copies(run('pg_restore', ['--data-only', '--file=-', backup], true));
  const restored = copies(run('pg_dump', ['--data-only', '--file=-'], true));
  const included = Object.entries(archive).filter(([name]) => !/^(cron|net|vault)\./.test(name));
  assert.equal(included.length, 110);
  for (const [name, content] of included) assert.deepEqual(restored[name], content, 'RESTORED_CONTENT_MISMATCH');
  report.restore = { includedTables: included.length, omittedEntries: omitted.length, rowHashesMatch: true, ownerAndAclPreserved: true };
  const c = await connect(database);
  try {
    const sequences = async () => (await c.query("select schemaname,sequencename,last_value from pg_sequences where schemaname not like 'pg_%' order by 1,2")).rows;
    const beforeSequences = await sequences();
    assert.equal((await c.query('select count(*)::int n from pg_foreign_server')).rows[0].n, 0);
    assert.equal((await c.query('select count(*)::int n from pg_subscription')).rows[0].n, 0);
    assert.equal((await c.query("select count(*)::int n from pg_extension where extname in ('pg_cron','pg_net','supabase_vault')")).rows[0].n, 0);
    for (const m of plan.migrations) await c.query(fs.readFileSync(m.file, 'utf8'));
    const after = copies(run('pg_dump', ['--data-only', '--file=-'], true));
    for (const [name, content] of included) assert.deepEqual(after[name], content, 'MIGRATION_CHANGED_EXISTING_DATA');
    assert.deepEqual((await sequences()).filter(s => !s.sequencename.startsWith('seo_')), beforeSequences);
    report.migrations = { count: 6, hashes: plan.migrations, existingTableHashesPreserved: true, existingSequenceValuesPreserved: true,
      newSeoTables: (await c.query("select count(*)::int n from pg_class where relnamespace='public'::regnamespace and relkind='r' and relname like 'seo_%' and relrowsecurity")).rows[0].n };
    assert.equal(report.migrations.newSeoTables, 13);
    report.passed = true;
  } finally { await c.end(); }
}
main().catch(error => { report.passed = false; report.failure = error.code || 'LOCAL_RESTORE_FAILED'; process.exitCode = 1; }).finally(() => {
  if (report.startedCluster) {
    try { run('pg_ctl', ['-D', path.join(cluster, 'data'), '-m', 'fast', '-w', 'stop']); report.stopped = true; }
    catch { report.passed = false; report.shutdownFailed = true; process.exitCode = 1; }
  }
  report.limitations = ['Existing October 18 backup, not a fresh production snapshot.', 'Application profile omits managed cron/net/Vault and hosted event triggers; no full-platform recovery claim.', 'PostgreSQL 18 local; production is PostgreSQL 17.6.', 'No hosted writes, external deliveries, worker activation or restored application execution.'];
  const file = `artifacts/seo-final-local-restore-${stamp}.json`;
  fs.writeFileSync(file, JSON.stringify(report, null, 2), { flag: 'wx' }); console.log(JSON.stringify({ file, ...report }));
});
