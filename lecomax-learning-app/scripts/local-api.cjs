const { spawn } = require('node:child_process');
const path = require('node:path');

function managedOrigin(value) {
  if (!value) return null;
  const url = new URL(value);
  return url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname)
    && url.port === '3002' && url.pathname === '/' && !url.username && !url.password
    && !url.search && !url.hash ? url.origin : null;
}

async function apiReady(origin) {
  try {
    const response = await fetch(`${origin}/api/learning-mobile/auth/sessions`, {
      signal: AbortSignal.timeout(3000),
    });
    const body = await response.json();
    return response.status === 401 && typeof body.error === 'string';
  } catch { return false; }
}

function runCheck(root, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['scripts/check-learning-owner.mjs'], {
      cwd: root, env, stdio: 'inherit', windowsHide: true,
    });
    const timer = setTimeout(() => { child.kill(); reject(new Error('Login database check timed out. Check Internet/database access and retry.')); }, 30000);
    child.once('error', error => { clearTimeout(timer); reject(error); });
    child.once('exit', code => {
      clearTimeout(timer);
      if (code === 0) resolve();
      else reject(new Error('Login database unavailable. Check backend configuration and network access, then run npm run web again.'));
    });
  });
}

async function ensureLocalApi(origin, { root, env, onExit }) {
  // A 401 alone proves routing, not database availability. Check both before Expo.
  await runCheck(root, env);
  if (await apiReady(origin)) {
    console.log(`Reusing learning API at ${origin}`);
    return null;
  }
  console.log(`Starting learning API at ${origin}`);
  const child = spawn(process.execPath, [path.join(root, 'scripts/start-notification-api.mjs')], {
    cwd: root, env, stdio: 'inherit', windowsHide: true,
  });
  let failure;
  child.once('error', error => { failure = error; });
  child.once('exit', code => { failure = new Error(`Learning API stopped (${code}). Restart with npm run web.`); onExit?.(); });
  try {
    const deadline = Date.now() + 120000;
    while (Date.now() < deadline) {
      if (failure) throw failure;
      if (await apiReady(origin)) return child;
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    throw new Error('Learning API startup timed out. Review the server output above.');
  } catch (error) { child.kill(); throw error; }
}

module.exports = { managedOrigin, apiReady, ensureLocalApi };
