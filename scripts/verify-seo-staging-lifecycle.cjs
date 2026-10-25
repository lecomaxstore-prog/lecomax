// Builds an exact upload copy; never writes to the reviewed sibling worktree.
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const crypto = require('node:crypto');
const Module = require('node:module');
const root = path.resolve(__dirname, '..');
const original = path.resolve(root, "../L'ecomax-seo-staging");
const retry = process.argv[2] === '--retry' && process.argv.length === 4;
if (process.argv.length > 2 && !retry) throw Error('EXPECTED_OPTIONAL_RETRY_DIRECTORY');
const evidence = retry ? path.resolve(process.argv[3]) : path.join(root, 'artifacts', `seo-staging-lifecycle-${Date.now()}`);
if (path.dirname(evidence) !== path.join(root, 'artifacts') || !/^seo-staging-lifecycle-\d+$/.test(path.basename(evidence))) throw Error('UNSAFE_EVIDENCE_PATH');
const target = path.join(evidence, 'source');
const node = path.join(root, 'artifacts/seo-node24/node-v24.22.0.exe');
const inventoryDir = path.join(root, 'artifacts/seo-staging-rc-20261020');
const inventoryName = fs.readdirSync(inventoryDir).filter(n => /^upload-inventory-\d+\.json$/.test(n)).sort().at(-1);
const inventory = JSON.parse(fs.readFileSync(path.join(inventoryDir, inventoryName)));
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
if (inventory.problems.length) throw Error('INVENTORY_NOT_CLEAN');
const space = fs.statfsSync(root);
if (space.bavail * space.bsize < 1_000_000_000) throw Error('INSUFFICIENT_DISK_SPACE');
fs.mkdirSync(target, { recursive: true });
for (const entry of inventory.files) {
  const input = path.join(original, entry.file);
  if (sha(fs.readFileSync(input)) !== entry.sha256) throw Error(`SOURCE_DRIFT:${entry.file}`);
  const output = path.join(target, entry.file);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  if (!retry) fs.copyFileSync(input, output, fs.constants.COPYFILE_EXCL);
  else if (!/^app\/admin\/how-it-was-built\/course\/(content|generated)\//.test(entry.file) && sha(fs.readFileSync(output)) !== entry.sha256) throw Error(`COPY_DRIFT:${entry.file}`);
}
if (!retry) fs.symlinkSync(path.join(root, 'node_modules'), path.join(target, 'node_modules'), 'junction');
const bin = path.join(evidence, 'bin');
if (!retry) {
  fs.mkdirSync(bin);
  fs.linkSync(node, path.join(bin, 'node.exe'));
}
if (fs.realpathSync(path.join(target, 'node_modules')) !== fs.realpathSync(path.join(root, 'node_modules'))) throw Error('DEPENDENCY_JUNCTION_DRIFT');
if (sha(fs.readFileSync(path.join(bin, 'node.exe'))) !== sha(fs.readFileSync(node))) throw Error('NODE_BINARY_DRIFT');
if (fs.readdirSync(target).some(n => n === '.vercel' || /^\.env($|\.)/.test(n) && n !== '.env.example')) throw Error('HOSTED_METADATA_OR_DOTENV_PRESENT');
const env = {};
for (const [key, value] of Object.entries(process.env)) {
  if (/^(PATH|SystemRoot|windir|ComSpec|TEMP|TMP|USERPROFILE|APPDATA|LOCALAPPDATA|ProgramFiles|ProgramFiles\(x86\)|NUMBER_OF_PROCESSORS|PROCESSOR_ARCHITECTURE)$/i.test(key)) env[key] = value;
}
const pathKey = Object.keys(env).find(k => k.toLowerCase() === 'path') || 'PATH';
env[pathKey] = bin + path.delimiter + (env[pathKey] || '');
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
const stamp = Date.now();
const guard = path.join(evidence, `offline-${stamp}.cjs`);
fs.writeFileSync(guard, "globalThis.fetch=async()=>{throw Error('ISOLATED_BUILD_NETWORK_DISABLED')};\n", { flag: 'wx' });
env.NODE_OPTIONS = `--require ${JSON.stringify(guard)}`;
const npm = path.join(process.env.ProgramFiles, 'nodejs/node_modules/npm/bin/npm-cli.js');
const log = path.join(evidence, `npm-build-${stamp}.log`);
const fd = fs.openSync(log, 'wx');
console.log(JSON.stringify({ evidence, target, inventoryName, startedAt: new Date().toISOString() }));
const result = cp.spawnSync(node, [npm, 'run', 'build'], { cwd: target, env, windowsHide: true, stdio: ['ignore', fd, fd] });
fs.closeSync(fd);
const report = {
  at: new Date().toISOString(), exitCode: result.status, error: result.error?.message,
  inventoryName, files: inventory.files.length, node: '24.22.0', log,
  syntheticOnly: true, hosted: false, cleanInstall: false,
  limitations: ['Windows dependency junction; not a clean Linux npm ci.', 'Synthetic development identity, not hosted staging credential validation.'],
};
fs.writeFileSync(path.join(evidence, `result-${stamp}.json`), JSON.stringify(report, null, 2), { flag: 'wx' });
console.log(JSON.stringify(report));
if (result.status !== 0) process.exit(result.status || 1);
// Reuse the established eight HTTP assertions against this newly built copy.
const harnessFile = path.join(root, 'scripts/validate-seo-staging-rc.cjs');
let source = fs.readFileSync(harnessFile, 'utf8')
  .replace('const target = path.resolve(root, "../L\'ecomax-seo-staging");', `const target = ${JSON.stringify(target)};`);
const harness = new Module(harnessFile, module);
harness.filename = harnessFile;
harness.paths = Module._nodeModulePaths(path.dirname(harnessFile));
process.argv[2] = 'smoke';
harness._compile(source, harnessFile);
