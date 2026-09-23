import { DAILY_TEST_VERSION, gradeDailyTest } from "./daily-tests.ts";

export type DailyAssessment = { version: number; answers: number[]; attempts: number; submittedOn: string };
export type DailyEntry = { note: string; practiced: boolean; compared: boolean; trainedDays?: string[]; readOn?: string; completedOn?: string; assessment?: DailyAssessment };
export type DailyProgress = Record<string, DailyEntry>;
const validDay = (value: unknown): value is string => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);

export function recordTrainingDay(entry: DailyEntry, today: string, checked: boolean): DailyEntry {
  if (!validDay(today) || !Number.isFinite(Date.parse(today)) || new Date(today).toISOString().slice(0, 10) !== today) return entry;
  const days = new Set(entry.trainedDays ?? []);
  if (checked) days.add(today); else days.delete(today);
  return { ...entry, trainedDays: [...days].sort() };
}

export function recordDailyAttempt(id: string, entry: DailyEntry, answers: unknown, today: string): DailyEntry | null {
  const result = gradeDailyTest(id, answers);
  if (!result || !entry.practiced || !validDay(today)) return null;
  return {
    ...entry,
    assessment: { version: DAILY_TEST_VERSION, answers: [...answers as number[]], attempts: Math.min(100000, (entry.assessment?.attempts ?? 0) + 1), submittedOn: today },
    completedOn: result.passed ? (entry.completedOn ?? today) : undefined,
  };
}

export function readDailyProgress(raw: unknown, ids: string[]): DailyProgress {
  const clean: DailyProgress = {};
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return clean;
  const record = raw as Record<string, unknown>;
  for (const id of ids) {
    const item = record[id];
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const value = item as Record<string, unknown>;
    const candidate = value.assessment as Partial<DailyAssessment> | undefined;
    const assessment = candidate && candidate.version === DAILY_TEST_VERSION && gradeDailyTest(id, candidate.answers) && Number.isSafeInteger(candidate.attempts) && candidate.attempts! > 0 && candidate.attempts! <= 100000 && validDay(candidate.submittedOn)
      ? { version: DAILY_TEST_VERSION, answers: [...candidate.answers!], attempts: candidate.attempts!, submittedOn: candidate.submittedOn } : undefined;
    const passed = assessment && value.practiced === true && gradeDailyTest(id, assessment.answers)?.passed;
    clean[id] = {
      note: typeof value.note === "string" ? value.note.slice(0, 1500) : "",
      practiced: value.practiced === true,
      compared: value.compared === true,
      ...(Array.isArray(value.trainedDays) ? { trainedDays: [...new Set(value.trainedDays.filter(day => validDay(day) && Number.isFinite(Date.parse(day)) && new Date(day).toISOString().slice(0, 10) === day))].sort() } : {}),
      ...(validDay(value.readOn) ? { readOn: value.readOn } : validDay(value.completedOn) ? { readOn: value.completedOn } : {}),
      ...(assessment ? { assessment } : {}),
      ...(passed && validDay(value.completedOn) ? { completedOn: value.completedOn } : {}),
    };
  }
  return clean;
}

export function resumeDailyLesson(progress: DailyProgress, ids: string[], today: string) {
  const latestToday = ids.findLastIndex(id => progress[id]?.completedOn === today || progress[id]?.trainedDays?.includes(today));
  const next = ids.findIndex(id => !progress[id]?.completedOn && !progress[id]?.trainedDays?.length);
  return latestToday >= 0 ? latestToday : next >= 0 ? next : Math.max(0, ids.length - 1);
}
