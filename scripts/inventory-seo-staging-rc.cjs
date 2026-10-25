const fs = require('node:fs'), path = require('node:path'), cp = require('node:child_process'), crypto = require('node:crypto');
const ts = require('typescript'), ignore = require('ignore');
const root = path.resolve(__dirname, '..'), target = path.resolve(root, "../L'ecomax-seo-staging");
const evidence = path.join(root, 'artifacts/seo-staging-rc-20261020');
const git = args => cp.execFileSync('git', ['-c', `safe.directory=${target.replaceAll('\\', '/')}`, '-C', target, ...args], { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const rules = ignore().add(fs.readFileSync(path.join(target, '.vercelignore'), 'utf8'));
const all = [...new Set(git(['ls-files', '-z', '--cached', '--others', '--exclude-standard']).split('\0').filter(Boolean))].filter(f => fs.existsSync(path.join(target, f)) && fs.statSync(path.join(target, f)).isFile());
const uploaded = all.filter(f => !rules.ignores(f));
const files = uploaded.map(file => ({ file, bytes: fs.statSync(path.join(target, file)).size, sha256: sha(fs.readFileSync(path.join(target, file))) }));
const problems = [], dependencies = new Set(), scanned = new Set();
const pkg = JSON.parse(fs.readFileSync(path.join(target, 'package.json')));
const queue = uploaded.filter(f => /^(app|lib|components)\//.test(f) && /\.[jt]sx?$/.test(f));
queue.push('middleware.ts', 'instrumentation.ts', 'next.config.js', 'scripts/next-build.mjs', 'scripts/source-library.mjs');
while (queue.length) {
  const file = queue.shift();
  if (scanned.has(file) || !/\.[cm]?[jt]sx?$/.test(file)) continue;
  scanned.add(file);
  const source = ts.createSourceFile(file, fs.readFileSync(path.join(target, file), 'utf8'), ts.ScriptTarget.Latest, true);
  const visit = n => {
    const literal = ((ts.isImportDeclaration(n) || ts.isExportDeclaration(n)) && n.moduleSpecifier) ||
      (ts.isCallExpression(n) && (n.expression.kind === ts.SyntaxKind.ImportKeyword || ['require', 'require.resolve'].includes(n.expression.getText(source))) && n.arguments[0]);
    if (literal && ts.isStringLiteral(literal)) {
      const spec = literal.text;
      if (spec.startsWith('.') || spec.startsWith('@/')) {
        const base = spec.startsWith('@/') ? spec.slice(2) : path.posix.normalize(path.posix.join(path.posix.dirname(file), spec));
        const resolved = [base, ...['.ts', '.tsx', '.js', '.mjs', '.cjs', '.json', '/index.ts', '/index.tsx', '/index.js'].map(ext => base + ext)]
          .find(f => fs.existsSync(path.join(target, f)) && fs.statSync(path.join(target, f)).isFile());
        if (!resolved || rules.ignores(resolved)) problems.push({ file, spec, reason: resolved ? 'EXCLUDED_FROM_UPLOAD' : 'MISSING' });
        else queue.push(resolved);
      } else if (!require('node:module').isBuiltin(spec) && spec !== 'server-only') {
        const name = spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0];
        dependencies.add(name);
        if (!pkg.dependencies?.[name] && !pkg.devDependencies?.[name]) problems.push({ file, spec, reason: 'UNDECLARED_PACKAGE' });
      }
    }
    ts.forEachChild(n, visit);
  };
  visit(source);
}
const config = JSON.parse(fs.readFileSync(path.join(target, 'vercel.json')));
if (config.framework !== 'nextjs' || config.crons?.length !== 0 || config.git?.deploymentEnabled !== false) problems.push({ reason: 'UNSAFE_VERCEL_CONFIGURATION' });
for (const file of uploaded) {
  if (/(^|\/)(\.env(?:\.|$)|\.vercel(?:\/|$))/.test(file)) problems.push({ file, reason: 'CREDENTIAL_OR_HOSTING_METADATA' });
}
const lock = JSON.parse(fs.readFileSync(path.join(target, 'package-lock.json')));
// npm sorts lockfile keys; dependency maps are unordered declarations.
// Compare keys AND values without rejecting a harmless insertion-order change.
const { isDeepStrictEqual } = require('node:util');
if (!isDeepStrictEqual(lock.packages[''].dependencies, pkg.dependencies) || !isDeepStrictEqual(lock.packages[''].devDependencies, pkg.devDependencies)) problems.push({ reason: 'LOCKFILE_DECLARATION_DRIFT' });
const migrationPlan = JSON.parse(fs.readFileSync(path.join(target, 'operations/seo/editorial-six-migration-plan.json')));
for (const entry of migrationPlan.migrations) if (sha(fs.readFileSync(path.join(target, entry.file))) !== entry.sha256) problems.push({ file: entry.file, reason: 'MIGRATION_DRIFT' });
const report = { at: new Date().toISOString(), base: git(['rev-parse', 'HEAD']).trim(), uploadedFiles: files.length, bytes: files.reduce((n, f) => n + f.bytes, 0), scannedModules: scanned.size, dependencies: [...dependencies].sort(), problems, files, limitations: ['Inventory models .vercelignore using gitignore semantics; no Vercel CLI upload or hosted build performed.', 'Local dependency junction is excluded; clean Linux npm ci remains hosted acceptance.'], deployed: false };
fs.writeFileSync(path.join(evidence, `upload-inventory-${Date.now()}.json`), JSON.stringify(report, null, 2), { flag: 'wx' });
console.log(JSON.stringify({ uploadedFiles: files.length, bytes: report.bytes, scannedModules: scanned.size, problems }));
process.exitCode = problems.length ? 1 : 0;
