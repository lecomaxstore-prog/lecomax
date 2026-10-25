import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, Field, Label, Page, ProgressBar, Row } from '../../components/UI';
import { useSchool } from '../../store/School';
import { ToolCard } from '../../components/AcademySignature';
import {
  answerRun,
  challenges,
  games,
  gameScore,
  newRun,
  nextRound,
  readRun,
  type Copy,
  type Game,
  type GameRun,
  type Subject,
} from './model';

const KEY = 'universe:game';
export default function Games() {
  const { state, update, t, colors, ready, saveStatus, retry } = useSchool();
  const [subject, setSubject] = useState<Subject>('numbers');
  const [timed, setTimed] = useState(true);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [pairResult, setPairResult] = useState('');
  const [now, setNow] = useState(() => Date.now());
  const copy = (v: Copy) => t(...v);
  const run = useMemo(() => readRun(state.drafts[KEY]), [state.drafts]);
  const qs = run ? challenges(run.game, run.subject, run.seed) : [];
  const q = run && qs[run.index];
  const orderKey = `universe:order:${run?.seed}:${run?.index}`;
  const order = (state.drafts[orderKey] || '')
    .split(',')
    .filter((v) => /^[0-2]$/.test(v))
    .map(Number)
    .filter((v, i, a) => a.indexOf(v) === i);
  const setOrder = (value: number[] | ((old: number[]) => number[])) =>
    update((p) => ({
      ...p,
      drafts: {
        ...p.drafts,
        [orderKey]: (typeof value === 'function' ? value(order) : value).join(','),
      },
    }));
  const result = run?.answers[run.index];
  const complete = !!run && run.index >= qs.length;
  const write = (transform: (r: GameRun) => GameRun) =>
    update((p) => {
      const r = readRun(p.drafts[KEY]);
      return r ? { ...p, drafts: { ...p.drafts, [KEY]: JSON.stringify(transform(r)) } } : p;
    });
  const textKey = `universe:explain:${run?.seed}:${run?.index}`;
  const text = state.drafts[textKey] || '';
  useEffect(() => {
    if (!run || run.game !== 'speed' || !run.timed || result || complete) return;
    const tick = () => {
      const at = Date.now();
      setNow(at);
      if (at - run.startedAt >= 30000)
        update((p) => {
          const current = readRun(p.drafts[KEY]);
          if (!current || current.seed !== run.seed || current.index !== run.index) return p;
          return {
            ...p,
            drafts: { ...p.drafts, [KEY]: JSON.stringify(answerRun(current, [-1], '', at)) },
          };
        });
    };
    tick();
    const timer = setInterval(tick, 500);
    return () => clearInterval(timer);
  }, [run, result, complete, update]); // deadline survives backgrounding and reload
  const start = (game: Game, seed = Date.now()) => {
    const r = newRun(game, subject, seed, timed);
    update((p) => ({ ...p, drafts: { ...p.drafts, [KEY]: JSON.stringify(r) } }));
    setFlipped([]);
    setPairResult('');
  };
  const exit = () =>
    update((p) => {
      const active = readRun(p.drafts[KEY]);
      const drafts: Record<string, string> = { ...p.drafts, [KEY]: '' };
      // Latest completed result per activity; scores are practice outcomes, never mastery.
      if (active && active.index >= challenges(active.game, active.subject, active.seed).length)
        drafts[`universe:result:${active.game}:${active.subject}`] = JSON.stringify(active);
      return { ...p, drafts };
    });
  const match = (tile: number) => {
    if (!run || flipped.length === 2 || flipped.includes(tile) || run.answers[tile % 4]) return;
    const selected = [...flipped, tile];
    setFlipped(selected);
    if (selected.length < 2) return;
    const first = selected[0]!;
    const correct = first % 4 === tile % 4 && first !== tile;
    setPairResult(
      correct
        ? t('Paire trouvée !', 'Pair found!', 'وجدت الزوج!')
        : t(
            'Pas la même valeur. Regardez, puis réessayez.',
            'Different values. Look, then try again.',
            'قيمتان مختلفتان. انظر ثم حاول مجدداً.',
          ),
    );
    if (correct) {
      // Store matched positions separately because pairs can be found in any order.
      update((p) => ({
        ...p,
        drafts: { ...p.drafts, [`universe:match:${run.seed}:${tile % 4}`]: 'yes' },
      }));
    } else
      update((p) => ({
        ...p,
        drafts: {
          ...p.drafts,
          [`universe:misses:${run.seed}`]: String(
            Number(p.drafts[`universe:misses:${run.seed}`] || 0) + 1,
          ),
        },
      }));
  };
  const matched = run
    ? qs.map((_, i) => state.drafts[`universe:match:${run.seed}:${i}`] === 'yes')
    : [];
  const allMatched = matched.length > 0 && matched.every(Boolean);
  return (
    <Page
      wide
      title={t('Arcade du savoir', 'Learning Arcade', 'ساحة التعلّم')}
      subtitle={t(
        'Jouer. Comprendre. Recommencer.',
        'Play with ideas. Learn from every attempt.',
        'العب بالأفكار. تعلّم من كل محاولة.',
      )}
    >
      {saveStatus === 'error' && (
        <Button
          title={t('Réessayer la sauvegarde', 'Retry saving', 'أعد محاولة الحفظ')}
          onPress={retry}
        />
      )}
      {!run ? (
        <>
          <Card style={{ backgroundColor: colors.hero }}>
            <Label bold size={28} style={{ color: colors.onPrimary }}>
              {t(
                'La curiosité passe à l’action.',
                'Curiosity, in action.',
                'فضولك يتحول إلى تجربة.',
              )}
            </Label>
            <Label style={{ color: colors.heroText }}>
              {t(
                'Défis générés avec des règles vérifiables. Fonctionne hors ligne. Les points mesurent la pratique, pas la maîtrise.',
                'Challenges generated from checked rules. Works offline. Points measure practice, not mastery.',
                'تحديات مولّدة بقواعد قابلة للتحقق. تعمل دون اتصال. النقاط تقيس التدريب لا الإتقان.',
              )}
            </Label>
          </Card>
          <Row>
            {(
              [
                ['numbers', t('Nombres et logique', 'Numbers & logic', 'أعداد ومنطق')],
                ['javascript', 'JavaScript'],
              ] as const
            ).map(([id, title]) => (
              <Button
                key={id}
                quiet
                selected={subject === id}
                title={title}
                onPress={() => setSubject(id)}
              />
            ))}
          </Row>
          <Button
            quiet
            selected={!timed}
            title={
              timed
                ? t('Rappel express : 30 s', 'Speed Recall: 30 seconds', 'استرجاع سريع: 30 ثانية')
                : t(
                    'Rappel sans limite de temps',
                    'Recall without time pressure',
                    'استرجاع دون حد زمني',
                  )
            }
            onPress={() => setTimed(!timed)}
          />
          <Button
            icon="sunny-outline"
            title={t('Le défi du jour', 'Start today’s challenge', 'ابدأ تحدي اليوم')}
            onPress={() => {
              const d = new Date();
              start('quest', d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate());
            }}
          />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
            {games.map(([id, title, icon]) => (
              <View key={id} style={{ flexGrow: 1, flexBasis: 260 }}>
                <ToolCard
                  icon={icon}
                  title={copy(title)}
                  description={
                    id === 'debug' && subject !== 'javascript'
                      ? t(
                          'Choisissez JavaScript pour corriger du code.',
                          'Choose JavaScript to debug code.',
                          'اختر JavaScript لتصحيح الكود.',
                        )
                      : t(
                          'Une activité courte, un vrai retour.',
                          'A short activity with clear feedback.',
                          'نشاط قصير وملاحظات واضحة.',
                        )
                  }
                  onPress={() => {
                    if (id === 'debug' && subject !== 'javascript') setSubject('javascript');
                    else if (ready) start(id);
                  }}
                />
              </View>
            ))}
          </View>
          {state.drafts[KEY] && !run && (
            <Label accessibilityRole="alert">
              {t(
                'La partie sauvegardée est illisible. Lancez une nouvelle partie.',
                'The saved game cannot be read. Start a new game.',
                'تعذرت قراءة اللعبة المحفوظة. ابدأ لعبة جديدة.',
              )}
            </Label>
          )}
        </>
      ) : complete ? (
        <Card>
          <Label bold size={30}>
            {t('Défi terminé', 'Challenge complete', 'اكتمل التحدي')}
          </Label>
          <Label bold size={36}>
            {gameScore(run)} {t('points', 'points', 'نقطة')}
          </Label>
          <Label>
            {run.answers.filter((a) => a.correct).length} / {qs.length}{' '}
            {t('réponses correctes', 'correct checks', 'إجابات صحيحة')}
          </Label>
          <ProgressBar value={1} />
          <Label muted>
            {t(
              'Un résultat de pratique, pas une certification. Retrouvez ce résultat dans Croissance personnelle.',
              'Practice evidence, not certification. Find this result in Personal Growth.',
              'نتيجة تدريب وليست شهادة إتقان. تجدها في نموّك الشخصي.',
            )}
          </Label>
          <Button
            title={t('Choisir un autre jeu', 'Choose another game', 'اختر لعبة أخرى')}
            onPress={exit}
          />
          <Button
            quiet
            title={t('Voir ma progression', 'See my growth', 'شاهد تقدّمي')}
            onPress={() => {
              exit();
              router.push('/growth');
            }}
          />
        </Card>
      ) : (
        q && (
          <>
            <Row>
              <Label bold size={23}>
                {copy(games.find((g) => g[0] === run.game)![1])}
              </Label>
              <Label muted>
                {run.game === 'match' ? matched.filter(Boolean).length : run.index + 1} /{' '}
                {qs.length}
              </Label>
            </Row>
            <ProgressBar
              value={
                (run.game === 'match' ? matched.filter(Boolean).length : run.index) / qs.length
              }
            />
            <Label muted>
              {run.game === 'speed' && run.timed
                ? t(
                    '100 points par réponse correcte + jusqu’à 50 pour la rapidité. 30 s par question.',
                    '100 per correct answer + up to 50 for speed. 30 seconds per question.',
                    '100 نقطة للإجابة الصحيحة وحتى 50 للسرعة. 30 ثانية لكل سؤال.',
                  )
                : run.game === 'match'
                  ? t(
                      '100 par paire, moins 10 par erreur, minimum 0.',
                      '100 per pair, minus 10 per mismatch, minimum 0.',
                      '100 لكل زوج، ناقص 10 لكل خطأ، بحد أدنى صفر.',
                    )
                  : t(
                      '100 par première réponse correcte. 0 après une erreur ; l’explication reste disponible.',
                      '100 for a correct first answer. 0 for an error; feedback is always available.',
                      '100 للإجابة الأولى الصحيحة. صفر للخطأ، مع شرح متاح دائماً.',
                    )}
            </Label>
            {run.game === 'speed' && run.timed && (
              <Label accessibilityLabel={t('Temps restant', 'Time remaining', 'الوقت المتبقي')}>
                {Math.max(0, Math.ceil((30000 - (now - run.startedAt)) / 1000))} s
              </Label>
            )}
            {run.game === 'match' ? (
              <Card>
                <Label>
                  {t(
                    'Retournez deux cartes de même valeur.',
                    'Turn over two cards with equal values.',
                    'اقلب بطاقتين لهما القيمة نفسها.',
                  )}
                </Label>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                  {[0, 5, 2, 7, 4, 1, 6, 3].map((tile) => {
                    const c = qs[tile % 4]!;
                    const shown = matched[tile % 4] || flipped.includes(tile);
                    return (
                      <Button
                        key={tile}
                        style={{ flexBasis: '44%', flexGrow: 1, minHeight: 90 }}
                        quiet
                        disabled={matched[tile % 4] || flipped.length === 2}
                        title={
                          shown
                            ? tile < 4
                              ? `${2 + (run.seed % 8) + tile} + 10`
                              : copy(c.options[c.correct]!)
                            : t(`Carte ${tile + 1}`, `Card ${tile + 1}`, `بطاقة ${tile + 1}`)
                        }
                        onPress={() => match(tile)}
                      />
                    );
                  })}
                </View>
                <Label accessibilityLiveRegion="polite">{pairResult}</Label>
                {flipped.length === 2 && !allMatched && (
                  <Button
                    title={t('Continuer', 'Continue', 'متابعة')}
                    onPress={() => {
                      setFlipped([]);
                      setPairResult('');
                    }}
                  />
                )}
                {allMatched && (
                  <Button
                    title={t('Voir mon score', 'See my score', 'شاهد نقاطي')}
                    onPress={() =>
                      write((r) => ({
                        ...r,
                        index: qs.length,
                        answers: qs.map((c, i) => ({
                          choice: [c.correct],
                          correct: true,
                          points: Math.max(
                            0,
                            100 -
                              Math.max(
                                0,
                                Number(state.drafts[`universe:misses:${r.seed}`] || 0) * 10 -
                                  i * 100,
                              ),
                          ),
                          at: Date.now(),
                          text: '',
                        })),
                      }))
                    }
                  />
                )}
              </Card>
            ) : (
              <Card>
                <Label bold size={23}>
                  {copy(q.prompt)}
                </Label>
                {run.game === 'explain' && (
                  <Field
                    multiline
                    maxLength={2000}
                    placeholder={t(
                      'Mon explication (10 caractères minimum)',
                      'My explanation (at least 10 characters)',
                      'شرحي (10 أحرف على الأقل)',
                    )}
                    value={text}
                    onChangeText={(value) =>
                      update((p) => ({ ...p, drafts: { ...p.drafts, [textKey]: value } }))
                    }
                  />
                )}
                {run.game === 'sequence' ? (
                  <>
                    <Label>
                      {order.map((item, i) => `${i + 1}. ${copy(q.options[item]!)}`).join('\n') ||
                        t(
                          'Choisissez la première étape.',
                          'Choose the first step.',
                          'اختر الخطوة الأولى.',
                        )}
                    </Label>
                    {q.options.map((option, i) => (
                      <Button
                        key={i}
                        quiet
                        title={copy(option)}
                        disabled={!!result || order.includes(i)}
                        onPress={() => setOrder((v) => [...v, i])}
                      />
                    ))}
                    <Row>
                      <Button
                        quiet
                        disabled={!!result || !order.length}
                        title={t('Annuler une étape', 'Undo step', 'تراجع عن خطوة')}
                        onPress={() => setOrder((v) => v.slice(0, -1))}
                      />
                      <Button
                        disabled={!!result || order.length !== q.options.length}
                        title={t('Vérifier l’ordre', 'Check sequence', 'تحقق من الترتيب')}
                        onPress={() => write((r) => answerRun(r, order))}
                      />
                    </Row>
                  </>
                ) : (
                  q.options.map((option, i) => (
                    <Button
                      key={i}
                      quiet
                      disabled={!!result || (run.game === 'explain' && text.trim().length < 10)}
                      title={copy(option)}
                      onPress={() => write((r) => answerRun(r, [i], text))}
                    />
                  ))
                )}
                {result && (
                  <View style={{ gap: 12 }}>
                    <Label bold accessibilityLiveRegion="polite">
                      {result.correct
                        ? t('Bien raisonné !', 'Well reasoned!', 'أحسنت التفكير!')
                        : t(
                            'Une piste pour progresser',
                            'A clue for your next attempt',
                            'فكرة تساعدك في المحاولة القادمة',
                          )}
                    </Label>
                    <Label>{copy(q.feedback)}</Label>
                    <Label>
                      {t('Réponse', 'Answer', 'الإجابة')}:{' '}
                      {q.order
                        ? q.order.map((i) => copy(q.options[i]!)).join(' → ')
                        : copy(q.options[q.correct]!)}
                    </Label>
                    <Button
                      title={t('Continuer', 'Continue', 'متابعة')}
                      onPress={() => {
                        write((r) => nextRound(r));
                        setOrder([]);
                      }}
                    />
                  </View>
                )}
              </Card>
            )}
            <Button
              quiet
              title={t(
                'Pause · revenir à l’accueil',
                'Pause · return home',
                'توقف مؤقتاً · عُد للرئيسية',
              )}
              onPress={() => router.push('/(tabs)')}
            />
          </>
        )
      )}
    </Page>
  );
}
