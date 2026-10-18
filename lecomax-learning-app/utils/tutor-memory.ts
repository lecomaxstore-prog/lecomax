import { readTutorReply, tutorModes, type TutorMode, type TutorReply } from './tutor-contract';
import { readCoach, type Coach } from './tutor-coach-state';
export type ConceptRecord = {
  concept: string;
  attempts: number;
  correct: number;
  independent: number;
  errors: string[];
  lastReview: number;
  due: number;
  confusion: number;
  nextExercise: string;
};
export type TutorSession = {
  discoveryId?: string;
  discoveryStep?: string;
  coach?: Coach;
  id: string;
  goal: string;
  mode: TutorMode;
  summary: string;
  draft: string;
  messages: { role: 'user' | 'assistant'; content: string }[];
  reply: TutorReply | null;
  lesson: TutorReply['lesson'];
  stage: number;
  complete: boolean;
  answers: Record<
    string,
    { choice: number; correct: boolean; attempts: number; revealed: boolean }
  >;
  hints: string[];
  examDeadline: number;
  examSubmitted: boolean;
  updatedAt: number;
  settings?: {
    conversationLanguage: string;
    examType: string;
    minutes: string;
    target: string;
    difficulty: string;
  };
};
export type TutorMemory = {
  version: 1;
  active: string;
  sessions: TutorSession[];
  concepts: ConceptRecord[];
};
export const emptyTutor = (): TutorMemory => ({
  version: 1,
  active: '',
  sessions: [],
  concepts: [],
});
export function newTutorSession(goal: string, mode: TutorMode, now = Date.now()): TutorSession {
  return {
    id: `tutor-${now.toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    goal: goal.trim().slice(0, 300),
    mode,
    summary: '',
    draft: '',
    messages: [],
    reply: null,
    lesson: null,
    stage: 0,
    complete: false,
    answers: {},
    hints: [],
    examDeadline: 0,
    examSubmitted: false,
    updatedAt: now,
  };
}
export function readTutorMemory(raw: unknown): TutorMemory {
  if (raw === undefined) return emptyTutor();
  const m = raw as TutorMemory;
  if (
    !m ||
    m.version !== 1 ||
    typeof m.active !== 'string' ||
    !Array.isArray(m.sessions) ||
    m.sessions.length > 20 ||
    !Array.isArray(m.concepts) ||
    m.concepts.length > 200 ||
    JSON.stringify(m).length > 3_000_000
  )
    throw new Error('INVALID_TUTOR_MEMORY');
  const text = (v: unknown, n: number) => typeof v === 'string' && v.length <= n;
  const integer = (v: unknown, max = Number.MAX_SAFE_INTEGER) =>
    Number.isSafeInteger(v) && (v as number) >= 0 && (v as number) <= max;
  for (const s of m.sessions) {
    if (!s) throw new Error('INVALID_TUTOR_SESSION');
    readCoach(s.coach);
    if (JSON.stringify(s).length > 100000) throw new Error('INVALID_TUTOR_SESSION');
    if (
      s.settings &&
      (typeof s.settings !== 'object' ||
        ['conversationLanguage', 'examType', 'minutes', 'target', 'difficulty'].some(
          (k) => !text(s.settings![k as keyof NonNullable<TutorSession['settings']>], 120),
        ))
    )
      throw new Error('INVALID_TUTOR_SETTINGS');
    if (
      !s ||
      !/^tutor-[a-z0-9-]+$/.test(s.id) ||
      !tutorModes.includes(s.mode) ||
      !text(s.goal, 300) ||
      (s.discoveryId !== undefined && !/^[a-z0-9-]{1,80}$/.test(s.discoveryId)) ||
      (s.discoveryStep !== undefined &&
        (!s.discoveryId || !/^[a-z0-9-]{1,80}$/.test(s.discoveryStep))) ||
      !text(s.summary, 1600) ||
      !text(s.draft, 6000) ||
      !integer(s.stage, 3) ||
      typeof s.complete !== 'boolean' ||
      !integer(s.updatedAt) ||
      !integer(s.examDeadline) ||
      typeof s.examSubmitted !== 'boolean' ||
      !Array.isArray(s.messages) ||
      s.messages.length > 12 ||
      s.messages.some(
        (v) => !v || !['user', 'assistant'].includes(v.role) || !text(v.content, 12000),
      ) ||
      !Array.isArray(s.hints) ||
      s.hints.length > 100 ||
      s.hints.some((h) => !text(h, 160)) ||
      !s.answers ||
      typeof s.answers !== 'object' ||
      Array.isArray(s.answers) ||
      Object.keys(s.answers).length > 100
    )
      throw new Error('INVALID_TUTOR_SESSION');
    if (s.reply) readTutorReply(s.reply);
    if (s.lesson) readTutorReply({ ...(s.reply || emptyReply()), lesson: s.lesson });
    for (const [key, a] of Object.entries(s.answers))
      if (
        key.length > 160 ||
        !a ||
        !integer(a.choice, 4) ||
        typeof a.correct !== 'boolean' ||
        typeof a.revealed !== 'boolean' ||
        !integer(a.attempts, 10000)
      )
        throw new Error('INVALID_TUTOR_ANSWER');
  }
  if (
    new Set(m.sessions.map((s) => s.id)).size !== m.sessions.length ||
    (m.active && !m.sessions.some((s) => s.id === m.active))
  )
    throw new Error('INVALID_TUTOR_SESSION');
  for (const c of m.concepts)
    if (
      !c ||
      !text(c.concept, 120) ||
      !integer(c.attempts, 100000) ||
      !integer(c.correct, c.attempts) ||
      !integer(c.independent, c.correct) ||
      !integer(c.lastReview) ||
      !integer(c.due) ||
      !integer(c.confusion, 100) ||
      !Array.isArray(c.errors) ||
      c.errors.length > 5 ||
      c.errors.some((e) => !text(e, 500)) ||
      !text(c.nextExercise, 1000)
    )
      throw new Error('INVALID_TUTOR_CONCEPT');
  return m;
}
export function emptyReply(): TutorReply {
  return {
    answer: 'Ready',
    summary: 'New session',
    followUps: [],
    roadmap: [],
    lesson: null,
    quiz: [],
    evaluation: null,
    revision: [],
    challenge: null,
    diagram: null,
  };
}
export function boundedTutorSession(session: TutorSession): TutorSession {
  const next = { ...session, messages: [...session.messages] };
  // Leave room for drafts and answers. Summaries preserve the learning handoff.
  while (JSON.stringify(next).length > 80000 && next.messages.length > 2)
    next.messages.splice(0, 2);
  if (JSON.stringify(next).length > 80000) throw new Error('SESSION_CAPACITY');
  return next;
}
export function acceptTutorReply(
  s: TutorSession,
  reply: TutorReply,
  message: string,
  originalDraft: string,
  now = Date.now(),
): TutorSession {
  const merged = {
    ...reply,
    lesson: null,
    roadmap: reply.roadmap.length ? reply.roadmap : s.reply?.roadmap || [],
    quiz: reply.quiz.length ? reply.quiz : s.reply?.quiz || [],
    revision: reply.revision.length ? reply.revision : s.reply?.revision || [],
    challenge: reply.challenge || s.reply?.challenge || null,
  };
  readTutorReply(merged);
  return boundedTutorSession({
    ...s,
    summary: reply.summary,
    draft: s.draft === originalDraft ? '' : s.draft,
    reply: merged,
    lesson: reply.lesson || s.lesson,
    stage: reply.lesson ? 0 : s.stage,
    complete: reply.lesson ? false : s.complete,
    answers: reply.lesson || reply.quiz.length ? {} : s.answers,
    hints: reply.lesson || reply.quiz.length ? [] : s.hints,
    examDeadline: reply.quiz.length ? 0 : s.examDeadline,
    examSubmitted: reply.quiz.length ? false : s.examSubmitted,
    messages: [
      ...s.messages,
      { role: 'user' as const, content: message.slice(0, 6000) },
      { role: 'assistant' as const, content: reply.answer },
    ].slice(-12),
    updatedAt: now,
  });
}
export function conceptEstimate(c: ConceptRecord) {
  return {
    familiarity: c.attempts ? 'practiced' : 'introduced',
    mastery: c.attempts ? Math.round((100 * c.independent) / (c.attempts + 2)) : 0,
    confidence: c.independent >= 5 ? 'moderate' : 'low',
  };
}
export function recordConcept(
  memory: TutorMemory,
  concept: string,
  correct: boolean,
  independent: boolean,
  error: string,
  nextExercise: string,
  now = Date.now(),
): TutorMemory {
  const old = memory.concepts.find((c) => c.concept === concept) || {
    concept,
    attempts: 0,
    correct: 0,
    independent: 0,
    errors: [],
    lastReview: 0,
    due: 0,
    confusion: 0,
    nextExercise: '',
  };
  const recalled = correct && independent && (!old.lastReview || now - old.lastReview >= 86400000);
  const record: ConceptRecord = {
    ...old,
    attempts: Math.min(100000, old.attempts + 1),
    correct: Math.min(100000, old.correct + Number(correct)),
    independent: Math.min(100000, old.independent + Number(recalled)),
    errors: correct ? old.errors : [...new Set([...old.errors, error.slice(0, 500)])].slice(-5),
    lastReview: now,
    due: now + (recalled ? Math.min(14, 2 ** old.independent) : 1) * 86400000,
    confusion: correct ? 0 : Math.min(100, old.confusion + 1),
    nextExercise: nextExercise.slice(0, 1000),
  };
  return {
    ...memory,
    concepts: [...memory.concepts.filter((c) => c.concept !== concept), record].slice(-200),
  };
}
export function compactTutorMemory(memory: TutorMemory, goal: string) {
  const terms = goal
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 2);
  return [...memory.concepts]
    .sort(
      (a, b) =>
        Number(terms.some((t) => b.concept.toLowerCase().includes(t))) -
          Number(terms.some((t) => a.concept.toLowerCase().includes(t))) ||
        b.lastReview - a.lastReview,
    )
    .slice(0, 8)
    .map((c) => ({ ...c, estimate: conceptEstimate(c) }));
}
export function submitTutorExam(memory: TutorMemory, id: string, now = Date.now()): TutorMemory {
  const session = memory.sessions.find((s) => s.id === id);
  if (!session || session.examSubmitted || !session.examDeadline) return memory;
  let next = memory;
  for (const q of session.reply?.quiz || []) {
    const answer = session.answers[`exam:${q.id}`];
    next = recordConcept(
      next,
      q.concept,
      !!answer?.correct,
      !answer?.revealed,
      q.explanation,
      q.question,
      now,
    );
  }
  return {
    ...next,
    sessions: next.sessions.map((s) => (s.id === id ? { ...s, examSubmitted: true } : s)),
  };
}
