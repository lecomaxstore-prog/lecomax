// Production is read-only. Plaintext archive stays in memory; encrypted output is outside the repo.
const fs = require('node:fs'), path = require('node:path'), cp = require('node:child_process');
const crypto = require('node:crypto'), assert = require('node:assert/strict');
const { Client } = require('pg');
const mode = process.argv[2], stamp = Date.now();
const report = { at: new Date().toISOString(), mode, productionWrites: false, migrationsExecuted: false, stage: 'input' };
const ref = 'yddqwgdgeljkzfsmtein', bin = 'C:/Program Files/PostgreSQL/18/bin';
const base = 'C:/Users/Ziko/Backups/LECOMAX';
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const cleanEnv = () => Object.fromEntries(Object.entries(process.env).filter(([k]) => /^(PATH|SystemRoot|windir|ComSpec|TEMP|TMP|USERPROFILE|APPDATA|LOCALAPPDATA)$/i.test(k)));
let client, archive, key;
async function main() {
  assert(['check', 'backup'].includes(mode));
  const uri = new URL(process.env.LECOMAX_BACKUP_DATABASE_URI);
  delete process.env.LECOMAX_BACKUP_DATABASE_URI;
  assert(['postgres:', 'postgresql:'].includes(uri.protocol));
  assert(uri.hostname === `db.${ref}.supabase.co` && decodeURIComponent(uri.username) === 'postgres' || uri.hostname.endsWith('.pooler.supabase.com') && decodeURIComponent(uri.username) === `postgres.${ref}`);
  assert(!uri.port || uri.port === '5432'); assert.equal(uri.pathname, '/postgres');
  assert(!uri.hash && (!uri.search || uri.search === '?sslmode=verify-full'));
  const env = { ...cleanEnv(), PGHOST: uri.hostname, PGPORT: '5432', PGUSER: decodeURIComponent(uri.username), PGPASSWORD: decodeURIComponent(uri.password), PGDATABASE: 'postgres', PGSSLMODE: 'verify-full', PGSSLROOTCERT: path.resolve('supabase/prod-ca-2021.crt'), PGCONNECT_TIMEOUT: '15', PGOPTIONS: '-c default_transaction_read_only=on -c statement_timeout=120000 -c timezone=UTC' };
  report.stage = 'tls-database-connection';
  client = new Client({ host: env.PGHOST, port: 5432, user: env.PGUSER, password: env.PGPASSWORD, database: 'postgres', ssl: { rejectUnauthorized: true, ca: fs.readFileSync(env.PGSSLROOTCERT, 'utf8') }, options: env.PGOPTIONS, connectionTimeoutMillis: 15000, query_timeout: 120000 });
  await client.connect();
  await client.query('begin isolation level repeatable read read only');
  const identity = (await client.query("select current_database() db,current_user role,current_setting('server_version') version,current_setting('transaction_read_only') read_only,pg_is_in_recovery() replica,pg_database_size(current_database())::text bytes")).rows[0];
  assert(identity.db === 'postgres' && identity.read_only === 'on' && !identity.replica && client.connection.stream.authorized === true);
  report.identity = { projectRef: ref, version: identity.version, readOnly: true, tlsVerified: true, databaseBytes: Number(identity.bytes) };
  report.stage = 'read-only-inventory';
  report.externalFeatures = (await client.query("select (select count(*)::int from pg_foreign_server) foreign_servers,(select count(*)::int from pg_subscription) subscriptions,(select count(*)::int from storage.objects) storage_objects")).rows[0];
  const disk = fs.statfsSync(base); report.freeBytes = disk.bavail * disk.bsize;
  if (mode === 'check') { report.passed = true; return; }
  assert(report.freeBytes > Math.max(256 * 1024 * 1024, Number(identity.bytes) * 2), 'DISK_HEADROOM_REQUIRED');
  report.stage = 'consistent-snapshot-dump';
  const snapshot = (await client.query('select pg_export_snapshot() snapshot')).rows[0].snapshot;
  report.snapshotAt = new Date().toISOString();
  const dump = cp.spawnSync(path.join(bin, 'pg_dump.exe'), ['--format=custom', '--snapshot', snapshot, '--lock-wait-timeout=5000', '--no-password'], { env, windowsHide: true, timeout: 180000, maxBuffer: 128 * 1024 * 1024 });
  // Never emit PostgreSQL stderr, which can include data or connection details.
  assert.equal(dump.status, 0, 'DUMP_FAILED'); archive = dump.stdout;
  assert(archive.subarray(0, 5).toString() === 'PGDMP');
  await client.query('rollback'); await client.end(); client = null;
  report.stage = 'encrypt';
  const out = path.join(base, `encrypted-production-${stamp}`);
  // Create a private directory and DPAPI-wrap the encryption key via stdin.
  key = crypto.randomBytes(32);
  const ps = path.join(process.env.SystemRoot, 'System32/WindowsPowerShell/v1.0/powershell.exe');
  const provision = "$ErrorActionPreference='Stop'; try { $d=$env:LECOMAX_BACKUP_OUTPUT; New-Item -ItemType Directory -Path $d | Out-Null; $sid=[Security.Principal.WindowsIdentity]::GetCurrent().User; $a=New-Object Security.AccessControl.DirectorySecurity; $a.SetOwner($sid); $a.SetAccessRuleProtection($true,$false); $a.AddAccessRule((New-Object Security.AccessControl.FileSystemAccessRule($sid,'FullControl','ContainerInherit,ObjectInherit','None','Allow'))); Set-Acl -LiteralPath $d -AclObject $a; if(-not (Get-Acl -LiteralPath $d).AreAccessRulesProtected){throw 'ACL'}; $s=ConvertTo-SecureString ([Console]::In.ReadToEnd()) -AsPlainText -Force; [IO.File]::WriteAllText((Join-Path $d 'archive-key.dpapi'),(ConvertFrom-SecureString $s)); $s.Dispose() } catch { exit 1 }";
  const protectedKey = cp.spawnSync(ps, ['-NoProfile', '-NonInteractive', '-Command', provision], { env: { ...cleanEnv(), LECOMAX_BACKUP_OUTPUT: out }, input: key.toString('hex'), windowsHide: true, timeout: 15000 });
  assert.equal(protectedKey.status, 0, 'KEY_PROTECTION_FAILED');
  const iv = crypto.randomBytes(12), cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(archive), cipher.final()]);
  const tag = cipher.getAuthTag();
  const filename = path.join(out, 'production.dump.aes256gcm');
  fs.writeFileSync(filename, ciphertext, { flag: 'wx' });
  const metadata = { format: 'LECOMAX-AES-256-GCM-v1', createdAt: report.snapshotAt, projectRef: ref, iv: iv.toString('hex'), tag: tag.toString('hex'), ciphertextSha256: sha(ciphertext), plaintextSha256: sha(archive), bytes: ciphertext.length, sourceVersion: identity.version, keyFile: 'archive-key.dpapi' };
  fs.writeFileSync(path.join(out, 'archive.json'), JSON.stringify(metadata, null, 2), { flag: 'wx' });
  report.archive = { directory: out, ...metadata };
  report.stage = 'integrity';
  const saved = fs.readFileSync(filename); assert.equal(sha(saved), metadata.ciphertextSha256);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv); decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(saved), decipher.final()]);
  assert.equal(sha(decrypted), metadata.plaintextSha256);
  const inspect = args => { const r = cp.spawnSync(path.join(bin, 'pg_restore.exe'), args, { env: cleanEnv(), input: decrypted, windowsHide: true, timeout: 120000, maxBuffer: 16 * 1024 * 1024 }); assert.equal(r.status, 0, 'ARCHIVE_READ_FAILED'); return r.stdout.toString(); };
  const listing = inspect(['--list']); inspect(['--file=NUL']);
  decrypted.fill(0);
  report.integrity = { authenticatedDecryption: true, ciphertextChecksum: true, plaintextChecksum: true, fullArchiveRead: true, tocEntries: listing.split(/\r?\n/).filter(l => /^\d+;/.test(l)).length };
  report.passed = true;
}
main().catch(e => { report.passed = false; report.failure = /^[A-Z0-9_]{2,60}$/.test(e.code || '') ? e.code : 'BACKUP_CHECK_FAILED'; if (['DISK_HEADROOM_REQUIRED','DUMP_FAILED','KEY_PROTECTION_FAILED','ARCHIVE_READ_FAILED'].includes(e.message)) report.reason = e.message; process.exitCode = 1; })
.finally(async () => { if (client) { await client.query('rollback').catch(() => {}); await client.end().catch(() => {}); } archive?.fill(0); key?.fill(0); report.finishedAt = new Date().toISOString(); report.limitations = ['No Storage object binaries or platform configuration export.', 'DPAPI key requires the same Windows user profile; independent offsite key recovery is not established.', 'No isolated restore is claimed by this backup script.']; const file = `artifacts/seo-encrypted-backup-${stamp}.json`; fs.writeFileSync(file, JSON.stringify(report, null, 2), { flag: 'wx' }); console.log(JSON.stringify({ file, ...report })); });
