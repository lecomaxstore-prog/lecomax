// Build an isolated source candidate from the verified live commit; never deploys.
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const crypto = require('node:crypto');
const base = 'release/brands-20261018';
const commit = 'd9d1d7a7b274fe3df9f70bb154704ea9e07e78ee';
const out = 'release/seo-rollout-20261018';
const archive = 'artifacts/seo-migration/production-source-for-seo-20261018.tar';
const git = args => cp.execFileSync('git', ['-C', base, ...args], { encoding: 'utf8' }).trim();
if (git(['rev-parse', 'HEAD']) !== commit || git(['status', '--porcelain'])) throw Error('Production source checkout changed');
const resumeEmpty = process.argv[2] === '--resume-empty';
if (resumeEmpty) {
  if (!fs.existsSync(archive) || !fs.existsSync(out) || fs.readdirSync(out).length) throw Error('Resume requires the preserved archive and an empty candidate directory');
} else if (fs.existsSync(out) || fs.existsSync(archive)) throw Error('Refusing to overwrite candidate or archive');
const files = [...new Set([
  ...JSON.parse(fs.readFileSync('artifacts/seo-implementation-report.json')).files,
  'tests/seo-api.test.ts', 'tests/seo-engine.test.ts', 'tests/seo-sitemap.test.ts', 'tests/product-indexing.test.ts',
  'supabase/rollback/20261018_seo_engine_disable_bounded.sql',
  'supabase/verification/seo-preflight.sql', 'supabase/verification/seo-postflight.sql',
  'supabase/verification/seo-rollout-integrity.sql',
])].sort();
if (!resumeEmpty) {
  cp.execFileSync('git', ['-C', base, 'archive', '--format=tar', `--output=${path.resolve(archive)}`, commit]);
  fs.mkdirSync(out);
}
cp.execFileSync('C:/Windows/System32/tar.exe', ['-xf', path.resolve(archive), '-C', out]);
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const entries = files.map(file => {
  const destination = path.join(out, file);
  const before = fs.existsSync(destination) ? sha(fs.readFileSync(destination)) : null;
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(file, destination);
  return { file, productionSha256: before, candidateSha256: sha(fs.readFileSync(destination)) };
});
// Package/lockfile remain exactly those of the production commit. No env, Git
// metadata, node_modules, build outputs, or unrelated worktree files are copied.
const manifest = { at: new Date().toISOString(), baseCommit: commit, directory: out,
  productionDeployment: 'dpl_HkgcNHTedgha5XhnjjX1RED3ZwGx',
  files: entries, validation: 'pending', deployed: false };
fs.writeFileSync('artifacts/seo-migration/isolated-release-manifest.json', JSON.stringify(manifest, null, 2), { flag: 'wx' });
console.log(JSON.stringify({ out, baseCommit: commit, overlayFiles: entries.length, deployed: false }));
