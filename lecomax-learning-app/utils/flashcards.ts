export type Rating = 'again' | 'hard' | 'good' | 'easy';
export type MemoryCard = {
  id: string;
  question: string;
  answer: string;
  source: string;
  createdAt: number;
  dueAt: number;
  lastAt: number;
  interval: number;
  ease: number;
  repetitions: number;
};
export type ReviewEvent = { cardId: string; at: number; rating: Rating; dueAt: number };
export type Flashcards = { version: 1; cards: MemoryCard[]; events: ReviewEvent[] };
export const emptyFlashcards = (): Flashcards => ({ version: 1, cards: [], events: [] });
const DAY = 86400000;
const time = (v: number) => Number.isSafeInteger(v) && v >= 0 && v <= 8640000000000000;
const text = (v: unknown, max: number) =>
  typeof v === 'string' && v.trim().length > 0 && v.length <= max;
export function readFlashcards(value: unknown): Flashcards {
  if (value === undefined) return emptyFlashcards();
  const v = value as Flashcards;
  if (
    !v ||
    v.version !== 1 ||
    !Array.isArray(v.cards) ||
    v.cards.length > 5000 ||
    !Array.isArray(v.events) ||
    v.events.length > 100000
  )
    throw new Error('Invalid memory studio');
  const ids = new Set<string>();
  for (const c of v.cards) {
    if (
      !c ||
      !text(c.id, 100) ||
      ids.has(c.id) ||
      !text(c.question, 2000) ||
      !text(c.answer, 6000) ||
      typeof c.source !== 'string' ||
      c.source.length > 500 ||
      !time(c.createdAt) ||
      !time(c.dueAt) ||
      !time(c.lastAt) ||
      !Number.isInteger(c.interval) ||
      c.interval < 0 ||
      c.interval > 3650 ||
      !Number.isFinite(c.ease) ||
      c.ease < 1.3 ||
      c.ease > 3 ||
      !Number.isSafeInteger(c.repetitions) ||
      c.repetitions < 0
    )
      throw new Error('Invalid memory card');
    ids.add(c.id);
  }
  for (const e of v.events)
    if (
      !e ||
      !ids.has(e.cardId) ||
      !time(e.at) ||
      !time(e.dueAt) ||
      !['again', 'hard', 'good', 'easy'].includes(e.rating)
    )
      throw new Error('Invalid card review');
  return v;
}
export function createCard(
  id: string,
  question: string,
  answer: string,
  source = '',
  now = Date.now(),
): MemoryCard {
  const card = {
    id,
    question: question.trim(),
    answer: answer.trim(),
    source,
    createdAt: now,
    dueAt: now,
    lastAt: 0,
    interval: 0,
    ease: 2.5,
    repetitions: 0,
  };
  readFlashcards({ version: 1, cards: [card], events: [] });
  return card;
}
// SM-2 interval/easiness recurrence, with explicit four-button grades
// Again=2, Hard=3, Good=4, Easy=5; failed recall returns in ten minutes.
export function scheduleCard(card: MemoryCard, rating: Rating, now = Date.now()): MemoryCard {
  if (!time(now) || now < card.dueAt || !['again', 'hard', 'good', 'easy'].includes(rating))
    throw new Error('Card is not due');
  const quality = { again: 2, hard: 3, good: 4, easy: 5 }[rating];
  const ease = Math.min(
    3,
    Math.max(1.3, card.ease + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)),
  );
  const repetitions = rating === 'again' ? 0 : card.repetitions + 1;
  const interval =
    rating === 'again'
      ? 0
      : repetitions === 1
        ? 1
        : repetitions === 2
          ? 6
          : Math.min(3650, Math.ceil(card.interval * card.ease));
  return {
    ...card,
    ease,
    repetitions,
    interval,
    lastAt: now,
    dueAt: now + (interval ? interval * DAY : 600000),
  };
}
export function reviewCard(
  state: Flashcards,
  id: string,
  rating: Rating,
  now = Date.now(),
): Flashcards {
  const card = state.cards.find((c) => c.id === id);
  if (!card || state.events.length >= 100000) throw new Error('Review unavailable');
  const next = scheduleCard(card, rating, now);
  return {
    ...state,
    cards: state.cards.map((c) => (c.id === id ? next : c)),
    events: [...state.events, { cardId: id, at: now, rating, dueAt: next.dueAt }],
  };
}
export const dueCards = (state: Flashcards, now = Date.now()) =>
  state.cards
    .filter((c) => c.dueAt <= now)
    .sort((a, b) => a.dueAt - b.dueAt || a.id.localeCompare(b.id));
