// Shared provider contract and runtime validation. No provider credentials or SDK here.
export const tutorModes = [
  'zero',
  'explain',
  'socratic',
  'homework',
  'exam',
  'conversation',
  'programming',
  'challenge',
  'beginner',
  'expert',
  'mistake',
  'different',
  'feynman',
  'real-world',
  'memory',
  'project',
  'reflection',
] as const;
export type TutorMode = (typeof tutorModes)[number];
type Schema = {
  type?: string;
  properties?: Record<string, Schema>;
  items?: Schema;
  required?: string[];
  additionalProperties?: boolean;
  enum?: readonly string[];
  anyOf?: Schema[];
  minLength?: number;
  maxLength?: number;
  minItems?: number;
  maxItems?: number;
  minimum?: number;
  maximum?: number;
};
const str = (max = 2000): Schema => ({ type: 'string', minLength: 1, maxLength: max });
const num = (min: number, max: number): Schema => ({ type: 'integer', minimum: min, maximum: max });
const arr = (items: Schema, max = 8, min = 0): Schema => ({
  type: 'array',
  items,
  minItems: min,
  maxItems: max,
});
const obj = (properties: Record<string, Schema>): Schema => ({
  type: 'object',
  properties,
  required: Object.keys(properties),
  additionalProperties: false,
});
const nullable = (schema: Schema): Schema => ({ anyOf: [schema, { type: 'null' }] });
const quizSchema = obj({
  id: str(80),
  concept: str(120),
  question: str(),
  options: arr(str(500), 5, 2),
  correctIndex: num(0, 4),
  explanation: str(),
  hints: arr(str(500), 3, 1),
});
const lessonSchema = obj({
  lessonId: str(80),
  title: str(200),
  subject: str(120),
  level: str(80),
  objectives: arr(str(300), 6, 1),
  sections: arr(obj({ title: str(150), text: str(4000) }), 6, 1),
  examples: arr(str(3000), 3, 1),
  exercises: arr(str(1500), 3, 1),
  hints: arr(str(500), 4, 1),
  assessment: arr(quizSchema, 6, 1),
  estimatedMinutes: num(1, 120),
  prerequisites: arr(str(200), 6),
  summary: str(1500),
  nextLesson: str(300),
});
export const tutorReplySchema = obj({
  answer: str(12000),
  teaching: nullable(
    obj({
      kind: {
        type: 'string',
        enum: [
          'explanation',
          'question',
          'hint',
          'example',
          'code-challenge',
          'quiz',
          'reflection',
          'memory-card',
          'progress',
          'recommendation',
        ],
      },
      objective: str(300),
      concept: str(120),
      prerequisites: arr(str(200), 6),
      missingPrerequisite: nullable(str(200)),
      body: str(4000),
      question: nullable(str(2000)),
      hints: arr(str(500), 3),
      nextActivity: str(1000),
      limitations: str(500),
      memory: nullable(obj({ question: str(2000), answer: str(6000) })),
    }),
  ),
  summary: str(1600),
  followUps: arr(str(200), 4),
  roadmap: arr(
    obj({ title: str(200), objective: str(500), minutes: num(1, 600), prerequisite: str(300) }),
    12,
  ),
  lesson: nullable(lessonSchema),
  quiz: arr(quizSchema, 10),
  evaluation: nullable(
    obj({
      concept: str(120),
      verdict: { type: 'string', enum: ['correct', 'partial', 'incorrect', 'uncertain'] },
      feedback: str(2000),
      misconception: str(500),
      nextExercise: str(1000),
    }),
  ),
  revision: arr(
    obj({ concept: str(120), reason: str(500), exercise: str(1000), days: num(1, 30) }),
    6,
  ),
  challenge: nullable(
    obj({
      title: str(200),
      sessions: num(1, 120),
      minutesPerSession: num(5, 120),
      milestones: arr(str(500), 12, 1),
      adjustment: str(1000),
    }),
  ),
  diagram: nullable(
    obj({
      kind: { type: 'string', enum: ['process', 'timeline', 'function', 'triangle'] },
      title: str(200),
      steps: arr(str(500), 10),
      slope: num(-5, 5),
      intercept: num(-5, 5),
    }),
  ),
});
export type TutorQuiz = {
  id: string;
  concept: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  hints: string[];
};
export type TutorLesson = {
  lessonId: string;
  title: string;
  subject: string;
  level: string;
  objectives: string[];
  sections: { title: string; text: string }[];
  examples: string[];
  exercises: string[];
  hints: string[];
  assessment: TutorQuiz[];
  estimatedMinutes: number;
  prerequisites: string[];
  summary: string;
  nextLesson: string;
};
export type TutorReply = {
  teaching?: {
    kind:
      | 'explanation'
      | 'question'
      | 'hint'
      | 'example'
      | 'code-challenge'
      | 'quiz'
      | 'reflection'
      | 'memory-card'
      | 'progress'
      | 'recommendation';
    objective: string;
    concept: string;
    prerequisites: string[];
    missingPrerequisite: string | null;
    body: string;
    question: string | null;
    hints: string[];
    nextActivity: string;
    limitations: string;
    memory: { question: string; answer: string } | null;
  } | null;
  answer: string;
  summary: string;
  followUps: string[];
  roadmap: { title: string; objective: string; minutes: number; prerequisite: string }[];
  lesson: TutorLesson | null;
  quiz: TutorQuiz[];
  evaluation: {
    concept: string;
    verdict: 'correct' | 'partial' | 'incorrect' | 'uncertain';
    feedback: string;
    misconception: string;
    nextExercise: string;
  } | null;
  revision: { concept: string; reason: string; exercise: string; days: number }[];
  challenge: {
    title: string;
    sessions: number;
    minutesPerSession: number;
    milestones: string[];
    adjustment: string;
  } | null;
  diagram: {
    kind: 'process' | 'timeline' | 'function' | 'triangle';
    title: string;
    steps: string[];
    slope: number;
    intercept: number;
  } | null;
};
export function matchesSchema(value: unknown, schema: Schema): boolean {
  if (schema.anyOf) return schema.anyOf.some((s) => matchesSchema(value, s));
  if (schema.type === 'null') return value === null;
  if (schema.type === 'string')
    return (
      typeof value === 'string' &&
      value.trim().length >= (schema.minLength || 0) &&
      value.length <= (schema.maxLength ?? Infinity) &&
      (!schema.enum || schema.enum.includes(value))
    );
  if (schema.type === 'integer')
    return (
      Number.isSafeInteger(value) &&
      (value as number) >= schema.minimum! &&
      (value as number) <= schema.maximum!
    );
  if (schema.type === 'array')
    return (
      Array.isArray(value) &&
      value.length >= (schema.minItems || 0) &&
      value.length <= schema.maxItems! &&
      value.every((v) => matchesSchema(v, schema.items!))
    );
  if (schema.type === 'object') {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
    const v = value as Record<string, unknown>;
    return (
      Object.keys(v).every((k) => Object.hasOwn(schema.properties!, k)) &&
      schema.required!.every(
        (k) => Object.hasOwn(v, k) && matchesSchema(v[k], schema.properties![k]!),
      )
    );
  }
  return false;
}
export function readTutorReply(value: unknown): TutorReply {
  // Older saved replies predate teaching cards. Validate the full new contract when supplied.
  const checked =
    value && typeof value === 'object' && !Object.hasOwn(value, 'teaching')
      ? { ...value, teaching: null }
      : value;
  if (JSON.stringify(value)?.length > 60000 || !matchesSchema(checked, tutorReplySchema))
    throw new Error('INVALID_AI_RESPONSE');
  const reply = value as TutorReply;
  if (
    reply.teaching &&
    ((['question', 'code-challenge', 'quiz'].includes(reply.teaching.kind) &&
      !reply.teaching.question) ||
      (reply.teaching.kind === 'memory-card' && !reply.teaching.memory) ||
      (reply.teaching.kind === 'reflection' && reply.evaluation))
  )
    throw new Error('INVALID_TEACHING_COMPONENT');
  if (
    reply.diagram &&
    ['process', 'timeline'].includes(reply.diagram.kind) &&
    reply.diagram.steps.length < 2
  )
    throw new Error('INVALID_AI_RESPONSE');
  for (const quiz of [reply.quiz, reply.lesson?.assessment || []]) {
    if (
      new Set(quiz.map((q) => q.id)).size !== quiz.length ||
      quiz.some(
        (q) =>
          q.correctIndex >= q.options.length ||
          new Set(q.options.map((o) => o.trim().toLowerCase())).size !== q.options.length,
      )
    )
      throw new Error('INVALID_AI_RESPONSE');
  }
  return reply;
}
export type TutorAttachment = {
  name: string;
  mime: 'image/jpeg' | 'image/png' | 'application/pdf' | 'text/plain';
  data: string;
};
export function readAttachment(value: unknown): TutorAttachment {
  const a = value as TutorAttachment;
  if (
    !a ||
    typeof a.name !== 'string' ||
    a.name.length > 120 ||
    !a.name.trim() ||
    !['image/jpeg', 'image/png', 'application/pdf', 'text/plain'].includes(a.mime) ||
    typeof a.data !== 'string'
  )
    throw new Error('INVALID_ATTACHMENT');
  if (a.mime === 'text/plain') {
    if (!a.data.trim() || a.data.length > 20000) throw new Error('INVALID_ATTACHMENT');
  } else if (
    a.data.length > 2_800_000 ||
    !new RegExp('^data:' + a.mime + ';base64,[A-Za-z0-9+/]+={0,2}$').test(a.data)
  )
    throw new Error('INVALID_ATTACHMENT');
  return { name: a.name, mime: a.mime, data: a.data };
}
