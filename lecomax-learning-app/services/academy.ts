import { academyLessons } from '../data/academy/registry';
import catalog from '../data/academy/catalog.json';
import type { AcademyLesson } from '../types/academy';
import type { IndexModule, Language, Lesson } from '../types/content';

export function explanationWords(lesson: AcademyLesson) {
  return lesson.sections.map(section => section.text).join(' ').trim().split(/\s+/).filter(Boolean).length;
}
export function studyMinutes(lesson: AcademyLesson) {
  return Math.ceil(explanationWords(lesson) / 120) + lesson.practiceMinutes;
}
const byId = new Map(academyLessons.map(lesson => [lesson.id, lesson]));
export const academyIndex: IndexModule[] = catalog.map(module => ({
  id: module.id, kind: 'course', title: module.title, summary: module.summary,
  lessons: module.lessonIds.map(id => {
    const lesson = byId.get(id);
    if (!lesson) throw new Error('Missing bundled academy lesson: ' + id);
    const text = [Object.values(lesson.title).join(' '), lesson.introduction,
      ...lesson.sections.map(section => section.title + ' ' + section.text),
      ...lesson.objectives, ...lesson.exercises.map(exercise => exercise.task)].join(' ');
    return { id, title: lesson.title, minutes: studyMinutes(lesson), difficulty: lesson.difficulty,
      search: { ar: text, en: text, fr: text } };
  }),
}));
export function getAcademyLesson(id: string, language: Language): Lesson | undefined {
  const lesson = byId.get(id);
  if (!lesson) return undefined;
  const module = catalog.find(item => item.id === lesson.moduleId);
  const position = module?.lessonIds.indexOf(id) ?? -1;
  return {
    id, moduleId: lesson.moduleId, language, contentLanguage: lesson.contentLanguage,
    title: lesson.title[language], subtitle: lesson.introduction,
    estimatedMinutes: studyMinutes(lesson), difficulty: lesson.difficulty,
    source: 'data/academy/lessons/' + id + '.json',
    relatedFiles: lesson.sourceFiles.map(file => file.path), relatedRoutes: [],
    realProjectExample: lesson.sourceFiles.map(file => ({ file: file.path, hash: file.sha256 })),
    tags: [lesson.trackId, 'long-form', 'darija'], concept: lesson.introduction,
    explanation: [...lesson.sections, { title: 'الربط بين الدروس', text: lesson.connections }],
    codeExample: lesson.examples,
    exercise: { task: lesson.exercises.map((exercise, i) => (i + 1) + '. ' + exercise.task).join('\n\n'),
      hints: lesson.exercises.flatMap(exercise => exercise.hints),
      solution: lesson.exercises.map(exercise => exercise.solution + '\n' + exercise.walkthrough).join('\n\n') },
    quiz: lesson.quiz, summary: lesson.recap, why: '', whatIf: '',
    nextLesson: module?.lessonIds[position + 1] || '', academy: lesson,
  };
}
