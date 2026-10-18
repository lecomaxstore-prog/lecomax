export type JourneyState = {
  version: 1;
  activeCourse: string;
  starts: Record<string, string>;
  overrides: string[];
  projects: Record<string, { artifact: string; reviewed: boolean; at: number }>;
  diagnostics: {
    courseId: string;
    at: number;
    answers: Record<string, number>;
    recommendedModule: string;
  }[];
};
export const emptyJourney = (): JourneyState => ({
  version: 1,
  activeCourse: '',
  starts: {},
  overrides: [],
  diagnostics: [],
  projects: {},
});
export function readJourney(value: unknown): JourneyState {
  if (value === undefined) return emptyJourney();
  const p = value as JourneyState;
  const text = (v: unknown): v is string => typeof v === 'string' && v.length <= 500;
  const map = (v: unknown): v is Record<string, unknown> =>
    !!v && typeof v === 'object' && !Array.isArray(v);
  if (
    !p ||
    p.version !== 1 ||
    !text(p.activeCourse) ||
    !map(p.starts) ||
    !Object.values(p.starts).every(text) ||
    !Array.isArray(p.overrides) ||
    !p.overrides.every(text) ||
    !Array.isArray(p.diagnostics)
  )
    throw new Error('Invalid journey');
  for (const d of p.diagnostics)
    if (
      !d ||
      !text(d.courseId) ||
      !text(d.recommendedModule) ||
      !Number.isSafeInteger(d.at) ||
      d.at < 0 ||
      !map(d.answers) ||
      !Object.values(d.answers).every((n) => Number.isInteger(n) && Number(n) >= 0)
    )
      throw new Error('Invalid diagnostic');
  const projects = p.projects === undefined ? {} : p.projects;
  if (
    !map(projects) ||
    Object.values(projects).some(
      (v) =>
        !v ||
        typeof v.artifact !== 'string' ||
        v.artifact.length > 20000 ||
        typeof v.reviewed !== 'boolean' ||
        !Number.isSafeInteger(v.at) ||
        v.at < 0,
    )
  )
    throw new Error('Invalid project evidence');
  return { ...p, projects };
}
