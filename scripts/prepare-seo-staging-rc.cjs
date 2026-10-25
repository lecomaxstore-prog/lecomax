// Local-only reviewed overlay. Planning never writes to the staging worktree.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const cp = require('node:child_process');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const target = path.resolve(root, "../L'ecomax-seo-staging");
const evidence = path.join(root, 'artifacts/seo-staging-rc-20261020');
fs.mkdirSync(evidence, { recursive: true });
const hash = data => crypto.createHash('sha256').update(data).digest('hex');
const sha = file => fs.existsSync(file) ? hash(fs.readFileSync(file)) : null;
const git = args => cp.execFileSync('git', ['-c', `safe.directory=${target.replaceAll('\\', '/')}`, '-C', target, ...args], { encoding: 'utf8' }).trim();
const manifestPath = path.join(evidence, 'transfer-reviewed.json');
if (process.argv[2] === '--apply') {
  const plan = JSON.parse(fs.readFileSync(manifestPath));
  if (git(['rev-parse', 'HEAD']) !== plan.baseCommit) throw Error('BASE_DRIFT');
  for (const entry of plan.entries) {
    if (sha(path.join(target, entry.file)) !== entry.before) throw Error(`TARGET_DRIFT: ${entry.file}`);
    if (sha(path.join(root, entry.source)) !== entry.after) throw Error(`SOURCE_DRIFT: ${entry.file}`);
  }
  for (const entry of plan.entries) {
    fs.mkdirSync(path.dirname(path.join(target, entry.file)), { recursive: true });
    fs.copyFileSync(path.join(root, entry.source), path.join(target, entry.file));
  }
  fs.writeFileSync(path.join(evidence, 'applied.json'), JSON.stringify({ at: new Date().toISOString(), files: plan.entries.length, deployed: false }, null, 2), { flag: 'wx' });
  console.log(`Applied ${plan.entries.length} reviewed files; no deployment.`);
  process.exit();
}
if (process.argv.length !== 2) throw Error('INVALID_ARGUMENTS');
if (git(['status', '--porcelain'])) throw Error('STAGING_NOT_CLEAN');
const selected = new Map();
const add = (file, reason, source = file) => {
  if (!fs.existsSync(path.join(root, source))) throw Error(`MISSING_SOURCE: ${source}`);
  if (!selected.has(file)) selected.set(file, { source, reason });
};
const walk = directory => fs.readdirSync(path.join(root, directory), { withFileTypes: true }).flatMap(e =>
  e.name.startsWith('.') ? [] : e.isDirectory() ? walk(`${directory}/${e.name}`) : [`${directory}/${e.name}`]);
const original = JSON.parse(fs.readFileSync(path.join(root, 'artifacts/seo-implementation-report.json')));
for (const file of original.files) add(file, 'SEO implementation integration');
const security = JSON.parse(fs.readFileSync(path.join(root, 'artifacts/seo-staging-security-20261020/source-integrity-final.json')));
for (const entry of security.entries) {
  if (sha(path.join(root, entry.file)) !== entry.sha256) throw Error(`SECURITY_SOURCE_DRIFT: ${entry.file}`);
  if (!entry.file.startsWith('docs/') && !entry.file.startsWith('.env') && !entry.file.startsWith('lecomax-learning-app/')) add(entry.file, 'Verified security checkpoint');
}
for (const directory of ['app/admin/seo', 'app/api/admin/seo', 'operations/seo-vercel/lib', 'operations/seo-vercel/tests', 'operations/seo-vercel/supabase']) {
  for (const file of walk(directory)) add(file, 'SEO runtime and offline validation');
}
for (const file of [
  ...fs.readdirSync(path.join(root, 'lib')).filter(n => n.startsWith('seo')).map(n => `lib/${n}`),
  ...fs.readdirSync(path.join(root, 'tests')).filter(n => /^(seo-|environment-|indexnow-|staging-|supabase-key|admin-access|admin-session|password-reset|product-indexing|owner-)/.test(n)).map(n => `tests/${n}`),
  'instrumentation.ts', 'next.config.js', '.vercelignore', 'lib/supabase-server.ts',
  'lib/admin-session.ts', 'lib/paypal-server.ts', 'lib/db-server.ts',
  'scripts/next-build.mjs', 'scripts/validate-seo-environment.mjs',
  'scripts/verify-storefront-release.mjs', 'operations/seo-vercel/run-tests.mjs',
  'operations/seo/editorial-six-migration-plan.json', 'operations/seo/staging-app.env.example',
  'operations/seo/staging-worker.env.example',
]) add(file, 'Environment isolation, SEO regression or build dependency');
add('vercel.json', 'Staging only: Next.js, no crons, Git deployments disabled', 'operations/seo/staging-vercel.json');
for (const entry of JSON.parse(fs.readFileSync(path.join(root, 'operations/seo/editorial-six-migration-plan.json'))).migrations) {
  if (sha(path.join(root, entry.file)) !== entry.sha256) throw Error('MIGRATION_DRIFT');
  add(entry.file, 'Hash-verified six-migration plan; never executed');
}
// Traverse candidate imports. Preserve baseline modules unless explicitly selected
// or absent; do not pull unrelated modified UI just because it is imported.
const queue = [...selected.keys()];
const scanned = new Set();
const missing = [];
while (queue.length) {
  const file = queue.shift();
  if (scanned.has(file) || !/\.[cm]?[jt]sx?$/.test(file)) continue;
  scanned.add(file);
  const physical = selected.has(file) ? path.join(root, selected.get(file).source) : path.join(target, file);
  if (!fs.existsSync(physical)) continue;
  const source = ts.createSourceFile(file, fs.readFileSync(physical, 'utf8'), ts.ScriptTarget.Latest, true);
  const imports = [];
  const visit = node => {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) imports.push(node.moduleSpecifier.text);
    if (ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword || node.expression.getText(source) === 'require' || node.expression.getText(source) === 'require.resolve') && node.arguments[0] && ts.isStringLiteral(node.arguments[0])) imports.push(node.arguments[0].text);
    ts.forEachChild(node, visit);
  };
  visit(source);
  for (const spec of imports.filter(s => s.startsWith('.') || s.startsWith('@/'))) {
    const base = spec.startsWith('@/') ? spec.slice(2) : path.posix.normalize(path.posix.join(path.posix.dirname(file), spec));
    const options = [base, ...['.ts', '.tsx', '.js', '.mjs', '.cjs', '.json', '/index.ts', '/index.tsx', '/index.js'].map(ext => base + ext)];
    const found = options.find(p => [root, target].some(dir => fs.existsSync(path.join(dir, p)) && fs.statSync(path.join(dir, p)).isFile()));
    if (!found) { missing.push({ file, spec }); continue; }
    if (!fs.existsSync(path.join(target, found)) && !selected.has(found)) add(found, `Missing transitive dependency of ${file}`);
    queue.push(found);
  }
}
const entries = [...selected].map(([file, detail]) => ({
  file, ...detail, before: sha(path.join(target, file)), after: sha(path.join(root, detail.source)),
})).filter(e => e.before !== e.after).sort((a, b) => a.file.localeCompare(b.file));
const plan = { at: new Date().toISOString(), baseCommit: git(['rev-parse', 'HEAD']), target, entries, scannedModules: scanned.size, unresolvedImports: missing, deployed: false };
fs.writeFileSync(manifestPath, JSON.stringify(plan, null, 2), { flag: 'wx' });
console.log(JSON.stringify({ files: entries.length, scannedModules: scanned.size, unresolvedImports: missing }));
