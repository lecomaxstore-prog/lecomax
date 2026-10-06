export const LEARNING_INTERVALS = [10, 20, 30, 60] as const;
export type LearningSettings = {
  enabled: boolean;
  paused: boolean;
  interval_minutes: number;
  quiet_enabled: boolean;
  quiet_start: string;
  quiet_end: string;
  time_zone: string;
  next_due_at?: string;
};
export const DEFAULT_LEARNING_SETTINGS: LearningSettings = {
  enabled: false, paused: false, interval_minutes: 10,
  quiet_enabled: true, quiet_start: "22:00", quiet_end: "08:00", time_zone: "Europe/Paris",
};
export type LearningTip = {
  id: number; topic: string; level: number; difficulty: string; title: string;
  content: string; code: string; remember: string; source_path: string;
};
export type LearningHistory = {
  id: string; tip_id: number; title: string; content: string; topic: string; level: number;
  sent_at: string | null; created_at: string; read_at: string | null; learned_at: string | null;
  favorite: boolean; delivery_state: string;
};

export function validateLearningSettings(value: unknown): LearningSettings | null {
  if (!value || typeof value !== "object") return null;
  const settings = value as LearningSettings;
  if (![settings.enabled, settings.paused, settings.quiet_enabled].every(item => typeof item === "boolean")) return null;
  if (!LEARNING_INTERVALS.includes(settings.interval_minutes as 10)) return null;
  if (![settings.quiet_start, settings.quiet_end].every(item => typeof item === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(item))) return null;
  if (settings.quiet_enabled && settings.quiet_start === settings.quiet_end) return null;
  try { new Intl.DateTimeFormat("en", { timeZone: settings.time_zone }).format(); } catch { return null; }
  if (typeof settings.time_zone !== "string" || !settings.time_zone || settings.time_zone.length > 100) return null;
  return {
    enabled: settings.enabled, paused: settings.paused, interval_minutes: settings.interval_minutes,
    quiet_enabled: settings.quiet_enabled, quiet_start: settings.quiet_start, quiet_end: settings.quiet_end, time_zone: settings.time_zone,
  };
}

export function learningProgress(tips: LearningTip[], history: LearningHistory[]) {
  const learned = new Set(history.filter(row => row.learned_at).map(row => row.tip_id));
  const levels = [...new Set(tips.map(tip => tip.level))];
  const completed = levels.filter(level => tips.filter(tip => tip.level === level).every(tip => learned.has(tip.id)));
  return {
    learned: learned.size, received: history.filter(row => row.sent_at).length,
    topics: completed.length, total: tips.length,
    level: levels.find(level => !completed.includes(level)) ?? levels.at(-1) ?? 1,
    percent: tips.length ? Math.round(learned.size / tips.length * 100) : 0,
  };
}

export function learningTipUrl(id: number) {
  return `/admin/how-it-was-built/learn/tip/${id}/`;
}
