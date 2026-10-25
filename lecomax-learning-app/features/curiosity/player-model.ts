import { getJourney, getStep } from './journeys';
import { labSpec } from './labs';
export const PLAYER_KEY = 'curiosity-player:v1';
export type Evidence = {
  choice: number;
  attempts: number;
  firstCorrect: boolean;
  correct: boolean;
  assisted: boolean;
  due: number;
  at: number;
};
export type StepMemory = { value: number; trials: number; hint: boolean; answer?: Evidence };
export type PlayerMemory = {
  version: 1;
  last: string;
  topics: Record<string, { active: string; steps: Record<string, StepMemory> }>;
};
export const freshPlayer = (): PlayerMemory => ({ version: 1, last: '', topics: {} });
export function stepMemory(s: PlayerMemory, topic: string, id: string): StepMemory {
  return (
    s.topics[topic]?.steps[id] || {
      value: labSpec[getStep(topic, id)!.lab].initial,
      trials: 0,
      hint: false,
    }
  );
}
export function readPlayer(raw?: string): PlayerMemory {
  if (!raw) return freshPlayer();
  const s = JSON.parse(raw) as PlayerMemory;
  if (
    !s ||
    s.version !== 1 ||
    typeof s.last !== 'string' ||
    (s.last && !getJourney(s.last)) ||
    !s.topics ||
    typeof s.topics !== 'object' ||
    Array.isArray(s.topics)
  )
    throw new Error('Invalid journey progress');
  for (const [topic, t] of Object.entries(s.topics)) {
    if (
      !getJourney(topic) ||
      !t ||
      !getStep(topic, t.active) ||
      !t.steps ||
      Array.isArray(t.steps) ||
      typeof t.steps !== 'object'
    )
      throw new Error('Invalid journey');
    for (const [id, m] of Object.entries(t.steps)) {
      const step = getStep(topic, id);
      if (!step || !m) throw new Error('Invalid step');
      const spec = labSpec[step.lab];
      if (
        !Number.isFinite(m.value) ||
        m.value < spec.min ||
        m.value > spec.max ||
        !Number.isSafeInteger(m.trials) ||
        m.trials < 0 ||
        typeof m.hint !== 'boolean'
      )
        throw new Error('Invalid experiment');
      const a = m.answer;
      if (
        a &&
        (!Number.isSafeInteger(a.choice) ||
          !step.options[a.choice] ||
          a.correct !== (a.choice === step.correct) ||
          !Number.isSafeInteger(a.attempts) ||
          a.attempts < 1 ||
          typeof a.firstCorrect !== 'boolean' ||
          typeof a.assisted !== 'boolean' ||
          !Number.isFinite(a.due) ||
          a.due < 0 ||
          !Number.isFinite(a.at) ||
          a.at < 0)
      )
        throw new Error('Invalid checkpoint');
    }
  }
  return s;
}
export function visitStep(s: PlayerMemory, topic: string, id: string): PlayerMemory {
  if (!getStep(topic, id)) return s;
  return {
    ...s,
    last: topic,
    topics: { ...s.topics, [topic]: { active: id, steps: s.topics[topic]?.steps || {} } },
  };
}
export function amendStep(
  s: PlayerMemory,
  topic: string,
  id: string,
  fn: (m: StepMemory) => StepMemory,
): PlayerMemory {
  if (!getStep(topic, id)) return s;
  const next = visitStep(s, topic, id);
  return {
    ...next,
    topics: {
      ...next.topics,
      [topic]: {
        ...next.topics[topic]!,
        steps: { ...next.topics[topic]!.steps, [id]: fn(stepMemory(s, topic, id)) },
      },
    },
  };
}
export function experiment(
  s: PlayerMemory,
  topic: string,
  id: string,
  value: number,
): PlayerMemory {
  const step = getStep(topic, id);
  if (!step) return s;
  const spec = labSpec[step.lab];
  if (!Number.isFinite(value) || value < spec.min || value > spec.max) return s;
  return amendStep(s, topic, id, (m) => ({
    ...m,
    value,
    trials: m.trials + (value !== m.value ? 1 : 0),
  }));
}
export function checkpoint(
  s: PlayerMemory,
  topic: string,
  id: string,
  choice: number,
  now = Date.now(),
): PlayerMemory {
  const step = getStep(topic, id);
  if (!step || !Number.isInteger(choice) || !step.options[choice]) return s;
  return amendStep(s, topic, id, (m) => {
    const correct = choice === step.correct;
    return {
      ...m,
      answer: {
        choice,
        correct,
        firstCorrect: m.answer?.firstCorrect ?? correct,
        assisted: m.hint || !!m.answer,
        attempts: (m.answer?.attempts || 0) + 1,
        at: now,
        due:
          correct && m.answer?.correct && now < m.answer.due
            ? m.answer.due
            : now + (correct ? 86400000 : 600000),
      },
    };
  });
}
export const completedSteps = (s: PlayerMemory, topic: string) =>
  getJourney(topic)?.steps.filter((step) => {
    const m = stepMemory(s, topic, step.id);
    return m.trials > 0 && m.answer?.correct;
  }).length || 0;
export function playerContext(topic: string, id: string, s: PlayerMemory) {
  const step = getStep(topic, id);
  if (!step) return undefined;
  const m = stepMemory(s, topic, id);
  return {
    title: getJourney(topic)!.title,
    activeStep: id,
    stepTitle: step.title,
    explanation: step.deep,
    source: step.source,
    sourceChecked: '2026-10-16',
    experiment: { kind: step.lab, value: m.value, trials: m.trials },
    checkpoint: {
      question: step.question,
      selected: m.answer ? step.options[m.answer.choice] : undefined,
      correct: m.answer?.correct,
      firstCorrect: m.answer?.firstCorrect,
      assisted: m.answer?.assisted,
    },
    instruction:
      'Explain this active step at the supplied learner level. Address observed misconceptions, label model simplifications, cite the supplied source when relevant, and ask a useful follow-up. Do not treat one correct answer as mastery.',
  };
}
