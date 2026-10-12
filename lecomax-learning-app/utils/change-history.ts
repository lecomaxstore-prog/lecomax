export type ChangeStatus = 'successful' | 'failed' | 'needs-testing';
export type ChangeReport = {
  id: string;
  createdAt: string;
  title: string;
  summary: string;
  status: ChangeStatus;
  relatedId?: string;
  retrospective?: boolean;
  pages: string[];
  components: string[];
  files: string[];
  changes: { kind: 'added' | 'modified' | 'removed' | 'fixed'; detail: string }[];
  validation: { name: string; result: 'passed' | 'failed' | 'not-run'; detail: string }[];
  preview?: { path: string; label: string; verifiedAt: string };
};
export const HISTORY_KEY = 'lecomax.change-history.v1';
const text = (v: unknown): v is string => typeof v === 'string' && !!v.trim() && v.length <= 12000;
const date = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/.test(v) && Number.isFinite(Date.parse(v));
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
export function readReports(value: unknown): ChangeReport[] {
  if (!Array.isArray(value)) throw new Error('Invalid change history');
  const ids = new Set<string>();
  for (const r of value) {
    if (!object(r) || !text(r.id) || !/^[a-z0-9][a-z0-9-]{2,99}$/.test(r.id) || ids.has(r.id) || !date(r.createdAt) || !text(r.title) || !text(r.summary) || !['successful', 'failed', 'needs-testing'].includes(String(r.status))) throw new Error('Invalid change report');
    ids.add(r.id);
    if (r.retrospective !== undefined && typeof r.retrospective !== "boolean") throw new Error("Invalid retrospective flag");
    if (r.relatedId !== undefined && (!text(r.relatedId) || r.relatedId === r.id)) throw new Error('Invalid related report');
    for (const key of ['pages', 'components', 'files']) if (!Array.isArray(r[key]) || !(r[key] as unknown[]).length || !(r[key] as unknown[]).every(text)) throw new Error('Missing affected areas');
    if (!Array.isArray(r.changes) || !r.changes.length || r.changes.some(c => !object(c) || !['added', 'modified', 'removed', 'fixed'].includes(String(c.kind)) || !text(c.detail))) throw new Error('Invalid change details');
    if (!Array.isArray(r.validation) || !r.validation.length || r.validation.some(c => !object(c) || !['passed', 'failed', 'not-run'].includes(String(c.result)) || !text(c.name) || !text(c.detail))) throw new Error('Invalid validation');
    if (r.status === 'successful' && r.validation.some(c => c.result === 'failed')) throw new Error('Successful report contains failed checks');
    if (r.preview !== undefined && (!object(r.preview) || !text(r.preview.label) || !date(r.preview.verifiedAt) || typeof r.preview.path !== 'string' || !/^\/(?!\/)[a-zA-Z0-9/_-]*$/.test(r.preview.path))) throw new Error('Invalid internal preview');
  }
  return value as ChangeReport[];
}
export function readArchive(raw: string | null): ChangeReport[] {
  if (raw === null) return [];
  const value: unknown = JSON.parse(raw);
  if (!object(value) || value.version !== 1) throw new Error('Unsupported history archive');
  return readReports(value.reports);
}
export function mergeReports(saved: ChangeReport[], bundled: ChangeReport[]): ChangeReport[] {
  readReports(saved); readReports(bundled);
  const records = new Map(saved.map(r => [r.id, r]));
  for (const r of bundled) {
    const prior = records.get(r.id);
    if (prior && JSON.stringify(prior) !== JSON.stringify(r)) throw new Error('An existing report was changed. Archive preserved.');
    records.set(r.id, r);
  }
  return [...records.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id));
}
export function serializeHistory(reports: ChangeReport[]) {
  return JSON.stringify({ version: 1, reports: readReports(reports) });
}
export async function archiveReports(storage: { getItem: (key: string) => Promise<string | null>; setItem: (key: string, value: string) => Promise<void> }, bundled: ChangeReport[], available?: (reports: ChangeReport[]) => void) {
  const saved = readArchive(await storage.getItem(HISTORY_KEY));
  if (saved.length) available?.(mergeReports([], saved));
  const reports = mergeReports(saved, bundled);
  available?.(reports);
  const raw = serializeHistory(reports);
  await storage.setItem(HISTORY_KEY, raw);
  return reports;
}
export function formatChangeDate(value: string, language = 'en') {
  return new Intl.DateTimeFormat(language, { timeZone: 'Europe/Paris', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).format(new Date(value)) + ' · Europe/Paris';
}
