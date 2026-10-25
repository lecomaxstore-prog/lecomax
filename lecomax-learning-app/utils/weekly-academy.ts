import type { Progress } from './progress';
import { dueReviews } from './learning-memory';

export type PlanningLesson = {
  id: string;
  minutes: number;
  difficulty: number;
  questionIds?: string[];
};
export type WeeklySession = {
  day: number;
  minutes: number;
  kind: 'learn' | 'review' | 'practice' | 'reflect';
  lessonId?: string;
};

export function retainedLesson(p: Progress, lesson: PlanningLesson) {
  return (
    !!lesson.questionIds?.length &&
    lesson.questionIds.every((id) => (p.memory.reviews[lesson.id + '::' + id]?.recalls || 0) >= 2)
  );
}

export function weeklyAcademy(
  p: Progress,
  catalog: readonly PlanningLesson[],
  now = Date.now(),
): WeeklySession[] {
  const budget = p.academy.profile.dailyMinutes;
  const ids = new Set(catalog.map((l) => l.id));
  const review = [...new Set(dueReviews(p, now).map((r) => r.lessonId))].filter((id) =>
    ids.has(id),
  );
  // Keep curriculum order. Opening/completing a lesson is not evidence of recall.
  const queue = catalog.filter((l) => !retainedLesson(p, l));
  let cursor = 0;
  return Array.from({ length: 7 }, (_, day) => {
    if (day === 6) return { day, minutes: Math.min(5, budget), kind: 'reflect' };
    if (review.length)
      return { day, minutes: Math.min(10, budget), kind: 'review', lessonId: review.shift() };
    const lesson = queue[Math.floor(cursor++ / 2)];
    if (!lesson) return { day, minutes: Math.min(10, budget), kind: 'reflect' };
    return {
      day,
      minutes: Math.min(budget, Math.max(5, lesson.minutes)),
      kind: cursor % 2 ? 'learn' : 'practice',
      lessonId: lesson.id,
    };
  });
}
