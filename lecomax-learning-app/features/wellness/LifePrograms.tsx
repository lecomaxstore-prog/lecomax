import { useState } from 'react';
import { Linking } from 'react-native';
import { Button, Card, Label, ProgressBar, Row } from '../../components/UI';
import type { LifeProps } from './LifeEditors';

const programs = [
  {
    id: 'walking',
    title: 'Walking foundations',
    source: 'https://www.who.int/news-room/fact-sheets/detail/physical-activity',
    steps: [
      'Choose an accessible route and a comfortable opportunity to move.',
      'Learn to begin with a manageable amount. A shorter route is a valid option.',
      'Notice comfort and recovery before deciding whether to repeat.',
      'Choose a repeatable cue. Consistency can include rest and changes of plan.',
    ],
  },
  {
    id: 'running',
    title: 'Beginner running literacy',
    source: 'https://www.nhs.uk/better-health/get-active/get-running-with-couch-to-5k/',
    steps: [
      'Read how walking and running alternate in the NHS beginner programme.',
      'Learn why a walking warm-up belongs before a running session.',
      'Learn why recovery days sit between sessions. Walking is an alternative.',
      'Review the linked programme and decide whether it suits you. Repeat learning before progressing if useful.',
    ],
  },
  {
    id: 'strength',
    title: 'Strength and recovery',
    source: 'https://www.nhs.uk/live-well/exercise/how-to-improve-strength-flexibility/',
    steps: [
      'Learn how resistance can come from body weight, bands or weights.',
      'Review technique with a reliable demonstration or qualified instructor.',
      'Learn why recovery and a manageable challenge belong together.',
      'Review your chosen approach. Increase difficulty only when appropriate, never automatically.',
    ],
  },
  {
    id: 'mobility',
    title: 'Mobility and seated options',
    source: 'https://www.nhs.uk/live-well/exercise/sitting-exercises/',
    steps: [
      'Review the NHS seated guide and its stable-chair setup.',
      'Learn what a comfortable range of motion means. Never force a stretch.',
      'Review one demonstration; a learning-only session is enough.',
      'Reflect on comfort and accessibility. Keep, simplify or skip the activity.',
    ],
  },
] as const;

export function LifePrograms({ life, commit }: LifeProps) {
  const [selected, setSelected] = useState('walking'),
    [error, setError] = useState('');
  const program = programs.find((p) => p.id === selected)!;
  const progress = life.learning?.[selected] || { level: 'learn' as const, completed: [] };
  const level = life.planner.movement === 'none' ? 'learn' : progress.level;
  const save = (next: typeof progress) =>
    void commit((s) => ({ ...s, learning: { ...s.learning, [selected]: next } }));
  return (
    <>
      <Card>
        <Label bold size={24}>
          Move & learn
        </Label>
        <Label>
          Four self-paced educational paths. Choose the challenge yourself; completion records
          learning steps, not fitness or exercise performance.
        </Label>
        <Row>
          {programs.map((p) => (
            <Button
              key={p.id}
              quiet
              title={p.title}
              selected={selected === p.id}
              onPress={() => {
                setSelected(p.id);
                setError('');
              }}
            />
          ))}
        </Row>
      </Card>
      <Card>
        <Label bold size={22}>
          {program.title}
        </Label>
        <Label bold>Learning difficulty</Label>
        <Row>
          {(['learn', 'gentle', 'practice'] as const).map((value) => (
            <Button
              key={value}
              quiet
              title={
                {
                  learn: 'Learn only',
                  gentle: 'Gentle exploration',
                  practice: 'Independent review',
                }[value]
              }
              selected={level === value}
              disabled={life.planner.movement === 'none' && value !== 'learn'}
              onPress={() => save({ ...progress, level: value })}
            />
          ))}
        </Row>
        <Label>
          {level === 'learn'
            ? 'Read or watch; no physical activity is needed.'
            : level === 'gentle'
              ? 'If suitable, explore one comfortable option from the guide. You choose the amount and may stop at any time.'
              : 'Review the guide, select an appropriate option and reflect on technique and recovery. There is no automatic increase in intensity.'}
        </Label>
        {life.planner.movement === 'seated' && (
          <Label>
            Your seated preference is saved. Use the mobility path for seated examples; walking and
            running can remain learning-only.
          </Label>
        )}
        <Label muted>{progress.completed.length} of 4 learning steps recorded</Label>
        <ProgressBar value={progress.completed.length / 4} />
        {program.steps.map((step, i) => (
          <Card key={step}>
            <Label bold>
              {i + 1}. {step}
            </Label>
            <Button
              quiet
              selected={progress.completed.includes(i)}
              title={
                progress.completed.includes(i) ? `Undo step ${i + 1}` : `Mark step ${i + 1} learned`
              }
              onPress={() =>
                save({
                  ...progress,
                  completed: progress.completed.includes(i)
                    ? progress.completed.filter((n) => n !== i)
                    : [...progress.completed, i],
                })
              }
            />
          </Card>
        ))}
        <Label>
          Stop movement if it causes pain or you feel unwell. If you are unsure about suitability,
          have an injury, symptoms or exercise restrictions, seek individual guidance before trying
          a physical activity. No medical details are needed here.
        </Label>
        <Button
          quiet
          title="Read the programme source"
          onPress={() =>
            void Linking.openURL(program.source).catch(() =>
              setError('Could not open the source. Please retry.'),
            )
          }
        />
        {!!error && <Label accessibilityRole="alert">{error}</Label>}
        <Button
          quiet
          title="Clear this learning path progress"
          onPress={() => save({ level: 'learn', completed: [] })}
        />
      </Card>
    </>
  );
}
