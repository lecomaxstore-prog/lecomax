import { courses } from '../constants/courses';
import { index } from './content';
import { curriculum } from '../data/university/curriculum';
import { pathLessons } from './curriculum';

export function lessonSequence(courseId: string | undefined, lessonId: string) {
  const module = index.find((item) => item.lessons.some((lesson) => lesson.id === lessonId));
  if (!module) return undefined;
  const path = courseId?.startsWith('path:') ? curriculum.find(p => 'path:' + p.id === courseId) : undefined;
  if (path) {
    const lessons = [...new Map(pathLessons(path).map(lesson => [lesson.id, lesson])).values()];
    const position = lessons.findIndex(lesson => lesson.id === lessonId);
    if (position >= 0) return { courseId, moduleId: module.id, title: path.title, lessons, position };
  }
  const explicit = courses.find((item) => item.id === courseId && item.modules.some((id) => id === module.id));
  const course = explicit || courses.find((item) => item.modules[0] === module.id)
    || courses.find((item) => item.modules.some((id) => id === module.id));
  const entries = [...new Map((course ? course.modules.flatMap((id) => index.find((item) => item.id === id)?.lessons || []) : module.lessons).map((lesson) => [lesson.id, lesson])).values()];
  const position = entries.findIndex((lesson) => lesson.id === lessonId);
  return { courseId: course?.id, moduleId: module.id, title: course ? { fr: course.title[0], en: course.title[1], ar: course.title[2] } : module.title, lessons: entries, position };
}

export function courseNavigation(courseId: string | undefined, lessonId: string) {
  if (courseId?.startsWith('path:')) {
    const sequence = lessonSequence(courseId, lessonId);
    if (sequence?.courseId !== courseId) return undefined;
    return { courseId, previous: sequence.lessons[sequence.position - 1]?.id, next: sequence.lessons[sequence.position + 1]?.id };
  }
  if (!courses.some((course) => course.id === courseId && course.modules.some((id) => index.find((module) => module.id === id)?.lessons.some((lesson) => lesson.id === lessonId)))) return undefined;
  const sequence = lessonSequence(courseId, lessonId);
  if (!sequence?.courseId) return undefined;
  return { courseId: sequence.courseId, previous: sequence.lessons[sequence.position - 1]?.id, next: sequence.lessons[sequence.position + 1]?.id };
}
