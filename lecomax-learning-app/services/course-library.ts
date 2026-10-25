import { courses } from '../constants/courses';
import { index } from './content';

const modules = new Map(index.map((module) => [module.id, module]));
export const library = courses.map((course) => ({
  ...course,
  lessons: [
    ...new Map(
      course.modules
        .flatMap((id) => modules.get(id)?.lessons || [])
        .map((lesson) => [lesson.id, lesson]),
    ).values(),
  ],
}));

export function courseProgress(
  course: (typeof library)[number],
  completed: readonly string[],
  lastLesson: string,
) {
  const finished = new Set(completed);
  const done = course.lessons.filter((lesson) => finished.has(lesson.id)).length;
  const next =
    course.lessons.find((lesson) => lesson.id === lastLesson && !finished.has(lesson.id)) ||
    course.lessons.find((lesson) => !finished.has(lesson.id));
  return {
    done,
    next,
    total: course.lessons.length,
    started: done > 0 || course.lessons.some((lesson) => lesson.id === lastLesson),
  };
}

export function normalizeCourseQuery(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f\u064b-\u065f\u0670\u0640]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .toLocaleLowerCase()
    .trim();
}
