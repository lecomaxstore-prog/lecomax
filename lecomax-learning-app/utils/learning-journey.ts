import type { Progress } from './progress';
import { planLessonId, type StudyPlan } from './academy';

export function recordDiagnostic(
  p: Progress,
  planId: string,
  index: number,
  choice: number,
  confidence: 'unsure' | 'certain',
  at = Date.now(),
): Progress {
  const plan = p.academy.plans.find((item) => item.id === planId);
  const q = plan?.design?.diagnostic[index];
  if (
    !q ||
    !Number.isInteger(index) ||
    !Number.isInteger(choice) ||
    choice < 0 ||
    choice >= q.options.length ||
    !['unsure', 'certain'].includes(confidence) ||
    !Number.isSafeInteger(at) ||
    at < 0
  )
    throw new Error('Invalid diagnostic');
  const key = planLessonId(plan!, index);
  // A revealed answer cannot replace the original baseline, including after restart.
  if (p.academy.diagnostics?.[key]) return p;
  return {
    ...p,
    academy: {
      ...p.academy,
      diagnostics: { ...p.academy.diagnostics, [key]: { choice, confidence, at } },
    },
  };
}

export function journeyRecommendation(p: Progress, plan: StudyPlan, now = Date.now()) {
  if (plan.design) {
    const index = plan.design.diagnostic.findIndex(
      (_, i) => !p.academy.diagnostics?.[planLessonId(plan, i)],
    );
    if (index >= 0) return { state: 'ASSESS', index, reason: 'baseline' } as const;
  }
  const reviews = Object.values(p.memory.reviews).filter((r) =>
    plan.lessons.some((_, i) => planLessonId(plan, i) === r.lessonId),
  );
  const repeated = reviews.find((r) => r.mistakes >= 2 && r.recalls === 0);
  if (repeated) {
    const index = plan.lessons.findIndex((_, i) => planLessonId(plan, i) === repeated.lessonId);
    const prerequisite = plan.design?.prerequisites[index]?.find(
      (i) => !p.completed.includes(planLessonId(plan, i)),
    );
    return {
      state: 'GUIDED_PRACTICE',
      index: prerequisite ?? index,
      reason: prerequisite === undefined ? 'repeated-errors' : 'prerequisite',
    } as const;
  }
  const due = reviews.filter((r) => r.dueAt <= now).sort((a, b) => a.dueAt - b.dueAt)[0];
  if (due)
    return {
      state: 'REVIEW',
      index: plan.lessons.findIndex((_, i) => planLessonId(plan, i) === due.lessonId),
      reason: 'due',
    } as const;
  const index = plan.lessons.findIndex((_, i) => !p.completed.includes(planLessonId(plan, i)));
  if (index < 0) return { state: 'ADVANCE', index: 0, reason: 'project' } as const;
  const baseline = p.academy.diagnostics?.[planLessonId(plan, index)];
  const gap = baseline && baseline.choice !== plan.design?.diagnostic[index]?.correctIndex;
  return { state: 'EXPLAIN', index, reason: gap ? 'starting-gap' : 'sequence' } as const;
}

export function lessonEvidence(p: Progress, plan: StudyPlan, index: number) {
  const id = planLessonId(plan, index);
  const attempts = p.memory.evidence.filter((e) => e.lessonId === id);
  return {
    attempts: attempts.length,
    correct: attempts.filter((e) => e.correct).length,
    independent: attempts.filter((e) => e.independent).length,
    baseline: p.academy.diagnostics?.[id],
    completed: p.completed.includes(id),
  };
}
