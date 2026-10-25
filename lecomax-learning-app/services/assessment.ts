import type { Assessment, AssessmentQuestion, Response, Mission } from '../types/assessment';

export const assessmentStandards = { quiz: 80, module: 85, course: 90 } as const;
const unique = (values: number[]) => new Set(values).size === values.length;
export function isResponse(question: AssessmentQuestion, value: unknown): value is Response {
  if (question.kind === 'number' || question.kind === 'output') return typeof value === 'string' && value.length <= 2000;
  return Array.isArray(value) && value.length <= question.options.length && unique(value) && value.every(v => Number.isInteger(v) && v >= 0 && v < question.options.length)
    && (question.kind !== 'single' || value.length <= 1);
}
export function answerCorrect(q: AssessmentQuestion, response: Response | undefined): boolean {
  if (!isResponse(q, response)) return false;
  if (q.kind === 'number') {
    const text = (response as string).trim();
    // Decimal answers only; reject blank, hex, exponent, Infinity and partial parses.
    return /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(text) && Number(text) === q.expected;
  }
  if (q.kind === 'output') return q.expected.includes((response as string).replace(/\r\n/g, '\n').trim());
  const values = response as number[];
  if (q.kind === 'single') return values.length === 1 && values[0] === q.correct;
  if (q.kind === 'order') return values.length === q.correct.length && values.every((n, i) => n === q.correct[i]);
  return values.length === q.correct.length && q.correct.every(n => values.includes(n));
}
export function grade(assessment: Assessment, responses: Record<string, Response>) {
  const results = assessment.questions.map(q => ({ id: q.id, skill: q.skill, critical: !!q.critical, correct: answerCorrect(q, responses[q.id]) }));
  const correct = results.filter(r => r.correct).length;
  const total = results.length;
  const score = total ? correct * 100 / total : 0;
  return { score, correct, total, results, passed: total > 0 && correct * 100 >= assessment.threshold * total && results.every(r => !r.critical || r.correct) };
}
export function validateMission(m: Mission): void {
  const ids = new Set<string>();
  if (!m.id || !Number.isInteger(m.version) || m.version < 1 || !m.activities.length) throw new Error('Invalid mission');
  for (const a of m.activities) {
    if (ids.has(a.id) || !a.id || !a.questions.length || !Number.isFinite(a.threshold) || a.threshold < 1 || a.threshold > 100) throw new Error('Invalid assessment');
    ids.add(a.id);
    for (const q of a.questions) {
      if (ids.has(q.id) || !q.id || !q.skill) throw new Error('Duplicate or invalid question');
      ids.add(q.id);
      for (const text of [q.prompt, q.explanation, q.hint, ...('options' in q ? q.options : [])]) {
        if (text.length !== 3 || text.some(s => typeof s !== 'string' || !s.trim())) throw new Error('Missing translation');
      }
      if (q.kind === 'number') { if (!Number.isFinite(q.expected)) throw new Error('Invalid numeric answer'); }
      else if (q.kind === 'output') { if (!q.expected.length || q.expected.some(s => !s.trim())) throw new Error('Missing output answer'); }
      else {
        const correct = q.kind === 'single' ? [q.correct] : [...q.correct];
        if (q.options.length < 2 || !correct.length || !isResponse(q, correct)) throw new Error('Invalid choice answer');
        if (q.kind === 'order' && correct.length !== q.options.length) throw new Error('Incomplete ordering');
      }
    }
  }
}

export type MissionAttempt = {
  version: 1;
  contentVersion: number;
  startedOn: string;
  goal: 20 | 45 | 60;
  active: number;
  responses: Record<string, Response>;
  submissions: Record<string, Record<string, Response>>;
  attempts: Record<string, number>;
};
export const missionKey = (m: Mission) => `mission:v1:${m.id}`;
export function newMission(m: Mission, date: string): MissionAttempt {
  return { version: 1, contentVersion: m.version, startedOn: date, goal: 45, active: 0, responses: {}, submissions: {}, attempts: {} };
}
const map = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
export function readMission(m: Mission, raw: string | undefined, date: string): MissionAttempt {
  if (raw === undefined) return newMission(m, date);
  const v = JSON.parse(raw) as MissionAttempt;
  if (!v || v.version !== 1 || v.contentVersion !== m.version || !/^\d{4}-\d{2}-\d{2}$/.test(v.startedOn) || ![20,45,60].includes(v.goal) || !Number.isInteger(v.active) || v.active < 0 || v.active >= m.activities.length || !map(v.responses) || !map(v.submissions) || !map(v.attempts)) throw new Error('Mission data needs recovery');
  const questions = m.activities.flatMap(a => a.questions);
  for (const [id, value] of Object.entries(v.responses)) {
    const q = questions.find(q => q.id === id);
    if (!q || !isResponse(q, value)) throw new Error('Invalid saved response');
  }
  for (const [id, submission] of Object.entries(v.submissions)) {
    const a = m.activities.find(a => a.id === id);
    if (!a || !map(submission)) throw new Error('Invalid saved submission');
    for (const [qid, response] of Object.entries(submission)) {
      const q = a.questions.find(q => q.id === qid);
      if (!q || !isResponse(q, response)) throw new Error('Invalid submitted response');
    }
  }
  for (const [id, count] of Object.entries(v.attempts)) if (!m.activities.some(a => a.id === id) || !Number.isSafeInteger(count) || count < 1) throw new Error('Invalid attempt count');
  return v;
}
export function missionStatus(m: Mission, state: MissionAttempt) {
  // Recompute from submitted answers; never trust a stored percentage or passed flag.
  const activities = m.activities.map(a => { const response = state.submissions[a.id]; return response ? grade(a, response) : undefined; });
  const done = activities.filter(a => a?.passed).length;
  return { activities, done, complete: done === m.activities.length, percent: Math.round(done * 100 / m.activities.length) };
}
export function submitActivity(m: Mission, state: MissionAttempt, index: number): MissionAttempt {
  if (!Number.isInteger(index) || index < 0 || index >= m.activities.length) throw new Error('Invalid activity');
  const status = missionStatus(m, state);
  if (status.activities.slice(0, index).some(a => !a?.passed)) throw new Error('Complete prerequisite activities');
  const a = m.activities[index];
  if (!a) throw new Error('Invalid activity');
  const submission: Record<string, Response> = {};
  for (const q of a.questions) {
    const response = state.responses[q.id];
    if (isResponse(q, response)) submission[q.id] = Array.isArray(response) ? [...response] : response;
  }
  return { ...state, submissions: { ...state.submissions, [a.id]: submission }, attempts: { ...state.attempts, [a.id]: (state.attempts[a.id] || 0) + 1 } };
}
