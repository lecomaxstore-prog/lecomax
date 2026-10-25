import { initial, readProgress, type Progress } from './progress';

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const object = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);
export class ProgressConflict extends Error {
  constructor(public paths: string[]) {
    super('PROGRESS_CONFLICT');
  }
}
/** Three-way merge. A conflict stops the entire transaction before any write. */
export function mergeProgress(base: Progress, local: Progress, remote: Progress): Progress {
  const conflicts: string[] = [];
  function merge(b: unknown, l: unknown, r: unknown, path: string): unknown {
    if (same(l, r)) return l;
    if (same(l, b)) return r;
    if (same(r, b)) return l;
    if (object(l) && object(r) && (object(b) || b === undefined)) {
      return Object.fromEntries(
        [...new Set([...Object.keys(l), ...Object.keys(r)])].map((k) => [
          k,
          merge(object(b) ? b[k] : undefined, l[k], r[k], path ? path + '.' + k : k),
        ]),
      );
    }
    // Completion/enrollment are additive only if neither device removed an old entry.
    if (
      ['completed', 'academy.enrolled', 'journey.overrides'].includes(path) &&
      Array.isArray(l) &&
      Array.isArray(r) &&
      (!Array.isArray(b) || b.every((x) => l.includes(x) && r.includes(x)))
    )
      return [...new Set([...l, ...r])];
    if (path === 'memory.evidence' || path === 'journey.diagnostics' || path === 'academy.visits') {
      if (
        Array.isArray(l) &&
        Array.isArray(r) &&
        (!Array.isArray(b) ||
          b.every((x) => l.some((y) => same(x, y)) && r.some((y) => same(x, y))))
      ) {
        const values = [...new Map([...l, ...r].map((x) => [JSON.stringify(x), x])).values()];
        return values.sort((a, b) => (path === 'academy.visits' ? b.at - a.at : a.at - b.at));
      }
    }
    conflicts.push(path);
    return l;
  }
  const result = merge(base, local, remote, '');
  if (conflicts.length) throw new ProgressConflict(conflicts);
  return readProgress(JSON.stringify(result));
}
export type ProgressTransport = {
  get: () => Promise<{ revision: number; snapshot: unknown }>;
  put: (revision: number, snapshot: Progress) => Promise<unknown>;
};
export async function synchronizeProgress(
  local: Progress,
  baseline: Progress | null,
  transport: ProgressTransport,
) {
  const remote = await transport.get();
  if (!Number.isSafeInteger(remote.revision) || remote.revision < 0)
    throw new Error('INVALID_REMOTE_PROGRESS');
  const server = remote.snapshot === null ? null : readProgress(JSON.stringify(remote.snapshot));
  const merged = server ? mergeProgress(baseline || initial, local, server) : local;
  if (!server || !same(merged, server)) await transport.put(remote.revision, merged);
  return merged;
}
