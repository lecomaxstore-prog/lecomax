import * as pty from 'node-pty';
import { randomUUID } from 'node:crypto';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { resolveTerminalRuntime, terminalRuntimes, type TerminalRuntime } from './teacher-runtimes.ts';

type Runtime = TerminalRuntime;
type Session = { owner: string; runtime: Runtime; terminal: pty.IPty; output: string; offset: number; touched: number; created: number; exitCode: number | null; exited: boolean; cwd: string };
const globalState = globalThis as typeof globalThis & { lecomaxTerminals?: Map<string, Session>; lecomaxTerminalTimer?: ReturnType<typeof setInterval> };
const sessions = globalState.lecomaxTerminals ??= new Map<string, Session>();
export function stopTerminal(id: string, owner: string) {
  const session = sessions.get(id);
  if (!session || session.owner !== owner) throw new Error('TERMINAL_NOT_FOUND');
  sessions.delete(id);
  try { session.terminal.kill(); } catch {}
}
if (!globalState.lecomaxTerminalTimer) {
  globalState.lecomaxTerminalTimer = setInterval(() => {
    for (const [id, session] of sessions) if (Date.now() - session.touched > 5 * 60_000 || Date.now() - session.created > 4 * 3600_000) stopTerminal(id, session.owner);
  }, 30_000);
  globalState.lecomaxTerminalTimer.unref();
}
export function terminalAction(owner: string, input: unknown) {
  const body = input as { action?: string; runtime?: Runtime; id?: string; data?: string; cursor?: number; cols?: number; rows?: number } | null;
  if (!body || typeof body !== 'object') throw new Error('INVALID_INPUT');
  if (body.action === 'runtimes') return { runtimes: terminalRuntimes() };
  if (body.action === 'start') {
    if (!['powershell', 'python', 'javascript', 'kali'].includes(body.runtime || '')) throw new Error('INVALID_INPUT');
    if (sessions.size >= 9 || [...sessions.values()].filter(s => s.owner === owner).length >= 6) throw new Error('TERMINAL_LIMIT');
    const runtime = body.runtime!;
    const launch = resolveTerminalRuntime(runtime);
    if (!launch) throw new Error('RUNTIME_NOT_INSTALLED');
    const cwd = mkdtempSync(path.join(tmpdir(), 'lecomax-terminal-'));
    const { executable, args } = launch;
    const env: Record<string, string> = { TERM: 'xterm-256color' };
    for (const key of ['SystemRoot', 'WINDIR', 'PATH', 'PATHEXT', 'TEMP', 'TMP', 'USERPROFILE', 'LOCALAPPDATA', 'APPDATA', 'HOME', 'LANG']) if (process.env[key]) env[key] = process.env[key]!;
    const terminal = pty.spawn(executable, args, { name: 'xterm-256color', cols: 80, rows: 24, cwd, env });
    const id = randomUUID();
    const session: Session = { owner, runtime, terminal, output: '', offset: 0, touched: Date.now(), created: Date.now(), exitCode: null, exited: false, cwd };
    sessions.set(id, session);
    terminal.onData(data => {
      session.output += data;
      if (session.output.length > 200000) { const remove = session.output.length - 200000; session.output = session.output.slice(remove); session.offset += remove; }
    });
    terminal.onExit(({ exitCode }) => { session.exitCode = exitCode; session.exited = true; });
    return { id, cwd, runtime };
  }
  if (typeof body.id !== 'string') throw new Error('INVALID_INPUT');
  const session = sessions.get(body.id);
  if (!session || session.owner !== owner) throw new Error('TERMINAL_NOT_FOUND');
  session.touched = Date.now();
  if (body.action === 'stop') { stopTerminal(body.id, owner); return { stopped: true }; }
  if (body.action === 'read') {
    const cursor = body.cursor ?? 0;
    if (!Number.isSafeInteger(cursor) || cursor < 0) throw new Error('INVALID_INPUT');
    if (body.data !== undefined) {
      if (typeof body.data !== 'string' || body.data.length > 8000) throw new Error('INVALID_INPUT');
      if (!session.exited && body.data) session.terminal.write(body.data);
    }
    if (body.cols !== undefined || body.rows !== undefined) {
      if (!Number.isInteger(body.cols) || !Number.isInteger(body.rows) || body.cols! < 10 || body.cols! > 400 || body.rows! < 2 || body.rows! > 200) throw new Error('INVALID_INPUT');
      if (!session.exited) session.terminal.resize(body.cols!, body.rows!);
    }
    return { output: session.output.slice(Math.max(0, cursor - session.offset)), cursor: session.offset + session.output.length, truncated: cursor < session.offset, exited: session.exited, exitCode: session.exitCode };
  }
  if (session.exited) throw new Error('TERMINAL_EXITED');
  if (body.action === 'write') {
    if (typeof body.data !== 'string' || body.data.length > 8000) throw new Error('INVALID_INPUT');
    session.terminal.write(body.data); return { written: true };
  }
  if (body.action === 'resize') {
    if (!Number.isInteger(body.cols) || !Number.isInteger(body.rows) || body.cols! < 10 || body.cols! > 400 || body.rows! < 2 || body.rows! > 200) throw new Error('INVALID_INPUT');
    session.terminal.resize(body.cols!, body.rows!); return { resized: true };
  }
  throw new Error('INVALID_INPUT');
}
