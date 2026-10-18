import type { Progress } from './progress';
function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function streak(days: Record<string, number>, now: Date) {
  const d = new Date(now);
  let count = 0;
  if (!days[dayKey(d)]) d.setDate(d.getDate() - 1);
  while (days[dayKey(d)]) {
    count++;
    d.setDate(d.getDate() - 1);
  }
  return count;
}

export type LearnerProfile = {
  name: string;
  goal: string;
  level: 'zero' | 'beginner' | 'intermediate' | 'advanced';
  teacherLanguage: 'ar' | 'darija' | 'en' | 'fr';
  motivation: string;
  dailyMinutes: number;
  format: 'reading' | 'examples' | 'practice' | 'audio' | 'mixed';
  approach: 'structured' | 'explore';
  onboarded: boolean;
  interests?: string[];
  routineGoal?: string;
  accessibilityNeeds?: string;
  shareOptionalPreferences?: boolean;
};
export type PlanLesson = {
  title: string;
  objective: string;
  minutes: number;
  explanation: string;
  example: string;
  mistake: string;
  exercise: string;
  solution: string;
  summary: string;
  quiz: { prompt: string; options: string[]; correctIndex: number; explanation: string }[];
};
export type StudyPlan = {
  design?: { version: 1; prerequisites: number[][]; diagnostic: PlanLesson['quiz'] };
  id: string;
  goal: string;
  createdAt: string;
  language: LearnerProfile['teacherLanguage'];
  title: string;
  verification: string;
  project: string;
  criteria: string[];
  lessons: PlanLesson[];
};
export type AcademyState = {
  diagnostics?: Record<string, { choice: number; confidence: 'unsure' | 'certain'; at: number }>;
  profile: LearnerProfile;
  favorites: string[];
  enrolled: string[];
  recentSearches: string[];
  visits: { id: string; at: number }[];
  feedback: Record<string, 'helpful' | 'difficult'>;
  plans: StudyPlan[];
};
export const freshAcademy = (): AcademyState => ({
  profile: {
    name: '',
    goal: '',
    level: 'zero',
    teacherLanguage: 'ar',
    motivation: '',
    dailyMinutes: 20,
    format: 'mixed',
    approach: 'structured',
    onboarded: false,
  },
  favorites: [],
  enrolled: [],
  recentSearches: [],
  visits: [],
  feedback: {},
  plans: [],
});
const text = (v: unknown, max: number, required = false): v is string =>
  typeof v === 'string' && v.length <= max && (!required || !!v.trim());
export function readProfile(value: unknown): LearnerProfile {
  const p = value as LearnerProfile;
  if (
    !p ||
    !text(p.name, 80) ||
    !text(p.goal, 500) ||
    !text(p.motivation, 300) ||
    !['zero', 'beginner', 'intermediate', 'advanced'].includes(p.level) ||
    !['ar', 'darija', 'en', 'fr'].includes(p.teacherLanguage) ||
    !['reading', 'examples', 'practice', 'audio', 'mixed'].includes(p.format) ||
    !['structured', 'explore'].includes(p.approach) ||
    typeof p.onboarded !== 'boolean' ||
    !Number.isInteger(p.dailyMinutes) ||
    p.dailyMinutes < 5 ||
    p.dailyMinutes > 240 ||
    (p.onboarded && !p.goal.trim())
  )
    throw new Error('Invalid learner profile');
  if ((p.interests !== undefined && (!Array.isArray(p.interests) || p.interests.length > 6 || !p.interests.every(x => ['technology', 'math', 'science', 'languages', 'skills', 'world'].includes(x)))) ||
    (p.routineGoal !== undefined && !text(p.routineGoal, 300)) ||
    (p.accessibilityNeeds !== undefined && !text(p.accessibilityNeeds, 300)) ||
    (p.shareOptionalPreferences !== undefined && typeof p.shareOptionalPreferences !== 'boolean')) throw new Error('Invalid learning preferences');
  return {
    ...(p.shareOptionalPreferences !== undefined ? { shareOptionalPreferences: p.shareOptionalPreferences } : {}),
    ...(p.interests !== undefined ? { interests: [...new Set(p.interests)] } : {}),
    ...(p.routineGoal !== undefined ? { routineGoal: p.routineGoal } : {}),
    ...(p.accessibilityNeeds !== undefined ? { accessibilityNeeds: p.accessibilityNeeds } : {}),
    name: p.name,
    goal: p.goal,
    level: p.level,
    teacherLanguage: p.teacherLanguage,
    motivation: p.motivation,
    dailyMinutes: p.dailyMinutes,
    format: p.format,
    approach: p.approach,
    onboarded: p.onboarded,
  };
}
export function teacherProfile(profile?: LearnerProfile): LearnerProfile | undefined {
  if (!profile || profile.shareOptionalPreferences) return profile;
  const { interests: _interests, routineGoal: _routine, accessibilityNeeds: _accessibility, shareOptionalPreferences: _sharing, ...basic } = profile;
  return basic;
}
export function validatePlanContent(
  value: unknown,
): Pick<StudyPlan, 'title' | 'verification' | 'project' | 'criteria' | 'lessons' | 'design'> {
  const p = value as StudyPlan;
  if (
    !p ||
    !text(p.title, 200, true) ||
    !text(p.verification, 1000, true) ||
    !text(p.project, 2000, true) ||
    !Array.isArray(p.criteria) ||
    p.criteria.length < 1 ||
    p.criteria.length > 8 ||
    !p.criteria.every((x) => text(x, 400, true)) ||
    !Array.isArray(p.lessons) ||
    p.lessons.length < 3 ||
    p.lessons.length > 6
  )
    throw new Error('Incomplete learning plan');
  for (const l of p.lessons) {
    if (
      !l ||
      !text(l.title, 200, true) ||
      !text(l.objective, 600, true) ||
      !Number.isInteger(l.minutes) ||
      l.minutes < 1 ||
      l.minutes > 120 ||
      !text(l.explanation, 5000, true) ||
      !text(l.example, 2500, true) ||
      !text(l.mistake, 800, true) ||
      !text(l.exercise, 1500, true) ||
      !text(l.solution, 2500, true) ||
      !text(l.summary, 800, true) ||
      !Array.isArray(l.quiz) ||
      l.quiz.length < 2 ||
      l.quiz.length > 4
    )
      throw new Error('Incomplete lesson');
    for (const q of l.quiz)
      if (
        !q ||
        !text(q.prompt, 800, true) ||
        !Array.isArray(q.options) ||
        q.options.length < 2 ||
        q.options.length > 4 ||
        !q.options.every((x) => text(x, 500, true)) ||
        new Set(q.options).size !== q.options.length ||
        !Number.isInteger(q.correctIndex) ||
        q.correctIndex < 0 ||
        q.correctIndex >= q.options.length ||
        !text(q.explanation, 1000, true)
      )
        throw new Error('Invalid assessment');
  }
  if (p.design !== undefined) {
    const d = p.design;
    if (!d || d.version !== 1 || !Array.isArray(d.prerequisites) || d.prerequisites.length !== p.lessons.length ||
      d.prerequisites.some((deps, i) => !Array.isArray(deps) || new Set(deps).size !== deps.length || deps.some(n => !Number.isInteger(n) || n < 0 || n >= i)) ||
      !Array.isArray(d.diagnostic) || d.diagnostic.length !== p.lessons.length)
      throw new Error('Invalid learning design');
    for (const [i, q] of d.diagnostic.entries()) {
      if (!q || !text(q.prompt, 800, true) || !Array.isArray(q.options) || q.options.length < 2 || q.options.length > 4 ||
        !q.options.every(x => text(x, 500, true)) || new Set(q.options).size !== q.options.length ||
        !Number.isInteger(q.correctIndex) || q.correctIndex < 0 || q.correctIndex >= q.options.length || !text(q.explanation, 1000, true) ||
        p.lessons[i]!.quiz.some(item => item.prompt.trim().toLowerCase() === q.prompt.trim().toLowerCase()))
        throw new Error('Invalid diagnostic question');
    }
  }
  return {
    ...(p.design ? { design: p.design } : {}),
    title: p.title,
    verification: p.verification,
    project: p.project,
    criteria: p.criteria,
    lessons: p.lessons,
  };
}
export function parsePlanReply(raw: string) {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');
  return validatePlanContent(JSON.parse(cleaned));
}
export function readAcademy(value: unknown): AcademyState {
  if (value === undefined) return freshAcademy();
  const a = value as AcademyState;
  if (!a || typeof a !== 'object') throw new Error('Invalid Academy data');
  readProfile(a.profile);
  for (const key of ['favorites', 'enrolled', 'recentSearches'] as const)
    if (!Array.isArray(a[key]) || a[key].length > 200 || !a[key].every((x) => text(x, 500, true)))
      throw new Error('Invalid Academy list');
  if (
    !Array.isArray(a.visits) ||
    a.visits.length > 200 ||
    a.visits.some((v) => !v || !text(v.id, 500, true) || !Number.isSafeInteger(v.at) || v.at < 0)
  )
    throw new Error('Invalid history');
  if (
    !a.feedback ||
    typeof a.feedback !== 'object' ||
    Array.isArray(a.feedback) ||
    Object.values(a.feedback).some((x) => !['helpful', 'difficult'].includes(x))
  )
    throw new Error('Invalid feedback');
  if (!Array.isArray(a.plans) || a.plans.length > 30) throw new Error('Invalid study plans');
  const ids = new Set<string>();
  for (const p of a.plans) {
    if (
      !p ||
      !/^plan-[a-z0-9-]+$/.test(p.id) ||
      ids.has(p.id) ||
      !text(p.goal, 500, true) ||
      !Number.isFinite(Date.parse(p.createdAt)) ||
      !['ar', 'darija', 'en', 'fr'].includes(p.language)
    )
      throw new Error('Invalid plan metadata');
    ids.add(p.id);
    validatePlanContent(p);
  }
  if (a.diagnostics !== undefined) {
    if (!a.diagnostics || typeof a.diagnostics !== 'object' || Array.isArray(a.diagnostics) || Object.keys(a.diagnostics).length > 180)
      throw new Error('Invalid diagnostics');
    for (const [key, value] of Object.entries(a.diagnostics)) {
      const question = a.plans.flatMap(plan => (plan.design?.diagnostic || []).map((q, i) => ({ key: `${plan.id}:${i}`, q }))).find(item => item.key === key)?.q;
      if (!question || !value || !Number.isInteger(value.choice) || value.choice < 0 || value.choice >= question.options.length ||
        !['unsure', 'certain'].includes(value.confidence) || !Number.isSafeInteger(value.at) || value.at < 0)
        throw new Error('Invalid diagnostic evidence');
    }
  }
  return a;
}
export function visitLesson(p: Progress, id: string, at = Date.now()): Progress {
  const a = p.academy || freshAcademy();
  return {
    ...p,
    lastLesson: id,
    stages: { ...p.stages, [id]: p.stages[id] ?? 0 },
    academy: { ...a, visits: [{ id, at }, ...a.visits.filter((v) => v.id !== id)].slice(0, 200) },
  };
}
export function planLessonId(plan: StudyPlan, index: number) {
  return `${plan.id}:${index}`;
}
export function canCompletePlanLesson(p: Progress, id: string, lesson: PlanLesson) {
  return (
    !!p.drafts[id]?.trim() &&
    lesson.quiz.every((q, i) => p.answers[id + '::q' + i]?.choice === q.correctIndex)
  );
}
export function analytics(p: Progress, now = new Date()) {
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - 6 + i);
    return { day: dayKey(d), seconds: p.days[dayKey(d)] || 0 };
  });
  const independent = p.memory.evidence.filter((e) => e.independent);
  const retained = Object.values(p.memory.reviews).filter(
    (r) => r.recalls >= 3 && r.intervalDays >= 4,
  );
  return {
    week,
    streak: streak(p.days, now),
    todayMinutes: Math.floor((p.days[dayKey(now)] || 0) / 60),
    totalMinutes: Math.floor(Object.values(p.days).reduce((a, b) => a + b, 0) / 60),
    accuracy: independent.length
      ? Math.round((independent.filter((e) => e.correct).length / independent.length) * 100)
      : null,
    assessed: independent.length,
    retained: retained.length,
    activeDays: week.filter((d) => d.seconds > 0).length,
    achievements: [
      p.completed.length >= 1 && 'first-lesson',
      p.completed.length >= 10 && 'ten-lessons',
      streak(p.days, now) >= 3 && 'three-days',
      retained.length >= 1 && 'recall',
    ].filter(Boolean) as string[],
  };
}
