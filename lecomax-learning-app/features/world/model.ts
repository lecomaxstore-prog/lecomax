import { countries, getTopic, missions, questionsFor } from './content';
export const WORLD_KEY = 'world:v1';
export type Evidence = {
  choice: number;
  attempts: number;
  firstCorrect: boolean;
  correct: boolean;
  at: string;
};
export type WorldState = {
  version: 1;
  last: string;
  visited: string[];
  saved: string[];
  map: string[];
  answers: Record<string, Evidence>;
};
export const freshWorld = (): WorldState => ({
  version: 1,
  last: '',
  visited: [],
  saved: [],
  map: [],
  answers: {},
});
export function validTopic(id: string) {
  return !!getTopic(id) || countries.some((c) => 'country:' + c.id === id);
}
export function readWorld(raw?: string): WorldState {
  if (!raw) return freshWorld();
  const v = JSON.parse(raw) as WorldState;
  if (
    v.version !== 1 ||
    typeof v.last !== 'string' ||
    (v.last && !validTopic(v.last)) ||
    !['visited', 'saved', 'map'].every(
      (k) => Array.isArray(v[k as 'saved']) && v[k as 'saved'].every((x) => typeof x === 'string'),
    ) ||
    !v.answers ||
    typeof v.answers !== 'object' ||
    Array.isArray(v.answers)
  )
    throw new Error('Invalid discovery journal');
  for (const a of Object.values(v.answers))
    if (
      !a ||
      !Number.isInteger(a.choice) ||
      a.choice < 0 ||
      !Number.isInteger(a.attempts) ||
      a.attempts < 1 ||
      typeof a.correct !== 'boolean' ||
      typeof a.firstCorrect !== 'boolean' ||
      typeof a.at !== 'string'
    )
      throw new Error('Invalid discovery evidence');
  return {
    ...v,
    visited: v.visited.filter(validTopic),
    saved: v.saved.filter(validTopic),
    map: v.map.filter((id) => countries.some((c) => c.id === id)),
  };
}
export function visitWorld(s: WorldState, id: string): WorldState {
  return validTopic(id) ? { ...s, last: id, visited: [...new Set([...s.visited, id])] } : s;
}
export function saveWorld(s: WorldState, id: string): WorldState {
  return validTopic(id)
    ? { ...s, saved: s.saved.includes(id) ? s.saved.filter((x) => x !== id) : [...s.saved, id] }
    : s;
}
export function answerWorld(
  s: WorldState,
  id: string,
  qid: string,
  choice: number,
  at: string,
): WorldState {
  if (!validTopic(id)) return s;
  const q = questionsFor(id).find((q) => q.id === qid);
  if (!q || !Number.isInteger(choice) || choice < 0 || choice >= q.options.length) return s;
  const old = s.answers[qid];
  const correct = choice === q.correct;
  return {
    ...s,
    answers: {
      ...s.answers,
      [qid]: {
        choice,
        attempts: (old?.attempts || 0) + 1,
        firstCorrect: old?.firstCorrect ?? correct,
        correct,
        at,
      },
    },
  };
}
export function topicComplete(s: WorldState, id: string) {
  const qs = questionsFor(id);
  return s.visited.includes(id) && qs.length > 0 && qs.every((q) => s.answers[q.id]?.correct);
}
export function missionComplete(s: WorldState, id: string) {
  const m = missions.find((m) => m.id === id);
  return !!m && m.topics.every((t) => topicComplete(s, t)) && (!m.map || s.map.includes(m.map));
}
export function challengeQueue(s: WorldState) {
  const ids = [
    'earth',
    'seasons',
    'plates',
    'mars',
    'jupiter',
    'habitats',
    'continents',
    'country:MAR',
    'country:BRA',
  ];
  const all = ids.flatMap((id) => questionsFor(id).map((q) => ({ topic: id, q })));
  const strong = Object.values(s.answers).filter((a) => a.firstCorrect && a.correct).length >= 4;
  return all.sort((a, b) => {
    const rank = (x: typeof a) =>
      s.answers[x.q.id] && !s.answers[x.q.id]!.correct
        ? 0
        : !s.answers[x.q.id]
          ? strong
            ? 3 - x.q.level
            : x.q.level
          : 4;
    return rank(a) - rank(b);
  });
}
