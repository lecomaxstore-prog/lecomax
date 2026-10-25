import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, Label, ProgressBar, Row } from '../../components/UI';
import { Input, type LifeProps } from './LifeEditors';
import { finishFocus, focusRemaining } from './life-model';
export function LifeFocus({ life, date, commit }: LifeProps) {
  const [now, setNow] = useState(Date.now),
    [duration, setDuration] = useState(String(life.focus.minutes)),
    [reflection, setReflection] = useState(''),
    [task, setTask] = useState(life.focusNotes?.task || ''),
    [distractions, setDistractions] = useState(life.focusNotes?.distractions || ''),
    [confirm, setConfirm] = useState(false);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const timer = setInterval(tick, 1000);
    const sub = AppState.addEventListener('change', tick);
    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, []);
  const remaining = focusRemaining(life.focus, now),
    recorded = life.sessions.some((s) => s.id === life.focus.id);
  const running = life.focus.since !== null && remaining > 0;
  const start = () =>
    void commit((s) => ({
      ...s,
      focus: {
        ...s.focus,
        id: s.focus.id || `focus-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        since: Date.now(),
      },
    }));
  const pause = () =>
    void commit((s) => ({
      ...s,
      focus: { ...s.focus, remaining: focusRemaining(s.focus), since: null },
    }));
  const reset = () =>
    void commit((s) => ({
      ...s,
      focus: {
        minutes: Number(duration),
        remaining: Number(duration) * 60000,
        since: null,
        id: '',
        breakNotice: s.focus.breakNotice,
      },
    })).then((ok) => {
      if (ok) {
        setConfirm(false);
        setReflection('');
      }
    });
  return (
    <>
      <Card>
        <Label bold>One thing at a time</Label>
        <Input label="My next Academy task" value={task} max={150} onChange={setTask} />
        <Input
          label="Park a distraction for later"
          value={distractions}
          max={1000}
          onChange={setDistractions}
        />
        <Button
          quiet
          title="Save my focus notes"
          onPress={() => void commit((s) => ({ ...s, focusNotes: { task, distractions } }))}
        />
        <Label muted>
          Private notes on this device. Saving a task does not mark an Academy lesson complete.
        </Label>
      </Card>
      <Card>
        <Label bold size={24}>
          Focus, then recover
        </Label>
        <Label>
          Choose one small learning task, put unrelated tabs aside, and set a timebox you can
          change. This timer measures elapsed time, not attention or learning mastery.
        </Label>
        <Input
          label="Focus duration (1–180 minutes)"
          value={duration}
          number
          onChange={setDuration}
        />
        <Button
          quiet
          title="Set new timer"
          onPress={() => (life.focus.id && !recorded ? setConfirm(true) : reset())}
        />
        {confirm && (
          <>
            <Label>Replace the unfinished timer? Saved sessions remain.</Label>
            <Button title="Replace timer" onPress={reset} />
            <Button quiet title="Keep timer" onPress={() => setConfirm(false)} />
          </>
        )}
        <Label
          bold
          size={44}
          accessibilityLabel={`${Math.ceil(remaining / 1000)} seconds remaining`}
        >
          {String(Math.floor(Math.ceil(remaining / 1000) / 60)).padStart(2, '0')}:
          {String(Math.ceil(remaining / 1000) % 60).padStart(2, '0')}
        </Label>
        <ProgressBar value={1 - remaining / (life.focus.minutes * 60000)} />
        <Row>
          <Button
            title={running ? 'Pause focus' : 'Start or resume focus'}
            disabled={remaining === 0}
            onPress={running ? pause : start}
          />
          <Button
            quiet
            title="Open my Academy lessons"
            onPress={() => router.push('/my-learning')}
          />
        </Row>
        <Button
          quiet
          selected={life.focus.breakNotice}
          title="Show a gentle break prompt when finished"
          onPress={() =>
            void commit((s) => ({ ...s, focus: { ...s.focus, breakNotice: !s.focus.breakNotice } }))
          }
        />
        <Label muted>
          Timer state survives navigation and restart. The clock continues while running, including
          background time. Break prompts appear in this screen; no background alarm is implied.
          Optional scheduled reminders are in Reminders.
        </Label>
      </Card>
      {remaining === 0 && !!life.focus.id && (
        <Card>
          {life.focus.breakNotice && (
            <Label accessibilityLiveRegion="polite">
              Your timebox has ended. Rest your eyes, change position if comfortable, or simply
              pause.
            </Label>
          )}
          <Input
            label="Session reflection (optional, local only)"
            value={reflection}
            max={500}
            onChange={setReflection}
          />
          <Button
            title={recorded ? 'Session saved' : 'Save finished session'}
            disabled={recorded}
            onPress={() => void commit((s) => finishFocus(s, date, reflection))}
          />
          <Label muted>Saving does not complete a lesson or award mastery.</Label>
        </Card>
      )}
      <Card>
        <Label bold>Reduce distractions</Label>
        <Label>
          Pick one next action. Silence non-essential notifications yourself. Keep a note for
          unrelated thoughts. After the timer, decide whether to continue or stop; a short session
          still counts as time you chose to spend.
        </Label>
      </Card>
    </>
  );
}
