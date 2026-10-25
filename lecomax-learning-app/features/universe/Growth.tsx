import React, { useState } from 'react';
import { router } from 'expo-router';
import { Button, Card, Label, ListItem, Page, Row } from '../../components/UI';
import { MetricCard } from '../../components/AcademySignature';
import { useSchool } from '../../store/School';
import { lessons } from '../../services/content';
import { challenges, games, gameScore, readRun, skillState } from './model';
export default function Growth() {
  const { state, t } = useSchool();
  const [now] = useState(() => Date.now());
  const completed = new Set(state.completed);
  const mastery = lessons.filter(
    (l) => completed.has(l.id) && skillState(state, l.id, [], now) === 'mastered',
  );
  const needs = [
    ...new Set(
      Object.values(state.memory.reviews)
        .filter((r) => r.mistakes > 0 || r.dueAt <= now)
        .map((r) => r.lessonId),
    ),
  ];
  const reviewDays = new Set(
    state.flashcards.events.map((e) => new Date(e.at).toLocaleDateString('en-CA')),
  );
  const results = Object.entries(state.drafts)
    .filter(([key]) => key.startsWith('universe:result:'))
    .map(([, value]) => readRun(value))
    .filter((r) => r !== null);
  const active = readRun(state.drafts['universe:game']);
  if (
    active &&
    active.index === challenges(active.game, active.subject, active.seed).length &&
    !results.some((r) => r.seed === active.seed)
  )
    results.push(active);
  const projects = Object.entries(state.drafts)
    .filter(([key]) => /^interactive:project:.+:evaluation$/.test(key))
    .flatMap(([key, raw]) => {
      try {
        const e = JSON.parse(raw);
        return e && typeof e.message === 'string' && typeof e.tested === 'boolean'
          ? [{ id: key.split(':')[2]!, tested: e.tested, message: e.message }]
          : [];
      } catch {
        return [];
      }
    });
  const title = (id: string) =>
    lessons.find((l) => l.id === id)?.title[state.language] ||
    state.academy.plans
      .flatMap((p) => p.lessons.map((l, i) => ({ id: `${p.id}:${i}`, title: l.title })))
      .find((l) => l.id === id)?.title ||
    id;
  return (
    <Page
      wide
      title={t('Votre croissance', 'Personal Growth', 'نموّك الشخصي')}
      subtitle={t(
        'De petites preuves. De vrais progrès.',
        'Small pieces of evidence. Real progress.',
        'أدلة صغيرة. تقدّم حقيقي.',
      )}
    >
      <Row>
        <MetricCard
          icon="checkmark-done-outline"
          value={state.completed.length}
          label={t('Leçons terminées', 'Completed lessons', 'دروس مكتملة')}
        />
        <MetricCard
          icon="planet-outline"
          value={mastery.length}
          label={t('Rappel espacé démontré', 'Spaced recall demonstrated', 'استرجاع متباعد مثبت')}
        />
        <MetricCard
          icon="calendar-outline"
          value={reviewDays.size}
          label={t('Jours de révision enregistrés', 'Recorded review days', 'أيام مراجعة مسجلة')}
        />
      </Row>
      <Card>
        <Label bold size={22}>
          {t('Compétences démontrées', 'Demonstrated skills', 'مهارات مثبتة')}
        </Label>
        <Label muted>
          {t(
            'Leçon terminée et deux rappels espacés réussis pour chaque question évaluée. Aucun score de jeu ni auto-évaluation ne suffit.',
            'Completed lesson and two successful spaced recalls per assessed question. Game scores and self-ratings alone do not qualify.',
            'درس مكتمل واسترجاعان متباعدان صحيحان لكل سؤال مقيّم. نقاط اللعب والتقييم الذاتي لا تكفي.',
          )}
        </Label>
        {mastery
          .slice(-8)
          .reverse()
          .map((l) => (
            <ListItem
              key={l.id}
              title={l.title[state.language]}
              onPress={() => router.push({ pathname: '/lesson/[id]', params: { id: l.id } })}
            />
          ))}
        {!mastery.length && (
          <Label>
            {t(
              'Votre première preuve commence par une question. Revenez la rappeler un autre jour.',
              'Your first evidence starts with a question. Return to recall it on another day.',
              'يبدأ أول دليل بسؤال. عُد لاسترجاعه في يوم آخر.',
            )}
          </Label>
        )}
        <Button
          quiet
          title={t('Voir la galaxie', 'Open the galaxy', 'افتح المجرة')}
          onPress={() => router.push('/galaxy')}
        />
      </Card>
      <Card>
        <Label bold size={22}>
          {t('À renforcer', 'Room to grow', 'مجالات للتحسين')}
        </Label>
        {needs.slice(0, 8).map((id) => (
          <ListItem
            key={id}
            title={title(id)}
            onPress={() =>
              id.startsWith('plan-')
                ? router.push({
                    pathname: '/plan-lesson',
                    params: { plan: id.split(':')[0], step: id.split(':')[1] },
                  })
                : router.push({ pathname: '/lesson/[id]', params: { id } })
            }
          />
        ))}
        {!needs.length && (
          <Label>
            {t(
              'Aucune difficulté enregistrée pour le moment.',
              'No difficulties recorded yet.',
              'لا توجد صعوبات مسجلة بعد.',
            )}
          </Label>
        )}
        <Button
          quiet
          title={t('Réviser mes cartes', 'Review my cards', 'راجع بطاقاتي')}
          onPress={() => router.push('/memory-studio')}
        />
      </Card>
      <Card>
        <Label bold size={22}>
          {t('Résultats de pratique', 'Practice outcomes', 'نتائج التدريب')}
        </Label>
        {results.map((r) => (
          <Label key={`${r.game}:${r.subject}:${r.seed}`}>
            {t(...(games.find((g) => g[0] === r.game)![1] as readonly [string, string, string]))} ·{' '}
            {gameScore(r)} {t('points', 'points', 'نقطة')} ·{' '}
            {r.answers.filter((a) => a.correct).length}/{r.answers.length}
          </Label>
        ))}
        {!results.length && (
          <Label>
            {t(
              'Terminez un jeu pour conserver votre résultat.',
              'Complete a game to record a result.',
              'أكمل لعبة لتسجيل نتيجة.',
            )}
          </Label>
        )}
        <Label muted>
          {t(
            'Dernière partie terminée par jeu et sujet. Ces résultats ne certifient pas la maîtrise.',
            'Latest completed game per activity and subject. These results do not certify mastery.',
            'آخر لعبة مكتملة لكل نشاط وموضوع. هذه النتائج لا تثبت الإتقان.',
          )}
        </Label>
        <Button
          quiet
          title={t('Jouer et apprendre', 'Play and learn', 'العب وتعلّم')}
          onPress={() => router.push('/games')}
        />
      </Card>
      <Card>
        <Label bold size={22}>
          {t('Projets et livrables', 'Projects & deliverables', 'مشاريع وأعمال')}
        </Label>
        {projects.map((p) => (
          <Label key={p.id}>
            {p.id} ·{' '}
            {p.tested
              ? t(
                  'Tests réussis lors de l’évaluation',
                  'Tests passed at evaluation',
                  'نجحت الاختبارات عند التقييم',
                )
              : t('Revue nécessaire', 'Needs review', 'تحتاج مراجعة')}
          </Label>
        ))}
        {!projects.length && (
          <Label>
            {t(
              'Construisez puis évaluez un projet pour voir ses preuves ici.',
              'Build and evaluate a project to see its evidence here.',
              'ابنِ مشروعاً وقيّمه لعرض أدلته هنا.',
            )}
          </Label>
        )}
        <Label muted>
          {t(
            'Les tests archivés ne garantissent pas que le code actuel reste correct. Vérifiez à nouveau après modification.',
            'Archived test results do not guarantee that current code is still correct. Recheck after edits.',
            'نتائج الاختبارات السابقة لا تضمن صحة الكود الحالي. أعد الاختبار بعد التعديل.',
          )}
        </Label>
        <Button
          quiet
          title={t('Ouvrir les projets', 'Open projects', 'افتح المشاريع')}
          onPress={() =>
            router.push({ pathname: '/interactive-studio', params: { tool: 'projects' } })
          }
        />
      </Card>
    </Page>
  );
}
