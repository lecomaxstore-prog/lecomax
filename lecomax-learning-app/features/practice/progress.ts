export type Attempt = { attempts: number; firstCorrect: boolean; correct: boolean; choice: number; usedHint: boolean; at: string };
export const attemptKey = (id: string) => `practice:v1:attempt:${id}`;
export const noteKey = (id: string) => `practice:v1:note:${id}`;
export function readAttempt(raw?: string): Attempt | undefined {
  try {
    if (!raw) return;
    const v = JSON.parse(raw);
    if (!v || !Number.isSafeInteger(v.attempts) || v.attempts < 1 || typeof v.firstCorrect !== 'boolean' || typeof v.correct !== 'boolean' || !Number.isInteger(v.choice) || v.choice < 0 || v.choice > 2 || typeof v.usedHint !== 'boolean' || typeof v.at !== 'string' || !Number.isFinite(Date.parse(v.at))) return;
    return v;
  } catch { return; }
}
export function recordAttempt(previous: Attempt | undefined, choice: number, answer: number, usedHint: boolean, at = new Date().toISOString()): Attempt {
  if (![choice, answer].every(n => Number.isInteger(n) && n >= 0 && n <= 2)) throw new Error('Invalid answer');
  const correct = choice === answer;
  return { attempts: (previous?.attempts ?? 0) + 1, firstCorrect: previous?.firstCorrect ?? (correct && !usedHint), correct, choice, usedHint, at };
}
export function dailyIndex(day: string, count: number) {
  if (count < 1) return 0;
  return [...day].reduce((value, char) => (value * 31 + char.charCodeAt(0)) >>> 0, 0) % count;
}
