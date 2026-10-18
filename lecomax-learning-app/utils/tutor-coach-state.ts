export const coachPhases = [
  'diagnosis',
  'concept',
  'teachback',
  'challenge',
  'mastery',
  'recap',
] as const;
export type Coach = {
  hintsUsed?: number;
  focus?: {
    objective: string;
    concept: string;
    prerequisites: string[];
    missingPrerequisite: string | null;
    nextActivity: string;
  };
  reflection?: { easy: string; difficult: string; surprising: string; at: number };
  phase: (typeof coachPhases)[number];
  awaiting: boolean;
  prompt?: string;
  depth: 'beginner' | 'expert';
  confidence: 'unsure' | 'fair' | 'confident';
  shareProgress: boolean;
  outcomes: {
    phase: string;
    concept: string;
    verdict: string;
    at: number;
    question?: string;
    response?: string;
    confidence?: Coach['confidence'];
    misconception?: string;
    nextExercise?: string;
    hintsUsed?: number;
  }[];
};
export const newCoach = (): Coach => ({
  phase: 'diagnosis',
  awaiting: false,
  depth: 'beginner',
  confidence: 'unsure',
  shareProgress: true,
  outcomes: [],
});
export function readCoach(value: unknown): Coach | undefined {
  if (value === undefined) return undefined;
  const c = value as Coach;
  const text = (v: unknown, max: number) => typeof v === 'string' && v.length <= max;
  if (
    c?.hintsUsed !== undefined &&
    (!Number.isInteger(c.hintsUsed) || c.hintsUsed < 0 || c.hintsUsed > 3)
  )
    throw new Error('INVALID_COACH_HINTS');
  if (
    c?.focus !== undefined &&
    (!c.focus ||
      !text(c.focus.objective, 300) ||
      !text(c.focus.concept, 120) ||
      !text(c.focus.nextActivity, 1000) ||
      !Array.isArray(c.focus.prerequisites) ||
      c.focus.prerequisites.length > 6 ||
      !c.focus.prerequisites.every((p) => text(p, 200)) ||
      (c.focus.missingPrerequisite !== null && !text(c.focus.missingPrerequisite, 200)))
  )
    throw new Error('INVALID_COACH_FOCUS');
  if (
    c?.reflection !== undefined &&
    (!c.reflection ||
      !['easy', 'difficult', 'surprising'].every((k) => text(c.reflection![k as 'easy'], 1000)) ||
      !Number.isSafeInteger(c.reflection.at) ||
      c.reflection.at < 0)
  )
    throw new Error('INVALID_COACH_REFLECTION');
  if (c?.prompt !== undefined && (typeof c.prompt !== 'string' || c.prompt.length > 12000))
    throw new Error('INVALID_COACH_PROMPT');
  if (
    !c ||
    !coachPhases.includes(c.phase) ||
    typeof c.awaiting !== 'boolean' ||
    !['beginner', 'expert'].includes(c.depth) ||
    !['unsure', 'fair', 'confident'].includes(c.confidence) ||
    typeof c.shareProgress !== 'boolean' ||
    !Array.isArray(c.outcomes) ||
    c.outcomes.length > 100 ||
    c.outcomes.some(
      (o) =>
        !o ||
        !coachPhases.includes(o.phase as Coach['phase']) ||
        typeof o.concept !== 'string' ||
        o.concept.length > 120 ||
        !['correct', 'partial', 'incorrect', 'uncertain'].includes(o.verdict) ||
        (o.question !== undefined && !text(o.question, 2000)) ||
        (o.response !== undefined && !text(o.response, 6000)) ||
        (o.misconception !== undefined && !text(o.misconception, 500)) ||
        (o.nextExercise !== undefined && !text(o.nextExercise, 1000)) ||
        (o.confidence !== undefined && !['unsure', 'fair', 'confident'].includes(o.confidence)) ||
        (o.hintsUsed !== undefined &&
          (!Number.isInteger(o.hintsUsed) || o.hintsUsed < 0 || o.hintsUsed > 3)) ||
        !Number.isSafeInteger(o.at) ||
        o.at < 0,
    )
  )
    throw new Error('INVALID_COACH');
  return c;
}
