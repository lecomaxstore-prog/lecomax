export const PYTHON_CODE_LIMIT = 64000;
export const PYTHON_FILE_PREFIX = 'python-script:';
export function pythonDraftKey(seed = '') {
  if (!seed) return 'python-studio:draft';
  // Two independent hashes plus length avoid using lesson source text as a storage key.
  let a = 2166136261, b = 5381;
  for (let i = 0; i < seed.length; i++) { a = Math.imul(a ^ seed.charCodeAt(i), 16777619); b = Math.imul(b, 33) ^ seed.charCodeAt(i); }
  return `python-lesson:${seed.length}:${a >>> 0}:${b >>> 0}`;
}
export function pythonFileName(value: string) {
  const name = value.trim().replace(/\.py$/i, '');
  if (!name || name.length > 60 || /[\x00-\x1f/\\:<>"|?*]/.test(name)) throw new Error('Use a name of 1–60 characters without path separators or reserved symbols.');
  return name;
}
export function managePythonFile(drafts: Record<string, string>, action: 'save' | 'rename' | 'delete', name: string, code = '', previous?: string) {
  const key = PYTHON_FILE_PREFIX + pythonFileName(name);
  const next = { ...drafts };
  if (action === 'save') {
    if (code.length > PYTHON_CODE_LIMIT) throw new Error('Script exceeds 64,000 characters.');
    if (!(key in drafts) && Object.keys(drafts).filter(k => k.startsWith(PYTHON_FILE_PREFIX)).length >= 100) throw new Error('Keep up to 100 practice files. Export or delete a file before adding another.');
    next[key] = code;
  } else if (action === 'rename') {
    const old = PYTHON_FILE_PREFIX + pythonFileName(previous || '');
    if (!(old in drafts)) throw new Error('Open an existing file first.');
    if (key !== old && key in drafts) throw new Error('That name already exists. Choose a different name.');
    next[key] = drafts[old]!;
    if (key !== old) delete next[old];
  } else {
    if (!(key in drafts)) throw new Error('File not found.');
    delete next[key];
  }
  return next;
}

export type PythonExercise = { id: string; title: string; theory: string; task: string; starter: string; hints: string[]; solution: string; cases: { label: string; input: string; suffix?: string; output: string }[] };
export const pythonExercises: PythonExercise[] = [
  { id: 'greeting', title: '1 · Meet input()', theory: 'input() returns text. print() writes a line. Read two answers in their requested order.', task: 'Read a name and a city, without input prompts. Print exactly: Hello NAME from CITY!', starter: 'name = input()\ncity = input()\n# Print the greeting\n', hints: ['Keep both answers in separate variables.', 'An f-string inserts values: f"Hello {name}".'], solution: 'name = input()\ncity = input()\nprint(f"Hello {name} from {city}!")', cases: [{ label: 'Two ordinary answers', input: 'Ada\nParis\n', output: 'Hello Ada from Paris!\n' }, { label: 'Unicode and spaces', input: 'أمل\nNew York\n', output: 'Hello أمل from New York!\n' }, { label: 'Empty name', input: '\nRabat\n', output: 'Hello  from Rabat!\n' }] },
  { id: 'sum', title: '2 · A small calculator', theory: 'Convert input text with int() before adding. Negative integers work too.', task: 'Read two integers without prompts and print their sum.', starter: 'first = int(input())\nsecond = int(input())\n# Print their sum\n', hints: ['Adding strings joins text; adding integers performs arithmetic.', 'Use print(first + second).'], solution: 'first = int(input())\nsecond = int(input())\nprint(first + second)', cases: [{ label: 'Positive values', input: '8\n5\n', output: '13\n' }, { label: 'Negative value', input: '-8\n5\n', output: '-3\n' }, { label: 'Zero', input: '0\n0\n', output: '0\n' }] },
  { id: 'loop', title: '3 · Count with a loop', theory: 'range(1, n + 1) includes n. Start a running total at zero before the loop.', task: 'Read a nonnegative integer n and print the sum of integers from 1 through n.', starter: 'n = int(input())\ntotal = 0\n# Add the integers, then print total\n', hints: ['Use a for loop with range(1, n + 1).', 'Inside the loop: total += number. Print after the loop.'], solution: 'n = int(input())\ntotal = 0\nfor number in range(1, n + 1):\n    total += number\nprint(total)', cases: [{ label: 'Five numbers', input: '5\n', output: '15\n' }, { label: 'Empty range', input: '0\n', output: '0\n' }, { label: 'One number', input: '1\n', output: '1\n' }, { label: 'Larger range', input: '100\n', output: '5050\n' }] },
  { id: 'function', title: '4 · Return from a function', theory: 'return sends a value to the caller. A function need not print anything.', task: 'Define square(number), returning number multiplied by itself. Do not print at the top level.', starter: 'def square(number):\n    # Return the square\n    pass\n', hints: ['Multiply with *, not ^ (which means bitwise XOR).', 'Use return number * number.'], solution: 'def square(number):\n    return number * number', cases: [{ label: 'Positive', input: '', suffix: '\nprint(square(4))', output: '16\n' }, { label: 'Negative', input: '', suffix: '\nprint(square(-3))', output: '9\n' }, { label: 'Zero', input: '', suffix: '\nprint(square(0))', output: '0\n' }] },
  { id: 'class', title: '5 · Your first class', theory: 'An instance keeps its own state. __init__ creates it; methods access it through self.', task: 'Define Counter with value initially 0 and an increment() method that adds 1. Do not print at the top level.', starter: 'class Counter:\n    def __init__(self):\n        self.value = 0\n\n    def increment(self):\n        pass\n', hints: ['Change self.value inside increment().', 'Use self.value += 1. Each new instance should start at zero.'], solution: 'class Counter:\n    def __init__(self):\n        self.value = 0\n\n    def increment(self):\n        self.value += 1', cases: [{ label: 'Initial value', input: '', suffix: '\nprint(Counter().value)', output: '0\n' }, { label: 'Two increments', input: '', suffix: '\nc = Counter()\nc.increment()\nc.increment()\nprint(c.value)', output: '2\n' }, { label: 'Independent instances', input: '', suffix: '\na, b = Counter(), Counter()\na.increment()\nprint(a.value, b.value)', output: '1 0\n' }] },
];
export function checkPythonAnswer(result: { stdout: string; stderr: string; exitCode: number | null; truncated: boolean }, expected: string) {
  return result.exitCode === 0 && !result.stderr && !result.truncated && result.stdout.replace(/\r\n/g, '\n').replace(/\n$/, '') === expected.replace(/\n$/, '');
}
