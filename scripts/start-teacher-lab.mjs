import { resolvePythonExecutable } from '../lib/python-runtime.ts';
// Explicit local-only terminal opt-in. The imported server binds to 127.0.0.1.
process.env.LECOMAX_LOCAL_TERMINAL = '1';
// Resolve the Windows launcher before stripping the child process environment.
if (!process.env.LECOMAX_PYTHON_EXECUTABLE) {
  try {
    process.env.LECOMAX_PYTHON_EXECUTABLE = resolvePythonExecutable();
  } catch {
    console.warn('Python launcher unavailable; the lab will try Python on PATH.');
  }
}
await import('./start-notification-api.mjs');
