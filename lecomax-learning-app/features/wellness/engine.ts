import { brains, goals, interests, lessons, meals, reminders, tasks } from './data';
import { readLife } from './life-model';
import type {
  DailyPlan,
  JourneyState,
  NotificationPreferences,
  ProgressStats,
  UserPreferences,
} from './types';
export const dateKey = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
export function shiftDate(key: string, amount: number) {
  const [y, m, d] = key.split('-').map(Number);
  return dateKey(new Date(y!, m! - 1, d! + amount, 12));
}
export function dayNumber(key: string) {
  const [y, m, d] = key.split('-').map(Number);
  return Math.floor(Date.UTC(y!, m! - 1, d!) / 86400000);
}
export const validTime = (value: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
export function initialJourney(today = dateKey()): JourneyState {
  return {
    version: 1,
    startDate: today,
    preferences: {
      goals: ['health'],
      wakeTime: '07:30',
      sleepTime: '22:30',
      activity: 'gentle',
      diet: 'balanced',
      exerciseMinutes: 10,
      interests: [],
      onboarded: false,
    },
    notifications: {
      enabled: false,
      sound: true,
      categories: Object.fromEntries(
        Object.entries(reminders).map(([id, r]) => [
          id,
          { enabled: id === 'morning', time: r.time },
        ]),
      ) as NotificationPreferences['categories'],
    },
    days: {},
    achievements: [],
  };
}
export function mealOptions(slot: number, preferences: UserPreferences) {
  return meals[slot]!.filter((m) =>
    preferences.diet === 'vegan'
      ? m.vegan
      : preferences.diet === 'vegetarian'
        ? m.vegetarian
        : true,
  );
}
export function createPlan(date: string, preferences: UserPreferences): DailyPlan {
  const seed = dayNumber(date);
  const preferred = preferences.interests.length
    ? preferences.interests
    : preferences.goals.flatMap(
        (g) =>
          (
            ({
              sleep: ['sleep'],
              food: ['nutrition'],
              memory: ['memory'],
              focus: ['productivity'],
              discipline: ['habits'],
              learn: ['knowledge'],
              calm: ['growth'],
              health: ['habits', 'nutrition'],
              energy: ['sleep', 'nutrition'],
              movement: ['habits'],
            }) as Record<string, string[]>
          )[g] || [],
      );
  // Interleave interests and discoveries, without repeating a lesson inside the eight-day cycle.
  const pool = lessons.filter((l) => preferred.includes(l.category));
  const discoveries = lessons.filter((l) => !preferred.includes(l.category));
  const cycle = Array.from({ length: Math.max(pool.length, discoveries.length) }, (_, index) =>
    [pool[index], discoveries[index]].filter(
      (lesson): lesson is (typeof lessons)[number] => !!lesson,
    ),
  ).flat();
  const selected = cycle[seed % cycle.length]!;
  return {
    date,
    brain: brains[seed % brains.length]!.id,
    lesson: selected.id,
    meals: meals.map((_, slot) => {
      const options = mealOptions(slot, preferences);
      return options[(seed + slot) % options.length]!.id;
    }),
    mindfulness: seed % 7,
    movement: (seed + 2) % 7,
    sleepTip: (seed + 4) % 7,
    motivation: (seed + 3) % 7,
    minutes: Math.min(
      preferences.exerciseMinutes,
      { gentle: 10, moderate: 20, active: 30 }[preferences.activity],
    ),
    wakeTime: preferences.wakeTime,
    sleepTime: preferences.sleepTime,
  };
}
export function ensureDay(state: JourneyState, date: string): JourneyState {
  if (state.days[date]) return state;
  return {
    ...state,
    days: { ...state.days, [date]: { date, tasks: {}, plan: createPlan(date, state.preferences) } },
  };
}
export function percentage(day?: JourneyState['days'][string]) {
  return day ? Math.round((tasks.filter((t) => day.tasks[t.id]).length / tasks.length) * 100) : 0;
}
export function stats(
  state: JourneyState,
  today: string,
  range: 'week' | 'month' | 'all' = 'all',
): ProgressStats {
  const date = new Date(`${today}T12:00:00`);
  const start =
    range === 'week'
      ? shiftDate(today, -((date.getDay() + 6) % 7))
      : range === 'month'
        ? `${today.slice(0, 7)}-01`
        : state.startDate;
  const first = start < state.startDate ? state.startDate : start;
  const days = Object.values(state.days).filter((d) => d.date >= first && d.date <= today);
  const completed = Object.values(state.days)
    .filter((d) => d.date <= today && percentage(d) >= 70)
    .map((d) => d.date)
    .sort();
  let longest = 0,
    run = 0,
    previous = '';
  for (const key of completed) {
    run = previous && shiftDate(previous, 1) === key ? run + 1 : 1;
    longest = Math.max(longest, run);
    previous = key;
  }
  const set = new Set(completed);
  let current = 0,
    cursor = set.has(today) ? today : shiftDate(today, -1);
  while (set.has(cursor)) {
    current++;
    cursor = shiftDate(cursor, -1);
  }
  const avg = (key: 'mood' | 'sleep' | 'focus') => {
    const values = days.flatMap((d) => (d.checkIn?.[key] ? [d.checkIn[key]!] : []));
    return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
  };
  const count = (id: 'water' | 'learn' | 'brain' | 'move' | 'meal') =>
    days.filter((d) => d.tasks[id]).length;
  return {
    current,
    longest,
    completedDays: completed.length,
    completion: Math.round(
      days.reduce((s, d) => s + percentage(d), 0) /
        Math.max(1, dayNumber(today) - dayNumber(first) + 1),
    ),
    mood: avg('mood'),
    sleep: avg('sleep'),
    focus: avg('focus'),
    water: count('water'),
    learning: count('learn'),
    brain: count('brain'),
    active: count('move'),
    healthy: days.filter((d) => d.tasks.meal && d.tasks.vegetables && d.tasks.fruit).length,
  };
}
export function earned(state: JourneyState, today: string) {
  const s = stats(state, today);
  return [
    ['first', s.completedDays >= 1],
    ['streak3', s.longest >= 3],
    ['streak7', s.longest >= 7],
    ['streak30', s.longest >= 30],
    ['brain10', s.brain >= 10],
    ['learn10', s.learning >= 10],
    ['active7', s.active >= 7],
    ['healthy7', s.healthy >= 7],
  ]
    .filter(([, ok]) => ok)
    .map(([id]) => String(id));
}
// Reject malformed/unknown versions without overwriting the original stored history.
export function parseJourney(raw: string): JourneyState {
  const value = JSON.parse(raw) as JourneyState;
  const assert = (ok: unknown) => {
    if (!ok) throw new Error('INVALID_JOURNEY_STORAGE');
  };
  const validDate = (s: unknown) =>
    typeof s === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(s) &&
    dateKey(new Date(`${s}T12:00:00`)) === s;
  assert(value && value.version === 1 && validDate(value.startDate));
  const p = value.preferences,
    n = value.notifications;
  assert(
    p &&
      Array.isArray(p.goals) &&
      p.goals.every((g) => g in goals) &&
      Array.isArray(p.interests) &&
      p.interests.every((i) => i in interests),
  );
  assert(
    validTime(p.wakeTime) &&
      validTime(p.sleepTime) &&
      ['gentle', 'moderate', 'active'].includes(p.activity) &&
      ['balanced', 'vegetarian', 'vegan'].includes(p.diet) &&
      [5, 10, 15, 20, 30].includes(p.exerciseMinutes) &&
      typeof p.onboarded === 'boolean',
  );
  assert(n && typeof n.enabled === 'boolean' && typeof n.sound === 'boolean' && n.categories);
  assert((n.quietStart === undefined && n.quietEnd === undefined) || (validTime(n.quietStart || '') && validTime(n.quietEnd || '')));
  if (value.life !== undefined) readLife(value.life);
  // Existing installations keep their schedule; the new alert is opt-in.
  if (!n.categories.bedtime) n.categories.bedtime = { enabled: false, time: p.sleepTime };
  for (const id of Object.keys(reminders) as (keyof typeof reminders)[])
    assert(
      n.categories[id] &&
        typeof n.categories[id].enabled === 'boolean' &&
        validTime(n.categories[id].time),
    );
  assert(
    value.days &&
      typeof value.days === 'object' &&
      !Array.isArray(value.days) &&
      Array.isArray(value.achievements) &&
      value.achievements.every((a) => typeof a === 'string'),
  );
  for (const [key, day] of Object.entries(value.days)) {
    assert(
      validDate(key) &&
        day.date === key &&
        day.tasks &&
        typeof day.tasks === 'object' &&
        !Array.isArray(day.tasks),
    );
    assert(
      Object.entries(day.tasks).every(
        ([id, done]) => tasks.some((t) => t.id === id) && typeof done === 'boolean',
      ),
    );
    const plan = day.plan;
    assert(
      plan &&
        plan.date === key &&
        brains.some((b) => b.id === plan.brain) &&
        lessons.some((l) => l.id === plan.lesson),
    );
    assert(
      Array.isArray(plan.meals) &&
        plan.meals.length === 4 &&
        plan.meals.every((id, i) => meals[i]!.some((m) => m.id === id)),
    );
    assert(
      [plan.mindfulness, plan.movement, plan.sleepTip, plan.motivation].every(
        (i) => Number.isInteger(i) && i >= 0 && i < 7,
      ) &&
        Number.isFinite(plan.minutes) &&
        plan.minutes > 0 &&
        plan.minutes <= 30 &&
        validTime(plan.wakeTime) &&
        validTime(plan.sleepTime),
    );
    if (day.compass !== undefined) {
      assert(
        day.compass &&
          typeof day.compass.priority === 'string' &&
          day.compass.priority.length <= 240 &&
          typeof day.compass.focused === 'boolean' &&
          typeof day.compass.connected === 'boolean',
      );
    }
    if (day.dailyMoment !== undefined) {
      assert(
        day.dailyMoment &&
          typeof day.dailyMoment.completed === 'boolean' &&
          typeof day.dailyMoment.gratitude === 'string' &&
          day.dailyMoment.gratitude.length <= 2000,
      );
    }
    if (day.checkIn) {
      assert(typeof day.checkIn.note === 'string' && day.checkIn.note.length <= 2000);
      for (const field of ['mood', 'energy', 'focus', 'sleep', 'stress'] as const) {
        const score = day.checkIn[field];
        assert(score === undefined || (Number.isInteger(score) && score >= 1 && score <= 5));
      }
    }
  }
  return value;
}
