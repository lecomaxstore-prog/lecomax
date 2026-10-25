// The opaque-origin iframe owns this worker. It receives code, never auth or storage.
export const pythonWorker = String.raw`
let busy = false;
let answer;
let inputId = 0;
const streamCache = { stdout: '', stderr: '' };
const sentLengths = { stdout: -1, stderr: -1 };
const output = [];
const flush = () => {
  for (const stream of ['stdout', 'stderr']) self.postMessage({ type: 'stream', stream, text: streamCache[stream] });
  self.postMessage({ type: 'output', output });
};
self._pythonInput = prompt => new Promise(resolve => {
  if (++inputId > 100) throw new Error('Input request limit reached.');
  answer = resolve;
  flush();
  self.postMessage({ type: 'input', id: inputId, prompt: String(prompt).slice(0, 1000) });
});
let lastStream = 0;
self._pythonStream = (stream, text) => {
  text = String(text).slice(0, 24000);
  const added = text.slice(streamCache[stream].length);
  if (added) {
    const last = output[output.length - 1];
    if (last?.stream === stream) last.text += added;
    else if (output.length < 2000) output.push({ stream, text: added });
  }
  streamCache[stream] = text;
  const now = performance.now();
  if (sentLengths[stream] !== text.length && now - lastStream >= 50) {
    lastStream = now;
    sentLengths[stream] = text.length;
    flush();
  }
};
self.onmessage = async ({ data }) => {
  if (data?.type === 'answer' && answer && data.id === inputId && typeof data.value === 'string' && data.value.length <= 4000 && !/[\r\n]/.test(data.value)) { const resolve = answer; answer = null; resolve(data.value); return; }
  if (busy || data?.type !== 'run' || typeof data.code !== 'string' || data.code.length > 64000 || typeof data.input !== 'string' || data.input.length > 12000) return;
  busy = true;
  try {
    importScripts('https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.js');
    const py = await loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/', stdout: () => {}, stderr: () => {} });
    const interactive = data.interactive === true && typeof WebAssembly.Suspending === 'function' && typeof WebAssembly.promising === 'function';
    self.postMessage({ type: 'running', interactive });
    py.globals.set('_lesson_code', data.code);
    py.globals.set('_lesson_input', data.input);
    py.globals.set('_lesson_interactive', interactive);
    py.globals.set('_lesson_live_requested', data.interactive === true);
    const result = await py.runPythonAsync(\`
import io, sys, json, time, traceback, contextlib, builtins
try:
    from js import _pythonStream, _pythonInput
except ImportError:
    _pythonStream = lambda *args: None
_events = []
class _BoundedOutput(io.StringIO):
    def __init__(self, stream):
        super().__init__()
        self.stream = stream
        self.truncated = False
    def write(self, text):
        available = max(0, 24000 - self.tell())
        if len(_events) >= 2000:
            available = 0
        self.truncated = self.truncated or len(text) > available
        accepted = text[:available]
        if accepted:
            super().write(accepted)
            if _events and _events[-1]['stream'] == self.stream:
                _events[-1]['text'] += accepted
            else:
                _events.append({'stream': self.stream, 'text': accepted})
            _pythonStream(self.stream, self.getvalue())
        return len(text)
_out, _err = _BoundedOutput('stdout'), _BoundedOutput('stderr')
_start = time.perf_counter()
_exit = 0
sys.stdin = io.StringIO(_lesson_input)
if _lesson_interactive:
    from pyodide.ffi import run_sync
    def _live_input(prompt=''):
        if prompt:
            print(prompt, end='')
        value = run_sync(_pythonInput(str(prompt)))
        print(str(value))
        return str(value)
    builtins.input = _live_input
elif globals().get('_lesson_live_requested', False):
    def _unsupported_input(prompt=''):
        if prompt:
            print(prompt, end='')
        raise RuntimeError('Interactive input is unavailable in this browser. Use a browser with WebAssembly JSPI, or explicitly turn off Interactive input and supply your own prepared answers in Editor settings.')
    builtins.input = _unsupported_input
with contextlib.redirect_stdout(_out), contextlib.redirect_stderr(_err):
    try:
        exec(compile(_lesson_code, 'lesson.py', 'exec'), {'__name__': '__main__'})
    except SystemExit as error:
        _exit = 0 if error.code is None or error.code == 0 else 1
        if _exit:
            traceback.print_exc(limit=12)
    except BaseException:
        _exit = 1
        traceback.print_exc(limit=12)
json.dumps({'stdout': _out.getvalue(), 'stderr': _err.getvalue(), 'output': _events, 'exitCode': _exit, 'durationMs': round((time.perf_counter() - _start) * 1000), 'truncated': _out.truncated or _err.truncated})
    \`);
    self.postMessage({ type: 'result', result: JSON.parse(result) });
  } catch (error) {
    self.postMessage({ type: 'failure', message: 'Python could not load or run. Check your connection and retry. ' + String(error).slice(0, 300) });
  }
};
`.replaceAll('\\`', '`');

// No same-origin permission, storage, navigation, forms, popups or application API access.
// CSP is inherited by the blob worker. Only the pinned runtime CDN can be contacted.
export const pythonSandboxDocument = `<!doctype html><meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net/pyodide/v0.27.7/full/; worker-src blob:; connect-src https://cdn.jsdelivr.net/pyodide/v0.27.7/full/;">
<script>
let worker;
let url;
const stop = () => { if (worker) worker.terminate(); worker = null; if (url) URL.revokeObjectURL(url); url = null; };
window.addEventListener('message', event => {
  if (event.source !== parent) return;
  if (event.data?.type === 'stop') { stop(); return; }
  if (event.data?.type === 'answer' && worker) { worker.postMessage(event.data); return; }
  if (event.data?.type !== 'run' || worker) return;
  url = URL.createObjectURL(new Blob([${JSON.stringify(pythonWorker).replaceAll('<', '\\u003c')}], { type: 'text/javascript' }));
  worker = new Worker(url);
  worker.onmessage = ({ data }) => { parent.postMessage(data, '*'); if (data.type === 'result' || data.type === 'failure') stop(); };
  worker.onerror = () => { parent.postMessage({ type: 'failure', message: 'Python worker unavailable. Check your browser and connection.' }, '*'); stop(); };
  worker.postMessage(event.data);
});
parent.postMessage({ type: 'ready' }, '*');
</script>`;

export type PythonOutput = { stream: 'stdout' | 'stderr'; text: string };
export type PythonResult = { stdout: string; stderr: string; output?: PythonOutput[]; exitCode: number | null; durationMs: number; truncated: boolean };
export function validPythonOutput(value: unknown): value is PythonOutput[] {
  if (!Array.isArray(value) || value.length > 2000) return false;
  let size = 0;
  return value.every(item => item && (item.stream === 'stdout' || item.stream === 'stderr') && typeof item.text === 'string' && (size += item.text.length) <= 48000);
}
export function validPythonResult(value: unknown): value is PythonResult {
  if (!value || typeof value !== 'object') return false;
  const r = value as PythonResult;
  return typeof r.stdout === 'string' && r.stdout.length <= 24000 && typeof r.stderr === 'string' && r.stderr.length <= 24000
    && (r.output === undefined || (validPythonOutput(r.output) && r.output.filter(item => item.stream === 'stdout').map(item => item.text).join('') === r.stdout && r.output.filter(item => item.stream === 'stderr').map(item => item.text).join('') === r.stderr))
    && (r.exitCode === null || r.exitCode === 0 || r.exitCode === 1) && Number.isFinite(r.durationMs) && r.durationMs >= 0 && typeof r.truncated === 'boolean';
}
