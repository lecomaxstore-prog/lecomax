import { router } from 'expo-router';
import { useSchool } from '../store/School';
import { activeJourney, demonstratedSkills, roadmap } from '../services/learning-roadmap';
import { dueReviews } from '../utils/learning-memory';
import { analytics } from '../utils/academy';
import { lessons } from '../services/content';
import { Button, Card, Label, Page, ProgressBar, Row } from './UI';
import { ChangesMade } from './ChangeHistory';
import { ContinueLearning } from './ContinueLearning';
import { SyncProgress } from './SyncProgress';

export function JourneyDashboard() {
  const { state, t, colors, ready, error, retry } = useSchool();
  const course = activeJourney(state);
  const plan = course && roadmap(course.id, state);
  const stats = analytics(state);
  const minutes = Math.floor(stats.week.reduce((sum, d) => sum + d.seconds, 0) / 60);
  const goal = state.academy.profile.dailyMinutes * 7;
  const reviews = [...new Set(dueReviews(state).map((r) => r.lessonId))].filter((id) =>
    lessons.some((l) => l.id === id),
  );
  const generated = state.academy.plans.some((p) => state.lastLesson.startsWith(p.id + ':'));
  const legacyResume = !course && !!state.lastLesson;
  return (
    <Page title={t('Mon parcours', 'My Learning Journey', 'رحلتي التعليمية')}>
      {!ready ? (
        <Card>
          <Label>
            {error ||
              t('Chargement…', 'Loading your learning records…', 'جارٍ تحميل سجلك التعليمي…')}
          </Label>
          {!!error && <Button title={t('Réessayer', 'Retry', 'أعد المحاولة')} onPress={retry} />}
        </Card>
      ) : (
        <>
          <Card style={{ borderColor: colors.accent }}>
            <Label muted>LECOMAX ACADEMY</Label>
            <Label bold size={26}>
              {plan
                ? t(plan.course.title[0], plan.course.title[1], plan.course.title[2])
                : t(
                    'Choisissez votre destination',
                    'Choose your learning destination',
                    'اختر هدفك التعليمي',
                  )}
            </Label>
            {plan ? (
              <>
                <Row style={{ justifyContent: 'space-between' }}>
                  <Label bold>
                    {plan.complete
                      ? t('Cours terminé', 'Course completed', 'اكتمل المقرر')
                      : t(
                          `Niveau du contenu : ${plan.current?.level || 1}`,
                          `Curriculum level: ${plan.current?.level || 1}`,
                          `مستوى المحتوى: ${plan.current?.level || 1}`,
                        )}
                  </Label>
                  <Label>{plan.pathPercent}%</Label>
                </Row>
                <ProgressBar value={plan.pathDone / Math.max(1, plan.pathTotal)} />
                <Label muted>
                  {t(
                    `Parcours : ${plan.pathPercent}%`,
                    `Path progress: ${plan.pathPercent}%`,
                    `تقدم المسار: ${plan.pathPercent}%`,
                  )}
                </Label>
                <Label muted>
                  {t(
                    `${plan.done} / ${plan.total} leçons terminées`,
                    `${plan.done} / ${plan.total} lessons completed`,
                    `${plan.done} / ${plan.total} دروس مكتملة`,
                  )}
                </Label>
                <Label>{plan.current?.module.title[state.language]}</Label>
                {plan.current && (
                  <Label muted>
                    {t(
                      `Module : ${plan.current.done}/${plan.current.total}`,
                      `Module progress: ${plan.current.done}/${plan.current.total}`,
                      `تقدم الوحدة: ${plan.current.done}/${plan.current.total}`,
                    )}
                  </Label>
                )}
                {plan.next && (
                  <Label bold>
                    {plan.next.title[state.language]} · {plan.next.minutes}{' '}
                    {t('min', 'min', 'دقيقة')}
                  </Label>
                )}
                {plan.next && (
                  <Label muted>
                    {
                      [
                        t('Lecture', 'Read', 'القراءة'),
                        t('Exemples', 'Examples', 'الأمثلة'),
                        t('Pratique', 'Practice', 'التطبيق'),
                        t('Évaluation', 'Assessment', 'التقييم'),
                      ][state.stages[plan.next.id] || 0]
                    }
                  </Label>
                )}
                {!generated && (
                  <Button
                    title={
                      plan.complete
                        ? t('Revoir mon parcours', 'Review my roadmap', 'راجع مساري')
                        : t('Continuer à apprendre', 'Continue Learning', 'تابع التعلم')
                    }
                    onPress={() =>
                      plan.next
                        ? router.push({
                            pathname: '/lesson/[id]',
                            params: { id: plan.next.id, course: plan.course.id },
                          })
                        : router.push('/roadmap')
                    }
                  />
                )}
              </>
            ) : (
              <>
                <Label>
                  {t(
                    'Un objectif, un point de départ et des étapes claires. Aucun test obligatoire.',
                    'One goal, a clear starting point, and visible stages. No required placement test.',
                    'هدف واضح ونقطة بداية وخطوات مرتبة. اختبار تحديد المستوى اختياري.',
                  )}
                </Label>
                <Button
                  quiet={generated || legacyResume}
                  title={t('Créer mon parcours', 'Set up my learning path', 'أنشئ مساري التعليمي')}
                  onPress={() =>
                    router.push(state.academy.profile.onboarded ? '/roadmap' : '/onboarding')
                  }
                />
              </>
            )}
          </Card>
          {(generated || legacyResume) && <ContinueLearning showLibraryLink={false} />}
          {plan && (
            <Card>
              <Label bold size={20}>
                {t('Ma feuille de route', 'My Learning Roadmap', 'خريطة تعلمي')}
              </Label>
              {plan.stages.map((s, i) => (
                <Row key={s.module.id}>
                  <Label style={{ color: s.status === 'completed' ? colors.accent : colors.muted }}>
                    {s.status === 'completed' ? '✓' : s.status === 'upcoming' ? '○' : '▶'}
                  </Label>
                  <Label style={{ flex: 1 }}>
                    {i + 1}. {s.module.title[state.language]} · {s.done}/{s.total}
                  </Label>
                </Row>
              ))}
              <Button
                quiet
                title={t(
                  'Voir les étapes et prérequis',
                  'View stages and prerequisites',
                  'اعرض المراحل والمتطلبات',
                )}
                onPress={() => router.push('/roadmap')}
              />
            </Card>
          )}
          <Card>
            <Label bold>
              {t('Objectif hebdomadaire', 'Weekly learning goal', 'هدف التعلم الأسبوعي')}
            </Label>
            <Label>
              {minutes} / {goal} {t('minutes', 'minutes', 'دقيقة')}
            </Label>
            <ProgressBar value={Math.min(1, minutes / goal)} />
            <Button
              quiet
              title={t('Ajuster mon rythme', 'Adjust my study goal', 'عدّل وقت الدراسة')}
              onPress={() => router.push('/profile')}
            />
          </Card>
          <Card>
            <Label bold>
              {t('Compétences démontrées', 'Skills demonstrated', 'مهارات تدعمها الأدلة')}
            </Label>
            <Label muted>
              {t(
                'Réussite répétée et différée sur au moins deux questions. Ce n’est pas une certification.',
                'Completed lessons with multiple question evidence and successful spaced recall. This is not certification.',
                'دروس مكتملة مع أدلة من أسئلة متعددة واسترجاع متباعد ناجح. ليست شهادة إتقان.',
              )}
            </Label>
            {course && demonstratedSkills(course.id, state).length ? (
              demonstratedSkills(course.id, state).map((l) => (
                <Label key={l.id}>✓ {l.title[state.language]}</Label>
              ))
            ) : (
              <Label>
                {t(
                  'Pas encore assez de preuves.',
                  'Not enough evidence yet.',
                  'لا توجد أدلة كافية بعد.',
                )}
              </Label>
            )}
          </Card>
          <Card>
            <Label bold>
              {t('Révisions à prévoir', 'Topics due for review', 'مواضيع حان وقت مراجعتها')}
            </Label>
            <Label muted>
              {t(
                'Un rappel prévu ne signifie pas que vous avez oublié.',
                'A scheduled review does not mean you have forgotten the topic.',
                'موعد المراجعة لا يعني أنك نسيت الموضوع.',
              )}
            </Label>
            {reviews.slice(0, 3).map((id) => (
              <Button
                quiet
                key={id}
                title={lessons.find((l) => l.id === id)!.title[state.language]}
                onPress={() => router.push({ pathname: '/lesson/[id]', params: { id } })}
              />
            ))}
            {!reviews.length && (
              <Label>
                {t('Aucune révision prévue.', 'No reviews due.', 'لا توجد مراجعات مستحقة.')}
              </Label>
            )}
          </Card>
          <SyncProgress />
          <Button
            quiet
            title={t(
              'Changer de parcours / réévaluer',
              'Change path / reassess',
              'غيّر المسار أو أعد التقييم',
            )}
            onPress={() => router.push('/roadmap')}
          />
          <Button
            quiet
            title={t('Explorer les autres matières', 'Explore Other Subjects', 'استكشف مواد أخرى')}
            onPress={() => router.push('/explore')}
          />
          <ChangesMade />
        </>
      )}
    </Page>
  );
}
