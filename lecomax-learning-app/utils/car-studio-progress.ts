export type CarStudioProgress = { studied: string[]; answers: Record<string, { correct: boolean; attempts: number }> };
const ids = new Set(['body', 'engine', 'transmission', 'suspension', 'brakes', 'wheels', 'cooling', 'exhaust', 'steering', 'differential', 'electrical', 'interior']);
export function readCarStudioProgress(value: unknown): CarStudioProgress {
  if (value === undefined) return { studied: [], answers: {} };
  if (!value || typeof value !== 'object') throw Error('Invalid car studio progress');
  const state = value as CarStudioProgress;
  if (!Array.isArray(state.studied) || state.studied.some(id => !ids.has(id)) || new Set(state.studied).size !== state.studied.length || !state.answers || typeof state.answers !== 'object' || Array.isArray(state.answers)) throw Error('Invalid car studio progress');
  for (const [id, answer] of Object.entries(state.answers)) if (!ids.has(id) || !answer || typeof answer.correct !== 'boolean' || !Number.isSafeInteger(answer.attempts) || answer.attempts < 1) throw Error('Invalid car studio answer');
  return { studied: [...state.studied], answers: { ...state.answers } };
}
