// Read two immutable local archives. Capture SQL in memory; publish only hashes/counts.
const fs = require('node:fs'), path = require('node:path'), cp = require('node:child_process'), crypto = require('node:crypto');
const base = 'C:/Users/Ziko/Backups/LECOMAX';
const previous = 'lecomax-production-2026-10-18T17-42-58-995Z.dump';
const latest = fs.readdirSync(base).filter(f => /^lecomax-production-.*\.dump$/.test(f)).sort().at(-1);
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
function read(file) {
  const full = path.join(base, file), report = JSON.parse(fs.readFileSync(full + '.report.json'));
  if (sha(fs.readFileSync(full)) !== report.sha256) throw Error('Checksum mismatch');
  const r = cp.spawnSync('C:/Program Files/PostgreSQL/18/bin/pg_restore.exe', ['--data-only', '--file=-', full], { encoding: 'utf8', maxBuffer: 64*1024*1024, timeout: 60000, windowsHide: true });
  if (r.status !== 0) throw Error('Archive read failed');
  const tables = {}; let key = null;
  for (const line of r.stdout.split(/\r?\n/)) {
    if (key) { if (line === '\\.') key = null; else tables[key].rows.push(line); }
    else { const m = line.match(/^COPY (\S+) (\(.*\)) FROM stdin;$/); if (m) { key = m[1]; tables[key] = { columns: m[2], rows: [] }; } }
  }
  for (const t of Object.values(tables)) { t.count = t.rows.length; t.sha256 = sha(t.rows.sort().join('\n')); delete t.rows; }
  return { file, createdAt: report.startedAt, sha256: report.sha256, tables };
}
const a = read(previous), b = read(latest);
const differences = [...new Set([...Object.keys(a.tables), ...Object.keys(b.tables)])].filter(k => JSON.stringify(a.tables[k]) !== JSON.stringify(b.tables[k])).map(table => ({ table, before: a.tables[table], after: b.tables[table] }));
const report = { at: new Date().toISOString(), previous: a.file, latest: b.file, latestCreatedAt: b.createdAt, latestSha256: b.sha256,
  archiveTablesCompared: Object.keys(b.tables).length, differences,
  recoveredApplicationTablesUnchanged: differences.every(d => ['cron.job','cron.job_run_details','vault.secrets'].includes(d.table)),
  scope: 'COPY column lists, row counts and sorted raw row hashes; excludes sequence state and hosted services. Latest archive not independently restored.' };
const file = `artifacts/seo-migration/backup-data-comparison-${Date.now()}.json`;
fs.writeFileSync(file, JSON.stringify(report, null, 2), { flag: 'wx' });
console.log(JSON.stringify({ file, ...report }));
