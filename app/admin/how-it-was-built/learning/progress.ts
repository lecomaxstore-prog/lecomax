export const PROGRESS_KEY = 'lecomax-site-code-learning-v1';
export type Review = { due: string; interval: number; misses: number; successes: number };
export type Progress = { bookmarks: string[]; current: string; completed: string[]; exercises: string[]; quizzes: Record<string, number>; struggles: string[]; projects: string[]; days: string[]; notes: Record<string, string>; lessonSteps: Record<string, number>; drafts: Record<string, string>; reviews: Record<string, Review> };
const list = (value: unknown): string[] => Array.isArray(value) ? [...new Set(value.filter((item): item is string => typeof item === 'string' && item.length < 100))].slice(-400) : [];
export function readProgress(raw: unknown, ids: string[]): Progress {
  const value = raw && typeof raw === 'object' ? raw as Partial<Progress> : {};
  const bookmarks = list(value.bookmarks).filter(id => ids.includes(id));
  const drafts = Object.fromEntries(Object.entries(value.drafts && typeof value.drafts === 'object' ? value.drafts : {}).filter(([id, draft]) => ids.includes(id) && typeof draft === 'string').map(([id, draft]) => [id, draft.slice(0, 180)]));
  const reviews = Object.fromEntries(Object.entries(value.reviews && typeof value.reviews === 'object' ? value.reviews : {}).filter(([id, review]) => ids.includes(id) && review && typeof review === 'object' && /^\d{4}-\d{2}-\d{2}$/.test(review.due) && Number.isFinite(Date.parse(review.due)) && [review.interval, review.misses, review.successes].every(n => Number.isInteger(n) && n >= 0 && n <= 365)));
  return { bookmarks, drafts, reviews, lessonSteps: Object.fromEntries(Object.entries(value.lessonSteps && typeof value.lessonSteps === 'object' ? value.lessonSteps : {}).filter(([id, step]) => ids.includes(id) && Number.isInteger(step) && step >= 0 && step <= 3)), notes: Object.fromEntries(Object.entries(value.notes && typeof value.notes === 'object' ? value.notes : {}).filter(([id, note]) => /^[a-z0-9-]{1,80}$/.test(id) && typeof note === 'string').slice(0, 40).map(([id, note]) => [id, String(note).slice(0, 2000)])), current: typeof value.current === 'string' && ids.includes(value.current) ? value.current : ids[0], completed: list(value.completed).filter(id => ids.includes(id)), exercises: list(value.exercises).filter(id => ids.includes(id)), struggles: list(value.struggles).filter(id => ids.includes(id)), projects: list(value.projects), days: list(value.days).filter(day => /^\d{4}-\d{2}-\d{2}$/.test(day)), quizzes: Object.fromEntries(Object.entries(value.quizzes && typeof value.quizzes === 'object' ? value.quizzes : {}).filter(([id, score]) => ids.includes(id) && Number.isInteger(score) && score >= 0 && score <= 2)) };
}
export const dayKey = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
/** Reviews are scheduled in local calendar days, not 24-hour offsets (DST safe). */
export function recordReview(previous: Review | undefined, correct: boolean, now = new Date()): Review {
  const interval = correct ? Math.min(30, previous?.successes ? Math.max(1, previous.interval) * 2 : 1) : 0;
  const due = new Date(now); due.setDate(due.getDate() + interval);
  return { due: dayKey(due), interval, misses: Math.min(365, (previous?.misses ?? 0) + Number(!correct)), successes: correct ? Math.min(365, (previous?.successes ?? 0) + 1) : 0 };
}
export function dueReviews(progress: Progress, today = dayKey()): string[] {
  return Object.entries(progress.reviews).filter(([, review]) => review.due <= today).sort((a, b) => a[1].due.localeCompare(b[1].due)).map(([id]) => id);
}
export const matchesAnswer = (attempt: string, answers: string[]) => answers.some(answer => answer.trim() === attempt.trim());
export function streak(days: string[], now = new Date()) { let count=0; const date=new Date(now); if(!days.includes(dayKey(date))) date.setDate(date.getDate()-1); while(days.includes(dayKey(date))) { count++; date.setDate(date.getDate()-1); } return count; }
export const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
/** Parse a tiny declarative exercise, never evaluate learner code. */
export function runPlayground(code: string): { title: string; price: number; quantity: number } | null {
  const match = /^\s*const title = "([^"\n]{1,80})";\s*const price = (\d{1,4});\s*const quantity = (\d{1,2});\s*$/.exec(code);
  if (!match || Number(match[3]) < 1) return null;
  return { title: match[1], price: Number(match[2]), quantity: Number(match[3]) };
}
