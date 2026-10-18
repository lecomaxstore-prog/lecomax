import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { resolvePythonExecutable } from './python-runtime.ts';

export type TerminalRuntime = 'powershell' | 'python' | 'javascript' | 'kali';
type Launch = { executable: string; args: string[]; version: string };
const cache = new Map<TerminalRuntime, { at: number; launch: Launch | null }>();
function probe(executable: string, args: string[]) {
  return execFileSync(executable, args, { encoding: 'utf8', timeout: 8000, windowsHide: true, stdio: ['ignore', 'pipe', 'ignore'] }).trim();
}
export function resolveTerminalRuntime(runtime: TerminalRuntime): Launch | null {
  const previous = cache.get(runtime);
  if (previous && Date.now() - previous.at < 30000) return previous.launch;
  let launch: Launch | null = null;
  try {
    if (runtime === 'javascript') launch = { executable: process.execPath, args: ['-i'], version: process.version };
    if (runtime === 'python') {
      const executable = resolvePythonExecutable();
      launch = { executable, args: ['-I', '-X', 'utf8', '-q'], version: probe(executable, ['--version']) };
    }
    if (runtime === 'powershell') {
      const candidates = process.env.LECOMAX_POWERSHELL_EXECUTABLE ? [process.env.LECOMAX_POWERSHELL_EXECUTABLE]
        : ['pwsh', ...(process.platform === 'win32' ? [path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe')] : [])];
      for (const executable of candidates) {
        try {
          launch = { executable, args: ['-NoLogo', '-NoProfile'], version: probe(executable, ['-NoLogo', '-NoProfile', '-Command', '$PSVersionTable.PSVersion.ToString()']) };
          break;
        } catch {}
      }
    }
    if (runtime === 'kali' && process.platform === 'win32') {
      const executable = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'wsl.exe');
      const version = probe(executable, ['-d', 'kali-linux', '--exec', 'sh', '-c', '. /etc/os-release; test "$ID" = kali && printf "%s" "$PRETTY_NAME"']);
      if (version) launch = { executable, args: ['-d', 'kali-linux', '--cd', '~', '--exec', 'bash', '-i'], version };
    }
  } catch {}
  cache.set(runtime, { at: Date.now(), launch });
  return launch;
}
export function terminalRuntimes() {
  return (['powershell', 'python', 'javascript', 'kali'] as const).map(runtime => {
    const launch = resolveTerminalRuntime(runtime);
    return { runtime, available: !!launch, version: launch?.version || '', setup: runtime === 'kali'
      ? 'Install Kali in Windows PowerShell: wsl --install -d kali-linux. Then run wsl -d kali-linux once to finish setup. Restart the local lab server.'
      : runtime === 'python' ? 'Install Python 3, then restart the local lab server.'
      : runtime === 'powershell' ? 'Install PowerShell or set LECOMAX_POWERSHELL_EXECUTABLE, then restart the local lab server.' : 'Node.js is supplied by the local lab server.' };
  });
}
