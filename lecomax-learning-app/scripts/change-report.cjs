const fs = require('node:fs');
const path = require('node:path');
const { load } = require('./inspect.cjs');
const { readReports, mergeReports } = load('lecomax-learning-app/utils/change-history.ts');
const app = path.resolve(__dirname, '..');
const folder = path.join(app, 'changes');
const manifest = path.join(app, 'data/change-history.json');
function reportsOnDisk() {
  return readReports(fs.readdirSync(folder).filter(f => f.endsWith('.json')).map(f => JSON.parse(fs.readFileSync(path.join(folder, f), 'utf8'))));
}
function preserveBundledReports(reports) {
  const bundled = readReports(JSON.parse(fs.readFileSync(manifest, 'utf8')));
  const disk = new Map(reports.map(report => [report.id, report]));
  for (const report of bundled) {
    if (!disk.has(report.id)) throw new Error('An archived source report is missing: ' + report.id + '. Restore it before writing history.');
  }
  mergeReports(bundled, reports); // Reject edited reports before touching either archive.
}
function writeManifest(reports) {
  const tmp = manifest + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(mergeReports([], reports), null, 2) + '\n');
  fs.renameSync(tmp, manifest);
}
fs.mkdirSync(folder, { recursive: true });
const [action, input] = process.argv.slice(2);
try {
  if (action === '--check') {
    const disk = mergeReports([], reportsOnDisk());
    const bundled = readReports(JSON.parse(fs.readFileSync(manifest, 'utf8')));
    if (JSON.stringify(disk) !== JSON.stringify(bundled)) throw new Error('History manifest differs from immutable reports. Run --rebuild.');
    console.log('Change history valid: ' + disk.length + ' reports.');
  } else if (action === '--append' && input || action === '--rebuild') {
    const lock = path.join(folder, '.write-lock');
    const descriptor = fs.openSync(lock, 'wx');
    try {
      const old = reportsOnDisk();
      preserveBundledReports(old);
      if (action === '--append') {
        const report = readReports([JSON.parse(fs.readFileSync(path.resolve(input), 'utf8'))])[0];
        if (report.relatedId && !old.some(r => r.id === report.relatedId)) throw new Error('Related report does not exist.');
        if (old.some(r => r.id === report.id)) throw new Error('Report ID already exists. Append a follow-up instead.');
        fs.writeFileSync(path.join(folder, report.id + '.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
      }
      writeManifest(reportsOnDisk());
      console.log('History saved. Earlier reports retained.');
    } finally { fs.closeSync(descriptor); fs.unlinkSync(lock); }
  } else {
    throw new Error('Usage: node scripts/change-report.cjs --append report.json | --check | --rebuild');
  }
} catch (error) { console.error(error.message); process.exitCode = 1; }
