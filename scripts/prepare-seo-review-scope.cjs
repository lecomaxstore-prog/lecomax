// Non-destructive review inventory. This does not create a deployable release.
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const crypto = require('node:crypto');
const sha = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const git = args => cp.execFileSync('git', args, { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
const existing = JSON.parse(fs.readFileSync('artifacts/seo-implementation-report.json'));
const review = JSON.parse(fs.readFileSync('artifacts/seo-migration/production-review-source-manifest.json'));
const selected = new Set([...existing.files, ...review.files.map(r => r.file),
  'tests/seo-api.test.ts', 'tests/seo-engine.test.ts', 'tests/seo-sitemap.test.ts',
  'lib/supabase-server.ts', 'public/robots.txt']);
const stamp = Date.now();
const out = `artifacts/seo-migration/review-scope-${stamp}`;
fs.mkdirSync(out);
const baseline = 'artifacts/seo-system-backup';
const entries = [...selected].filter(f => fs.existsSync(f)).sort().map(file => {
  const original = path.join(baseline, file);
  const prior = review.files.find(r => r.file === file);
  let patch;
  if (fs.existsSync(original)) {
    const result = cp.spawnSync('git', ['diff', '--no-index', '--', original, file], { encoding: 'utf8' });
    if (result.status !== 0 && result.status !== 1) throw Error('Diff failed');
    patch = file.replaceAll('/', '__') + '.patch';
    fs.writeFileSync(path.join(out, patch), result.stdout, { flag: 'wx' });
  }
  return { file, sha256: sha(file), unchangedSincePriorReview: prior ? sha(file) === prior.sha256 : null,
    classification: patch ? 'SEO delta against preserved pre-SEO file; review patch before transplant' :
      file.startsWith('lib/seo-') || file.includes('/seo/') || file.includes('/sitemaps/') || file.includes('seo_engine') ?
        'SEO implementation' : 'Shared dependency or operational file; do not copy wholesale without review',
    ...(patch ? { preSeoSha256: sha(original), patch } : {}) };
});
const changed = git(['status', '--porcelain=v1', '-uall']).trimEnd().split('\n');
const report = { at: new Date().toISOString(), gitHead: git(['rev-parse', 'HEAD']).trim(),
  deployable: false, scope: 'SEO files and preserved pre-SEO deltas separated for review; unrelated work retained in place.',
  changedEntryCount: changed.length, entries,
  remainingChanges: changed.filter(line => !selected.has(line.slice(3).replaceAll('\\', '/'))),
  blockers: ['Current deployment source/commit correspondence not proven.',
    'Shared dependencies and candidate lockfile/build must be resolved in an isolated release before deployment.'] };
fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify(report, null, 2), { flag: 'wx' });
console.log(JSON.stringify({ out, entries: entries.length, patches: entries.filter(e => e.patch).length,
  priorReviewDrift: entries.filter(e => e.unchangedSincePriorReview === false).map(e => e.file),
  changedEntryCount: changed.length, deployable: false }));
