const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const root = path.resolve(__dirname, '..'), target = path.resolve(root, "../L'ecomax-seo-staging");
const integrity = JSON.parse(fs.readFileSync(path.join(root, 'artifacts/seo-isolation-recovery-20261020/source-integrity.json')));
const hash = b => crypto.createHash('sha256').update(b).digest('hex');
const files = ['lib/owner-auth-database.mjs', 'app/api/auth/signup/route.ts', 'app/api/send-confirmation/route.ts', 'app/api/newsletter/send/route.ts', 'app/api/orders/[id]/notify/route.ts'];
const changes = [];
for (const file of files) {
  const data = fs.readFileSync(path.join(root, file));
  const expected = integrity.files.find(e => e.file === file)?.sha256;
  if (hash(data) !== expected) throw Error('PRIOR_VERIFIED_SOURCE_DRIFT');
  changes.push({ file, before: hash(fs.readFileSync(path.join(target, file))), after: expected });
}
for (const { file } of changes) fs.copyFileSync(path.join(root, file), path.join(target, file));
fs.writeFileSync(path.join(root, 'artifacts/seo-staging-rc-20261020/prior-security-completion.json'), JSON.stringify({ at: new Date().toISOString(), changes }, null, 2), { flag: 'wx' });
