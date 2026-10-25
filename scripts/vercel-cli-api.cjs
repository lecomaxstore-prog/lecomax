// CLI owns OAuth refresh. Never read credential files or pass secrets in argv.
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');

function cliPath() {
  const candidates = [
    path.join(__dirname, '../node_modules/vercel/dist/index.js'),
    process.env.APPDATA && path.join(process.env.APPDATA, 'npm/node_modules/vercel/dist/index.js'),
    '/usr/local/lib/node_modules/vercel/dist/index.js',
    '/usr/lib/node_modules/vercel/dist/index.js',
  ].filter(Boolean);
  const found = candidates.find(file => fs.existsSync(file));
  if (!found) throw Error('VERCEL_CLI_NOT_INSTALLED');
  return found;
}

function runCli(args, input, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(Error('VERCEL_CLI_ABORTED'));
    const child = spawn(process.execPath, [cliPath(), ...args], {
      shell: false, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, NO_UPDATE_NOTIFIER: '1', VERCEL_TELEMETRY_DISABLED: '1', NO_COLOR: '1' },
    });
    let output = '', bytes = 0, failed = false;
    const stop = () => { failed = true; child.kill(); };
    const timer = setTimeout(stop, 60000);
    signal?.addEventListener('abort', stop, { once: true });
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', chunk => {
      bytes += Buffer.byteLength(chunk);
      if (bytes > 16 * 1024 * 1024) stop();
      else output += chunk;
    });
    // Error output can contain request data; consume it without logging/persisting.
    child.stderr.resume();
    child.stdin.on('error', stop);
    child.on('error', () => { failed = true; });
    child.on('close', code => {
      clearTimeout(timer); signal?.removeEventListener('abort', stop);
      if (failed) reject(Error('VERCEL_CLI_EXECUTION_FAILED'));
      else resolve({ code, output });
    });
    child.stdin.end(input);
  });
}

function parseResponse({ code, output }) {
  const match = /^HTTP(?:\/\d(?:\.\d)?)? (\d{3})[^\r\n]*\r?\n([\s\S]*?)\r?\n\r?\n([\s\S]*)$/.exec(output);
  if (!match || (code !== 0 && Number(match[1]) < 400)) throw Error('VERCEL_CLI_API_FAILED');
  const status = Number(match[1]);
  const headers = new Headers();
  for (const line of match[2].split(/\r?\n/)) {
    const colon = line.indexOf(':');
    if (colon > 0) headers.append(line.slice(0, colon), line.slice(colon + 1).trim());
  }
  // Never propagate an error body which might echo sensitive request data.
  return new Response([204, 205, 304].includes(status) ? null : status >= 400 ? '{}' : match[3], { status, headers });
}

async function vercelApiFetch(input, options = {}, runner = runCli) {
  const url = new URL(input);
  if (url.origin !== 'https://api.vercel.com' || url.username || url.password || url.hash)
    throw Error('VERCEL_API_ORIGIN_REQUIRED');
  const headers = new Headers(options.headers);
  if ([...headers.keys()].some(key => key !== 'content-type')) throw Error('VERCEL_CLI_OWNS_AUTHENTICATION');
  const method = options.method || 'GET';
  if (!['GET', 'POST', 'PATCH', 'PUT'].includes(method)) throw Error('VERCEL_API_METHOD_UNSUPPORTED');
  if (method === 'GET' && options.body !== undefined) throw Error('VERCEL_GET_BODY_FORBIDDEN');
  const args = ['api', url.pathname + url.search, '--method', method, '--raw', '--include', '--non-interactive'];
  if (options.body !== undefined) args.push('--input', '-');
  // No retry: a failed mutation may already have reached the service.
  return parseResponse(await runner(args, options.body, options.signal));
}

module.exports = { vercelApiFetch, parseResponse };
