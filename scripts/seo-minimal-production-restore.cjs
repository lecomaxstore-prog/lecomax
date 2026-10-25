// Fixed local-only recovery. No production credentials, remote connections or migrations.
const fs = require('node:fs'), path = require('node:path'), cp = require('node:child_process');
const crypto = require('node:crypto'), assert = require('node:assert/strict');
const { Client } = require('pg');
const base = 'C:/Users/Ziko/Backups/LECOMAX', cluster = path.join(base, 'restore-test-20261018');
const backup = path.join(base, 'encrypted-production-1792662461177');
const bin = 'C:/Program Files/PostgreSQL/18/bin', stamp = Date.now(), database = `encrypted_recovery_${stamp}`;
const output = path.join(backup, `restore-${stamp}`);
const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => /^(PATH|SystemRoot|windir|ComSpec|TEMP|TMP|USERPROFILE|APPDATA|LOCALAPPDATA)$/i.test(k)));
const report = { at: new Date().toISOString(), productionConnected: false, migrationsExecuted: false, database, output, stage: 'decrypt', startedCluster: false };
const hash = x => crypto.createHash('sha256').update(x).digest('hex');
let archive, key, password;
function run(tool, args, input) {
  // pg_ctl starts a long-lived child: inherited pipes can keep spawnSync waiting on Windows.
  const controlLog = tool === 'pg_ctl' ? fs.openSync(path.join(output, 'cluster-control.log'), 'a') : null;
  let r;
  try { r = cp.spawnSync(path.join(bin, tool + '.exe'), args, { env, input, windowsHide: true, timeout: 120000, maxBuffer: 64 * 1024 * 1024, ...(controlLog !== null ? { stdio: ['ignore', controlLog, controlLog] } : {}) }); }
  finally { if (controlLog !== null) fs.closeSync(controlLog); }
  if (r.status !== 0) {
    // Store no raw stderr or SQL. Fixed categories suffice to diagnose failures safely.
    const err = r.stderr?.toString() || '';
    report.toolFailure = { tool, status: r.status, missingRole: /role .* does not exist/i.test(err), missingExtension: /extension .* not available|could not open extension/i.test(err), permissionDenied: /permission denied/i.test(err), diskFull: /No space left/i.test(err), requiresSeek: /seek|could not read/i.test(err) };
    throw Error('TOOL_FAILED');
  }
  return r.stdout?.toString() || '';
}
async function connect(db) {
  const c = new Client({ host: 'localhost', port: 55439, database: db, user: 'postgres', password, ssl: { rejectUnauthorized: true, ca: fs.readFileSync(path.join(cluster, 'localhost.crt'), 'utf8') }, connectionTimeoutMillis: 10000, query_timeout: 30000 });
  try {
    await c.connect();
    const i = (await c.query("select current_database() db,host(inet_server_addr()) host,current_setting('data_directory') dir,current_setting('listen_addresses') listen,current_setting('server_version') version")).rows[0];
    assert(i.db === db && i.host === '127.0.0.1' && i.listen === '127.0.0.1' && c.connection.stream.authorized);
    assert.equal(path.resolve(i.dir).toLowerCase(), path.resolve(cluster, 'data').toLowerCase());
    report.localVersion = i.version;
    return c;
  } catch (e) { await c.end().catch(() => {}); throw e; }
}
function copies(sql) {
  const tables = {}; let current;
  for (const line of sql.split(/\r?\n/)) {
    if (current) { if (line === '\\.') current = null; else tables[current].rows.push(line); }
    else { const m = line.match(/^COPY (\S+) (\(.*\)) FROM stdin;$/); if (m) { current = m[1].replaceAll('"', ''); tables[current] = { columns: m[2], rows: [] }; } }
  }
  return Object.fromEntries(Object.entries(tables).map(([n,t]) => [n,{ columns:t.columns,count:t.rows.length,hash:hash(t.rows.sort().join('\n')) }]));
}
function sequences(sql) { return sql.split(/\r?\n/).filter(l => /^SELECT pg_catalog\.setval\(/.test(l)).sort(); }
async function main() {
  assert.equal(process.argv.length, 2);
  const disk = fs.statfsSync(base); report.freeBytes = disk.bavail * disk.bsize;
  assert(report.freeBytes > 256 * 1024 * 1024, 'DISK_HEADROOM');
  const meta = JSON.parse(fs.readFileSync(path.join(backup, 'archive.json')));
  const ciphertext = fs.readFileSync(path.join(backup, 'production.dump.aes256gcm'));
  assert.equal(hash(ciphertext), meta.ciphertextSha256);
  const ps = path.join(process.env.SystemRoot, 'System32/WindowsPowerShell/v1.0/powershell.exe');
  const unwrap = "$ErrorActionPreference='Stop';$p=[IntPtr]::Zero;try{$s=ConvertTo-SecureString ([IO.File]::ReadAllText($env:LECOMAX_KEY_FILE));$p=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($s);[Console]::Out.Write([Runtime.InteropServices.Marshal]::PtrToStringBSTR($p))}catch{exit 1}finally{if($p -ne [IntPtr]::Zero){[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($p)};if($s){$s.Dispose()}}";
  const unlocked = cp.spawnSync(ps, ['-NoProfile','-NonInteractive','-Command',unwrap], { env: { ...env, LECOMAX_KEY_FILE: path.join(backup, 'archive-key.dpapi') }, windowsHide: true, timeout: 15000 });
  assert.equal(unlocked.status, 0); assert(/^[a-f0-9]{64}$/.test(unlocked.stdout.toString()));
  key = Buffer.from(unlocked.stdout.toString(), 'hex'); unlocked.stdout.fill(0);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(meta.iv, 'hex')); decipher.setAuthTag(Buffer.from(meta.tag,'hex'));
  archive = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  assert.equal(hash(archive), meta.plaintextSha256);
  report.archive = { directory: backup, snapshotAt: meta.createdAt, ciphertextSha256: meta.ciphertextSha256, authenticatedDecryption: true, dpapiKeyRecovery: true };
  fs.mkdirSync(output);
  report.stage = 'archive-profile';
  const toc = run('pg_restore',['--list'],archive), omitted = [];
  assert(!/ FOREIGN SERVER | SUBSCRIPTION /.test(toc), 'REMOTE_CONNECTION_OBJECTS');
  const selected = toc.split(/\r?\n/).filter(line => {
    if (!/^\d+;/.test(line)) return true;
    const excluded = /(?:EXTENSION -|COMMENT - EXTENSION) (pg_cron|pg_net|supabase_vault)(?: |$)/.test(line) || / (cron|net|vault) /.test(line) || /(?:SCHEMA -|ACL - SCHEMA) (cron|net|vault)(?: |$)/.test(line) || / EVENT TRIGGER /.test(line);
    if(excluded) omitted.push(line); return !excluded;
  });
  fs.writeFileSync(path.join(output,'omitted.json'),JSON.stringify(omitted,null,2),{flag:'wx'});
  const list = path.join(output,'application.list');fs.writeFileSync(list,selected.join('\n'),{flag:'wx'});
  report.omittedEntries = omitted.length;
  password = fs.readFileSync(path.join(cluster,'password.txt'),'utf8').trim();
  Object.assign(env,{PGHOST:'localhost',PGPORT:'55439',PGDATABASE:database,PGUSER:'postgres',PGPASSWORD:password,PGSSLMODE:'verify-full',PGSSLROOTCERT:path.join(cluster,'localhost.crt'),PGOPTIONS:'-c timezone=UTC'});
  report.stage = 'local-cluster';
  if (!fs.existsSync(path.join(cluster,'data/postmaster.pid'))) {
    report.startedCluster = true;
    run('pg_ctl',['-D',path.join(cluster,'data'),'-l',path.join(output,'server.log'),'-o','-h 127.0.0.1 -p 55439 -c shared_preload_libraries= -c log_statement=none -c log_min_error_statement=panic','-w','start']);
  } else { throw Error('CLUSTER_ALREADY_RUNNING'); }
  const admin = await connect('postgres');
  try {
    assert.equal((await admin.query('select 1 from pg_database where datname=$1',[database])).rowCount,0);
    await admin.query(`create database "${database}" template template0`);
  } finally { await admin.end(); }
  report.stage = 'restore';
  run('pg_restore',['--exit-on-error','--single-transaction','--use-list',list,'--dbname',database],archive);
  report.stage = 'verify';
  const originalSql = run('pg_restore',['--data-only','--file=-'],archive);
  const restoredSql = run('pg_dump',['--data-only','--file=-']);
  const original = copies(originalSql), restored = copies(restoredSql);
  const included = Object.entries(original).filter(([name]) => !/^(cron|net|vault)\./.test(name));
  assert(included.length > 0);
  for (const [name,content] of included) assert.deepEqual(restored[name],content,'RESTORED_DATA_MISMATCH');
  assert.deepEqual(sequences(restoredSql),sequences(originalSql).filter(l=>!/'(?:cron|net|vault)\./.test(l)),'SEQUENCE_MISMATCH');
  const c = await connect(database);
  try {
    const isolation = (await c.query("select (select count(*)::int from pg_foreign_server) foreign_servers,(select count(*)::int from pg_subscription) subscriptions,(select count(*)::int from pg_extension where extname in ('pg_cron','pg_net','supabase_vault')) outbound_extensions")).rows[0];
    assert(Object.values(isolation).every(n=>n===0)); report.isolation = isolation;
    report.rlsTables = (await c.query("select count(*)::int n from pg_class where relnamespace='public'::regnamespace and relkind='r' and relrowsecurity")).rows[0].n;
  } finally { await c.end(); }
  report.restore = { includedTables: included.length, tableContentHashesMatch: true, sequenceValuesMatch: true, ownerAclRestoreErrors: false, applicationLaunched: false };
  report.passed = true;
}
main().catch(e=>{report.passed=false;report.failure=/^[A-Z0-9_]{2,60}$/.test(e.code||'')?e.code:'LOCAL_RESTORE_FAILED';process.exitCode=1;})
.finally(()=>{if(report.startedCluster){try{run('pg_ctl',['-D',path.join(cluster,'data'),'-m','fast','-w','stop']);report.stopped=true;}catch{report.stopped=false;report.passed=false;process.exitCode=1;}}archive?.fill(0);key?.fill(0);report.finishedAt=new Date().toISOString();report.limitations=['Application-profile recovery excludes managed cron/net/Vault and hosted event triggers.','Local PostgreSQL 18 versus production 17.6; no same-major/full-platform recovery certification.','Storage object binaries and external settings not included.','Restored database contains plaintext data in the existing local cluster; cluster stopped after test. No app was launched.','DPAPI key recovery tested under this Windows user only; offsite/disaster key recovery remains unverified.'];const file=`artifacts/seo-encrypted-local-restore-${stamp}.json`;fs.writeFileSync(file,JSON.stringify(report,null,2),{flag:'wx'});console.log(JSON.stringify({file,...report}));});
