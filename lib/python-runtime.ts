import { execFileSync } from 'node:child_process';
import path from 'node:path';

/** Resolve aliases in the parent environment before launching an isolated child. */
export function resolvePythonExecutable(): string {
  const candidates: string[][] = process.env.LECOMAX_PYTHON_EXECUTABLE
    ? [[process.env.LECOMAX_PYTHON_EXECUTABLE]]
    : process.platform === 'win32'
      ? [['py.exe', '-3'],
        ...(process.env.LOCALAPPDATA ? [[path.join(process.env.LOCALAPPDATA, 'Python', 'bin', 'python.exe')]] : []),
        ['python.exe']]
      : [['python3']];
  for (const [command, ...prefix] of candidates) {
    try {
      const executable = execFileSync(command, [...prefix, '-I', '-c', 'import sys; print(sys.executable)'], {
        encoding: 'utf8', timeout: 8000, windowsHide: true, stdio: ['ignore', 'pipe', 'ignore'],
      }).trim();
      if (path.isAbsolute(executable)) return executable;
    } catch { /* A broken Windows app alias must not hide an installed runtime. */ }
  }
  throw new Error('RUNTIME_UNAVAILABLE');
}
