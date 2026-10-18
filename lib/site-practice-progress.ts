export const PRACTICE_KEY = "lecomax-practical-missions-v1";
export const missionIds = ["local", "api", "github", "vercel"] as const;
export type MissionId = typeof missionIds[number];
export type PracticeProgress = {
  active: MissionId;
  steps: Record<MissionId, number[]>;
  notes: Record<MissionId, string>;
  passed: MissionId[];
};
const counts: Record<MissionId, number> = { local: 3, api: 3, github: 3, vercel: 4 };
const record = (value: unknown): Record<string, unknown> => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
export function readPracticeProgress(raw: unknown): PracticeProgress {
  const value = record(raw), steps = record(value.steps), notes = record(value.notes);
  return {
    active: missionIds.includes(value.active as MissionId) ? value.active as MissionId : "local",
    steps: Object.fromEntries(missionIds.map(id => [id, [...new Set(Array.isArray(steps[id]) ? steps[id].filter((n: unknown) => typeof n === "number" && Number.isInteger(n) && n >= 0 && n < counts[id]) : [])]])) as PracticeProgress["steps"],
    notes: Object.fromEntries(missionIds.map(id => [id, typeof notes[id] === "string" ? notes[id].slice(0, 2000) : ""])) as PracticeProgress["notes"],
    passed: missionIds.filter(id => Array.isArray(value.passed) && value.passed.includes(id)),
  };
}
export function missionComplete(progress: PracticeProgress, id: MissionId): boolean {
  return progress.steps[id].length === counts[id] && progress.passed.includes(id);
}
