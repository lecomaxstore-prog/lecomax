export const studioTools = [
  ['python', 'Python Studio', 'Run real Python, practise functions and inspect tracebacks.'],
  ['javascript', 'JavaScript Studio', 'Run isolated JavaScript and test functions.'],
  ['typescript', 'TypeScript Studio', 'Compile typed programs and test their behavior.'],
  ['web', 'HTML/CSS Studio', 'Build a page with a separate, restricted preview.'],
  ['sql', 'SQL Playground', 'Query a disposable shop database.'],
  ['react', 'React / Next.js', 'Build a React component; study Next.js through guided tasks.'],
  ['math', 'Math Lab', 'Calculate expressions, graph functions and solve equations.'],
  ['science', 'Science Lab', 'Experiment with motion and check predictions.'],
  ['language', 'Language Practice', 'Practise translation, recall and optional listening.'],
  ['quiz', 'Quiz Arena', 'Check answers with explicit rules and explanations.'],
  ['cards', 'Flashcard Review', 'Create decks and schedule spaced reviews.'],
  ['board', 'AI Whiteboard', 'Draw, label and save a visual explanation.'],
  ['projects', 'Guided Projects', 'Build and evaluate work milestone by milestone.'],
] as const;
export type ToolId = typeof studioTools[number][0];
export type RunResult = { output: string; error: string; tables: { columns: string[]; values: (string | number | null)[][] }[]; tests: { label: string; passed: boolean; actual: string }[] };
export const sqlSchema = `CREATE TABLE customers(id INTEGER PRIMARY KEY, name TEXT, city TEXT);
CREATE TABLE orders(id INTEGER PRIMARY KEY, customer_id INTEGER REFERENCES customers(id), total REAL);
INSERT INTO customers VALUES(1,'Amina','Rabat'),(2,'Youssef','Casablanca'),(3,'Sara','Rabat');
INSERT INTO orders VALUES(1,1,80),(2,1,120),(3,2,50);`;
export const sqlExamples = [
  ['SELECT', 'SELECT name, city FROM customers;'],
  ['WHERE', "SELECT name FROM customers WHERE city = 'Rabat';"],
  ['ORDER BY', 'SELECT total FROM orders ORDER BY total DESC;'],
  ['JOIN', 'SELECT customers.name, orders.total FROM customers JOIN orders ON customers.id = orders.customer_id ORDER BY orders.id;'],
  ['GROUP BY / HAVING', 'SELECT customer_id, SUM(total) AS spent FROM orders GROUP BY customer_id HAVING SUM(total) > 100;'],
  ['Subquery', 'SELECT name FROM customers WHERE id IN (SELECT customer_id FROM orders WHERE total > 100);'],
] as const;
export const starters: Record<string, string> = {
  javascript: 'function square(n) {\n  return n * n;\n}\nconsole.log(square(4));',
  typescript: 'function square(n: number): number {\n  return n * n;\n}\nconsole.log(square(4));',
  sql: sqlExamples[0][1],
  web: '<!doctype html>\n<html><head><style>\nbody { font-family: system-ui; padding: 24px; background: #eef5ef; }\nbutton { padding: 12px; }\n</style></head><body>\n<h1>My learning portfolio</h1>\n<p>I am learning by building.</p>\n<button>Explore my work</button>\n</body></html>',
  react: 'function App() {\n  const [count, setCount] = React.useState(0);\n  return <button onClick={() => setCount(count + 1)}>Count: {count}</button>;\n}\n',
};
export type CardRecord = { id: string; deck: string; front: string; back: string; due: number; interval: number; ease: number; repetitions: number; reviews: number; lapses: number };
export function reviewCard(card: CardRecord, rating: 'again' | 'hard' | 'good' | 'easy', now: number): CardRecord {
  // SM-2 quality grades: again=1, hard=3, good=4, easy=5.
  const q = { again: 1, hard: 3, good: 4, easy: 5 }[rating];
  const ease = Math.max(1.3, card.ease + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  const repetitions = q < 3 ? 0 : card.repetitions + 1;
  const interval = q < 3 ? 0 : repetitions === 1 ? 1 : repetitions === 2 ? 6 : Math.round(card.interval * card.ease);
  return { ...card, ease, repetitions, interval, due: now + (q < 3 ? 60000 : interval * 86400000), reviews: card.reviews + 1, lapses: card.lapses + (q < 3 ? 1 : 0) };
}
export function cardsFromNotes(text: string, deck: string, now: number): CardRecord[] {
  return text.split('\n').filter(line => line.includes('::')).slice(0, 50).flatMap((line, i) => {
    const [front = '', ...rest] = line.split('::'); const back = rest.join('::').trim();
    return front.trim() && back ? [{ id: `${now}-${i}`, deck: deck.slice(0, 80) || 'Notes', front: front.trim().slice(0, 1000), back: back.slice(0, 2000), due: now, interval: 0, ease: 2.5, repetitions: 0, reviews: 0, lapses: 0 }] : [];
  });
}
// Small bounded expression parser. No eval, property access, variables other than x, or executable input.
export function calculate(source: string, x = 0): number {
  if (source.length > 300 || !Number.isFinite(x)) throw new Error('Expression too long or invalid x.');
  const tokens = source.match(/(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?|[a-z]+|[()+\-*/^]/gi) || [];
  if (tokens.join('') !== source.replace(/\s/g, '') || tokens.length > 150) throw new Error('Use numbers, x, + − * / ^, parentheses, sin, cos, sqrt or abs.');
  let pos = 0;
  const atom = (): number => {
    const t = tokens[pos++];
    if (t === '(') { const v = sum(); if (tokens[pos++] !== ')') throw new Error('Missing closing parenthesis.'); return v; }
    if (t === 'x') return x;
    if (t === 'pi') return Math.PI;
    if (['sin', 'cos', 'sqrt', 'abs'].includes(t || '')) { if (tokens[pos++] !== '(') throw new Error('Function needs parentheses.'); const v = sum(); if (tokens[pos++] !== ')') throw new Error('Missing closing parenthesis.'); return ({ sin: Math.sin, cos: Math.cos, sqrt: Math.sqrt, abs: Math.abs }[t!]!)(v); }
    if (!t || !/^(?:\d|\.)/.test(t)) throw new Error('Expected a number or expression.');
    return Number(t);
  };
  const power = (): number => { const v = atom(); return tokens[pos] === '^' ? (pos++, v ** unary()) : v; };
  const unary = (): number => tokens[pos] === '-' ? (pos++, -unary()) : tokens[pos] === '+' ? (pos++, unary()) : power();
  const product = (): number => { let v = unary(); while (tokens[pos] === '*' || tokens[pos] === '/') { const op = tokens[pos++]; const n = unary(); v = op === '*' ? v * n : v / n; } return v; };
  const sum = (): number => { let v = product(); while (tokens[pos] === '+' || tokens[pos] === '-') { const op = tokens[pos++]; const n = product(); v = op === '+' ? v + n : v - n; } return v; };
  const result = sum(); if (pos !== tokens.length || !Number.isFinite(result)) throw new Error('Undefined result or incomplete expression.'); return result;
}
export type Question = { id: string; kind: 'choice' | 'boolean' | 'fill' | 'short' | 'matching' | 'ordering' | 'number'; prompt: string; answer: string; options?: string[]; explanation: string; hint: string; objective: string; difficulty: string };
export const quizQuestions: Question[] = [
  { id: 'q1', kind: 'choice', prompt: 'Which Python operator multiplies?', answer: '*', options: ['*', '^', '+'], explanation: '* multiplies. ** raises to a power.', hint: 'It is the asterisk.', objective: 'Python operators', difficulty: 'Beginner' },
  { id: 'q2', kind: 'boolean', prompt: 'A SQL INNER JOIN includes every unmatched row.', answer: 'False', options: ['True', 'False'], explanation: 'INNER JOIN returns matching pairs only.', hint: 'Think about what inner means.', objective: 'Relationships', difficulty: 'Beginner' },
  { id: 'q3', kind: 'fill', prompt: 'Complete: SELECT * FROM orders ___ total > 50;', answer: 'WHERE', explanation: 'WHERE filters individual rows.', hint: 'A five-letter filtering keyword.', objective: 'SQL filters', difficulty: 'Beginner' },
  { id: 'q4', kind: 'number', prompt: 'Solve 3x + 2 = 14. Enter x or a numeric expression.', answer: '4', explanation: 'Subtract 2: 3x = 12. Divide by 3: x = 4.', hint: 'Undo addition first.', objective: 'Linear equations', difficulty: 'Beginner' },
  { id: 'q5', kind: 'ordering', prompt: 'Order these operations: print result, read input, calculate. Separate with commas.', answer: 'read input,calculate,print result', explanation: 'Read data before calculating; print after the result exists.', hint: 'Input comes first.', objective: 'Algorithms', difficulty: 'Beginner' },
  { id: 'q6', kind: 'matching', prompt: 'Match HTML, CSS, JavaScript to structure, style, behavior. Enter HTML=…,CSS=…,JavaScript=…', answer: 'html=structure,css=style,javascript=behavior', explanation: 'HTML structures content; CSS styles it; JavaScript adds behavior.', hint: 'CSS controls appearance.', objective: 'Web roles', difficulty: 'Beginner' },
  { id: 'q7', kind: 'short', prompt: 'What keyword returns a value from a Python function? One keyword.', answer: 'return', explanation: 'return sends a result to the caller.', hint: 'It is not print.', objective: 'Functions', difficulty: 'Beginner' },
];
export function gradeAnswer(q: Question, answer: string): boolean {
  if (!answer.trim()) return false;
  if (q.kind === 'number') { try { return Math.abs(calculate(answer) - Number(q.answer)) <= 1e-8 * Math.max(1, Math.abs(Number(q.answer))); } catch { return false; } }
  const normalize = (v: string) => v.trim().toLowerCase().replace(/\s+/g, ' ');
  if (q.kind === 'ordering' || q.kind === 'matching') {
    const parts = (v: string) => v.split(',').map(p => normalize(p).replace(/\s*=\s*/g, '='));
    const a = parts(answer), b = parts(q.answer); if (q.kind === 'matching') { a.sort(); b.sort(); } return JSON.stringify(a) === JSON.stringify(b);
  }
  return normalize(answer) === normalize(q.answer);
}
export function readSaved<T>(raw: string | undefined, fallback: T): T {
  try {
    if (!raw || raw.length > 2000000) return fallback;
    const value = JSON.parse(raw);
    if (value === null || typeof value !== typeof fallback || Array.isArray(value) !== Array.isArray(fallback)) return fallback;
    return value as T;
  } catch { return fallback; }
}
export function readCards(raw: string | undefined): CardRecord[] {
  return readSaved<unknown[]>(raw, []).filter((v): v is CardRecord => {
    if (!v || typeof v !== 'object') return false;
    const c = v as CardRecord;
    return ['id','deck','front','back'].every(k => typeof c[k as keyof CardRecord] === 'string') && c.front.length <= 1000 && c.back.length <= 2000 && ['due','interval','ease','repetitions','reviews','lapses'].every(k => typeof c[k as keyof CardRecord] === 'number' && Number.isFinite(c[k as keyof CardRecord]) && Number(c[k as keyof CardRecord]) >= 0);
  }).slice(0,500);
}
