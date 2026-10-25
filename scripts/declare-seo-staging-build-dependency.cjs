const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const root = path.resolve(__dirname, '..'), target = path.resolve(root, "../L'ecomax-seo-staging");
const lock = JSON.parse(fs.readFileSync(path.join(target, 'package-lock.json')));
const pkg = JSON.parse(fs.readFileSync(path.join(target, 'package.json')));
const version = lock.packages['node_modules/@next/env'].version;
if (version !== '15.5.24') throw Error('UNREVIEWED_NEXT_ENV_VERSION');
pkg.dependencies['@next/env'] = version;
lock.packages[''].dependencies['@next/env'] = version;
// Existing locked tarball and integrity remain unchanged; no new installation.
const changes = [];
for (const [file, data] of [['package.json', pkg], ['package-lock.json', lock]]) {
  const hash = b => crypto.createHash('sha256').update(b).digest('hex');
  const before = hash(fs.readFileSync(path.join(target, file)));
  const bytes = JSON.stringify(data, null, 2) + '\n';
  fs.writeFileSync(path.join(target, file), bytes);
  changes.push({ file, before, after: hash(bytes) });
}
fs.writeFileSync(path.join(root, 'artifacts/seo-staging-rc-20261020/dependency-correction.json'), JSON.stringify({ at: new Date().toISOString(), version, changes }, null, 2), { flag: 'wx' });
