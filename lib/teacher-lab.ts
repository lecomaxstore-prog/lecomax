import { spawn } from 'node:child_process';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { resolvePythonExecutable } from './python-runtime.ts';

export type LabRuntime = 'javascript' | 'powershell' | 'python';
export function privateLabAddress(host = '') {
  const parts = host.split('.').map(Number);
  return /^\d+\.\d+\.\d+\.\d+$/.test(host) && parts.every(n => Number.isInteger(n) && n >= 0 && n <= 255)
    && (parts[0] === 10 || parts[0] === 192 && parts[1] === 168 || parts[0] === 172 && parts[1]! >= 16 && parts[1]! <= 31);
}
export function labBindHost(env = process.env) {
  return privateLabAddress(env.LECOMAX_LAB_HOST) ? env.LECOMAX_LAB_HOST! : '127.0.0.1';
}
export function labAllowed(url: string, origin: string | null, env = process.env) {
  if (env.NODE_ENV === 'production' || env.LECOMAX_LOCAL_TERMINAL !== '1') return false;
  try {
    const target = new URL(url);
    const host = labBindHost(env);
    return target.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]', host].includes(target.hostname)
      && !!origin && (/^http:\/\/(localhost|127\.0\.0\.1|\[::1\]):8081$/.test(origin) || origin === `http://${host}:8081`);
  } catch { return false; }
}
export function labInput(value: unknown): { runtime: LabRuntime; code: string } | null {
  const input = value as { runtime?: unknown; code?: unknown } | null;
  return input && (input.runtime === 'javascript' || input.runtime === 'powershell' || input.runtime === 'python')
    && typeof input.code === 'string' && !!input.code.trim() && input.code.length <= 12000
    ? { runtime: input.runtime, code: input.code } : null;
}
let running = false;
export async function executeLab(runtime: LabRuntime, code: string, signal?: AbortSignal, timeoutMs = 10000) {
  if (running) throw new Error('LAB_BUSY');
  if (signal?.aborted) throw new Error('LAB_CANCELLED');
  if (runtime === 'powershell' && process.platform !== 'win32') throw new Error('POWERSHELL_UNAVAILABLE');
  running = true;
  try {
    // A working directory is convenience, NOT an OS security sandbox.
    const cwd = await mkdtemp(path.join(tmpdir(), 'lecomax-lab-'));
    const file = path.join(cwd, runtime === 'javascript' ? 'example.cjs' : runtime === 'python' ? 'example.py' : 'example.ps1');
    await writeFile(file, runtime === 'powershell'
      ? '\ufeff$ErrorActionPreference = "Stop"\n[Console]::OutputEncoding = [System.Text.Encoding]::UTF8\n' + code : code, 'utf8');
    const executable = runtime === 'javascript' ? process.execPath
      : runtime === 'python' ? resolvePythonExecutable()
      : path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
    const args = runtime === 'javascript' ? [file] : runtime === 'python' ? ['-I', '-u', '-X', 'utf8', file] : ['-NoLogo', '-NoProfile', '-NonInteractive', '-Command', `$ErrorActionPreference = 'Stop'; [Console]::OutputEncoding = [System.Text.Encoding]::UTF8; & { ${code}\n }`];
    // Do not inherit API keys, database credentials, session secrets or Node preload hooks.
    const env: NodeJS.ProcessEnv = { NODE_ENV: 'development' };
    for (const key of ['SystemRoot', 'WINDIR', 'PATH', 'PATHEXT', 'TEMP', 'TMP']) {
      if (process.env[key]) env[key] = process.env[key];
    }
    const started = Date.now();
    return await new Promise<{ stdout: string; stderr: string; exitCode: number | null; durationMs: number; timedOut: boolean; cancelled: boolean; truncated: boolean }>((resolve, reject) => {
      let stdout = '', stderr = '', timedOut = false, cancelled = false, truncated = false, bytes = 0;
      const child = spawn(executable, args, { cwd, env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
      const stop = () => {
        if (child.pid && process.platform === 'win32') {
          const killer = spawn(path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'taskkill.exe'), ['/PID', String(child.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' });
          killer.on('error', () => child.kill());
          killer.on('exit', code => { if (code !== 0) child.kill(); });
        } else child.kill('SIGKILL');
      };
      const collect = (chunk: string, error: boolean) => {
        const remaining = Math.max(0, 24000 - bytes);
        const part = chunk.slice(0, remaining);
        bytes += part.length;
        if (error) stderr += part; else stdout += part;
        if (chunk.length > remaining) { truncated = true; stop(); }
      };
      child.stdout.setEncoding('utf8').on('data', chunk => collect(chunk, false));
      child.stderr.setEncoding('utf8').on('data', chunk => collect(chunk, true));
      const timer = setTimeout(() => { timedOut = true; stop(); }, timeoutMs);
      const cancel = () => { cancelled = true; stop(); };
      signal?.addEventListener('abort', cancel, { once: true });
      if (signal?.aborted) cancel();
      const cleanup = () => { clearTimeout(timer); signal?.removeEventListener('abort', cancel); };
      child.on('error', () => { cleanup(); reject(new Error('RUNTIME_UNAVAILABLE')); });
      child.on('close', exitCode => { cleanup(); resolve({ stdout, stderr, exitCode, durationMs: Date.now() - started, timedOut, cancelled, truncated }); });
    });
  } finally { running = false; }
}
