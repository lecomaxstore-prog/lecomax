import { addEvidence, emptyMemory, readMemory, type LearningMemory } from './learning-memory';
import { readCarStudioProgress, type CarStudioProgress } from './car-studio-progress';
import { freshAcademy, readAcademy, type AcademyState } from './academy';
import { emptyTutor, readTutorMemory, type TutorMemory } from './tutor-memory';
import { emptyFlashcards, readFlashcards, type Flashcards } from './flashcards';
import { emptyJourney, readJourney, type JourneyState } from './journey-state';
export type Progress = {
  journey: JourneyState;
  flashcards: Flashcards;
  tutor: TutorMemory;
  academy: AcademyState;
  carStudio: CarStudioProgress;
  version: 1;
  memory: LearningMemory;
  language: 'ar' | 'en' | 'fr';
  theme: 'system' | 'light' | 'dark';
  level: number;
  completed: string[];
  bookmarks: string[];
  codeBookmarks: string[];
  difficult: string[];
  notes: Record<string, string>;
  drafts: Record<string, string>;
  stages: Record<string, number>;
  answers: Record<
    string,
    { lessonId: string; questionId: string; choice: number; correct: boolean; attempts: number }
  >;
  days: Record<string, number>;
  lastLesson: string;
  reminder: number;
  teacher: { draft: string; history: { role: 'user' | 'assistant'; content: string }[] };
};
export const initial: Progress = {
  journey: emptyJourney(),
  flashcards: emptyFlashcards(),
  tutor: emptyTutor(),
  academy: freshAcademy(),
  carStudio: readCarStudioProgress(undefined),
  version: 1,
  memory: emptyMemory(),
  language: 'ar',
  theme: 'system',
  level: 1,
  completed: [],
  bookmarks: [],
  codeBookmarks: [],
  difficult: [],
  notes: {},
  drafts: {},
  stages: {},
  answers: {},
  days: {},
  lastLesson: '',
  reminder: 0,
  teacher: { draft: '', history: [] },
};
export function readProgress(raw: string | null): Progress {
  if (!raw) return { ...initial };
  const v: unknown = JSON.parse(raw);
  if (!v || typeof v !== 'object' || !('version' in v) || v.version !== 1)
    throw new Error('Unsupported progress format');
  const p = v as Partial<Progress>;
  if (
    p.teacher !== undefined &&
    (!p.teacher ||
      typeof p.teacher.draft !== 'string' ||
      p.teacher.draft.length > 6000 ||
      !Array.isArray(p.teacher.history) ||
      p.teacher.history.length > 40 ||
      p.teacher.history.some(
        (m) =>
          !m ||
          !['user', 'assistant'].includes(m.role) ||
          typeof m.content !== 'string' ||
          m.content.length > 32000,
      ))
  )
    throw new Error('Invalid teacher history');
  for (const key of ['notes', 'drafts', 'answers', 'days', 'stages'] as const)
    if (!p[key] || typeof p[key] !== 'object' || Array.isArray(p[key]))
      throw new Error('Invalid progress map');
  for (const key of ['completed', 'bookmarks', 'codeBookmarks', 'difficult'] as const)
    if (!Array.isArray(p[key]) || !p[key]?.every((x) => typeof x === 'string'))
      throw new Error('Invalid progress');
  for (const key of ['notes', 'drafts'] as const)
    if (!p[key] || !Object.values(p[key]!).every((x) => typeof x === 'string'))
      throw new Error('Invalid notes');
  if (
    !p.answers ||
    !p.days ||
    !p.stages ||
    typeof p.lastLesson !== 'string' ||
    !['ar', 'en', 'fr'].includes(p.language || '') ||
    !['system', 'light', 'dark'].includes(p.theme || '')
  )
    throw new Error('Invalid settings');
  if (!Object.values(p.days).every((x) => typeof x === 'number' && Number.isFinite(x) && x >= 0))
    throw new Error('Invalid time');
  if (
    ![1, 2, 3].includes(p.level || 0) ||
    ![0, 10, 30, 60, 1440].includes(p.reminder ?? -1) ||
    !Object.values(p.stages).every((x) => Number.isInteger(x) && x >= 0 && x <= 3)
  )
    throw new Error('Invalid learning settings');
  if (
    !Object.values(p.answers).every(
      (x) =>
        x &&
        typeof x.lessonId === 'string' &&
        typeof x.questionId === 'string' &&
        typeof x.correct === 'boolean' &&
        Number.isInteger(x.choice) &&
        x.choice >= 0 &&
        Number.isInteger(x.attempts) &&
        x.attempts > 0,
    )
  )
    throw new Error('Invalid answers');
  return { ...initial, ...p, journey: readJourney(p.journey), flashcards: readFlashcards(p.flashcards), tutor: readTutorMemory(p.tutor), academy: readAcademy(p.academy), memory: readMemory(p.memory), carStudio: readCarStudioProgress(p.carStudio) };
}
export function dayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export function streak(days: Record<string, number>, now = new Date()) {
  const date = new Date(now);
  let total = 0;
  if (!days[dayKey(date)]) date.setDate(date.getDate() - 1);
  while (days[dayKey(date)]) {
    total++;
    date.setDate(date.getDate() - 1);
  }
  return total;
}
export function recordAnswer(
  p: Progress,
  lessonId: string,
  questionId: string,
  choice: number,
  correct: boolean,
  at = Date.now(),
): Progress {
  if (!Number.isSafeInteger(at) || at < 0 || !Number.isInteger(choice) || choice < 0) throw new Error('Invalid assessment attempt');
  const key = lessonId + '::' + questionId;
  return {
    ...p,
    memory: addEvidence(p.memory, lessonId, questionId, choice, correct, at),
    answers: {
      ...p.answers,
      [key]: {
        lessonId,
        questionId,
        choice,
        correct,
        attempts: (p.answers[key]?.attempts || 0) + 1,
      },
    },
  };
}
export function toggle(items: string[], id: string) {
  return items.includes(id) ? items.filter((x) => x !== id) : [...items, id];
}
