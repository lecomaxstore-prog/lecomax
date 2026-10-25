// Deterministic guidance, never an AI diagnosis. Keep the actual traceback visible.
const advice: Record<string, [string, string]> = {
  SyntaxError: ['Python could not understand the structure of this statement.', 'Check colons, quotes and matching brackets. Example: if score > 0:\n    print(score)'],
  IndentationError: ['The indentation does not form a valid block.', 'Use four spaces inside a function, loop or condition. Keep statements in the same block aligned.'],
  TabError: ['Tabs and spaces are mixed in the indentation.', 'Replace indentation tabs with four spaces and align each block.'],
  NameError: ['A name was used before Python could find its value.', 'Check spelling and define the name before using it. Example: name = "Ada"\nprint(name)'],
  TypeError: ['An operation received a value of an incompatible type or the wrong arguments.', 'Check the types and function arguments. Example: age = int("20")\nprint(age + 1)'],
  ValueError: ['The type is accepted, but the value cannot be used for this operation.', 'Validate the value before conversion. Example: text = "20"\nnumber = int(text)'],
  IndexError: ['A sequence position is outside its available range.', 'Indexes start at zero. Check len(items) before indexing, or loop directly over items.'],
  KeyError: ['The requested dictionary key does not exist.', 'Check the key spelling or use a default: person.get("name", "Unknown")'],
  ZeroDivisionError: ['The program tried to divide by zero.', 'Check the denominator first. Example: if count != 0:\n    average = total / count'],
  ModuleNotFoundError: ['Python could not find the requested module.', 'Check its spelling. This browser runner provides the bundled standard library, not arbitrary installed packages or server frameworks.'],
  ImportError: ['Python found an import problem, such as a missing name in a module.', 'Read the last line of the traceback. Check the module name and the name after import. Some packages are unavailable in this runtime.'],
  AttributeError: ['This value does not provide the requested attribute or method.', 'Check the value type and method spelling. Example: "hello".upper()'],
  EOFError: ['input() reached the end of the supplied answers.', 'Add one answer per input() call in the input box, then run again. Empty lines are valid answers.'],
};

export function explainPythonError(stderr: string) {
  const lines = stderr.split('\n');
  const pattern = stderr.includes('Traceback (most recent call last):') ? /^([A-Za-z_]\w*(?:\.\w+)*):\s*(.*)$/ : /^(\w+(?:Error|Exception)|SystemExit|KeyboardInterrupt):\s*(.*)$/;
  const summary = [...lines].reverse().find(line => pattern.test(line.trim()));
  const match = summary?.trim().match(pattern);
  if (!match) return null;
  const learnerFrames = [...stderr.matchAll(/File "(?:lesson\.py|main\.py)", line (\d+)/g)];
  const location = learnerFrames.pop();
  const [why, fix] = advice[match[1]!] || ['Python stopped with the exception shown in the traceback. The exact cause needs more context.', 'Check the final exception message and the highlighted line. Use Explain Error for help with the executed code; keep the original traceback when asking for help.'];
  return { type: match[1]!, message: match[2]!, line: location ? Number(location[1]) : null, why, fix };
}
