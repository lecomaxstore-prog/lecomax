import React, { useEffect, useMemo, useState } from 'react';
import { Linking, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { getJourney, journeys } from './journeys';
import { Button, Card, Field, Label, Page, Row } from '../../components/UI';
import { useSchool } from '../../store/School';
import { catalog, getDiscovery, type Discovery, type Step } from './catalog';
import {
  answer,
  CURIOSITY_KEY,
  dailyDiscovery,
  forMode,
  freshJournal,
  modes,
  readJournal,
  recommend,
  type Journal,
} from './model';
import { newTutorSession } from '../../utils/tutor-memory';
import { PredictionLab } from './PredictionLab';

export function CuriosityEntry() {
  const { t, colors } = useSchool();
  return (
    <Card style={{ borderColor: colors.accent }}>
      <Label muted size={11}>
        CURIOSITY UNIVERSE
      </Label>
      <Label bold size={23}>
        {t(
          'Découvrez quelque chose d’incroyable',
          'Discover something amazing',
          'اكتشف شيئاً مدهشاً',
        )}
      </Label>
      <Label>
        {t(
          'Explorez les sciences, les inventions et le monde vivant.',
          'Explore science, inventions and the living world.',
          'استكشف العلوم والاختراعات والعالم الحي.',
        )}
      </Label>
      <Button
        title={t('Explorer', 'Explore the universe', 'استكشف عالم المعرفة')}
        icon="sparkles-outline"
        onPress={() => router.push('/curiosity')}
      />
    </Card>
  );
}

function Flow({
  steps,
  title,
  tutor,
}: {
  steps: Step[];
  title: string;
  tutor: (text: string) => void;
}) {
  const [selected, setSelected] = useState(0);
  const step = steps[selected] || steps[0]!;
  return (
    <Card>
      <Label bold size={21}>
        {title}
      </Label>
      <Label muted>Conceptual diagram · tap a node. Positions are not physical dimensions.</Label>
      <Row>
        {steps.map((s, i) => (
          <React.Fragment key={s.name}>
            <Button
              quiet
              selected={selected === i}
              title={`${i + 1}. ${s.name}`}
              onPress={() => setSelected(i)}
            />
            {i < steps.length - 1 && !title.includes('inside') && <Label muted>→</Label>}
          </React.Fragment>
        ))}
      </Row>
      <Label bold>{step.name}</Label>
      <Label>{step.detail}</Label>
      <Button
        quiet
        title="Ask AI about this component or step"
        onPress={() =>
          tutor(
            `Explain ${step.name}: ${step.detail} Explain its connections and give me a related activity.`,
          )
        }
      />
    </Card>
  );
}

function SequenceActivity({ d }: { d: Discovery }) {
  const [order, setOrder] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);
  const steps = d.steps!.slice(0, 5);
  const correct = order.length === steps.length && order.every((n, i) => n === i);
  return (
    <Card>
      <Label bold>Build the process</Label>
      <Label>
        Choose these stages in their logical order. This activity uses the first five stages of the
        simplified journey.
      </Label>
      <Row>
        {steps
          .map((_, i) => steps.length - 1 - i)
          .filter((i) => !order.includes(i))
          .map((i) => (
            <Button
              quiet
              key={i}
              title={steps[i]!.name}
              onPress={() => {
                setOrder([...order, i]);
                setChecked(false);
              }}
            />
          ))}
      </Row>
      {order.map((i, n) => (
        <Label key={i}>
          {n + 1}. {steps[i]!.name}
        </Label>
      ))}
      <Row>
        <Button
          title="Check sequence"
          disabled={order.length !== steps.length}
          onPress={() => setChecked(true)}
        />
        <Button
          quiet
          title="Start again"
          onPress={() => {
            setOrder([]);
            setChecked(false);
          }}
        />
      </Row>
      {checked && (
        <Label accessibilityLiveRegion="polite">
          {correct
            ? 'Correct: each stage prepares the information or material needed by the next.'
            : `Try again: start with ${steps[0]!.name}. Ask what each later step needs before it can begin.`}
        </Label>
      )}
    </Card>
  );
}

export default function CuriosityScreen() {
  const params = useLocalSearchParams<{ topic?: string }>();
  const { state, update, ready, error, saveStatus, retry, colors, t } = useSchool();
  const { width } = useWindowDimensions();
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);
  const [tab, setTab] = useState('Discover');
  const [mode, setMode] = useState<string>(modes[0]);
  const [selected, setSelected] = useState(
    typeof params.topic === 'string' && getDiscovery(params.topic) ? params.topic : '',
  );
  const [query, setQuery] = useState('');
  const [collection, setCollection] = useState('');
  const [message, setMessage] = useState('');
  const [language, setLanguage] = useState('English');
  const [hint, setHint] = useState(false);
  const [showCheck, setShowCheck] = useState(false);
  const [choice, setChoice] = useState<number>();
  const parsed = useMemo(() => {
    try {
      return { journal: readJournal(state.drafts[CURIOSITY_KEY]), invalid: false };
    } catch {
      return { journal: freshJournal(), invalid: true };
    }
  }, [state.drafts]);
  const journal = parsed.journal;
  const d = getDiscovery(selected);
  const change = (fn: (s: Journal) => Journal) => {
    if (!ready || parsed.invalid) return;
    update((p) => ({
      ...p,
      drafts: {
        ...p.drafts,
        [CURIOSITY_KEY]: JSON.stringify(fn(readJournal(p.drafts[CURIOSITY_KEY]))),
      },
    }));
  };
  const open = (id: string) => {
    setSelected(id);
    setHint(false);
    setShowCheck(false);
    setChoice(undefined);
    setMessage('');
    change((s) => ({ ...s, visited: [id, ...s.visited.filter((x) => x !== id)] }));
  };
  const tutor = (prompt: string, topic = d) => {
    const existing = topic && state.tutor.sessions.find((s) => s.discoveryId === topic.id);
    if (!existing && state.tutor.sessions.length >= 20) {
      setMessage(
        'Your Tutor has 20 sessions. Open Tutor and remove a session before starting another.',
      );
      return;
    }
    const session =
      existing ||
      newTutorSession(
        topic ? `Explore: ${topic.title}` : query || 'Explore a subject of my choice',
        'explain',
      );
    const next = {
      ...session,
      discoveryId: topic?.id,
      discoveryStep: undefined,
      draft: prompt,
      settings: {
        conversationLanguage: language,
        examType: 'Practice',
        minutes: '20',
        target: '80%',
        difficulty: journal.depth === 'deep' ? 'advanced' : 'beginner',
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
  const daily = dailyDiscovery(new Date(now));
  const matches = forMode(mode).filter((x) =>
    `${x.title} ${x.category} ${x.fact}`.toLowerCase().includes(query.toLowerCase()),
  );
  const card = (x: Discovery, reason?: string) => (
    <Card
      key={x.id}
      style={{
        width: width >= 850 ? '48%' : '100%',
        borderColor: journal.saved.includes(x.id) ? colors.accent : colors.line,
      }}
    >
      <Label muted size={11}>
        {x.category.toUpperCase()} · {x.evidence}
      </Label>
      <Label bold size={21}>
        {x.title}
      </Label>
      <Label>{x.fact}</Label>
      <Label muted size={12}>
        {reason ||
          `${journal.visited.includes(x.id) ? 'Explored' : 'New discovery'}${journal.answers[x.id]?.correct ? ' · Check passed' : ''}`}
      </Label>
      <Button quiet title={`Explore · ${x.title}`} onPress={() => open(x.id)} />
    </Card>
  );
  if (!ready)
    return (
      <Page title="Curiosity Universe">
        <Label>Loading your discovery journal…</Label>
      </Page>
    );
  if (parsed.invalid)
    return (
      <Page title="Curiosity Universe">
        <Card>
          <Label accessibilityRole="alert">
            The discovery journal could not be read. Its original data has been preserved. Restore a
            valid progress backup to recover your journal.
          </Label>
          <Button title="Open settings and backups" onPress={() => router.push('/settings')} />
          <Button quiet title="Back to Academy" onPress={() => router.push('/')} />
        </Card>
      </Page>
    );
  return (
    <Page title={t('Univers de curiosité', 'Curiosity Universe', 'عالم الفضول')} wide>
      <Row>
        <Button quiet title="Academy" onPress={() => router.push('/')} />
        {['Discover', 'Map', 'Journal'].map((x) => (
          <Button
            key={x}
            quiet
            selected={tab === x && !d}
            title={x}
            onPress={() => {
              setTab(x);
              setSelected('');
            }}
          />
        ))}
        <Button quiet title="Changes Made" onPress={() => router.push('/change-history')} />
      </Row>
      {error && (
        <Card>
          <Label accessibilityRole="alert">{error}</Label>
          <Button title="Retry saving" onPress={() => void retry()} />
        </Card>
      )}
      {parsed.invalid && (
        <Card>
          <Label accessibilityRole="alert">
            The journal could not be read. Its original data is preserved; saving is disabled.
            Restore a valid backup to recover it.
          </Label>
        </Card>
      )}
      {!!message && <Label accessibilityRole="alert">{message}</Label>}
      {!d && tab === 'Discover' && (
        <Card>
          <Label bold size={23}>
            Interactive discovery journeys
          </Label>
          <Label>
            Explore a model, test a prediction, and save your progress. Start with the complete
            eight-step AI journey.
          </Label>
          <Button
            title="Resume last interactive journey"
            onPress={() => router.push('/discovery')}
          />
          <Row>
            {journeys.map((j) => (
              <Button
                quiet
                key={j.id}
                title={`${j.title} · ${j.steps.length} steps`}
                onPress={() => router.push({ pathname: '/discovery', params: { topic: j.id } })}
              />
            ))}
          </Row>
        </Card>
      )}
      {d ? (
        <>
          <Button quiet title="← Back to discoveries" onPress={() => setSelected('')} />
          <Card style={{ borderColor: colors.accent }}>
            <Label muted>
              {d.category} · {d.evidence}
            </Label>
            <Label bold size={32}>
              {d.title}
            </Label>
            <Label size={20}>{d.fact}</Label>
            <Row>
              <Button
                title={journal.saved.includes(d.id) ? 'Saved · remove bookmark' : 'Save discovery'}
                onPress={() =>
                  change((s) => ({
                    ...s,
                    saved: s.saved.includes(d.id)
                      ? s.saved.filter((x) => x !== d.id)
                      : [...s.saved, d.id],
                  }))
                }
              />
              <Button
                quiet
                selected={journal.depth === 'simple'}
                title="Explain it simply"
                onPress={() => change((s) => ({ ...s, depth: 'simple' }))}
              />
              <Button
                quiet
                selected={journal.depth === 'deep'}
                title="How it actually works"
                onPress={() => change((s) => ({ ...s, depth: 'deep' }))}
              />
            </Row>
            <Label>{journal.depth === 'simple' ? d.simple : d.deep}</Label>
            {d.myth && <Label>{d.myth}</Label>}
          </Card>
          {d.steps && (
            <Flow key={d.id + 'steps'} title="Follow the journey" steps={d.steps} tutor={tutor} />
          )}
          {d.parts && (
            <Flow
              key={d.id + 'parts'}
              title="What’s inside? · Functional connections"
              steps={d.parts}
              tutor={tutor}
            />
          )}
          {!d.steps && !d.parts && (
            <Card>
              <Label bold>Concept connection diagram</Label>
              <Row>
                <Label>{d.title}</Label>
                <Label>→</Label>
                {d.related.map((id) => (
                  <Button key={id} quiet title={getDiscovery(id)!.title} onPress={() => open(id)} />
                ))}
              </Row>
              <Label muted>
                Links connect related ideas; they do not imply a physical mechanism.
              </Label>
            </Card>
          )}
          {d.history && (
            <Flow
              key={d.id + 'history'}
              title="Then → now · Historical milestones"
              steps={d.history}
              tutor={tutor}
            />
          )}
          {getJourney(d.id) && (
            <Button
              title="Start or resume guided discovery"
              onPress={() => router.push({ pathname: '/discovery', params: { topic: d.id } })}
            />
          )}
          {d.id === 'ai' && <PredictionLab />}
          {d.steps && <SequenceActivity key={d.id} d={d} />}
          <Card>
            <Label bold size={22}>
              Knowledge challenge
            </Label>
            <Label>{d.question}</Label>
            {d.options.map((option, i) => (
              <Button
                key={option}
                quiet
                selected={choice === i}
                title={option}
                onPress={() => {
                  setChoice(i);
                  setShowCheck(false);
                }}
              />
            ))}
            <Row>
              <Button
                title="Check my reasoning"
                disabled={choice === undefined}
                onPress={() => {
                  change((s) => answer(s, d.id, choice!));
                  setShowCheck(true);
                }}
              />
              <Button quiet title="Hint" onPress={() => setHint(true)} />
            </Row>
            {hint && <Label>Hint: {d.simple}</Label>}
            {showCheck && (
              <Label accessibilityLiveRegion="polite">
                {choice === d.correct ? 'Correct. ' : 'Not yet. '}
                {d.feedback}
              </Label>
            )}
            {journal.answers[d.id] && (
              <Label muted>
                Recall level {journal.answers[d.id]!.streak} · Next review{' '}
                {new Date(journal.answers[d.id]!.due).toLocaleDateString()} · One check is not proof
                of topic mastery.
              </Label>
            )}
          </Card>
          {d.project && (
            <Card>
              <Label bold>Try a mini-project</Label>
              <Label>{d.project}</Label>
              <Button
                quiet
                title="Discuss my project with AI"
                onPress={() => tutor(`Help me plan and explain this project: ${d.project}`)}
              />
            </Card>
          )}
          <Card>
            <Label bold size={22}>
              Your discovery teacher
            </Label>
            <Label muted>
              Online AI · uses the existing authenticated Tutor. Generated explanations and
              translations may need verification; browsing this catalog makes no AI requests.
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
            <Row>
              {[
                'Explain it like I’m 10.',
                'Teach me like a university student.',
                'Explain with a real-life example.',
                'Show me the steps.',
                'Why was this invented?',
                'Explain the science behind it.',
                'Compare it with another technology.',
                'Test whether I understood.',
                'Give me a related experiment or project.',
                'Translate this explanation.',
              ].map((p) => (
                <Button key={p} quiet title={p} onPress={() => tutor(p)} />
              ))}
            </Row>
          </Card>
          <Card>
            <Label bold>Source & editorial status</Label>
            <Label>
              Source checked {d.checked} · English educational summary · Not expert peer review.
            </Label>
            <Button
              quiet
              title={d.sourceName}
              onPress={() =>
                void Linking.openURL(d.source).catch(() =>
                  setMessage('Could not open the source. Check your connection and try again.'),
                )
              }
            />
            <Label muted>
              Established facts, simplified models and research frontiers are labeled separately. AI
              conversations cannot publish to this catalog.
            </Label>
          </Card>
          <Card>
            <Label bold>Add to a knowledge collection</Label>
            <Field
              value={collection}
              onChangeText={setCollection}
              maxLength={60}
              placeholder="Collection name"
            />
            <Button
              title="Add discovery to collection"
              disabled={
                !collection.trim() ||
                ['__proto__', 'constructor', 'prototype'].includes(collection.trim())
              }
              onPress={() => {
                change((s) => ({
                  ...s,
                  collections: {
                    ...s.collections,
                    [collection.trim()]: [
                      ...new Set([
                        ...(Array.isArray(s.collections[collection.trim()])
                          ? s.collections[collection.trim()]!
                          : []),
                        d.id,
                      ]),
                    ],
                  },
                }));
                setMessage('Discovery added to collection.');
              }}
            />
          </Card>
          <Label bold size={23}>
            Follow your curiosity
          </Label>
          <Row style={{ alignItems: 'stretch' }}>
            {recommend(
              journal,
              d.id,
              state.academy.plans.map((p) => p.title),
            ).map((x) =>
              card(x, d.related.includes(x.id) ? 'Connected concept' : 'Explore another field'),
            )}
          </Row>
        </>
      ) : tab === 'Discover' ? (
        <>
          <Card style={{ backgroundColor: colors.soft, borderColor: colors.accent, padding: 28 }}>
            <Label muted size={11}>
              THE WORLD IS FULL OF QUESTIONS
            </Label>
            <Label bold size={34}>
              Discover something amazing.
            </Label>
            <Label size={18}>
              Small discoveries. Deeper understanding. A new connection every day.
            </Label>
            <Label muted>
              {catalog.length} source-checked discoveries · Works offline · English catalog
            </Label>
            <Label bold size={22}>
              Today’s discovery · {daily.title}
            </Label>
            <Label>{daily.fact}</Label>
            <Row>
              <Button title="Explore today’s discovery" onPress={() => open(daily.id)} />
              <Button
                quiet
                title="Surprise me with another"
                onPress={() => {
                  const pool = recommend(journal, daily.id);
                  open(pool[Math.floor(Math.random() * pool.length)]!.id);
                }}
              />
            </Row>
          </Card>
          <Label bold size={23}>
            Choose a way to explore
          </Label>
          <Row>
            {modes.map((m) => (
              <Button
                quiet
                selected={mode === m}
                key={m}
                title={m}
                onPress={() => {
                  setMode(m);
                  setQuery('');
                }}
              />
            ))}
          </Row>
          <Field
            value={query}
            onChangeText={setQuery}
            placeholder="Search a subject, technology or question"
            maxLength={160}
          />
          {mode === 'Explore Anything With AI' ? (
            <Card>
              <Label bold>Start with a question</Label>
              <Label>
                Ask about a topic beyond the catalog. AI-generated answers are not source-checked
                catalog entries.
              </Label>
              <Button
                title="Open AI Tutor"
                onPress={() =>
                  tutor(query || 'Help me choose an interesting subject to explore.', undefined)
                }
              />
            </Card>
          ) : (
            <>
              <Label muted>
                {matches.length} discoveries · {mode}
              </Label>
              <Row style={{ alignItems: 'stretch' }}>{matches.map((x) => card(x))}</Row>
              {!matches.length && (
                <Card>
                  <Label>No matching discovery. Try another word, or ask the AI Tutor.</Label>
                  <Button quiet title="Clear search" onPress={() => setQuery('')} />
                </Card>
              )}
            </>
          )}
          <Label bold size={23}>
            Recommended for your next connection
          </Label>
          <Row style={{ alignItems: 'stretch' }}>
            {recommend(
              journal,
              '',
              state.academy.plans.map((p) => p.title),
            )
              .slice(0, 3)
              .map((x) =>
                card(
                  x,
                  (journal.answers[x.id]?.due ?? Infinity) <= now
                    ? 'Review is due'
                    : journal.interests.includes(x.category)
                      ? 'Matches your interests'
                      : 'Broaden your exploration',
                ),
              )}
          </Row>
        </>
      ) : tab === 'Map' ? (
        <>
          <Label bold size={28}>
            Everything connects.
          </Label>
          <Label>
            Each row is a neighborhood of ideas. Follow a connection to open its discovery.
          </Label>
          {catalog.map((x) => (
            <Card key={x.id}>
              <Button
                title={`${journal.answers[x.id]?.correct ? '✓ ' : journal.visited.includes(x.id) ? '◉ ' : '○ '}${x.title}`}
                onPress={() => open(x.id)}
              />
              <Row>
                <Label muted>connects to →</Label>
                {x.related.map((id) => (
                  <Button quiet key={id} title={getDiscovery(id)!.title} onPress={() => open(id)} />
                ))}
              </Row>
            </Card>
          ))}
          <Label muted>○ New · ◉ Explored · ✓ Check passed</Label>
        </>
      ) : (
        <>
          <Label bold size={28}>
            Your discovery journal
          </Label>
          <Label muted>
            Storage: {saveStatus} · {journal.visited.length} explored · {journal.saved.length} saved
          </Label>
          <Card>
            <Label bold>Favorite subjects</Label>
            <Row>
              {[...new Set(catalog.map((x) => x.category))].map((category) => (
                <Button
                  key={category}
                  quiet
                  selected={journal.interests.includes(category)}
                  title={category}
                  onPress={() =>
                    change((s) => ({
                      ...s,
                      interests: s.interests.includes(category)
                        ? s.interests.filter((x) => x !== category)
                        : [...s.interests, category],
                    }))
                  }
                />
              ))}
            </Row>
            <Label muted>
              Recommendations mix interests, connected concepts, unseen discoveries and due reviews.
            </Label>
          </Card>
          <Label bold size={22}>
            Due for retrieval
          </Label>
          {!Object.values(journal.answers).some((a) => a.due <= now) && (
            <Label muted>No reviews due. Complete a knowledge check to schedule one.</Label>
          )}
          <Row>
            {catalog
              .filter((x) => (journal.answers[x.id]?.due ?? Infinity) <= now)
              .map((x) => card(x, 'Answer again without looking at the explanation.'))}
          </Row>
          <Label bold size={22}>
            Bookmarks
          </Label>
          {!journal.saved.length && <Label muted>Save a discovery to find it here.</Label>}
          <Row>
            {journal.saved.map((id) =>
              getDiscovery(id) ? (
                card(getDiscovery(id)!)
              ) : (
                <Button
                  quiet
                  key={id}
                  title={getJourney(id)!.title}
                  onPress={() => router.push({ pathname: '/discovery', params: { topic: id } })}
                />
              ),
            )}
          </Row>
          <Label bold size={22}>
            Collections
          </Label>
          {!Object.keys(journal.collections).length && (
            <Label muted>Create a collection from a discovery.</Label>
          )}
          {Object.entries(journal.collections).map(([name, ids]) => (
            <Card key={name}>
              <Label bold>{name}</Label>
              {ids.map((id) => (
                <Row key={id}>
                  <Button quiet title={getDiscovery(id)!.title} onPress={() => open(id)} />
                  <Button
                    quiet
                    title={`Remove from ${name}`}
                    onPress={() =>
                      change((s) => ({
                        ...s,
                        collections: {
                          ...s.collections,
                          [name]: s.collections[name]!.filter((x) => x !== id),
                        },
                      }))
                    }
                  />
                </Row>
              ))}
            </Card>
          ))}
          <Label bold size={22}>
            Recently explored
          </Label>
          <Row>{journal.visited.map((id) => card(getDiscovery(id)!))}</Row>
        </>
      )}
    </Page>
  );
}
