export const activityKinds = [
  'wake',
  'breakfast',
  'study',
  'movement',
  'exercise',
  'break',
  'meal',
  'wind-down',
  'sleep',
  'other',
] as const;
export const habitKinds = [
  'sleep consistency',
  'hydration',
  'walking',
  'running',
  'exercise',
  'stretching',
  'reading',
  'screen breaks',
  'study focus',
  'relaxation',
  'other',
] as const;
export type LifeActivity = {
  id: string;
  title: string;
  time: string;
  minutes: number;
  days: number[];
  kind: (typeof activityKinds)[number];
};
export type LifeHabit = {
  id: string;
  title: string;
  category: (typeof habitKinds)[number];
  target: number;
  unit: string;
  days: number[];
  created: string;
};
export type LifeCheck = { value: number; status: 'active' | 'rest' | 'skip'; target: number };
export type LifePlanPreferences = {
  wake: string;
  sleep: string;
  busyStart: string;
  busyEnd: string;
  minutes: number;
  movement: 'gentle' | 'seated' | 'none';
  goal: 'balance' | 'study' | 'rest';
  energy: 'steady' | 'low';
  days?: number[];
};
export type LifeState = {
  version: 1;
  activities: LifeActivity[];
  habits: LifeHabit[];
  checks: Record<string, Record<string, LifeCheck>>;
  routineChecks: Record<string, Record<string, 'done' | 'rest' | 'missed'>>;
  overrides: Record<string, Record<string, string>>;
  planner: LifePlanPreferences;
  focus: {
    minutes: number;
    remaining: number;
    since: number | null;
    id: string;
    breakNotice: boolean;
  };
  sessions: { id: string; date: string; minutes: number; reflection: string }[];
  dayMinutes?: Record<string, Record<string, number>>;
  learning?: Record<string, { level: 'learn' | 'gentle' | 'practice'; completed: number[] }>;
  focusNotes?: { task: string; distractions: string };
};
export const newLife = (): LifeState => ({
  version: 1,
  activities: [],
  habits: [],
  checks: {},
  routineChecks: {},
  overrides: {},
  planner: {
    wake: '',
    sleep: '',
    busyStart: '',
    busyEnd: '',
    minutes: 20,
    movement: 'gentle',
    goal: 'balance',
    energy: 'steady',
  },
  focus: { minutes: 20, remaining: 1200000, since: null, id: '', breakNotice: false },
  sessions: [],
});
export const isTime = (v: string) => typeof v === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(v);
export const timeMinutes = (v: string) => Number(v.slice(0, 2)) * 60 + Number(v.slice(3));
export const clockTime = (v: number) =>
  `${String(Math.floor((((v % 1440) + 1440) % 1440) / 60)).padStart(2, '0')}:${String(((v % 60) + 60) % 60).padStart(2, '0')}`;
const validDate = (v: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(v) &&
  Number.isFinite(Date.parse(v + 'T12:00:00Z')) &&
  new Date(v + 'T12:00:00Z').toISOString().slice(0, 10) === v;
const bounded = (v: unknown, max: number, required = false): v is string =>
  typeof v === 'string' && v.length <= max && (!required || !!v.trim());
const integer = (v: unknown, min: number, max: number): v is number =>
  Number.isInteger(v) && Number(v) >= min && Number(v) <= max;
const daysValid = (days: number[]) =>
  Array.isArray(days) &&
  days.length > 0 &&
  days.length <= 7 &&
  new Set(days).size === days.length &&
  days.every((d) => integer(d, 0, 6));
const object = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);
export function validateActivity(a: LifeActivity) {
  if (
    !a ||
    !bounded(a.id, 100, true) ||
    !bounded(a.title, 100, true) ||
    !isTime(a.time) ||
    !integer(a.minutes, 0, 240) ||
    !daysValid(a.days) ||
    !activityKinds.includes(a.kind)
  )
    throw Error('INVALID_ACTIVITY');
  return a;
}
export function validateHabit(h: LifeHabit) {
  if (
    !h ||
    !bounded(h.id, 100, true) ||
    !bounded(h.title, 100, true) ||
    !habitKinds.includes(h.category) ||
    !integer(h.target, 1, 10000) ||
    !bounded(h.unit, 30, true) ||
    !daysValid(h.days) ||
    !validDate(h.created)
  )
    throw Error('INVALID_HABIT');
  return h;
}
export function validatePlanner(p: LifePlanPreferences, requireSchedule = false) {
  if (
    !p ||
    ![p.wake, p.sleep, p.busyStart, p.busyEnd].every((v) => v === '' || isTime(v)) ||
    !integer(p.minutes, 5, 180) ||
    !['gentle', 'seated', 'none'].includes(p.movement) ||
    !['balance', 'study', 'rest'].includes(p.goal) ||
    !['steady', 'low'].includes(p.energy) ||
    (p.days !== undefined && !daysValid(p.days)) ||
    !!p.busyStart !== !!p.busyEnd ||
    (p.busyStart && p.busyStart === p.busyEnd) ||
    (requireSchedule && (!p.wake || !p.sleep || p.wake === p.sleep))
  )
    throw Error('INVALID_PLAN_PREFERENCES');
  return p;
}
export function readLife(value: unknown): LifeState {
  if (value === undefined) return newLife();
  const s = value as LifeState;
  if (
    !s ||
    s.version !== 1 ||
    !Array.isArray(s.activities) ||
    s.activities.length > 100 ||
    !Array.isArray(s.habits) ||
    s.habits.length > 100
  )
    throw Error('INVALID_LIFE');
  s.activities.forEach(validateActivity);
  s.habits.forEach(validateHabit);
  validatePlanner(s.planner);
  if (
    new Set(s.activities.map((a) => a.id)).size !== s.activities.length ||
    new Set(s.habits.map((h) => h.id)).size !== s.habits.length
  )
    throw Error('DUPLICATE_ID');
  for (const map of [s.checks, s.routineChecks, s.overrides])
    if (!object(map) || Object.keys(map).some((d) => !validDate(d) || !object(map[d])))
      throw Error('INVALID_DAY');
  for (const checks of Object.values(s.checks))
    for (const [id, c] of Object.entries(checks))
      if (
        !s.habits.some((h) => h.id === id) ||
        !c ||
        !integer(c.value, 0, 100000) ||
        !integer(c.target, 1, 10000) ||
        !['active', 'rest', 'skip'].includes(c.status)
      )
        throw Error('INVALID_CHECK');
  for (const checks of Object.values(s.routineChecks))
    for (const [id, status] of Object.entries(checks))
      if (!s.activities.some((a) => a.id === id) || !['done', 'rest', 'missed'].includes(status))
        throw Error('INVALID_ROUTINE_CHECK');
  for (const overrides of Object.values(s.overrides))
    for (const [id, time] of Object.entries(overrides))
      if (!s.activities.some((a) => a.id === id) || !isTime(time)) throw Error('INVALID_OVERRIDE');
  const f = s.focus;
  if (s.dayMinutes !== undefined) {
    if (!object(s.dayMinutes)) throw Error('INVALID_DAY_MINUTES');
    for (const [date, values] of Object.entries(s.dayMinutes)) {
      if (!validDate(date) || !object(values)) throw Error('INVALID_DAY_MINUTES');
      for (const [id, minutes] of Object.entries(values))
        if (!s.activities.some((a) => a.id === id) || !integer(minutes, 0, 240))
          throw Error('INVALID_DAY_MINUTES');
    }
  }
  if (
    s.learning !== undefined &&
    (!object(s.learning) ||
      Object.entries(s.learning).some(
        ([id, p]) =>
          !['walking', 'running', 'strength', 'mobility'].includes(id) ||
          !p ||
          !['learn', 'gentle', 'practice'].includes(p.level) ||
          !Array.isArray(p.completed) ||
          p.completed.some((n) => !integer(n, 0, 3)) ||
          new Set(p.completed).size !== p.completed.length,
      ))
  )
    throw Error('INVALID_LEARNING');
  if (
    s.focusNotes !== undefined &&
    (!s.focusNotes || !bounded(s.focusNotes.task, 150) || !bounded(s.focusNotes.distractions, 1000))
  )
    throw Error('INVALID_FOCUS_NOTES');
  if (
    !f ||
    !integer(f.minutes, 1, 180) ||
    !integer(f.remaining, 0, f.minutes * 60000) ||
    !(f.since === null || integer(f.since, 0, Number.MAX_SAFE_INTEGER)) ||
    !bounded(f.id, 100) ||
    typeof f.breakNotice !== 'boolean' ||
    !Array.isArray(s.sessions) ||
    s.sessions.some(
      (x) =>
        !x ||
        !bounded(x.id, 100, true) ||
        !validDate(x.date) ||
        !integer(x.minutes, 1, 180) ||
        !bounded(x.reflection, 500),
    ) ||
    new Set(s.sessions.map((x) => x.id)).size !== s.sessions.length
  )
    throw Error('INVALID_FOCUS');
  return s;
}
export function saveActivity(s: LifeState, a: LifeActivity): LifeState {
  validateActivity(a);
  return readLife({ ...s, activities: [...s.activities.filter((x) => x.id !== a.id), a] });
}
export function saveHabit(s: LifeState, h: LifeHabit): LifeState {
  validateHabit(h);
  return readLife({ ...s, habits: [...s.habits.filter((x) => x.id !== h.id), h] });
}
function omitId<T>(map: Record<string, Record<string, T>>, id: string) {
  return Object.fromEntries(
    Object.entries(map).map(([date, values]) => [
      date,
      Object.fromEntries(Object.entries(values).filter(([key]) => key !== id)),
    ]),
  );
}
export function deleteLifeItem(s: LifeState, kind: 'habit' | 'activity', id: string): LifeState {
  return kind === 'habit'
    ? { ...s, habits: s.habits.filter((h) => h.id !== id), checks: omitId(s.checks, id) }
    : {
        ...s,
        activities: s.activities.filter((a) => a.id !== id),
        routineChecks: omitId(s.routineChecks, id),
        overrides: omitId(s.overrides, id),
        ...(s.dayMinutes ? { dayMinutes: omitId(s.dayMinutes, id) } : {}),
      };
}
export function checkHabit(
  s: LifeState,
  id: string,
  date: string,
  status: LifeCheck['status'],
  value = 0,
): LifeState {
  const habit = s.habits.find((h) => h.id === id);
  if (!habit || !validDate(date)) throw Error('INVALID_CHECK');
  return readLife({
    ...s,
    checks: {
      ...s.checks,
      [date]: {
        ...s.checks[date],
        [id]: { value, status, target: s.checks[date]?.[id]?.target ?? habit.target },
      },
    },
  });
}
export function habitInsights(s: LifeState, dates: string[]) {
  return dates.map((date) => {
    const checks = Object.values(s.checks[date] || {}),
      active = checks.filter((c) => c.status === 'active');
    const done = active.filter((c) => c.value >= c.target).length;
    return {
      date,
      recorded: checks.length,
      done,
      active: active.length,
      rest: checks.filter((c) => c.status !== 'active').length,
      rate: active.length ? done / active.length : null,
    };
  });
}
export function isQuiet(time: string, start?: string, end?: string) {
  if (!start || !end || !isTime(start) || !isTime(end)) return false;
  if (start === end) return true;
  return start < end ? time >= start && time < end : time >= start || time < end;
}
export function focusRemaining(f: LifeState['focus'], now = Date.now()) {
  return Math.max(0, f.remaining - (f.since === null ? 0 : Math.max(0, now - f.since)));
}
export function finishFocus(
  s: LifeState,
  date: string,
  reflection: string,
  now = Date.now(),
): LifeState {
  if (
    !s.focus.id ||
    focusRemaining(s.focus, now) > 0 ||
    s.sessions.some((x) => x.id === s.focus.id)
  )
    throw Error('FOCUS_NOT_FINISHED');
  return readLife({
    ...s,
    sessions: [...s.sessions, { id: s.focus.id, date, minutes: s.focus.minutes, reflection }],
    focus: { ...s.focus, remaining: 0, since: null },
  });
}
export function suggestedDay(
  p: LifePlanPreferences,
  short: boolean,
  idPrefix: string,
  titles: Record<string, string>,
): LifeActivity[] {
  validatePlanner(p, true);
  const wake = timeMinutes(p.wake),
    span = (timeMinutes(p.sleep) - wake + 1440) % 1440;
  if (span < 120) throw Error('SCHEDULE_TOO_SHORT');
  const duration = p.energy === 'low' || short ? Math.min(10, p.minutes) : p.minutes;
  const kinds = short
    ? ['wake', 'study', 'break', 'sleep']
    : ['wake', 'breakfast', 'study', 'break', 'movement', 'meal', 'study', 'wind-down', 'sleep'];
  return kinds.flatMap((kind, i) => {
    if (kind === 'movement' && p.movement === 'none') return [];
    const offset = Math.round((span * i) / (kinds.length - 1));
    const time = clockTime(wake + offset);
    const requestedMinutes =
      kind === 'study'
        ? p.goal === 'rest'
          ? Math.min(5, duration)
          : duration
        : ['wake', 'sleep'].includes(kind)
          ? 0
          : 5;
    // Leave space before the next suggested activity, even for a short waking window.
    const minutes = Math.min(
      requestedMinutes,
      Math.max(0, Math.floor(span / (kinds.length - 1)) - 1),
    );
    if (
      kind !== 'wake' &&
      kind !== 'sleep' &&
      (offset + minutes > span ||
        Array.from({ length: Math.max(1, minutes) }, (_, n) => clockTime(wake + offset + n)).some(
          (t) => isQuiet(t, p.busyStart, p.busyEnd),
        ))
    )
      return [];
    return [
      {
        id: `${idPrefix}-${i}`,
        title: kind === 'movement' && p.movement === 'seated' ? titles.seated! : titles[kind]!,
        time,
        minutes,
        days: p.days || [0, 1, 2, 3, 4, 5, 6],
        kind: kind as LifeActivity['kind'],
      },
    ];
  });
}

export function lighterDay(s: LifeState, date: string): LifeState {
  if (!validDate(date)) throw Error('INVALID_DATE');
  const weekday = new Date(date + 'T12:00:00').getDay();
  const minutes = { ...s.dayMinutes?.[date] },
    checks = { ...s.routineChecks[date] };
  for (const a of s.activities.filter((a) => a.days.includes(weekday))) {
    if (checks[a.id] === 'done' || checks[a.id] === 'rest') continue;
    if (a.kind === 'study') minutes[a.id] = Math.min(s.dayMinutes?.[date]?.[a.id] ?? a.minutes, 10);
    if (a.kind === 'exercise' || a.kind === 'movement') checks[a.id] = 'rest';
  }
  return readLife({
    ...s,
    dayMinutes: { ...s.dayMinutes, [date]: minutes },
    routineChecks: { ...s.routineChecks, [date]: checks },
  });
}
export function recoverActivity(s: LifeState, id: string, date: string, time: string): LifeState {
  const a = s.activities.find((a) => a.id === id);
  if (!a || !validDate(date) || !isTime(time)) throw Error('INVALID_RECOVERY');
  const minutes = s.dayMinutes?.[date]?.[id] ?? a.minutes;
  const overlaps = (start: number, duration: number, otherStart: number, otherDuration: number) =>
    Array.from({ length: Math.max(1, duration) }, (_, n) => (start + n) % 1440).some(
      (n) => (n - otherStart + 1440) % 1440 < Math.max(1, otherDuration),
    );
  if (
    Array.from({ length: Math.max(1, minutes) }, (_, n) => clockTime(timeMinutes(time) + n)).some(
      (t) => isQuiet(t, s.planner.busyStart, s.planner.busyEnd),
    ) ||
    s.activities.some(
      (b) =>
        b.id !== id &&
        b.days.includes(new Date(date + 'T12:00:00').getDay()) &&
        s.routineChecks[date]?.[b.id] !== 'rest' &&
        overlaps(
          timeMinutes(time),
          minutes,
          timeMinutes(s.overrides[date]?.[b.id] || b.time),
          s.dayMinutes?.[date]?.[b.id] ?? b.minutes,
        ),
    )
  )
    throw Error('TIME_CONFLICT');
  const checks = { ...s.routineChecks[date] };
  delete checks[id];
  return readLife({
    ...s,
    overrides: { ...s.overrides, [date]: { ...s.overrides[date], [id]: time } },
    routineChecks: { ...s.routineChecks, [date]: checks },
  });
}
