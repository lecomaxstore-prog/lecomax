const fs = require('node:fs'), path = require('node:path'), cp = require('node:child_process'), crypto = require('node:crypto');
const root = path.resolve(__dirname, '..'), target = path.resolve(root, "../L'ecomax-seo-staging");
const evidence = path.join(root, 'artifacts/seo-staging-rc-20261020');
const git = args => cp.execFileSync('git', ['-c', `safe.directory=${target.replaceAll('\\', '/')}`, '-C', target, ...args]);
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const changes = [];
for (const file of ['lib/db-server.ts', '.vercelignore']) {
  const before = fs.readFileSync(path.join(target, file));
  let after = git(['show', `HEAD:${file}`]);
  if (file === '.vercelignore') after = Buffer.from(after.toString() + '\n# Staging-only exclusions; preserve shared learning runtime modules above.\nartifacts/\noperations/seo-vercel/tests/\noperations/seo-vercel/api/\noperations/seo-vercel/node-server.mjs\noperations/seo/worker/\n.github/\n');
  fs.writeFileSync(path.join(target, file), after);
  changes.push({ file, before: sha(before), after: sha(after), reason: file === 'lib/db-server.ts' ? 'Preserve baseline collection exports; no security delta existed in overlay' : 'Preserve baseline shared-module upload exceptions' });
}
// Append reports through the supported command in both applications.
const report = JSON.parse(fs.readFileSync(path.join(evidence, 'prepared.json')));
const existing = path.join(target, 'lecomax-learning-app/changes', report.id + '.json');
if (!fs.existsSync(existing)) cp.execFileSync(process.execPath, ['lecomax-learning-app/scripts/change-report.cjs', '--append', path.join(evidence, 'prepared.json')], { cwd: target, stdio: 'inherit' });
fs.writeFileSync(path.join(evidence, 'baseline-preservation.json'), JSON.stringify({ at: new Date().toISOString(), changes }, null, 2), { flag: 'wx' });
