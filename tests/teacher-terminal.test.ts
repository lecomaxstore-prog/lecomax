import test from 'node:test';
import assert from 'node:assert/strict';
import { terminalAction, stopTerminal } from '../lib/teacher-terminal.ts';
import { resolveTerminalRuntime } from '../lib/teacher-runtimes.ts';
const owner = 'terminal-test-owner';
function start(runtime: 'python' | 'powershell' | 'javascript' | 'kali') { return terminalAction(owner, { action: 'start', runtime }) as { id: string }; }
function write(id: string, data: string) { terminalAction(owner, { action: 'write', id, data }); }
async function until(id: string, expected: RegExp, timeout = 15000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    const result = terminalAction(owner, { action: 'read', id, cursor: 0 }) as { output: string };
    const text = result.output.replace(/\x1b\[[0-?]*[ -/]*[@-~]/g, '').replace(/\x1b\][^\x07]*(?:\x07)/g, '');
    if (expected.test(text)) return text;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error('Expected terminal output not received: ' + expected);
}
test('real PowerShell keeps variables and directory between commands', async () => {
  const { id } = start('powershell');
  try {
    await until(id, /PS /);
    write(id, '$learningValue = 40\r');
    write(id, "Write-Output ('PS_' + 'VALUE ' + ($learningValue + 2))\r");
    await until(id, /PS_VALUE 42/);
    write(id, "New-Item -ItemType Directory child | Out-Null; Set-Location child\r");
    write(id, "Write-Output ('DIR_' + (Split-Path -Leaf (Get-Location)))\r");
    await until(id, /DIR_child/);
    assert.throws(() => terminalAction('another-owner', { action: 'read', id }), /TERMINAL_NOT_FOUND/);
  } finally { stopTerminal(id, owner); }
  assert.throws(() => terminalAction(owner, { action: 'read', id }), /TERMINAL_NOT_FOUND/);
});
test('real Python supports variables, interactive input and Ctrl+C', async () => {
  const { id } = start('python');
  try {
    await until(id, />>>/);
    write(id, 'learning_value = 40\r');
    write(id, "print('PY_' + 'VALUE', learning_value + 2)\r");
    await until(id, /PY_VALUE 42/);
    write(id, "name = input('Enter name: ')\r");
    await until(id, /Enter name:/);
    write(id, 'Ziko\r');
    write(id, "print('INPUT_' + name)\r");
    await until(id, /INPUT_Ziko/);
    write(id, 'import time; time.sleep(60)\r');
    await new Promise(resolve => setTimeout(resolve, 500));
    write(id, '\x03');
    await until(id, /KeyboardInterrupt/);
  } finally { stopTerminal(id, owner); }
});
test('real Node REPL keeps state and validates input and resize', async () => {
  const { id } = start('javascript');
  try {
    await until(id, /Welcome to Node/);
    write(id, 'let learningValue = 40\r');
    write(id, 'console.log("NODE_" + "VALUE", learningValue + 2)\r');
    await until(id, /NODE_VALUE 42/);
    terminalAction(owner, { action: 'resize', id, cols: 100, rows: 30 });
    assert.throws(() => terminalAction(owner, { action: 'resize', id, cols: -1, rows: 10 }), /INVALID_INPUT/);
    assert.throws(() => terminalAction(owner, { action: 'write', id, data: 'a'.repeat(8001) }), /INVALID_INPUT/);
  } finally { stopTerminal(id, owner); }
});

test('runtime discovery reports actual versions and setup instructions', () => {
  const result = terminalAction(owner, { action: 'runtimes' }) as { runtimes: { runtime: string; available: boolean; version: string; setup: string }[] };
  assert.equal(result.runtimes.length, 4);
  assert.equal(result.runtimes.find(item => item.runtime === 'javascript')?.version, process.version);
  for (const runtime of result.runtimes) {
    assert.ok(runtime.setup);
    if (runtime.available) assert.ok(runtime.version);
  }
  assert.throws(() => terminalAction(owner, { action: 'start', runtime: 'unknown' }), /INVALID_INPUT/);
});

test('real Kali Bash preserves state and identifies the Linux distribution', async (t) => {
  if (!resolveTerminalRuntime('kali')) { t.skip('Kali WSL not installed on this host'); return; }
  const { id } = start('kali');
  try {
    write(id, "printf 'KALI_%s\\n' READY\r");
    await until(id, /KALI_READY/);
    write(id, "learning_value=42\r");
    write(id, "printf 'VALUE_%s\\n' $learning_value\r");
    await until(id, /VALUE_42/);
    write(id, ". /etc/os-release; printf 'DISTRO_%s\\n' $ID\r");
    await until(id, /DISTRO_kali/);
    assert.throws(() => terminalAction('another-owner', { action: 'write', id, data: 'exit\r' }), /TERMINAL_NOT_FOUND/);
  } finally { stopTerminal(id, owner); }
});
