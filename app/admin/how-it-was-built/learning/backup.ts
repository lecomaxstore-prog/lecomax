import { readProgress, type Progress } from './progress.ts';

export const BACKUP_LIMIT = 300_000;
export function makeLearningBackup(progress: Progress, ids: string[]) {
  return JSON.stringify({ kind: 'lecomax-beginner-learning', version: 1, exportedAt: new Date().toISOString(), progress: readProgress(progress, ids) }, null, 2);
}
export function parseLearningBackup(content: string, ids: string[]): Progress {
  if (new TextEncoder().encode(content).length > BACKUP_LIMIT) throw new Error('INVALID_BACKUP');
  const data = JSON.parse(content);
  if (!data || data.kind !== 'lecomax-beginner-learning' || data.version !== 1 || !data.progress || typeof data.progress !== 'object' || Array.isArray(data.progress)) throw new Error('INVALID_BACKUP');
  return readProgress(data.progress, ids);
}
/** Merge milestones without replacing existing notes, drafts or the current place. */
export function mergeLearningBackup(current: Progress, imported: Progress, ids: string[]): Progress {
  const preferNonEmpty = (old: Record<string, string>, incoming: Record<string, string>) => ({ ...Object.fromEntries(Object.entries(old).filter(([, value]) => value.trim())), ...Object.fromEntries(Object.entries(incoming).filter(([key]) => typeof old[key] !== 'string' || !old[key].trim())) });
  return readProgress({
    ...imported, ...current,
    bookmarks: [...current.bookmarks, ...imported.bookmarks],
    completed: [...current.completed, ...imported.completed],
    exercises: [...current.exercises, ...imported.exercises],
    struggles: [...current.struggles, ...imported.struggles],
    projects: [...imported.projects, ...current.projects],
    days: [...imported.days, ...current.days],
    quizzes: Object.fromEntries(ids.filter(id => current.quizzes[id] !== undefined || imported.quizzes[id] !== undefined).map(id => [id, Math.max(current.quizzes[id] ?? 0, imported.quizzes[id] ?? 0)])),
    notes: preferNonEmpty(current.notes, imported.notes),
    drafts: preferNonEmpty(current.drafts, imported.drafts),
    lessonSteps: { ...imported.lessonSteps, ...current.lessonSteps },
    reviews: { ...imported.reviews, ...current.reviews },
  }, ids);
}
