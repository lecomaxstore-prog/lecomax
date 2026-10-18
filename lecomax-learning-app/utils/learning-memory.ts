import type { Progress } from './progress';
export type LearningEvidence = { lessonId: string; questionId: string; choice: number; correct: boolean; at: number; independent: boolean };
export type ReviewRecord = { lessonId: string; questionId: string; dueAt: number; lastAt: number; intervalDays: number; recalls: number; mistakes: number };
export type LearningMemory = { version: 1; evidence: LearningEvidence[]; reviews: Record<string, ReviewRecord> };
export const emptyMemory = (): LearningMemory => ({ version: 1, evidence: [], reviews: {} });
const DAY = 86400000;
export function readMemory(value: unknown): LearningMemory {
  if (value === undefined) return emptyMemory();
  const m = value as LearningMemory;
  const text = (v: unknown) => typeof v === 'string' && v.length > 0 && v.length <= 500;
  const integer = (v: number) => Number.isSafeInteger(v) && v >= 0;
  if (!m || m.version !== 1 || !Array.isArray(m.evidence) || m.evidence.length > 5000 || !m.reviews || typeof m.reviews !== 'object' || Array.isArray(m.reviews)) throw new Error('Invalid learning memory');
  for (const e of m.evidence) if (!e || !text(e.lessonId) || !text(e.questionId) || !integer(e.choice) || !integer(e.at) || typeof e.correct !== 'boolean' || typeof e.independent !== 'boolean') throw new Error('Invalid learning evidence');
  for (const [key, r] of Object.entries(m.reviews)) if (!r || !text(r.lessonId) || !text(r.questionId) || key !== r.lessonId + '::' + r.questionId || !integer(r.dueAt) || !integer(r.lastAt) || !integer(r.intervalDays) || r.intervalDays > 30 || !integer(r.recalls) || !integer(r.mistakes)) throw new Error('Invalid review record');
  return m;
}
export function addEvidence(memory: LearningMemory, lessonId: string, questionId: string, choice: number, correct: boolean, at: number): LearningMemory {
  const key = lessonId + '::' + questionId;
  const prior = memory.reviews[key];
  // Feedback is visible after the first attempt. Immediate retries are practice,
  // never independent recall and never extend the review interval.
  const independent = !prior || at - prior.lastAt >= DAY;
  const recalls = correct && independent ? (prior?.recalls || 0) + 1 : correct ? prior?.recalls || 0 : 0;
  const intervalDays = correct && independent ? Math.min(30, 2 ** Math.min(recalls - 1, 5)) : correct ? prior?.intervalDays || 0 : 0;
  const dueAt = correct && independent ? at + intervalDays * DAY : correct ? prior?.dueAt ?? at : at + 10 * 60000;
  return { version: 1, evidence: [...memory.evidence, { lessonId, questionId, choice, correct, at, independent }].slice(-5000), reviews: { ...memory.reviews, [key]: { lessonId, questionId, dueAt, lastAt: at, intervalDays, recalls, mistakes: (prior?.mistakes || 0) + (correct ? 0 : 1) } } };
}
export function dueReviews(p: Progress, now = Date.now()) {
  return Object.values(p.memory.reviews).filter(r => r.dueAt <= now).sort((a,b) => a.dueAt - b.dueAt || a.lessonId.localeCompare(b.lessonId));
}
export function learningContext(p: Progress, now = Date.now()) {
  return {
    lastLesson: p.lastLesson.slice(0, 500),
    assessedQuestions: Object.keys(p.memory.reviews).length,
    dueQuestions: dueReviews(p, now).length,
    recent: p.memory.evidence.slice(-12).map(e => ({ lessonId: e.lessonId, questionId: e.questionId, correct: e.correct, independent: e.independent, at: e.at })),
  };
}
