import { catalog, getDiscovery } from './catalog';
import { getJourney } from './journeys';
export const CURIOSITY_KEY = 'curiosity:v1';
export type Journal = {
  version: 1;
  visited: string[];
  saved: string[];
  interests: string[];
  depth: 'simple' | 'deep';
  collections: Record<string, string[]>;
  answers: Record<
    string,
    {
      choice: number;
      attempts: number;
      firstCorrect: boolean;
      correct: boolean;
      streak: number;
      due: number;
    }
  >;
};
export const freshJournal = (): Journal => ({
  version: 1,
  visited: [],
  saved: [],
  interests: [],
  depth: 'simple',
  collections: {},
  answers: {},
});
export function readJournal(raw?: string): Journal {
  if (!raw) return freshJournal();
  const v = JSON.parse(raw) as Journal;
  const ids = (x: unknown): x is string[] =>
    Array.isArray(x) && x.every((id) => typeof id === 'string' && !!getDiscovery(id));
  if (
    !v ||
    v.version !== 1 ||
    !ids(v.visited) ||
    !(
      Array.isArray(v.saved) &&
      v.saved.every((id) => typeof id === 'string' && (getDiscovery(id) || getJourney(id)))
    ) ||
    !Array.isArray(v.interests) ||
    !v.interests.every((x) => typeof x === 'string') ||
    !['simple', 'deep'].includes(v.depth) ||
    !v.collections ||
    Array.isArray(v.collections) ||
    typeof v.collections !== 'object' ||
    !Object.values(v.collections).every(ids) ||
    !v.answers ||
    Array.isArray(v.answers) ||
    typeof v.answers !== 'object'
  )
    throw new Error('Invalid curiosity journal; original data preserved.');
  for (const [id, a] of Object.entries(v.answers)) {
    const d = getDiscovery(id);
    if (
      !d ||
      !a ||
      !Number.isInteger(a.choice) ||
      !d.options[a.choice] ||
      !Number.isInteger(a.attempts) ||
      a.attempts < 1 ||
      typeof a.firstCorrect !== 'boolean' ||
      a.correct !== (a.choice === d.correct) ||
      !Number.isInteger(a.streak) ||
      a.streak < 0 ||
      !Number.isFinite(a.due) ||
      a.due < 0
    )
      throw new Error('Invalid curiosity evidence; original data preserved.');
  }
  return v;
}
export function answer(s: Journal, id: string, choice: number, now = Date.now()): Journal {
  const d = getDiscovery(id);
  if (!d || !Number.isInteger(choice) || !d.options[choice]) return s;
  const old = s.answers[id];
  const correct = choice === d.correct;
  // Repeated clicks before a scheduled review do not manufacture mastery.
  const streak = correct
    ? old?.correct && now < old.due
      ? old.streak
      : (old?.streak || 0) + 1
    : 0;
  const due = correct
    ? old?.correct && now < old.due
      ? old.due
      : now + [1, 3, 7, 14, 30][Math.min(streak - 1, 4)]! * 86400000
    : now + 600000;
  return {
    ...s,
    answers: {
      ...s.answers,
      [id]: {
        choice,
        correct,
        streak,
        due,
        attempts: (old?.attempts || 0) + 1,
        firstCorrect: old?.firstCorrect ?? correct,
      },
    },
  };
}
export function dailyDiscovery(date = new Date()) {
  return catalog[
    Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000) %
      catalog.length
  ]!;
}
export function recommend(s: Journal, current = '', subjects: string[] = [], now = Date.now()) {
  const related = getDiscovery(current)?.related || [];
  const score = (id: string, category: string) =>
    ((s.answers[id]?.due ?? Infinity) <= now ? 8 : 0) +
    (related.includes(id) ? 4 : 0) +
    ([...s.interests, ...subjects].some((x) => x.toLowerCase().includes(category.toLowerCase()))
      ? 3
      : 0) +
    (!s.visited.includes(id) ? 2 : 0);
  const sorted = catalog
    .filter((d) => d.id !== current)
    .sort((a, b) => score(b.id, b.category) - score(a.id, a.category) || a.id.localeCompare(b.id));
  const diverse = sorted.find((d) => d.category !== sorted[0]?.category);
  return [
    ...new Map(
      [...sorted.slice(0, 2), ...(diverse ? [diverse] : []), ...sorted].map((d) => [d.id, d]),
    ).values(),
  ].slice(0, 6);
}
export const modes = [
  'Did You Know?',
  'How Does It Work?',
  'How Is It Made?',
  'Who Invented It?',
  'Why Does This Happen?',
  'What’s Inside?',
  'The History Behind It',
  'Future Technologies',
  'Myth vs. Reality',
  'Explore Anything With AI',
] as const;
export function forMode(mode: string) {
  return catalog.filter((d) =>
    mode === 'How Is It Made?'
      ? ['ai', 'chips'].includes(d.id)
      : mode === 'How Does It Work?'
        ? !!d.steps || !!d.parts
        : mode === 'Who Invented It?' || mode === 'The History Behind It'
          ? !!d.history
          : mode === 'What’s Inside?'
            ? !!d.parts
            : mode === 'Future Technologies'
              ? d.evidence === 'research frontier'
              : mode === 'Myth vs. Reality'
                ? !!d.myth
                : mode === 'Why Does This Happen?'
                  ? ['Physics', 'Earth', 'Nature', 'Humans'].includes(d.category)
                  : true,
  );
}
