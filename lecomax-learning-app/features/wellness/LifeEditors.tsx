import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, Field, Label, ProgressBar, Row } from '../../components/UI';
import {
  lighterDay,
  recoverActivity,
  activityKinds,
  habitKinds,
  saveActivity,
  saveHabit,
  deleteLifeItem,
  checkHabit,
  suggestedDay,
  validatePlanner,
  habitInsights,
  timeMinutes,
  type LifeState,
  type LifeActivity,
  type LifeHabit,
} from './life-model';
import { shiftDate } from './engine';
export type LifeProps = {
  life: LifeState;
  date: string;
  onFocus?: (activity: LifeActivity) => void;
  commit: (fn: (s: LifeState) => LifeState) => Promise<boolean>;
};
const uid = () => `life-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const weekday = (date: string) => new Date(date + 'T12:00:00').getDay();
export function Weekdays({ days, onChange }: { days: number[]; onChange: (d: number[]) => void }) {
  return (
    <Row>
      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((name, i) => (
        <Button
          key={name}
          quiet
          selected={days.includes(i)}
          title={name}
          onPress={() => onChange(days.includes(i) ? days.filter((d) => d !== i) : [...days, i])}
        />
      ))}
    </Row>
  );
}
export function Input({
  label,
  value,
  onChange,
  number = false,
  max = 100,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  number?: boolean;
  max?: number;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Label bold size={14}>
        {label}
      </Label>
      <Field
        accessibilityLabel={label}
        placeholder={label}
        value={value}
        onChangeText={onChange}
        keyboardType={number ? 'number-pad' : 'default'}
        maxLength={max}
      />
    </View>
  );
}
export function DayTimeline({ life, date, commit, onFocus }: LifeProps) {
  const [edit, setEdit] = useState<LifeActivity | null>(null),
    [minutes, setMinutes] = useState('10'),
    [remove, setRemove] = useState(''),
    [move, setMove] = useState(''),
    [time, setTime] = useState(''),
    [adapt, setAdapt] = useState(false);
  const anchor = life.planner.wake ? timeMinutes(life.planner.wake) : 0;
  const items = life.activities
    .filter((a) => a.days.includes(weekday(date)))
    .sort(
      (a, b) =>
        ((timeMinutes(life.overrides[date]?.[a.id] || a.time) - anchor + 1440) % 1440) -
        ((timeMinutes(life.overrides[date]?.[b.id] || b.time) - anchor + 1440) % 1440),
    );
  const status = (id: string, value: 'done' | 'rest' | 'missed') =>
    void commit((s) => ({
      ...s,
      routineChecks: { ...s.routineChecks, [date]: { ...s.routineChecks[date], [id]: value } },
    }));
  return (
    <>
      <Card>
        <Label bold size={24}>
          My Healthy Day
        </Label>
        <Label muted>
          Your times, your pace. Rest or reschedule whenever life changes. Nothing here is a medical
          prescription.
        </Label>
        <Button quiet title="Low energy? Preview a lighter day" onPress={() => setAdapt(true)} />
        {adapt && (
          <>
            <Label>
              For this date only: shorten unfinished study sessions to at most 10 minutes and mark
              unfinished movement/exercise as rest. Completed activities, meal times and your
              recurring routine stay unchanged.
            </Label>
            <Button
              title="Apply lighter day"
              onPress={() =>
                void commit((s) => lighterDay(s, date)).then((ok) => {
                  if (ok) setAdapt(false);
                })
              }
            />
            <Button quiet title="Keep my original day" onPress={() => setAdapt(false)} />
          </>
        )}
        <Button
          title="Add activity"
          onPress={() => {
            setEdit({
              id: uid(),
              title: '',
              time: '',
              minutes: 10,
              kind: 'other',
              days: [0, 1, 2, 3, 4, 5, 6],
            });
            setMinutes('10');
          }}
        />
      </Card>
      {edit && (
        <Card>
          <Label bold>
            {life.activities.some((a) => a.id === edit.id) ? 'Edit activity' : 'New activity'}
          </Label>
          <Input
            label="Activity name"
            value={edit.title}
            onChange={(title) => setEdit({ ...edit, title })}
          />
          <Input
            label="Time (HH:MM)"
            value={edit.time}
            max={5}
            onChange={(time) => setEdit({ ...edit, time })}
          />
          <Input label="Duration in minutes (0–240)" value={minutes} number onChange={setMinutes} />
          <Row>
            {activityKinds.map((kind) => (
              <Button
                key={kind}
                quiet
                selected={edit.kind === kind}
                title={kind}
                onPress={() => setEdit({ ...edit, kind })}
              />
            ))}
          </Row>
          <Weekdays days={edit.days} onChange={(days) => setEdit({ ...edit, days })} />
          <Button
            title="Save activity"
            onPress={() =>
              void commit((s) =>
                saveActivity(s, { ...edit, title: edit.title.trim(), minutes: Number(minutes) }),
              ).then((ok) => {
                if (ok) setEdit(null);
              })
            }
          />
          <Button quiet title="Cancel editing" onPress={() => setEdit(null)} />
        </Card>
      )}
      {!items.length && (
        <Card>
          <Label>
            No activities scheduled for this day. Add your own, or preview an optional plan in
            Planner.
          </Label>
        </Card>
      )}
      {items.map((a) => (
        <Card
          key={a.id}
          style={{
            borderLeftWidth: 4,
            borderLeftColor: life.routineChecks[date]?.[a.id] === 'done' ? '#43826c' : '#8a9faf',
          }}
        >
          <Row style={{ justifyContent: 'space-between' }}>
            <Label bold size={20}>
              {life.overrides[date]?.[a.id] || a.time}
            </Label>
            <Label muted>
              {life.dayMinutes?.[date]?.[a.id] ?? a.minutes} min · {a.kind}
            </Label>
          </Row>
          <Label bold size={21}>
            {a.title}
          </Label>
          <Label muted>{life.routineChecks[date]?.[a.id] || 'Optional · not checked in'}</Label>
          <Row>
            <Button
              quiet
              title={`Done: ${a.title}`}
              selected={life.routineChecks[date]?.[a.id] === 'done'}
              onPress={() => status(a.id, 'done')}
            />
            <Button
              quiet
              title={`Rest: ${a.title}`}
              selected={life.routineChecks[date]?.[a.id] === 'rest'}
              onPress={() => status(a.id, 'rest')}
            />
            <Button quiet title={`Missed: ${a.title}`} onPress={() => status(a.id, 'missed')} />
          </Row>
          {life.routineChecks[date]?.[a.id] === 'missed' && (
            <Label>No catch-up required. Move it to a time that works, or take a rest.</Label>
          )}
          <Row>
            <Button
              quiet
              title={`Move today: ${a.title}`}
              onPress={() => {
                setMove(a.id);
                setTime(life.overrides[date]?.[a.id] || a.time);
              }}
            />
            <Button
              quiet
              title={`Edit: ${a.title}`}
              onPress={() => {
                setEdit(a);
                setMinutes(String(a.minutes));
              }}
            />
            <Button quiet title={`Delete: ${a.title}`} onPress={() => setRemove(a.id)} />
          </Row>
          {move === a.id && (
            <>
              <Input
                label="New time for this date (HH:MM)"
                value={time}
                max={5}
                onChange={setTime}
              />
              <Button
                title="Save new time"
                onPress={() =>
                  void commit((s) => recoverActivity(s, a.id, date, time)).then((ok) => {
                    if (ok) setMove('');
                  })
                }
              />
            </>
          )}
          {remove === a.id && (
            <>
              <Label>Delete this activity and its check-ins? Other activities stay saved.</Label>
              <Button
                title="Confirm activity deletion"
                onPress={() =>
                  void commit((s) => deleteLifeItem(s, 'activity', a.id)).then((ok) => {
                    if (ok) {
                      setRemove('');
                      setEdit(null);
                    }
                  })
                }
              />
              <Button quiet title="Keep activity" onPress={() => setRemove('')} />
            </>
          )}
          {!!life.routineChecks[date]?.[a.id] && (
            <Button
              quiet
              title={`Undo activity check-in: ${a.title}`}
              onPress={() =>
                void commit((s) => ({
                  ...s,
                  routineChecks: {
                    ...s.routineChecks,
                    [date]: Object.fromEntries(
                      Object.entries(s.routineChecks[date] || {}).filter(([id]) => id !== a.id),
                    ),
                  },
                }))
              }
            />
          )}
          {a.kind === 'study' && onFocus && (
            <Button
              title={`Focus on: ${a.title}`}
              onPress={() =>
                onFocus({ ...a, minutes: life.dayMinutes?.[date]?.[a.id] ?? a.minutes })
              }
            />
          )}
          {a.kind === 'study' && (
            <Button
              quiet
              title="Open Academy study plan"
              onPress={() => router.push('/my-learning')}
            />
          )}
        </Card>
      ))}
      {!!life.activities.filter((a) => !a.days.includes(weekday(date))).length && (
        <Card>
          <Label bold>Other scheduled activities</Label>
          {life.activities
            .filter((a) => !a.days.includes(weekday(date)))
            .map((a) => (
              <Button
                key={a.id}
                quiet
                title={`Edit: ${a.title}`}
                onPress={() => {
                  setEdit(a);
                  setMinutes(String(a.minutes));
                }}
              />
            ))}
        </Card>
      )}
    </>
  );
}
export function HabitsView({ life, date, commit }: LifeProps) {
  const [edit, setEdit] = useState<LifeHabit | null>(null),
    [target, setTarget] = useState('1'),
    [remove, setRemove] = useState('');
  return (
    <>
      <Card>
        <Label bold size={24}>
          Healthy habits, without pressure
        </Label>
        <Label muted>
          Define a goal and unit that fit you. All values are self-reported. Rest and skip never
          reduce a score or break a streak here.
        </Label>
        <Button
          title="Add habit"
          onPress={() => {
            setEdit({
              id: uid(),
              title: '',
              category: 'other',
              target: 1,
              unit: 'check-in',
              days: [0, 1, 2, 3, 4, 5, 6],
              created: date,
            });
            setTarget('1');
          }}
        />
      </Card>
      {edit && (
        <Card>
          <Input
            label="Habit name"
            value={edit.title}
            onChange={(title) => setEdit({ ...edit, title })}
          />
          <Row>
            {habitKinds.map((category) => (
              <Button
                key={category}
                quiet
                selected={edit.category === category}
                title={category}
                onPress={() => setEdit({ ...edit, category })}
              />
            ))}
          </Row>
          <Input label="Goal (1–10000)" value={target} number onChange={setTarget} />
          <Input
            label="Unit (cups, minutes, pages, check-ins…)"
            value={edit.unit}
            max={30}
            onChange={(unit) => setEdit({ ...edit, unit })}
          />
          <Label muted>
            This is your chosen target, not a recommended fluid intake or exercise dose.
          </Label>
          <Weekdays days={edit.days} onChange={(days) => setEdit({ ...edit, days })} />
          <Button
            title="Save habit"
            onPress={() =>
              void commit((s) =>
                saveHabit(s, { ...edit, title: edit.title.trim(), target: Number(target) }),
              ).then((ok) => {
                if (ok) setEdit(null);
              })
            }
          />
          <Button quiet title="Cancel editing" onPress={() => setEdit(null)} />
        </Card>
      )}
      {!life.habits.length && (
        <Card>
          <Label>Your habit list is empty. Start with one manageable habit.</Label>
        </Card>
      )}
      {life.habits.map((h) => {
        const check = life.checks[date]?.[h.id];
        const scheduled = h.days.includes(weekday(date)) && h.created <= date;
        return (
          <Card key={h.id}>
            <Label bold size={20}>
              {h.title}
            </Label>
            <Label muted>
              {scheduled ? 'Scheduled today' : 'Optional today'} · {h.target} {h.unit}
            </Label>
            <Label>
              {check?.status === 'rest'
                ? 'Rest day'
                : check?.status === 'skip'
                  ? 'Skipped by choice'
                  : `${check?.value || 0} / ${check?.target || h.target} ${h.unit}`}
            </Label>
            <ProgressBar
              value={check?.status === 'active' ? Math.min(1, check.value / check.target) : 0}
            />
            <Row>
              <Button
                title={`+1: ${h.title}`}
                onPress={() =>
                  void commit((s) =>
                    checkHabit(
                      s,
                      h.id,
                      date,
                      'active',
                      (s.checks[date]?.[h.id]?.status === 'active'
                        ? s.checks[date]?.[h.id]?.value || 0
                        : 0) + 1,
                    ),
                  )
                }
              />
              <Button
                quiet
                title={`Goal reached: ${h.title}`}
                onPress={() =>
                  void commit((s) =>
                    checkHabit(s, h.id, date, 'active', s.checks[date]?.[h.id]?.target ?? h.target),
                  )
                }
              />
              <Button
                quiet
                title={`Rest: ${h.title}`}
                onPress={() => void commit((s) => checkHabit(s, h.id, date, 'rest'))}
              />
              <Button
                quiet
                title={`Skip: ${h.title}`}
                onPress={() => void commit((s) => checkHabit(s, h.id, date, 'skip'))}
              />
              <Button
                quiet
                title={`Undo check-in: ${h.title}`}
                onPress={() =>
                  void commit((s) => ({
                    ...s,
                    checks: {
                      ...s.checks,
                      [date]: Object.fromEntries(
                        Object.entries(s.checks[date] || {}).filter(([id]) => id !== h.id),
                      ),
                    },
                  }))
                }
              />
            </Row>
            <Row>
              <Button
                quiet
                title={`Edit: ${h.title}`}
                onPress={() => {
                  setEdit(h);
                  setTarget(String(h.target));
                }}
              />
              <Button quiet title={`Delete: ${h.title}`} onPress={() => setRemove(h.id)} />
            </Row>
            {remove === h.id && (
              <>
                <Label>Delete this habit and its check-ins?</Label>
                <Button
                  title="Confirm habit deletion"
                  onPress={() =>
                    void commit((s) => deleteLifeItem(s, 'habit', h.id)).then((ok) => {
                      if (ok) {
                        setRemove('');
                        setEdit(null);
                      }
                    })
                  }
                />
                <Button quiet title="Keep habit" onPress={() => setRemove('')} />
              </>
            )}
          </Card>
        );
      })}
    </>
  );
}
export function PlannerView({ life, commit }: LifeProps) {
  const [p, setP] = useState(life.planner),
    [minutes, setMinutes] = useState(String(p.minutes)),
    [preview, setPreview] = useState<LifeActivity[]>([]),
    [error, setError] = useState('');
  const change = (v: Partial<typeof p>) => {
    setP({ ...p, ...v });
    setPreview([]);
  };
  const generate = (short: boolean) => {
    try {
      const checked = validatePlanner({ ...p, minutes: Number(minutes) }, true);
      setPreview(
        suggestedDay(checked, short, uid(), {
          wake: 'Wake up at my chosen time',
          breakfast: 'Breakfast pause',
          study: 'Focused study',
          break: 'Rest and screen break',
          movement: 'Comfortable movement',
          seated: 'Optional seated mobility',
          meal: 'Meal pause',
          'wind-down': 'My wind-down routine',
          sleep: 'My chosen bedtime',
        }),
      );
      setError('');
    } catch {
      setError(
        'Enter valid wake/sleep times, an optional complete busy interval, and 5–180 available study minutes. Leave at least two hours between waking and sleep.',
      );
    }
  };
  return (
    <>
      <Card>
        <Label bold size={24}>
          A plan that fits your life
        </Label>
        <Label>
          Choose your waking and sleep preferences, protected work/care time and available study
          time. Suggestions are local rules, not AI health predictions. Preview before adding; every
          activity stays editable.
        </Label>
        <Label bold>Which days should this routine repeat?</Label>
        <Weekdays days={p.days || [0, 1, 2, 3, 4, 5, 6]} onChange={(days) => change({ days })} />
        <Input
          label="Preferred wake time (HH:MM)"
          value={p.wake}
          max={5}
          onChange={(wake) => change({ wake })}
        />
        <Input
          label="Preferred sleep time (HH:MM)"
          value={p.sleep}
          max={5}
          onChange={(sleep) => change({ sleep })}
        />
        <Input
          label="Busy from (optional HH:MM)"
          value={p.busyStart}
          max={5}
          onChange={(busyStart) => change({ busyStart })}
        />
        <Input
          label="Busy until (optional HH:MM)"
          value={p.busyEnd}
          max={5}
          onChange={(busyEnd) => change({ busyEnd })}
        />
        <Input
          label="Available study minutes per session (5–180)"
          value={minutes}
          number
          onChange={(v) => {
            setMinutes(v);
            setPreview([]);
          }}
        />
        <Label bold>What matters today?</Label>
        <Row>
          {(['balance', 'study', 'rest'] as const).map((goal) => (
            <Button
              key={goal}
              quiet
              title={goal}
              selected={p.goal === goal}
              onPress={() => change({ goal })}
            />
          ))}
        </Row>
        <Label bold>Energy, if you want to share it locally</Label>
        <Row>
          {(['steady', 'low'] as const).map((energy) => (
            <Button
              key={energy}
              quiet
              title={energy === 'low' ? 'Low energy' : 'Steady energy'}
              selected={p.energy === energy}
              onPress={() => change({ energy })}
            />
          ))}
        </Row>
        <Label bold>Movement preference · no diagnosis needed</Label>
        <Row>
          {(['gentle', 'seated', 'none'] as const).map((movement) => (
            <Button
              key={movement}
              quiet
              title={movement}
              selected={p.movement === movement}
              onPress={() => change({ movement })}
            />
          ))}
        </Row>
        <Button
          quiet
          title="Save planning preferences"
          onPress={() =>
            void commit((s) => ({
              ...s,
              planner: validatePlanner({ ...p, minutes: Number(minutes) }),
            }))
          }
        />
        <Row>
          <Button title="Preview short day" onPress={() => generate(true)} />
          <Button quiet title="Preview full day" onPress={() => generate(false)} />
        </Row>
        {!!error && <Label accessibilityRole="alert">{error}</Label>}
      </Card>
      {!!preview.length && (
        <Card>
          <Label bold>Optional plan preview</Label>
          <Label muted>
            Conflicts with your busy interval are omitted. This adds recurring activities; it does
            not replace existing activities. Overlapping existing activities can be edited in My
            Day.
          </Label>
          {preview.map((a) => (
            <Label key={a.id}>
              {a.time} · {a.title} · {a.minutes} min
            </Label>
          ))}
          <Button
            title="Add this plan to my routine"
            onPress={() =>
              void commit((s) => ({
                ...s,
                planner: validatePlanner({ ...p, minutes: Number(minutes) }, true),
                activities: [...s.activities, ...preview],
              })).then((ok) => {
                if (ok) setPreview([]);
              })
            }
          />
          <Button quiet title="Discard preview" onPress={() => setPreview([])} />
        </Card>
      )}
    </>
  );
}
export function InsightsView({ life, date }: LifeProps) {
  const days = habitInsights(
    life,
    Array.from({ length: 7 }, (_, i) => shiftDate(date, i - 6)),
  );
  const total = days.reduce((n, d) => n + d.recorded, 0),
    done = days.reduce((n, d) => n + d.done, 0),
    rest = days.reduce((n, d) => n + d.rest, 0);
  const sessions = life.sessions.filter((s) => s.date >= days[0]!.date && s.date <= date);
  return (
    <>
      <Card>
        <Label bold size={24}>
          Your week, in your words
        </Label>
        <Label muted>
          Self-reported check-ins only. No sleep sensor, step counter, heart-rate data, or inferred
          health score.
        </Label>
        <Label>
          {total} recorded check-ins · {done} goals reached · {rest} rest/skip choices
        </Label>
        <Label>
          {sessions.length} saved focus sessions · {sessions.reduce((n, s) => n + s.minutes, 0)}{' '}
          timer minutes
        </Label>
      </Card>
      <Card>
        <Label bold>Seven-day habit trends</Label>
        {days.map((d) => (
          <View
            key={d.date}
            accessible
            accessibilityLabel={`${d.date}: ${d.done} goals reached, ${d.active} active check-ins, ${d.rest} rest or skip`}
            style={{ gap: 8, paddingVertical: 8 }}
          >
            <Label>
              {d.date} · {d.done}/{d.active} active check-ins met · {d.rest} rest/skip
            </Label>
            <ProgressBar value={d.rate || 0} />
          </View>
        ))}
        <Label muted>
          The denominator includes recorded active check-ins only. Unlogged days are unknown;
          rest/skip are excluded. This is not a wellbeing score.
        </Label>
      </Card>
      <Card>
        <Label bold>A small next step</Label>
        <Label>
          {!total
            ? 'Record one habit when it feels useful. No need to fill in missing days.'
            : rest
              ? 'You made room for rest. Keep the next plan manageable and choose what fits today.'
              : done
                ? 'Notice which habits felt easiest. You can repeat one without increasing its goal.'
                : 'Consider a smaller goal or a different time. Adjusting a plan is part of learning.'}
        </Label>
      </Card>
      {life.habits.map((h) => {
        const recorded = days.map((d) => life.checks[d.date]?.[h.id]).filter(Boolean);
        const active = recorded.filter((c) => c?.status === 'active');
        const reached = active.filter((c) => c!.value >= c!.target).length;
        return (
          <Card key={h.id}>
            <Label bold>{h.title}</Label>
            <Label>
              {reached} goals reached in {active.length} recorded active days ·{' '}
              {recorded.length - active.length} rest/skip choices
            </Label>
            <View
              accessible
              accessibilityLabel={`${h.title}: ${reached} of ${active.length} active check-ins reached the goal`}
            >
              <ProgressBar value={active.length ? reached / active.length : 0} />
            </View>
            <Label muted>
              {!active.length
                ? 'No active check-ins to interpret yet.'
                : reached
                  ? 'You have recorded progress here. Repeat what fits, without needing to raise the target.'
                  : 'If useful, simplify the goal or choose a different cue. Unrecorded days are unknown.'}
            </Label>
          </Card>
        );
      })}
      {sessions
        .slice(-7)
        .reverse()
        .map((s) => (
          <Card key={s.id}>
            <Label bold>
              {s.date} · {s.minutes} min
            </Label>
            <Label>{s.reflection || 'No reflection added.'}</Label>
          </Card>
        ))}
    </>
  );
}
