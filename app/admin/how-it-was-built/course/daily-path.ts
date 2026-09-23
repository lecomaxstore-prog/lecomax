import manifest from "./generated/manifest.json" with { type: "json" };
import { DAILY_LESSONS } from "./daily-lessons.ts";

// Keep the daily path focused on building software, in prerequisite order.
const modules = ["module-00-learning-tools", "module-02-git-github", "module-03-html-accessibility", "module-04-css", "module-05-responsive-tailwind", "module-06-javascript-foundations", "module-07-js-data-problem-solving", "module-08-dom-forms-storage", "async-fetch-errors", "typescript-contracts", "react-fundamentals", "react-state-forms-hooks", "nextjs-app-router", "nextjs-server-data", "sql-data-modeling", "supabase-platform", "ecommerce-architecture", "authentication-security-privacy", "quality-engineering", "web-quality", "deployment-operations", "final-store-capstone"];
export const DAILY_PATH = [
  ...DAILY_LESSONS.map(lesson => ({ id: lesson.id, moduleId: "", lessonId: lesson.id })),
  ...modules.flatMap(moduleId => (manifest.modules.find(module => module.id === moduleId)?.lessonIds ?? []).map(lessonId => ({ id: `${moduleId}/${lessonId}`, moduleId, lessonId }))),
];
export type SessionStage = "welcome" | "learn" | "practice" | "quiz";
export type SessionEntry = { stage: SessionStage; note: string; practiced: boolean; answers?: number[]; completedOn?: string };
export type SessionProgress = Record<string, SessionEntry>;
export const emptySession: SessionEntry = { stage: "welcome", note: "", practiced: false };
const dateValid = (date: unknown): date is string => typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(date)) && new Date(date).toISOString().slice(0, 10) === date;
export function readSessions(raw: unknown): SessionProgress {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const clean: SessionProgress = {};
  for (const { id } of DAILY_PATH) {
    const value = (raw as Record<string, unknown>)[id];
    if (!value || typeof value !== "object") continue;
    const item = value as SessionEntry;
    const answers = Array.isArray(item.answers) && item.answers.length > 0 && item.answers.length < 30 && item.answers.every(answer => Number.isInteger(answer) && answer >= 0 && answer < 20) ? item.answers : undefined;
    clean[id] = { stage: ["welcome", "learn", "practice", "quiz"].includes(item.stage) ? item.stage : "welcome", note: typeof item.note === "string" ? item.note.slice(0, 1500) : "", practiced: item.practiced === true, ...(answers ? { answers } : {}), ...(answers && item.practiced === true && dateValid(item.completedOn) ? { completedOn: item.completedOn } : {}) };
  }
  return clean;
}
export function nextDailySession(progress: SessionProgress, today: string) {
  const todayIndex = DAILY_PATH.findLastIndex(item => progress[item.id]?.completedOn === today);
  if (todayIndex >= 0) return todayIndex;
  const next = DAILY_PATH.findIndex(item => !progress[item.id]?.completedOn);
  return next < 0 ? DAILY_PATH.length - 1 : next;
}
export function gradeSession(answers: number[], correct: number[]) {
  const score = correct.filter((answer, index) => answers[index] === answer).length;
  return { score, total: correct.length, passed: correct.length > 0 && answers.length === correct.length && score === correct.length };
}
export function finishSession(entry: SessionEntry, answers: number[], correct: number[], today: string): SessionEntry {
  if (!entry.practiced || !dateValid(today) || entry.completedOn) return entry;
  const result = gradeSession(answers, correct);
  return { ...entry, stage: "quiz", answers: [...answers], ...(result.passed ? { completedOn: entry.completedOn ?? today } : {}) };
}
