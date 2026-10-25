const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const root = path.resolve(__dirname, '..'), target = path.resolve(root, "../L'ecomax-seo-staging");
const evidence = path.join(root, 'artifacts/seo-staging-rc-20261020');
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const changes = [];
function write(file, data, reason) {
  const dest = path.join(target, file), before = fs.existsSync(dest) ? sha(fs.readFileSync(dest)) : null;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, data);
  changes.push({ file, before, after: sha(data), reason });
}
for (const file of [
  'scripts/seo-hosted-acceptance-readonly.cjs', 'operations/seo/worker/scripts/seo-sync-worker.mjs',
  'operations/seo-vercel/vercel.json', 'operations/seo-vercel/schedule.hobby.json',
  'operations/seo-vercel/package.json', 'operations/seo-vercel/package-lock.json',
  'operations/seo-vercel/api/sync.mjs',
  ...['source.json', 'result-0.json', 'result-1.json'].map(n => `artifacts/seo-premium/approved-sol61-astra-20261019/${n}`),
]) write(file, fs.readFileSync(path.join(root, file)), 'Offline regression dependency; no execution or provider call');
let layout = fs.readFileSync(path.join(target, 'app/layout.tsx'), 'utf8');
layout = layout.replace('<Script src="//widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js" strategy="lazyOnload" />', '{process.env.APP_ENV === "production" && <Script src="//widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js" strategy="lazyOnload" />}');
for (const component of ['ConsentScripts', 'PushPrompt', 'AdsDisplay', 'DataCollector', 'PageTracker']) {
  layout = layout.replace(`<${component} />`, `{process.env.APP_ENV === "production" && <${component} />}`);
}
layout = layout.replaceAll('process.env.NODE_ENV === "production" &&', 'process.env.APP_ENV === "production" && process.env.NODE_ENV === "production" &&');
write('app/layout.tsx', layout, 'Do not mount tracking, ads, push prompts or external review scripts in staging');
let config = fs.readFileSync(path.join(target, 'next.config.js'), 'utf8');
config = config.replace('const nextConfig = {', 'const nextConfig = {\n  outputFileTracingRoot: __dirname,');
// Avoid multi-GB webpack caches on this capacity-constrained isolated candidate.
config = config.replace('webpack(config) {', 'webpack(config) {\n    config.cache = false;');
write('next.config.js', config, 'Explicit candidate tracing root and disabled local disk cache');
const ignore = fs.readFileSync(path.join(target, '.vercelignore'), 'utf8');
write('.vercelignore', ignore + '\n# Staging upload excludes offline evidence and standalone worker executables.\nartifacts/\noperations/seo-vercel/tests/\noperations/seo-vercel/api/\noperations/seo-vercel/node-server.mjs\noperations/seo/worker/\n.github/\n', 'Exclude offline evidence, worker entry points and CI from storefront upload');
fs.writeFileSync(path.join(evidence, 'corrections.json'), JSON.stringify({ at: new Date().toISOString(), changes, deployed: false }, null, 2), { flag: 'wx' });
console.log(`Applied ${changes.length} candidate packaging/isolation corrections.`);
