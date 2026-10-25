import { validPythonOutput, validPythonResult, type PythonResult, type PythonOutput } from './python-sandbox';
export type SessionState = { ready: boolean; busy: boolean; status: string; stdout: string; stderr: string; output: PythonOutput[]; prompt: string | null; interactive: boolean; generation: number };
export const initialPythonSession: SessionState = { ready: false, busy: false, status: 'Ready', stdout: '', stderr: '', output: [], prompt: null, interactive: false, generation: 0 };
export type PythonExecution = { result: PythonResult; status: string; code: string; input: string };
// Parent-owned deadlines remain outside the untrusted worker. A hard wall deadline
// prevents forged input/running messages from keeping a worker alive indefinitely.
export class PythonSession {
  state = { ...initialPythonSession };
  listener: (state: SessionState) => void = () => {};
  private pending: { code: string; input: string; interactive: boolean; resolve: (value: PythonExecution) => void } | null = null;
  private timer?: ReturnType<typeof setTimeout>;
  private wall?: ReturnType<typeof setTimeout>;
  private remaining = 10000;
  private segment = 0;
  private started = 0;
  private waitingId = 0;
  private sent = false;
  private running = false;
  constructor(private post: (message: unknown) => void, private now = () => performance.now()) {}
  private emit(patch: Partial<SessionState>) { this.state = { ...this.state, ...patch }; this.listener(this.state); }
  private arm(ms: number, message: string) { clearTimeout(this.timer); this.timer = setTimeout(() => this.stop(message), ms); }
  private send() {
    if (!this.pending || !this.state.ready || this.sent) return;
    this.sent = true;
    this.post({ type: 'run', code: this.pending.code, input: this.pending.input, interactive: this.pending.interactive });
  }
  run(code: string, input: string, interactive: boolean): Promise<PythonExecution> {
    if (this.pending) return Promise.reject(new Error('Python is already running.'));
    if (!code.trim() || code.length > 64000 || input.length > 12000) return Promise.reject(new Error('Code or input is empty or too large.'));
    this.started = this.now(); this.remaining = 10000; this.running = false; this.sent = false; this.waitingId = 0;
    return new Promise(resolve => {
      this.pending = { code, input, interactive, resolve };
      this.emit({ busy: true, status: 'Loading Python', stdout: '', stderr: '', output: [], prompt: null, interactive: false });
      this.arm(60000, 'Python loading timed out. Check your connection and retry.');
      this.wall = setTimeout(() => this.stop('Session reached its two-minute limit.'), 120000);
      this.send();
    });
  }
  receive(data: unknown) {
    if (!data || typeof data !== 'object') return;
    const m = data as Record<string, unknown>;
    if (m.type === 'ready') { this.emit({ ready: true }); this.send(); return; }
    if (!this.pending) return;
    if (m.type === 'running' && !this.running) {
      this.running = true; this.segment = this.now();
      this.emit({ status: 'Running', interactive: m.interactive === true });
      this.arm(this.remaining, 'Timed out after 10 seconds of execution.');
    } else if (m.type === 'stream' && (m.stream === 'stdout' || m.stream === 'stderr') && typeof m.text === 'string' && m.text.length <= 24000) {
      // Cumulative snapshots; no unbounded message accumulation or output DOM nodes.
      this.emit({ [m.stream]: m.text });
    } else if (m.type === 'output' && validPythonOutput(m.output)) {
      this.emit({ output: m.output });
    } else if (m.type === 'input' && this.pending.interactive && this.running && this.state.prompt === null && Number.isInteger(m.id) && (m.id as number) > this.waitingId && (m.id as number) <= 100 && typeof m.prompt === 'string' && m.prompt.length <= 1000) {
      this.remaining -= this.now() - this.segment;
      if (this.remaining <= 0) { this.stop('Timed out after 10 seconds of execution.'); return; }
      this.waitingId = m.id as number;
      this.emit({ prompt: m.prompt, status: 'Waiting for input' });
      this.arm(60000, 'Input timed out after 60 seconds.');
    } else if (m.type === 'result' && validPythonResult(m.result)) {
      this.finish(m.result, m.result.exitCode === 0 ? 'Completed' : 'Failed');
    } else if (m.type === 'failure' && typeof m.message === 'string') {
      this.stop(m.message.slice(0, 1000));
    }
  }
  answer(value: string) {
    if (!this.pending || this.state.prompt === null || value.length > 4000 || /[\r\n]/.test(value)) return false;
    this.pending.input += value + '\n';
    if (this.pending.input.length > 12000) { this.stop('Input limit reached.'); return false; }
    this.segment = this.now();
    this.emit({ prompt: null, status: 'Running' });
    this.arm(this.remaining, 'Timed out after 10 seconds of execution.');
    this.post({ type: 'answer', id: this.waitingId, value });
    return true;
  }
  private finish(result: PythonResult, status: string) {
    const current = this.pending; this.pending = null;
    clearTimeout(this.timer); clearTimeout(this.wall); this.post({ type: 'stop' });
    this.emit({ busy: false, ready: false, prompt: null, status, stdout: result.stdout, stderr: result.stderr, output: result.output || [], generation: this.state.generation + 1 });
    current?.resolve({ code: current.code, input: current.input, result, status });
  }
  stop(reason = 'Stopped') {
    if (!this.pending) return;
    const stderr = (this.state.stderr ? '\n' : '') + reason;
    this.finish({ stdout: this.state.stdout, stderr: this.state.stderr + stderr, output: [...this.state.output, { stream: 'stderr', text: stderr }], exitCode: null, durationMs: Math.round(this.now() - this.started), truncated: false }, reason === 'Stopped' ? 'Cancelled' : 'Failed');
  }
  restart() {
    if (this.pending) this.stop();
    else this.emit({ ...initialPythonSession, generation: this.state.generation + 1 });
  }
  dispose() { this.listener = () => {}; this.stop(); }
}
