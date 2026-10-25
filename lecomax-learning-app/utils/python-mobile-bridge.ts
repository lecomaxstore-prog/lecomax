export function pythonProgressSubset(state: { drafts: Record<string, string>; answers: Record<string, unknown>; theme: string; level: number; language: string }) {
  return { drafts: Object.fromEntries(Object.entries(state.drafts).filter(([key]) => isPythonDraft(key))), answers: Object.fromEntries(Object.entries(state.answers).filter(([key]) => key.startsWith('python-practice:'))), theme: state.theme, level: state.level, language: state.language };
}
export function isPythonDraft(key: string) { return /^(python-studio:|python-lesson:|python-working:|python-script:|python-exercise:)/.test(key); }

export function readPythonMobileDraft(value: unknown): { key: string; code: string } | null {
  if (!value || typeof value !== 'object') return null;
  const draft = value as { key?: unknown; code?: unknown };
  if (typeof draft.key !== 'string' || draft.key.length > 150 || !/^python-(studio|lesson|working|exercise):/.test(draft.key)
    || typeof draft.code !== 'string' || draft.code.length > 64000) return null;
  return { key: draft.key, code: draft.code };
}

// An older debounced snapshot must not overwrite a newer immediate keystroke.
export function mergePythonDraftSnapshot(snapshot: Record<string, string>, pending: Record<string, string>) {
  const remaining = { ...pending };
  for (const [key, code] of Object.entries(remaining)) if (snapshot[key] === code) delete remaining[key];
  return { drafts: { ...snapshot, ...remaining }, pending: remaining };
}
type Answer = { lessonId: string; questionId: string; choice: number; correct: boolean; attempts: number };
export function readPythonMobileProgress(value: unknown): { drafts: Record<string, string>; answers: Record<string, Answer> } | null {
  if (!value || typeof value !== 'object') return null;
  const p = value as { drafts: unknown; answers: unknown };
  if (!p.drafts || typeof p.drafts !== 'object' || Array.isArray(p.drafts) || !p.answers || typeof p.answers !== 'object' || Array.isArray(p.answers)) return null;
  const drafts = Object.entries(p.drafts), answers = Object.entries(p.answers);
  if (drafts.length > 400 || drafts.some(([key, code]) => !isPythonDraft(key) || key.length > 150 || typeof code !== 'string' || code.length > 64000)) return null;
  if (answers.length > 20 || answers.some(([key, answer]) => !key.startsWith('python-practice:') || !answer || typeof answer !== 'object' || answer.lessonId !== key || answer.questionId !== 'isolated-cases' || answer.choice !== 0 || typeof answer.correct !== 'boolean' || !Number.isInteger(answer.attempts) || answer.attempts < 1 || answer.attempts > 1000000)) return null;
  return { drafts: Object.fromEntries(drafts), answers: Object.fromEntries(answers) } as { drafts: Record<string, string>; answers: Record<string, Answer> };
}
