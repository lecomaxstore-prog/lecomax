// Local-only immutable preparation; never deploys or connects to a database.
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto'), assert = require('node:assert/strict');
const hash = b => crypto.createHash('sha256').update(b).digest('hex');
const oldDir = 'operations/seo/production-readiness-20261021';
const output = 'operations/seo/production-handoff-20261021';
const source = 'artifacts/seo-production-handoff-20261021/source';
assert(!fs.existsSync(output), 'OUTPUT_ALREADY_EXISTS');
const oldBytes = fs.readFileSync(oldDir + '/source-manifest-final.json');
const old = JSON.parse(oldBytes);
const recovered = [];
for (const entry of old.files) {
  let location = entry.source;
  if (!fs.existsSync(location) || hash(fs.readFileSync(location)) !== entry.sha256) {
    location = 'artifacts/seo-production-review-20261021/source/' + entry.file;
    recovered.push({ file: entry.file, source: location });
  }
  assert.equal(hash(fs.readFileSync(location)), entry.sha256, 'OLD_SOURCE_NOT_RECOVERED');
}
const staged = JSON.parse(fs.readFileSync('artifacts/seo-write-guard-20261021/release-manifest.json'));
const hosting = JSON.parse(fs.readFileSync('artifacts/seo-write-guard-20261021/hosting-1792601333224.json'));
const receipt = JSON.parse(fs.readFileSync('artifacts/seo-security-resume-20261021/status-1792601413046.json'));
assert.equal(receipt.upload.missing.length + receipt.upload.mismatches.length, 0);
assert.equal(receipt.aliasDeployment, 'dpl_4VCPk44FjpUmadAZKJyNFUKRHMyf');
const cronEntry = old.files.find(e => e.file === 'vercel.json');
const config = JSON.parse(fs.readFileSync(cronEntry.source));
const cronPairs = entries => entries.map(e => ({ path: e.path, schedule: e.schedule })).sort((a, b) => a.path.localeCompare(b.path));
assert.deepEqual(cronPairs(config.crons), cronPairs(hosting.projects.production.crons));
fs.mkdirSync(output, { recursive: true });
const files = staged.files.map(entry => {
  assert(!path.isAbsolute(entry.file) && !entry.file.split('/').includes('..'));
  const origin = entry.file === 'vercel.json' ? cronEntry.source : 'artifacts/seo-security-resume-20261021/source/' + entry.file;
  const bytes = fs.readFileSync(origin);
  assert.equal(hash(bytes), entry.file === 'vercel.json' ? cronEntry.sha256 : entry.sha256);
  const destination = source + '/' + entry.file;
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, bytes, { flag: 'wx' });
  return { file: entry.file, bytes: bytes.length, sha256: hash(bytes), source: destination };
});
assert.equal(files.length, 2124);
const migrations = JSON.parse(fs.readFileSync(oldDir + '/migration-plan.json'));
for (const m of migrations.migrations) assert.equal(hash(fs.readFileSync(m.file)), m.sha256);
const manifest = { createdAt: new Date().toISOString(), productionDeploymentAuthorized: false, sourceCount: files.length, stagingDeployment: receipt.aliasDeployment, previousManifestSha256: hash(oldBytes), deltaFromStaging: ['vercel.json'], files };
fs.writeFileSync(output + '/source-manifest.json', JSON.stringify(manifest, null, 2), { flag: 'wx' });
const report = { at: new Date().toISOString(), oldManifest: { sha256: hash(oldBytes), count: old.files.length, allPinnedBytesLocated: true, recovered }, candidate: { manifest: output + '/source-manifest.json', sha256: hash(fs.readFileSync(output + '/source-manifest.json')), count: files.length, allHashesVerified: true, productionDeploymentAuthorized: false, productionBuildTested: false }, migrations: { count: migrations.migrations.length, allHashesMatch: true }, existingCronsPreserved: true, rollback: hosting.projects.production.deployment, staging: { deployment: receipt.id, state: receipt.state, protection: receipt.protection, expectedFilesMatched: 2124, generatedExtraFiles: receipt.upload.extra.length }, limitations: ['Hosted authenticated security behavior remains untested for this deployment.', 'Fresh encrypted backup and isolated recovery await database credential.', 'Production configuration and exact candidate approval remain required.'] };
fs.writeFileSync(output + '/verification.json', JSON.stringify(report, null, 2), { flag: 'wx' });
console.log(JSON.stringify(report));
