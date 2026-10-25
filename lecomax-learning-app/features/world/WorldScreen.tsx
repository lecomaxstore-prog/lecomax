import React, { useCallback, useMemo, useState } from 'react';
import { Linking, ScrollView, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, Field, Label, Page, Row } from '../../components/UI';
import { CloudProgress } from '../../components/CloudProgress';
import { useSchool } from '../../store/School';
import Globe from './Globe';
import { Diagram, NatureIllustration, PlanetModel } from './Diagrams';
import {
  countries,
  countryDetails,
  countryQuestions,
  getTopic,
  mapSource,
  missions,
  planets,
  planetSource,
  questionsFor,
  reviewedAt,
  titleFor,
  topics,
} from './content';
import {
  answerWorld,
  challengeQueue,
  freshWorld,
  missionComplete,
  readWorld,
  saveWorld,
  topicComplete,
  visitWorld,
  WORLD_KEY,
  type WorldState,
} from './model';
import type { Question } from './types';
type Tab =
  | 'Home'
  | 'Earth'
  | 'Space'
  | 'Nature'
  | 'Science'
  | 'History'
  | 'Missions'
  | 'Journal'
  | 'Challenge'
  | 'Compare';
export default function WorldScreen() {
  const { state, update, ready, error, saveStatus, retry, t } = useSchool();
  const { width } = useWindowDimensions();
  const [tab, setTab] = useState<Tab>('Home');
  const [selected, setSelected] = useState('');
  const [query, setQuery] = useState('');
  const [linkError, setLinkError] = useState('');
  const [compare, setCompare] = useState(['earth', 'jupiter']);
  const [compareSlot, setCompareSlot] = useState(1);
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [challengeIds, setChallengeIds] = useState<string[]>([]);
  const [showCloud, setShowCloud] = useState(false);
  const parsed = useMemo(() => {
    try {
      return { world: readWorld(state.drafts[WORLD_KEY]), invalid: false };
    } catch {
      return { world: freshWorld(), invalid: true };
    }
  }, [state.drafts]);
  const world = parsed.world;
  const change = useCallback(
    (fn: (s: WorldState) => WorldState) => {
      if (!ready || parsed.invalid) return;
      update((p) => ({
        ...p,
        drafts: { ...p.drafts, [WORLD_KEY]: JSON.stringify(fn(readWorld(p.drafts[WORLD_KEY]))) },
      }));
    },
    [ready, parsed.invalid, update],
  );
  const open = useCallback(
    (id: string) => {
      setSelected(id);
      change((s) => visitWorld(s, id));
    },
    [change],
  );
  const selectCountry = useCallback(
    (id: string) => {
      if (!countries.some((c) => c.id === id)) return;
      change((s) => ({ ...visitWorld(s, 'country:' + id), map: [...new Set([...s.map, id])] }));
      setSelected('country:' + id);
    },
    [change],
  );
  const earthEvidence = useCallback((choice:number)=>change(s=>answerWorld(visitWorld(s,'earth'),'earth','earth-day',choice,new Date().toISOString())),[change]);
  const navigate = (next: Tab) => {
    setSelected('');
    setQuery('');
    setTab(next);
  };
  const source = (url: string) => {
    setLinkError('');
    void Linking.openURL(url).catch(() =>
      setLinkError('Could not open the source. Check your connection and try again.'),
    );
  };
  const answer = (id: string, q: Question, choice: number) =>
    change((s) => answerWorld(s, id, q.id, choice, new Date().toISOString()));
  const country = countries.find((c) => 'country:' + c.id === selected);
  const topic = getTopic(selected);
  const planet = planets.find((p) => p.id === selected);
  const detail = country ? countryDetails[country.id] : undefined;
  const countryName = (c: (typeof countries)[number]) =>
    state.language === 'ar' ? c.ar : state.language === 'fr' ? c.fr : c.name;
  const questionCard = (id: string, q: Question) => {
    const a = world.answers[q.id];
    return (
      <Card key={q.id}>
        <Label bold>{q.prompt}</Label>
        {q.options.map((option, i) => (
          <Button
            key={option}
            title={option}
            quiet
            selected={a?.choice === i}
            disabled={a?.correct}
            onPress={() => answer(id, q, i)}
          />
        ))}
        {a && (
          <View accessibilityLiveRegion="polite">
            <Label bold>
              {a.correct
                ? 'Correct · explain why in your own words'
                : 'Not yet · use the explanation and try again'}
            </Label>
            <Label>{q.explanation}</Label>
            <Label muted>
              {a.attempts} attempt(s) ·{' '}
              {a.firstCorrect
                ? 'First response correct'
                : 'Correction practice, not first-attempt recall'}
            </Label>
          </View>
        )}
      </Card>
    );
  };
  const [today] = useState(() => topics[Math.floor(Date.now() / 86400000) % topics.length]!);
  const search = query.trim().toLocaleLowerCase();
  const foundTopics = topics.filter(
    (x) =>
      (tab === 'Home' || tab === x.category) &&
      (!search ||
        (x.title + ' ' + x.intro + ' ' + x.sections.map((s) => s.text).join(' '))
          .toLowerCase()
          .includes(search)),
  );
  const foundCountries = countries.filter((c) =>
    [c.name, c.fr, c.ar, c.region].join(' ').toLowerCase().includes(search),
  );
  const renderTopicLink = (id: string) => (
    <Button
      key={id}
      quiet
      title={`${topicComplete(world, id) ? '✓ ' : ''}${titleFor(id)}`}
      onPress={() => open(id)}
    />
  );
  const allChallenges = challengeQueue(world);
  const challenge = allChallenges.find((x) => x.q.id === challengeIds[challengeIndex]);
  return (
    <Page
      wide
      title={t(
        'Explore World · Terre et au-delà',
        'Explore World · Earth & beyond',
        'استكشف العالم · الأرض وما وراءها',
      )}
      subtitle={t(
        'Observer. Questionner. Comprendre.',
        'Observe. Question. Understand.',
        'لاحظ. اسأل. افهم.',
      )}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
      >
        {(
          ['Home', 'Earth', 'Space', 'Nature', 'Science', 'History', 'Missions', 'Journal'] as Tab[]
        ).map((name) => (
          <Button
            key={name}
            title={
              {
                Home: t('Accueil', 'Home', 'الرئيسية'),
                Earth: t('Terre', 'Earth', 'الأرض'),
                Space: t('Espace', 'Space', 'الفضاء'),
                Nature: t('Nature', 'Nature', 'الطبيعة'),
                Science: t('Sciences', 'Science', 'العلوم'),
                History: t('Histoire', 'History', 'التاريخ'),
                Missions: t('Missions', 'Missions', 'المهام'),
                Journal: t('Collection', 'Journal', 'مجموعتي'),
                Challenge: 'Challenge',
                Compare: 'Compare',
              }[name]
            }
            selected={tab === name && !selected}
            quiet
            onPress={() => navigate(name)}
          />
        ))}
      </ScrollView>
      {!ready ? (
        <Card>
          <Label>Loading your discovery journal…</Label>
          <Button title="Retry loading" onPress={retry} />
        </Card>
      ) : parsed.invalid ? (
        <Card>
          <Label accessibilityRole="alert">
            The discovery journal could not be read. Your original saved data is preserved. Restore
            a known cloud backup or contact support; exploration writes are disabled.
          </Label>
          <CloudProgress />
        </Card>
      ) : (
        <>
          <Row>
            <Label muted>
              {saveStatus === 'saved'
                ? 'Saved on this device'
                : saveStatus === 'saving'
                  ? 'Saving discovery progress…'
                  : 'Progress has not been saved'}
            </Label>
            <Button
              quiet
              title="World knowledge challenge"
              onPress={() => {
                setChallengeIds(challengeQueue(world).map((x) => x.q.id));
                setChallengeIndex(0);
                navigate('Challenge');
              }}
            />
            <Button quiet title="Compare planets" onPress={() => navigate('Compare')} />
          </Row>
          {error && (
            <Card>
              <Label accessibilityRole="alert">{error}</Label>
              <Button title="Retry save" onPress={retry} />
            </Card>
          )}
          {linkError && <Label accessibilityRole="alert">{linkError}</Label>}
          {selected ? (
            <>
              <Button quiet title="Back to exploration" onPress={() => setSelected('')} />
              <Card>
                <Label muted>
                  {country ? 'COUNTRY FIELD NOTES' : topic?.category.toUpperCase() + ' FIELD NOTES'}{' '}
                  · reviewed {reviewedAt}
                </Label>
                <Label bold size={30}>
                  {country ? countryName(country) : topic?.title}
                </Label>
                {planet && <PlanetModel color={planet.color} rings={planet.id === 'saturn'} />}
                {topic?.category === 'Nature' && <NatureIllustration id={topic.id} />}
                <Row>
                  <Button
                    title={world.saved.includes(selected) ? 'Remove bookmark' : 'Save discovery'}
                    quiet
                    icon="bookmark-outline"
                    onPress={() => change((s) => saveWorld(s, selected))}
                  />
                  <Button
                    title="Ask the Discovery AI Tutor"
                    icon="sparkles-outline"
                    onPress={() =>
                      router.push({
                        pathname: '/tutor',
                        params: { world: selected, goal: `Explore ${titleFor(selected)}` },
                      })
                    }
                  />
                </Row>
                <Label muted>
                  Lesson text is in English. Ask the Tutor for English, French, Arabic or Moroccan
                  Darija, with simple, detailed or step-by-step explanations.
                </Label>
                {topic && <Label size={18}>{topic.intro}</Label>}
                {country && (
                  <>
                    <Label size={30}>
                      {/^[A-Z]{2}$/.test(country.iso)
                        ? String.fromCodePoint(
                            ...[...country.iso].map((c) => 127397 + c.charCodeAt(0)),
                          )
                        : ''}
                    </Label>
                    <Label>
                      {country.region} · {country.continent}
                    </Label>
                    <Label>
                      Map label location: {country.lat.toFixed(1)}° latitude,{' '}
                      {country.lon.toFixed(1)}° longitude
                    </Label>
                    <Label>
                      Population estimate: {country.population.toLocaleString()} · reference year{' '}
                      {country.year} · Natural Earth; not a current census.
                    </Label>
                    {detail ? (
                      <>
                        <Label>Capital: {detail.capital}</Label>
                        <Label>Languages: {detail.languages}</Label>
                        <Label>Area: {detail.area}</Label>
                        <Label bold>Climate & natural environments</Label>
                        <Label>{detail.climate}</Label>
                        <Label bold>History & culture</Label>
                        <Label>{detail.culture}</Label>
                        <Label bold>Places to investigate</Label>
                        <Label>{detail.places}</Label>
                      </>
                    ) : (
                      <Label muted>
                        This map entry includes region and historical population data. A reviewed
                        country lesson with capital, area, languages and culture has not yet been
                        published for this entry.
                      </Label>
                    )}
                  </>
                )}
              </Card>
              {topic?.diagram && <Diagram kind={topic.diagram} />}
              {planet && (
                <Card>
                  <Label bold>Planet field measurements</Label>
                  <Label>
                    Equatorial diameter: {planet.diameter.toLocaleString()} km · gravity:{' '}
                    {planet.gravity} m/s²
                  </Label>
                  <Label>
                    Mean Sun distance: {planet.distance} million km · orbital period:{' '}
                    {planet.orbit.toLocaleString()} Earth days
                  </Label>
                  <Label>
                    Rotation: {Math.abs(planet.rotation)} hours{' '}
                    {planet.rotation < 0 ? '(retrograde)' : ''} · reference mean temperature:{' '}
                    {planet.temperature} °C
                  </Label>
                  <Label>{planet.atmosphere}</Label>
                  <Label muted>
                    Rounded NASA reference values. Giant-planet gravity is at the equator near the
                    1-bar level; temperatures refer to atmospheric levels, not solid surfaces.
                    Rotation is relative to the stars, not length of a solar day. Illustration is
                    stylized.
                  </Label>
                  <Button
                    quiet
                    title="NASA measurement definitions"
                    onPress={() => source(planetSource)}
                  />
                </Card>
              )}
              {topic?.sections.map((section) => (
                <Card key={section.title}>
                  <Label bold size={21}>
                    {section.title}
                  </Label>
                  <Label>{section.text}</Label>
                </Card>
              ))}
              {(country ? countryQuestions(country) : topic?.questions || []).map((q) =>
                questionCard(selected, q),
              )}
              <Card>
                <Label bold>
                  {topicComplete(world, selected)
                    ? 'Exploration checks completed'
                    : 'Complete the checks to finish this exploration'}
                </Label>
                <Label muted>
                  Practice evidence is saved in your journal. A corrected response is recorded
                  separately from a first-attempt answer.
                </Label>
                <Label bold>Sources & attribution</Label>
                {[...(topic?.sources || [mapSource]), ...(detail?.sources || [])].map((url) => (
                  <Button
                    key={url}
                    quiet
                    title={url.replace('https://', '')}
                    onPress={() => source(url)}
                  />
                ))}
              </Card>
            </>
          ) : tab === 'Home' || tab === 'Earth' ? (
            <>
              {!search && (
                <Card style={{ backgroundColor: '#071629', borderColor: '#224861' }}>
                  <Label style={{ color: '#83ddd1', letterSpacing: 2 }} size={12}>
                    L’ECOMAX · FIELD EXPLORER
                  </Label>
                  <Label size={width < 600 ? 27 : 38} bold style={{ color: '#f1f8ff' }}>
                    A world of questions.{'\n'}A universe to discover.
                  </Label>
                  <Label style={{ color: '#b9cfe0' }}>
                    Drag Earth, choose a country, and follow the science behind what you see.
                  </Label>
                <Globe onSelect={selectCountry} onEvidence={earthEvidence} />
                  <Row>
                    <Button
                      title="Discover a random place"
                      onPress={() =>
                        open(
                          'country:' + countries[Math.floor(Math.random() * countries.length)]!.id,
                        )
                      }
                    />
                    {world.last && (
                      <Button
                        title={`Continue: ${titleFor(world.last)}`}
                        quiet
                        onPress={() => open(world.last)}
                      />
                    )}
                  </Row>
                </Card>
              )}
              <Field
                value={query}
                onChangeText={setQuery}
                placeholder="Search countries, planets, ecosystems or ideas"
                accessibilityLabel="Search the world"
              />
              {!search && tab === 'Home' && (
                <Card>
                  <Label muted>TODAY’S DISCOVERY · curated daily rotation, not live news</Label>
                  <Label bold size={24}>
                    {today.title}
                  </Label>
                  <Label>{today.intro}</Label>
                  <Button title="Investigate today’s discovery" onPress={() => open(today.id)} />
                </Card>
              )}
              <Row>
                {foundTopics.map((x) => (
                  <View key={x.id} style={{ flexGrow: 1, flexBasis: 280 }}>
                    <Card>
                      <Label muted>{x.category}</Label>
                      <Label bold size={22}>
                        {x.title}
                      </Label>
                      <Label>{x.intro}</Label>
                      <Button title={`Explore ${x.title}`} quiet onPress={() => open(x.id)} />
                    </Card>
                  </View>
                ))}
              </Row>
              <Card>
                <Label bold>Countries & regions</Label>
                <Label muted>
                  177 generalized map features · Natural Earth public domain. Boundaries are not a
                  sovereignty claim. Detailed country lessons: Morocco and Brazil.
                </Label>
                <Row>
                  {foundCountries.slice(0, search ? 177 : 12).map((c) => (
                    <Button
                      key={c.id}
                      title={countryName(c)}
                      quiet
                      onPress={() => open('country:' + c.id)}
                    />
                  ))}
                </Row>
                {!search && <Label muted>Search to find the other map entries.</Label>}
                {!foundCountries.length && !foundTopics.length && (
                  <Label>No reviewed results. Try a country name or a broader topic.</Label>
                )}
              </Card>
            </>
          ) : ['Space', 'Nature', 'Science', 'History'].includes(tab) ? (
            <>
              <Field
                value={query}
                onChangeText={setQuery}
                placeholder={`Search ${tab.toLowerCase()}`}
              />
              <Row>
                {foundTopics.map((x) => (
                  <View key={x.id} style={{ flexBasis: 280, flexGrow: 1 }}>
                    <Card>
                      {tab === 'Space' && planets.some(p=>p.id===x.id) && (
                        <PlanetModel
                          color={planets.find((p) => p.id === x.id)?.color || '#d7b482'}
                          size={100}
                          rings={x.id === 'saturn'}
                        />
                      )}
                      <Label bold size={23}>
                        {x.title}
                      </Label>
                      <Label>{x.intro}</Label>
                      <Button title={`Explore ${x.title}`} onPress={() => open(x.id)} />
                    </Card>
                  </View>
                ))}
              </Row>
              {!foundTopics.length && <Label>No matching reviewed topic.</Label>}
            </>
          ) : tab === 'Missions' ? (
            <>
              {missions.map((m) => (
                <Card key={m.id}>
                  <Label muted>
                    {missionComplete(world, m.id) ? 'COMPLETED' : 'DISCOVERY MISSION'}
                  </Label>
                  <Label bold size={24}>
                    {m.title}
                  </Label>
                  <Label>{m.goal}</Label>
                  <Label muted>
                    Visit each stop and answer its checks correctly.
                    {m.map
                      ? ' Select Morocco directly on the globe or its country selector, too.'
                      : ''}
                  </Label>
                  <Row>{m.topics.map(renderTopicLink)}</Row>
                  {m.map && !world.map.includes(m.map) && (
                    <Button title="Open globe activity" onPress={() => navigate('Earth')} />
                  )}
                  <Label>
                    {m.topics.filter((id) => topicComplete(world, id)).length}/{m.topics.length}{' '}
                    learning stops completed
                  </Label>
                </Card>
              ))}
            </>
          ) : tab === 'Journal' ? (
            <>
              <Card>
                <Label bold size={26}>
                  Your discovery collection
                </Label>
                <Label>
                  {world.saved.length} bookmarks ·{' '}
                  {world.visited.filter((id) => topicComplete(world, id)).length} explorations with
                  completed checks · {missions.filter((m) => missionComplete(world, m.id)).length}{' '}
                  missions completed
                </Label>
                <Label muted>
                  These counts describe practice, not certified mastery. Cloud backup is manual and
                  uses your Academy account.
                </Label>
                <Button
                  title={showCloud ? 'Hide cloud backup' : 'Back up or restore discovery progress'}
                  quiet
                  onPress={() => setShowCloud(!showCloud)}
                />
              </Card>
              {showCloud && <CloudProgress />}
              <Card>
                <Label bold>Saved discoveries</Label>
                <Row>{world.saved.map(renderTopicLink)}</Row>
                {!world.saved.length && (
                  <Label>
                    Use “Save discovery” on a country or topic to start your collection.
                  </Label>
                )}
              </Card>
              <Card>
                <Label bold>Revisit misunderstood concepts</Label>
                {world.visited
                  .filter((id) =>
                    questionsFor(id).some(
                      (q) => world.answers[q.id] && !world.answers[q.id]!.firstCorrect,
                    ),
                  )
                  .map(renderTopicLink)}
                <Label muted>
                  Includes corrected mistakes so you can revisit the reasoning later.
                </Label>
              </Card>
              <Card>
                <Label bold>Exploration history</Label>
                <Row>{world.visited.map(renderTopicLink)}</Row>
                {!world.visited.length && <Label>Your first exploration will appear here.</Label>}
              </Card>
            </>
          ) : tab === 'Compare' ? (
            <>
              <Card>
                <Label bold size={25}>
                  Compare two worlds
                </Label>
                <Row>
                  {compare.map((id, i) => (
                    <Button
                      key={i}
                      title={`Choose ${i === 0 ? 'first' : 'second'}: ${titleFor(id)}`}
                      selected={compareSlot === i}
                      quiet
                      onPress={() => setCompareSlot(i)}
                    />
                  ))}
                </Row>
                <Row>
                  {planets.map((p) => (
                    <Button
                      key={p.id}
                      title={titleFor(p.id)}
                      quiet
                      onPress={() =>
                        setCompare((old) => old.map((id, i) => (i === compareSlot ? p.id : id)))
                      }
                    />
                  ))}
                </Row>
              </Card>
              <Row>
                {compare.map((id, i) => {
                  const p = planets.find((p) => p.id === id)!;
                  return (
                    <View key={i} style={{ flex: 1, minWidth: 240 }}>
                      <Card>
                        <PlanetModel color={p.color} rings={p.id === 'saturn'} />
                        <Label bold size={24}>
                          {titleFor(id)}
                        </Label>
                        <Label>Diameter: {p.diameter.toLocaleString()} km</Label>
                        <Label>Gravity: {p.gravity} m/s²</Label>
                        <Label>Reference temperature: {p.temperature} °C</Label>
                        <Label>Sun distance: {p.distance} million km</Label>
                        <Label>Orbit: {p.orbit.toLocaleString()} days</Label>
                        <Label>
                          Rotation: {Math.abs(p.rotation)} hours{' '}
                          {p.rotation < 0 ? '· retrograde' : ''}
                        </Label>
                        <Label>{p.atmosphere}</Label>
                        <Button title="Open planet lesson" quiet onPress={() => open(p.id)} />
                      </Card>
                    </View>
                  );
                })}
              </Row>
              <Card>
                <Label>
                  The second planet’s diameter is{' '}
                  {(
                    planets.find((p) => p.id === compare[1])!.diameter /
                    planets.find((p) => p.id === compare[0])!.diameter
                  ).toFixed(2)}{' '}
                  times the first.
                </Label>
                <Label muted>
                  Illustrations are equal display size, not true relative scale. Giant planets have
                  no solid surface; gravity and temperature reference levels differ from terrestrial
                  surfaces. Values are rounded NASA references, not live measurements.
                </Label>
                <Button
                  quiet
                  title="Read NASA reference definitions"
                  onPress={() => source(planetSource)}
                />
              </Card>
            </>
          ) : tab === 'Challenge' ? (
            <Card>
              <Label bold size={25}>
                World knowledge challenge
              </Label>
              <Label muted>
                Misunderstood concepts come first. Application questions appear earlier after four
                first-response successes. No timer or points.
              </Label>
              {challenge ? (
                <>
                  <Label>
                    {challengeIndex + 1} / {challengeIds.length}
                  </Label>
                  {questionCard(challenge.topic, challenge.q)}
                  <Button
                    title="Read the explanation in context"
                    quiet
                    onPress={() => open(challenge.topic)}
                  />
                  <Button
                    title="Next question"
                    disabled={!world.answers[challenge.q.id]?.correct}
                    onPress={() => setChallengeIndex((i) => i + 1)}
                  />
                </>
              ) : (
                <>
                  <Label>Challenge complete. Revisit your journal to review the reasoning.</Label>
                  <Button title="Open discovery journal" onPress={() => navigate('Journal')} />
                </>
              )}
            </Card>
          ) : null}
        </>
      )}
      <Row>
        <Button quiet title="Academy course explorer" onPress={() => router.push('/explore')} />
        <Button
          quiet
          title="Changes Made / Change History"
          onPress={() => router.push('/change-history')}
        />
      </Row>
    </Page>
  );
}
