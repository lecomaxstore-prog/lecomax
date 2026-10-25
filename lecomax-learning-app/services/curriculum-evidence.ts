import type { Lesson } from '../types/content';
import type { Progress } from '../utils/progress';
export const rubricKey = (id: string, index: number) => 'curriculum:rubric:' + id + ':' + index;
export function practiceReady(lesson: Lesson, p: Progress) {
  return !lesson.curriculum || (!!p.drafts[lesson.id]?.trim() &&
    lesson.curriculum.rubric.every((_, i) => p.drafts[rubricKey(lesson.id, i)] === '2'));
}
export function curriculumGaps(lesson: Lesson, p: Progress) {
  return lesson.curriculum?.rubric.filter((_, i) => p.drafts[rubricKey(lesson.id, i)] !== '2') || [];
}
