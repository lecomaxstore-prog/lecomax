import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Linking, View } from 'react-native';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';
import { router, useLocalSearchParams } from 'expo-router';
import { Card, ProgressBar, Row } from '../../components/UI';
import { Button, Label, Page, Field, discoveryText } from './DiscoveryUI';
import { localizeJourney } from './arabic-ai';
import { useSchool } from '../../store/School';
import { newTutorSession } from '../../utils/tutor-memory';
import { getJourney, journeys } from './journeys';
import { labSpec } from './labs';
import { localizedLabResult } from './arabic-labs';
import {
  amendStep,
  checkpoint,
  completedSteps,
  experiment,
  freshPlayer,
  PLAYER_KEY,
  readPlayer,
  stepMemory,
  visitStep,
} from './player-model';
import { CURIOSITY_KEY, readJournal } from './model';
import { getDiscovery } from './catalog';
import { ScientificVisual } from './ScientificVisual';

export const playerModes = [
  'Explain Simply',
  'Explain in Depth',
  'Show Me Visually',
  'How Does It Work?',
  'What’s Inside?',
  'Interactive Experiment',
  'Ask AI Teacher',
  'Challenge My Knowledge',
] as const;
type Mode = (typeof playerModes)[number];

export default function DiscoveryPlayer() {
  const { state, update, ready, colors, saveStatus, error, retry, t } = useSchool();
  const params = useLocalSearchParams<{ topic?: string }>();
  const [mode, setMode] = useState<Mode>('Explain Simply');
  const [part, setPart] = useState(0);
  const [details, setDetails] = useState(false);
  const [choice, setChoice] = useState<number>();
  const [notice, setNotice] = useState('');
  const [question, setQuestion] = useState('');
  const [selectedLanguage, setLanguage] = useState<string>();
  const language = selectedLanguage || (state.language === 'ar' ? 'العربية' : state.language === 'fr' ? 'Français' : 'English');
  const [outline, setOutline] = useState(false);
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);
  const parsed = useMemo(() => {
    try {
      return {
        memory: readPlayer(state.drafts[PLAYER_KEY]),
        journal: readJournal(state.drafts[CURIOSITY_KEY]),
        invalid: false,
      };
    } catch {
      return { memory: freshPlayer(), journal: readJournal(), invalid: true };
    }
  }, [state.drafts]);
  const topic = typeof params.topic === 'string' ? params.topic : parsed.memory.last || 'ai';
  const journey = useMemo(
    () => localizeJourney(getJourney(topic), state.language),
    [topic, state.language],
  );
  const memory = parsed.memory;
  const step =
    journey?.steps.find((s) => s.id === memory.topics[topic]?.active) || journey?.steps[0];
  const restoredPreference = useRef(false);
  useEffect(() => {
    if (!ready || parsed.invalid) return;
    if (!restoredPreference.current) {
      setMode(parsed.journal.depth === 'deep' ? 'Explain in Depth' : 'Explain Simply');
      restoredPreference.current = true;
    }
    if (!step || (memory.last === topic && memory.topics[topic]?.active === step.id)) return;
    update((p) => ({
      ...p,
      drafts: {
        ...p.drafts,
        [PLAYER_KEY]: JSON.stringify(visitStep(readPlayer(p.drafts[PLAYER_KEY]), topic, step.id)),
      },
    }));
  }, [ready, parsed.invalid, parsed.journal.depth, memory, topic, step, update]);
  const mutate = (fn: (s: ReturnType<typeof freshPlayer>) => ReturnType<typeof freshPlayer>) => {
    if (!ready || parsed.invalid) return;
    update((p) => ({
      ...p,
      drafts: { ...p.drafts, [PLAYER_KEY]: JSON.stringify(fn(readPlayer(p.drafts[PLAYER_KEY]))) },
    }));
  };
  if (!ready)
    return (
      <Page title="Discovery player">
        <Label>Loading saved journey…</Label>
      </Page>
    );
  if (parsed.invalid)
    return (
      <Page title="Progress needs attention">
        <Label accessibilityRole="alert">
          Saved discovery data could not be read. It is preserved and has not been replaced.
        </Label>
        <Button title="Open backup settings" onPress={() => router.push('/settings')} />
      </Page>
    );
  if (!journey || !step)
    return (
      <Page title="Journey not found">
        <Label>This guided journey is unavailable.</Label>
        <Button title="Explore available discoveries" onPress={() => router.push('/curiosity')} />
      </Page>
    );
  const index = journey.steps.indexOf(step);
  const m = stepMemory(memory, topic, step.id);
  const spec = labSpec[step.lab];
  const result = localizedLabResult(step.lab, m.value, state.language);
  const done = completedSteps(memory, topic);
  const selectedPart = step.parts[part] || step.parts[0]!;
  const move = (id: string) => {
    mutate((s) => visitStep(s, topic, id));
    setPart(0);
    setChoice(undefined);
    setDetails(false);
    setNotice('');
  };
  const bookmark = () =>
    update((p) => {
      const j = readJournal(p.drafts[CURIOSITY_KEY]);
      return {
        ...p,
        drafts: {
          ...p.drafts,
          [CURIOSITY_KEY]: JSON.stringify({
            ...j,
            saved: j.saved.includes(topic)
              ? j.saved.filter((x) => x !== topic)
              : [...j.saved, topic],
          }),
        },
      };
    });
  const depth = (value: 'simple' | 'deep') => {
    setMode(value === 'simple' ? 'Explain Simply' : 'Explain in Depth');
    update((p) => ({
      ...p,
      drafts: {
        ...p.drafts,
        [CURIOSITY_KEY]: JSON.stringify({ ...readJournal(p.drafts[CURIOSITY_KEY]), depth: value }),
      },
    }));
  };
  const ask = (prompt: string) => {
    const existing = state.tutor.sessions.find(
      (s) => s.discoveryId === topic && s.discoveryStep === step.id,
    );
    if (!existing && state.tutor.sessions.length >= 20) {
      setNotice('Tutor session limit reached. Open Tutor to manage your 20 saved sessions.');
      return;
    }
    const session = existing || newTutorSession(`${journey.title}: ${step.title}`, 'explain');
    const next = {
      ...session,
      discoveryId: topic,
      discoveryStep: step.id,
      draft: prompt,
      settings: {
        conversationLanguage: language,
        examType: 'Practice',
        minutes: '20',
        target: '80%',
        difficulty: parsed.journal.depth === 'deep' ? 'advanced' : 'beginner',
      },
    };
    update((p) => ({
      ...p,
      tutor: {
        ...p.tutor,
        active: next.id,
        sessions: existing
          ? p.tutor.sessions.map((s) => (s.id === next.id ? next : s))
          : [...p.tutor.sessions, next],
      },
    }));
    router.push('/tutor');
  };
  const diagram = (
    <Card>
      <Label bold size={22}>
        See the calculation
      </Label>
      <ScientificVisual kind={step.lab} value={m.value} />
      <Svg width="100%" height={150} viewBox="0 0 540 150" accessibilityLabel={result.explanation}>
        <Line x1={90} y1={60} x2={450} y2={60} stroke={colors.accent} strokeWidth={2} />
        {result.nodes.map((n, i) => (
          <React.Fragment key={n.name}>
            <Circle
              cx={90 + i * 180}
              cy={60}
              r={46}
              stroke={colors.accent}
              strokeWidth={2}
              fill={colors.soft}
            />
            <SvgText x={90 + i * 180} y={68} fill={colors.text} textAnchor="middle" fontSize={24}>
              {Number(n.value.toFixed(3))}
            </SvgText>
            <SvgText x={90 + i * 180} y={130} textAnchor="middle" fill={colors.text} fontSize={12}>
              {discoveryText(n.name, state.language)}
            </SvgText>
          </React.Fragment>
        ))}
      </Svg>
      <Label>{result.explanation}</Label>
      <Label muted>{result.limitation}</Label>
      <Row>
        {result.nodes.map((n) => (
          <Label key={n.name} size={13}>
            {discoveryText(n.name, state.language)}: {Number(n.value.toFixed(5))}
          </Label>
        ))}
      </Row>
    </Card>
  );
  const experimentView = (
    <Card>
      <Label bold size={22}>
        Try it · {step.title}
      </Label>
      <Label>{step.mission}</Label>
      <Label bold>
        {spec.label}: {Number(m.value.toFixed(5))}
        {spec.unit}
      </Label>
      <Row>
        <Button
          quiet
          title={`Decrease ${spec.label}`}
          disabled={m.value <= spec.min}
          onPress={() =>
            mutate((s) =>
              experiment(s, topic, step.id, Math.max(spec.min, m.value - spec.increment)),
            )
          }
        />
        <Button
          title={`Increase ${spec.label}`}
          disabled={m.value >= spec.max}
          onPress={() =>
            mutate((s) =>
              experiment(s, topic, step.id, Math.min(spec.max, m.value + spec.increment)),
            )
          }
        />
        <Button
          quiet
          title="Reset experiment values"
          onPress={() =>
            mutate((s) => amendStep(s, topic, step.id, (old) => ({ ...old, value: spec.initial })))
          }
        />
      </Row>
      <Label accessibilityLiveRegion="polite">{result.explanation}</Label>
      <Label muted>{result.limitation}</Label>
      <Label muted>{m.trials} recorded input changes · Reset keeps your checkpoint history.</Label>
      <Button
        quiet
        title="Challenge my understanding"
        onPress={() => setMode('Challenge My Knowledge')}
      />
    </Card>
  );
  const check = (
    <Card>
      <Label bold size={22}>
        Checkpoint · apply the idea
      </Label>
      <Label>{step.question}</Label>
      {step.options.map((option, i) => (
        <Button
          quiet
          key={option}
          selected={choice === i}
          title={option}
          onPress={() => setChoice(i)}
        />
      ))}
      <Row>
        <Button
          title="Check answer"
          disabled={choice === undefined}
          onPress={() => mutate((s) => checkpoint(s, topic, step.id, choice!))}
        />
        <Button
          quiet
          title="Show a hint"
          onPress={() =>
            mutate((s) => amendStep(s, topic, step.id, (old) => ({ ...old, hint: true })))
          }
        />
      </Row>
      {m.hint && <Label>{step.hint}</Label>}
      {m.answer && (
        <>
          <Label accessibilityLiveRegion="polite">
            {m.answer.correct ? 'Correct. ' : 'Not yet. '}
            {step.feedback}
          </Label>
          <Label muted>
            Last answer: {step.options[m.answer.choice]} · Attempts: {m.answer.attempts} · First
            attempt: {m.answer.firstCorrect ? 'correct' : 'needs revision'} ·{' '}
            {m.answer.assisted ? 'Assisted/repeated practice' : 'First unassisted attempt'}
          </Label>
          <Label muted>
            Review due {new Date(m.answer.due).toLocaleString(state.language)}. A checkpoint is
            limited evidence, not mastery certification.
          </Label>
        </>
      )}
      {!m.trials && <Label>Try changing an experiment input to complete this step.</Label>}
    </Card>
  );
  return (
    <Page title={journey.title} wide>
      <Row>
        <Button quiet title="All discoveries" onPress={() => router.push('/curiosity')} />
        <Button
          quiet
          title={parsed.journal.saved.includes(topic) ? 'Bookmarked · remove' : 'Bookmark journey'}
          onPress={bookmark}
        />
        <Button quiet title="Changes Made" onPress={() => router.push('/change-history')} />
      </Row>
      {error && (
        <Card>
          <Label accessibilityRole="alert">{error}</Label>
          <Button title="Retry saving progress" onPress={() => void retry()} />
        </Card>
      )}
      {notice && <Label accessibilityRole="alert">{notice}</Label>}
      <Card style={{ backgroundColor: colors.soft, borderColor: colors.accent }}>
        <Label muted size={11}>
          DISCOVER · EXPERIMENT · UNDERSTAND
        </Label>
        <Label bold size={30}>
          {step.title}
        </Label>
        <Label>
          Step {index + 1} of {journey.steps.length} · {done} completed
        </Label>
        <ProgressBar value={done / journey.steps.length} />
        <Label muted>
          Completion = an experiment interaction + a correct checkpoint. Progress: {saveStatus}.
        </Label>
        <Button
          quiet
          title={
            outline
              ? t('Masquer les étapes', 'Hide step map', 'إخفاء خريطة الخطوات')
              : t('Voir les étapes', 'Show step map', 'عرض خريطة الخطوات')
          }
          expanded={outline}
          onPress={() => setOutline(!outline)}
        />
        {outline && (
          <Row>
            {journey.steps.map((s, i) => {
              const saved = stepMemory(memory, topic, s.id);
              return (
                <Button
                  key={s.id}
                  quiet
                  selected={s.id === step.id}
                  title={`${i + 1}. ${s.title}${saved.trials && saved.answer?.correct ? ' ✓' : ''}`}
                  onPress={() => move(s.id)}
                />
              );
            })}
          </Row>
        )}
      </Card>
      <Row>
        {playerModes.map((name) => (
          <Button
            key={name}
            quiet
            selected={mode === name}
            title={name}
            onPress={() =>
              name === 'Explain Simply'
                ? depth('simple')
                : name === 'Explain in Depth'
                  ? depth('deep')
                  : setMode(name)
            }
          />
        ))}
      </Row>
      {mode === 'Explain Simply' && (
        <>
          <Card>
            <Label bold size={23}>
              The idea, simply
            </Label>
            <Label size={19}>{step.simple}</Label>
            <Button
              quiet
              title={details ? 'Hide technical details' : 'Expand technical details'}
              expanded={details}
              onPress={() => setDetails(!details)}
            />
            {details && <Label>{step.deep}</Label>}
          </Card>
          {diagram}
          {experimentView}
        </>
      )}
      {mode === 'Explain in Depth' && (
        <>
          <Card>
            <Label bold size={23}>
              A closer look
            </Label>
            <Label>{step.deep}</Label>
          </Card>
          {diagram}
          {experimentView}
        </>
      )}
      {mode === 'Show Me Visually' && (
        <>
          {diagram}
          {experimentView}
        </>
      )}
      {mode === 'How Does It Work?' && (
        <Card>
          <Label bold size={22}>
            Follow the mechanism
          </Label>
          {step.mechanism.map((text, i) => (
            <View
              key={text}
              style={{ borderLeftWidth: 3, borderColor: colors.accent, padding: 14 }}
            >
              <Label bold>
                {i + 1}. {text}
              </Label>
            </View>
          ))}
          <Label>{step.deep}</Label>
          <Button title="Test the mechanism" onPress={() => setMode('Interactive Experiment')} />
        </Card>
      )}
      {mode === 'What’s Inside?' && (
        <Card>
          <Label bold size={22}>
            Explore the components
          </Label>
          <Label muted>
            Functional concepts, not a physical engineering or anatomical drawing.
          </Label>
          <Row>
            {step.parts.map((p, i) => (
              <Button
                key={p.name}
                quiet
                selected={part === i}
                title={p.name}
                onPress={() => setPart(i)}
              />
            ))}
          </Row>
          <Label bold>{selectedPart.name}</Label>
          <Label>{selectedPart.detail}</Label>
          <Button
            title="Ask about this component"
            onPress={() =>
              ask(
                `Explain ${selectedPart.name}: ${selectedPart.detail}. Connect it to this step and give an example.`,
              )
            }
          />
        </Card>
      )}
      {mode === 'Interactive Experiment' && (
        <>
          {diagram}
          {experimentView}
        </>
      )}
      {mode === 'Challenge My Knowledge' && check}
      {mode === 'Ask AI Teacher' && (
        <Card>
          <Label bold size={22}>
            Your teacher knows this step
          </Label>
          <Label>
            Context includes the active step, experiment input, checkpoint result and preferred
            difficulty. AI requires the authenticated online service; generated explanations may
            contain errors.
          </Label>
          <Row>
            {['English', 'العربية', 'Français', 'الدارجة المغربية'].map((l) => (
              <Button
                key={l}
                quiet
                selected={language === l}
                title={l}
                onPress={() => setLanguage(l)}
              />
            ))}
          </Row>
          <Field
            multiline
            value={question}
            onChangeText={setQuestion}
            maxLength={1500}
            placeholder="Ask about this step"
          />
          <Button
            title="Ask my question"
            disabled={!question.trim()}
            onPress={() => ask(question)}
          />
          <Row>
            {[
              'Explain differently',
              'Find my misconception',
              'Give a real-life example',
              'Ask me a follow-up question',
            ].map((p) => (
              <Button quiet key={p} title={p} onPress={() => ask(p)} />
            ))}
          </Row>
        </Card>
      )}
      <Row style={{ justifyContent: 'space-between' }}>
        <Button
          quiet
          title="Previous step"
          disabled={index === 0}
          onPress={() => move(journey.steps[index - 1]!.id)}
        />
        {index < journey.steps.length - 1 ? (
          <Button title="Next step" onPress={() => move(journey.steps[index + 1]!.id)} />
        ) : (
          <Button title="Review journey" onPress={() => setMode('Challenge My Knowledge')} />
        )}
      </Row>
      {done === journey.steps.length && (
        <Card>
          <Label bold>Journey checkpoints completed</Label>
          <Label>
            You explored every model and passed each check. Return for retrieval practice; these
            checks do not establish comprehensive mastery.
          </Label>
        </Card>
      )}
      <Card>
        <Label bold>Revision queue</Label>
        {journey.steps
          .filter((s) => {
            const a = stepMemory(memory, topic, s.id).answer;
            return a && (!a.correct || a.due <= now);
          })
          .map((s) => (
            <Button
              quiet
              key={s.id}
              title={`Review: ${s.title}`}
              onPress={() => {
                move(s.id);
                setMode('Challenge My Knowledge');
              }}
            />
          ))}
        <Label muted>
          Incorrect answers and due checkpoints appear here. Prior errors are retained after
          corrections.
        </Label>
      </Card>
      <Card>
        <Label bold>Source & model limits</Label>
        <Button
          quiet
          title={step.sourceName}
          onPress={() =>
            void Linking.openURL(step.source).catch(() =>
              setNotice('Could not open the source. Check your connection and retry.'),
            )
          }
        />
        <Label muted>
          {state.language === 'ar'
            ? topic === 'ai'
              ? 'محتوى تعليمي مكتوب بالعربية، مع الحفاظ على المصادر الأصلية. النماذج مبسّطة للتعلّم وليست محاكاة لنظام إنتاجي. إجابات المعلّم مولّدة وقد تحتاج إلى التحقّق.'
              : 'محتوى هذه الرحلة مكتوب بالإنجليزية حاليًا. يمكنك طلب شرح بالعربية من المعلّم الذكي. النماذج مبسّطة للتعلّم.'
            : 'Sources checked 2026-10-16 · Authored English content; the AI journey also has authored Arabic. Teaching models are simplified. Teacher responses are generated.'}
        </Label>
      </Card>
      <Label bold size={23}>
        Continue exploring
      </Label>
      <Row>
        {journeys
          .filter((j) => j.id !== topic)
          .map((j) => (
            <Button
              key={j.id}
              quiet
              title={localizeJourney(j, state.language)!.title}
              onPress={() => {
                setMode('Explain Simply');
                setPart(0);
                setChoice(undefined);
                router.push({ pathname: '/discovery', params: { topic: j.id } });
              }}
            />
          ))}
      </Row>
      <Row>
        {journey.related.map((id) => (
          <Button
            key={id}
            quiet
            title={`Related: ${getJourney(id)?.title || getDiscovery(id)?.title || id}`}
            onPress={() =>
              router.push({
                pathname: getJourney(id) ? '/discovery' : '/curiosity',
                params: { topic: id },
              })
            }
          />
        ))}
      </Row>
    </Page>
  );
}
