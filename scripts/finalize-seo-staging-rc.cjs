const fs = require('node:fs'), path = require('node:path'), cp = require('node:child_process'), crypto = require('node:crypto');
const root = path.resolve(__dirname, '..'), target = path.resolve(root, "../L'ecomax-seo-staging");
const evidence = path.join(root, 'artifacts/seo-staging-rc-20261020');
const git = args => cp.execFileSync('git', ['-c', `safe.directory=${target.replaceAll('\\', '/')}`, '-C', target, ...args], { encoding: 'utf8' });
const changed = () => [...new Set([
  ...git(['diff', '--name-only', '-z']).split('\0'),
  ...git(['ls-files', '--others', '--exclude-standard', '-z']).split('\0'),
])].filter(Boolean).sort();
const tooling = [
  'scripts/prepare-seo-staging-rc.cjs', 'scripts/validate-seo-staging-rc.cjs',
  'scripts/correct-seo-staging-rc.cjs', 'scripts/finish-seo-staging-rc.cjs',
  'scripts/inventory-seo-staging-rc.cjs', 'scripts/declare-seo-staging-build-dependency.cjs',
  'scripts/complete-seo-staging-security.cjs', 'scripts/test-seo-staging-email.cjs',
  'scripts/finalize-seo-staging-rc.cjs', 'docs/seo-staging-rc-handoff-20261020.md',
];
const report = {
  id: 'seo-staging-rc-verified-20261020', relatedId: 'seo-staging-rc-prepared-20261020',
  createdAt: new Date().toISOString(), title: 'Staging SEO candidate built and locally verified',
  summary: 'Selective staging transfer completed with environment, authentication, email, IndexNow and worker guards. Local build and checks pass; hosted staging and production remain NO-GO.',
  status: 'successful', pages: ['/admin/seo', '/produit/[slug]', '/[category]', '/sitemap.xml', '/change-history'],
  components: ['SEO editor and APIs', 'Supabase authentication', 'Staging upload configuration', 'Disabled outbound integrations'],
  files: [...new Set([...tooling, ...changed()])],
  changes: [
    { kind: 'added', detail: 'Dependency-reviewed SEO runtime, regression fixtures and hash-verified six-migration plan in the existing staging worktree; no migration execution.' },
    { kind: 'modified', detail: 'Staging configuration has Next.js, empty crons, disabled Git deployments, explicit tracing root and direct locked @next/env dependency.' },
    { kind: 'fixed', detail: 'Transferred missing verified email/owner-database isolation guards; fixed disabled-email build failure. Preserved baseline collection exports and shared learning module upload rules.' },
    { kind: 'removed', detail: 'Nonproduction mounting of external analytics/review scripts, tracking, ads and push prompts; offline evidence and separate worker entry points excluded from storefront upload.' },
  ],
  validation: [
    { name: 'Candidate tests', result: 'passed', detail: 'Node 24.22.0: 161 application/security tests, 71 worker tests, 4 email side-effect tripwire tests. Original history suite: 4 tests.' },
    { name: 'Types, lint and build', result: 'passed', detail: 'Candidate TypeScript and focused ESLint passed (existing warnings). Isolated Next production build passed 2026-10-20T14:41:36.673Z with synthetic credentials and blocked runtime fetch. Course content: 635429 checks passed.' },
    { name: 'Runtime and packaging', result: 'passed', detail: '8 loopback HTTP checks passed, including noindex, anonymous SEO denial, cron/email refusal and absent external tracking script HTML. 702 runtime/build modules have no missing/excluded literal import or undeclared package. Six migration hashes match.' },
    { name: 'Retained failures and corrections', result: 'passed', detail: 'Initial missing dynamic fixtures/CLI files, removed collection export and unconditional Resend construction were corrected. Two smoke harness status expectations were corrected without changing authorization. Failed logs retained.' },
    { name: 'Hosted and platform acceptance', result: 'not-run', detail: 'No deployment, push, hosted migrations, real sessions/RLS, paid calls, worker activation, browser UI or fresh Linux npm ci. Local dependencies use an excluded junction. Owner dashboard evidence and explicit deployment/provisioning approval remain required.' },
  ],
};
const reportFile = path.join(evidence, 'verified.json');
fs.writeFileSync(reportFile, JSON.stringify(report, null, 2), { flag: 'wx' });
for (const cwd of [root, target]) {
  cp.execFileSync(process.execPath, ['lecomax-learning-app/scripts/change-report.cjs', '--append', reportFile], { cwd, stdio: 'inherit' });
  cp.execFileSync(process.execPath, ['lecomax-learning-app/scripts/change-report.cjs', '--check'], { cwd, stdio: 'inherit' });
}
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const manifest = {
  at: new Date().toISOString(), target, base: git(['rev-parse', 'HEAD']).trim(),
  localCandidate: 'GO for owner review', hostedStaging: 'NO-GO pending owner gates and explicit approval', production: 'NO-GO',
  candidateChanges: changed().map(file => ({ file, sha256: hash(path.join(target, file)) })),
  originalWorkspaceTools: tooling.map(file => ({ file, sha256: hash(path.join(root, file)) })),
  deployed: false, hostedMigrations: false, paidRequests: false,
};
fs.writeFileSync(path.join(evidence, 'final-manifest.json'), JSON.stringify(manifest, null, 2), { flag: 'wx' });
console.log(JSON.stringify({ changedCandidateFiles: manifest.candidateChanges.length, localCandidate: manifest.localCandidate, hostedStaging: manifest.hostedStaging }));
