const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { load } = require('../scripts/inspect.cjs');
const { explainPythonError } = load('lecomax-learning-app/utils/python-errors.ts');
const { pythonWorker, pythonSandboxDocument, validPythonResult } = load('lecomax-learning-app/utils/python-sandbox.ts');

test('guidance covers requested errors, uses the last learner frame, and avoids invented diagnoses', () => {
  for (const type of ['SyntaxError', 'IndentationError', 'NameError', 'TypeError', 'ValueError', 'IndexError', 'KeyError', 'ZeroDivisionError', 'ImportError', 'ModuleNotFoundError', 'AttributeError', 'EOFError']) {
    const result = explainPythonError(`Traceback:\n  File "lesson.py", line 2\n  File "lesson.py", line 7\n${type}: example`);
    assert.equal(result.type, type); assert.equal(result.line, 7); assert(result.why); assert(result.fix);
  }
  assert.equal(explainPythonError('Runtime unavailable'), null);
  assert.match(explainPythonError('OSError: unavailable').why, /needs more context/);
  assert.equal(explainPythonError('  File "<string>", line 90\n  File "lesson.py", line 3\nNameError: missing').line, 3);
  assert.equal(explainPythonError('NameError: missing').line, null);
  assert.equal(explainPythonError('  File "<exec>", line 99\nRuntimeError: runtime bridge').line, null);
  assert.match(explainPythonError('Traceback (most recent call last):\n  File "lesson.py", line 2\nCustomProblem: details').why, /needs more context/);
});

test('sandbox bridge rejects strangers, prevents duplicate workers and releases resources', () => {
  let receive, instance, terminated = 0, revoked = 0;
  const parent = { postMessage() {} };
  class Worker {
    constructor() { instance = this; }
    postMessage(value) { this.value = value; }
    terminate() { terminated++; }
  }
  vm.runInNewContext(pythonSandboxDocument.match(/<script>([\s\S]*)<\/script>/)[1], {
    parent, window: { addEventListener: (_, fn) => { receive = fn; } }, Blob, Worker,
    URL: { createObjectURL: () => 'blob:test', revokeObjectURL: () => { revoked++; } },
  });
  receive({ source: {}, data: { type: 'run' } }); assert.equal(instance, undefined);
  receive({ source: parent, data: { type: 'run', code: 'print(1)' } });
  const first = instance;
  receive({ source: parent, data: { type: 'run' } }); assert.equal(instance, first);
  receive({ source: parent, data: { type: 'stop' } }); assert.equal(terminated, 1); assert.equal(revoked, 1);
  assert.match(pythonSandboxDocument, /default-src 'none'/);
  assert.match(pythonSandboxDocument, /connect-src https:\/\/cdn.jsdelivr.net\/pyodide\/v0.27.7\/full\//);
});

test('worker performs only one run and validates message sizes before loading', async () => {
  const messages = []; let imports = 0, runs = 0;
  const self = { postMessage: message => messages.push(message) };
  const context = { self, importScripts: () => { imports++; }, loadPyodide: async () => ({ globals: { set() {} }, runPythonAsync: async () => { runs++; return JSON.stringify({ stdout: '3\n', stderr: '', exitCode: 0, durationMs: 2, truncated: false }); } }) };
  vm.runInNewContext(pythonWorker, context);
  await self.onmessage({ data: { type: 'run', code: 'x'.repeat(64001), input: '' } }); assert.equal(imports, 0);
  await Promise.all([self.onmessage({ data: { type: 'run', code: 'print(3)', input: '' } }), self.onmessage({ data: { type: 'run', code: 'print(4)', input: '' } })]);
  assert.equal(imports, 1); assert.equal(runs, 1); assert.equal(messages[1].result.stdout, '3\n');
  assert(validPythonResult(messages[1].result));
  assert(!validPythonResult({ ...messages[1].result, stdout: 'x'.repeat(24001) }));
  assert(!validPythonResult({ ...messages[1].result, durationMs: Infinity }));
});

test('worker Python wrapper executes real Python, captures input/errors, and bounds output', () => {
  const { spawnSync } = require('node:child_process');
  const wrapper = pythonWorker.match(/runPythonAsync\(`([\s\S]*?)`\)/)[1];
  const cases = [
    ['print(2 + 3)', '', '5\n', ''],
    ['print("Hello World")\nprint("مرحبا 🐍")', '', 'Hello World\nمرحبا 🐍\n', ''],
    ['class Counter:\n    def double(self, n):\n        return n * 2\nfor i in range(3):\n    print(Counter().double(i))', '', '0\n2\n4\n', ''],
    ['name = input("Name: "); print(name)', 'Ada\n', 'Name: Ada\n', ''],
    ['print(input())', '', '', 'EOFError'],
    ['print(1 / 0)', '', '', 'ZeroDivisionError'],
    ['if True print(1)', '', '', 'SyntaxError'],
    ['print(unknown_variable)', '', '', 'NameError'],
    ['import no_such_lecomax_module', '', '', 'ModuleNotFoundError'],
    ['import sys\nprint("first")\nprint("warning", file=sys.stderr)\nprint("last")', '', 'first\nlast\n', 'warning'],
    ['import sys\nsys.exit(0)', '', '', ''],
    ['print("x" * 50000)', '', null, ''],
  ];
  for (const [code, input, stdout, error] of cases) {
    const program = `_lesson_code = ${JSON.stringify(code)}\n_lesson_input = ${JSON.stringify(input)}\n_lesson_interactive = False\n` + wrapper.replace(/json.dumps\(\{'stdout'/, "_result = json.dumps({'stdout'") + '\nprint(_result)';
    const python = process.env.PYTHON_EXECUTABLE || (process.platform === 'win32' ? `${process.env.LOCALAPPDATA}/Python/pythoncore-3.14-64/python.exe` : 'python3');
    const execution = spawnSync(python, ['-c', program], { encoding: 'utf8', timeout: 15000 });
    assert.equal(execution.status, 0, String(execution.error || execution.stderr));
    const result = JSON.parse(execution.stdout);
    if (stdout !== null) assert.equal(result.stdout, stdout); else { assert.equal(result.stdout.length, 24000); assert.equal(result.truncated, true); }
    assert(result.stderr.includes(error)); assert.equal(result.exitCode, error && error !== 'warning' ? 1 : 0);
    assert(validPythonResult(result));
    if (error === 'warning') assert.equal(result.output.map(item => item.text).join(''), 'first\nwarning\nlast\n');
  }
});

test('web Python uses the isolated workspace, leaving PC runtimes intact', () => {
  const source = fs.readFileSync(require.resolve('../components/TeacherLab.web.tsx'), 'utf8');
  assert.match(source, /opened\.filter\(value => value !== 'python'\)/);
  assert.match(source, /<PythonStudio/);
});
