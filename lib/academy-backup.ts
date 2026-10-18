import { readProgress } from "../lecomax-learning-app/utils/progress";

export function validateBackup(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const v = value as { revision?: unknown; snapshot?: unknown };
  if (
    !Number.isSafeInteger(v.revision) ||
    (v.revision as number) < 0 ||
    (v.revision as number) > 2147483646
  )
    return null;
  try {
    const raw = JSON.stringify(v.snapshot);
    if (!raw || raw.length > 4_000_000) return null;
    return { revision: v.revision as number, snapshot: readProgress(raw) };
  } catch {
    return null;
  }
}
