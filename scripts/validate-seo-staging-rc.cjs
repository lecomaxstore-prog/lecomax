// Safe local candidate checks with a fresh, synthetic-only child environment.
const fs = require('node:fs'), path = require('node:path'), cp = require('node:child_process'), crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const target = path.resolve(root, "../L'ecomax-seo-staging");
const evidence = path.join(root, 'artifacts/seo-staging-rc-20261020');
const node = path.join(root, 'artifacts/seo-node24/node-v24.22.0.exe');
const mode = process.argv[2];
const env = {};
for (const [key, value] of Object.entries(process.env)) {
  if (/^(PATH|SystemRoot|windir|ComSpec|TEMP|TMP|USERPROFILE|APPDATA|LOCALAPPDATA|ProgramFiles|ProgramFiles\(x86\)|NUMBER_OF_PROCESSORS|PROCESSOR_ARCHITECTURE)$/i.test(key)) env[key] = value;
}
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
Object.assign(env, {
  APP_ENV: 'development', NEXT_PUBLIC_APP_ENV: 'development', NODE_ENV: 'production',
  NEXT_PUBLIC_SITE_URL: 'http://localhost:3000', NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:9',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'synthetic-anon', SUPABASE_SERVICE_ROLE_KEY: 'synthetic-service',
  NEXT_PUBLIC_SUPABASE_KEY_BINDING: `local:${sha('synthetic-anon')}`,
  SUPABASE_SERVICE_KEY_BINDING: `local:${sha('synthetic-service')}`,
  ADMIN_EMAIL: 'owner@staging.invalid', ADMIN_SESSION_SECRET: 'synthetic-session-secret-for-isolated-build-only',
  SEO_AI_ENABLED: 'false', SEO_EDITORIAL_ENABLED: 'false', SEO_SYNC_ENABLED: 'false',
  SEO_MANUAL_SYNC_ENABLED: 'false', SEO_MIRAI_FALLBACK_ENABLED: 'false', INDEXNOW_ENABLED: 'false',
  PAYPAL_ENABLED: 'false', AGENT_STUDIO_LIVE_ENABLED: 'false', TUTOR_DAILY_TOKEN_BUDGET: '0',
  NEXT_TELEMETRY_DISABLED: '1',
});
if (mode === 'setup') {
  if (fs.existsSync(path.join(target, 'node_modules'))) throw Error('DEPENDENCY_DIRECTORY_ALREADY_EXISTS');
  fs.symlinkSync(path.join(root, 'node_modules'), path.join(target, 'node_modules'), 'junction');
  console.log('Local dependency junction created; excluded from upload.');
  process.exit();
}
if (mode === 'smoke') {
  const http = require('node:http'), assert = require('node:assert/strict');
  const stamp = Date.now(), log = path.join(evidence, `smoke-${stamp}.log`);
  const fd = fs.openSync(log, 'wx');
  env.NODE_OPTIONS = `--require ${JSON.stringify(path.join(evidence, 'offline-build.cjs'))}`;
  const port = 31847;
  const child = cp.spawn(node, [path.join(root, 'node_modules/next/dist/bin/next'), 'start', '--hostname', '127.0.0.1', '--port', String(port)], { cwd: target, env, windowsHide: true, stdio: ['ignore', fd, fd] });
  const request = (route, method = 'GET') => new Promise((resolve, reject) => {
    const req = http.request({ hostname: '127.0.0.1', port, path: route, method, timeout: 15000, headers: method === 'POST' ? { 'Content-Type': 'application/json' } : {} }, res => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.on('error', reject); req.on('timeout', () => req.destroy(Error('SMOKE_TIMEOUT')));
    req.end(method === 'POST' ? '{}' : undefined);
  });
  (async () => {
    const checks = [];
    try {
      let ready = false;
      for (let i = 0; i < 60; i++) {
        if (child.exitCode !== null) throw Error('LOCAL_SERVER_EXITED');
        try { await request('/robots.txt'); ready = true; break; } catch { await new Promise(resolve => setTimeout(resolve, 500)); }
      }
      assert(ready, 'local server readiness');
      for (const [route, method, status] of [
        ['/', 'GET', 200], ['/api/admin/seo', 'GET', 401],
        ['/api/cron/mobile-campaigns', 'GET', 503],
        ['/api/auth/signup', 'POST', 503], ['/api/send-confirmation', 'POST', 401],
        ['/api/newsletter/send', 'POST', 401], ['/api/orders/fixture/notify', 'POST', 503],
        ['/api/account/password-reset', 'POST', 503],
      ]) {
        const response = await request(route, method);
        assert.equal(response.status, status, route);
        assert.match(response.headers['x-robots-tag'] || '', /noindex/, route);
        if (route === '/') assert.doesNotMatch(response.body, /<script[^>]+src=["'][^"']*(?:widget\.trustpilot|googletagmanager|clarity\.ms|va\.vercel-scripts)/i);
        checks.push({ route, method, status, noindex: true });
      }
      fs.writeFileSync(path.join(evidence, `smoke-${stamp}.json`), JSON.stringify({ at: new Date().toISOString(), checks, runtimeFetchBlocked: true, hosted: false }, null, 2), { flag: 'wx' });
      console.log(JSON.stringify({ passed: checks.length, log, hosted: false }));
    } finally {
      child.kill();
      await new Promise(resolve => child.exitCode !== null ? resolve() : child.once('exit', resolve));
      fs.closeSync(fd);
    }
  })().catch(error => { console.error(error); process.exitCode = 1; });
} else {
let args;
if (mode === 'types') args = [path.join(root, 'node_modules/typescript/bin/tsc'), '--noEmit', '--incremental', 'false'];
else if (mode === 'application') args = ['--test', ...fs.readdirSync(path.join(target, 'tests')).filter(n => /^(seo-|environment-|indexnow-|staging-|supabase-key|admin-access|password-reset|product-indexing|owner-)/.test(n) && /\.test\.[cm]?ts$|\.test\.cjs$/.test(n)).map(n => `tests/${n}`)];
else if (mode === 'worker') args = ['operations/seo-vercel/run-tests.mjs'];
else if (mode === 'lint') {
  const plan = JSON.parse(fs.readFileSync(path.join(evidence, 'transfer-reviewed.json')));
  args = [path.join(root, 'node_modules/eslint/bin/eslint.js'), ...new Set([
    ...plan.entries.map(e => e.file), 'app/layout.tsx', 'lib/owner-auth-database.mjs',
    'app/api/auth/signup/route.ts', 'app/api/send-confirmation/route.ts',
    'app/api/newsletter/send/route.ts', 'app/api/orders/[id]/notify/route.ts',
  ].filter(f => /\.(ts|tsx|mjs|cjs|js)$/.test(f) && !f.endsWith('.d.mts')))];
} else if (mode === 'build') {
  const space = fs.statfsSync(target);
  if (space.bavail * space.bsize < 1_000_000_000) throw Error('INSUFFICIENT_BUILD_DISK_SPACE');
  if (fs.readdirSync(target).some(n => n === '.vercel' || /^\.env($|\.)/.test(n) && n !== '.env.example')) throw Error('HOSTED_METADATA_OR_DOTENV_PRESENT');
  const guard = path.join(evidence, 'offline-build.cjs');
  fs.writeFileSync(guard, "globalThis.fetch=async()=>{throw Error('ISOLATED_BUILD_NETWORK_DISABLED')};\n");
  env.NODE_OPTIONS = `--require ${JSON.stringify(guard)}`;
  args = [path.join(root, 'node_modules/next/dist/bin/next'), 'build'];
} else throw Error('UNKNOWN_MODE');
const at = Date.now(), log = path.join(evidence, `${mode}-${at}.log`);
const fd = fs.openSync(log, 'wx');
const result = cp.spawnSync(node, args, { cwd: target, env, windowsHide: true, stdio: ['ignore', fd, fd] });
fs.closeSync(fd);
const report = { at: new Date().toISOString(), mode, exitCode: result.status, error: result.error?.message, log, node, syntheticEnvironment: true, deployed: false };
fs.writeFileSync(path.join(evidence, `${mode}-${at}.json`), JSON.stringify(report, null, 2), { flag: 'wx' });
console.log(JSON.stringify(report));
process.exitCode = result.status ?? 1;
}
