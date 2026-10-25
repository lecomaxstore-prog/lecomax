// Local development must watch files even when launched from a CI-configured shell.
const { spawn } = require('node:child_process');
const path = require('node:path');
const { managedOrigin, ensureLocalApi } = require('./local-api.cjs');
const appRoot = path.resolve(__dirname, '..');
// Load only the Expo app's public configuration here, never the backend .env.
process.env.NODE_ENV = 'development';
require('@expo/env').load(appRoot);
const env = { ...process.env, NODE_ENV: 'development' };
for (const key of Object.keys(env)) if (key.toUpperCase() === 'CI') delete env[key];
const cli = path.join(path.dirname(require.resolve('expo/package.json')), 'bin/cli');
let api, expo, stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  expo?.kill();
  api?.kill();
  process.exitCode = code;
}
process.once('SIGINT', () => stop());
process.once('SIGTERM', () => stop());
async function main() {
  require('./build-car-studio.cjs');
  const origin = managedOrigin(env.EXPO_PUBLIC_LEARNING_API_URL?.trim());
  if (origin) api = await ensureLocalApi(origin, {
    root: path.resolve(appRoot, '..'), env,
    onExit: () => { if (!stopping) { console.error('Learning API stopped. Restart with npm run web.'); stop(1); } },
  });
  if (stopping) { api?.kill(); return; }
  expo = spawn(process.execPath, [cli, 'start', ...process.argv.slice(2)], {
    cwd: appRoot, env, stdio: 'inherit', windowsHide: true,
  });
  expo.on('error', error => { console.error(error.message); stop(1); });
  expo.on('exit', code => stop(code ?? 1));
}
main().catch(error => { console.error(error.message); stop(1); });
