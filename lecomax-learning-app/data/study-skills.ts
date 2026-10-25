import entries from './study-skills.json';
import type { IndexModule, Language, Lesson } from '../types/content';
const localized = (values: string[]) => ({ fr: values[0]!, en: values[1]!, ar: values[2]! });
export const studySkillsIndex: IndexModule = {
  id: 'study-skills', kind: 'course',
  title: { fr: 'Apprendre à apprendre', en: 'Learn how to learn', ar: 'تعلّم كيف تتعلّم' },
  summary: { fr: 'Comprendre, pratiquer, retenir et progresser.', en: 'Understand, practice, remember, and improve.', ar: 'افهم وطبّق وتذكّر وتقدّم.' },
  lessons: entries.map((entry) => ({ id: entry.id, title: localized(entry.title), minutes: entry.minutes, difficulty: 1, search: localized(entry.title.map((title, i) => title + ' ' + entry.objective[i])) })),
};
export function getStudyLesson(id: string, language: Language): Lesson | undefined {
  const position = entries.findIndex((entry) => entry.id === id);
  const entry = entries[position];
  if (!entry) return undefined;
  const lang = { fr: 0, en: 1, ar: 2 }[language];
  const pick = (values: string[]) => values[lang]!;
  return {
    id, moduleId: studySkillsIndex.id, language, title: pick(entry.title), subtitle: pick(entry.objective),
    estimatedMinutes: entry.minutes, difficulty: 1, source: 'data/study-skills.json',
    relatedFiles: [], relatedRoutes: [], realProjectExample: [], tags: ['learning', 'practice', 'recall'],
    concept: pick(entry.objective), explanation: entry.sections.map((section) => ({ title: section[lang]!, text: section[lang + 3]! })),
    codeExample: [], exercise: { task: pick(entry.task), hints: [pick(entry.hint)], solution: pick(entry.solution) },
    quiz: [{ id: id + '-check', question: pick(entry.question), options: entry.options.map(pick), correctIndex: entry.answer, explanation: pick(entry.feedback) }],
    summary: [pick(entry.objective), pick(entry.feedback)], why: '', whatIf: '', nextLesson: entries[position + 1]?.id || '',
  };
}
