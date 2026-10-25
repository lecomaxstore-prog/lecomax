import React, { useEffect, useState } from 'react';
import { router, type Href } from 'expo-router';
import { Button, Card, Label, ListItem, Page, ProgressBar, Row } from '../components/UI';
import { WeeklyChart, openLearningItem } from '../components/AcademyDashboard';
import { useSchool } from '../store/School';
import { analytics } from '../utils/academy';
import { library } from '../services/course-library';
import { courseLearning } from '../services/course-learning';
import { ContinueLearning } from '../components/ContinueLearning';
import { lessons } from '../services/content';
import { toggle } from '../utils/progress';

export default function MyLearning() {
  const { state, update, t } = useSchool();
  const [section, setSection] = useState('paths');
  const [reviewTime, setReviewTime] = useState(() => Date.now());
  useEffect(() => {
    if (section !== 'reviews') return;
    const refresh = () => setReviewTime(Date.now());
    refresh();
    const timer = setInterval(refresh, 60000);
    return () => clearInterval(timer);
  }, [section]);
  const stats = analytics(state);
  const titleFor = (id: string) =>
    lessons.find((l) => l.id === id)?.title[state.language] ||
    state.academy.plans
      .flatMap((p) => p.lessons.map((l, i) => ({ id: p.id + ':' + i, title: l.title })))
      .find((l) => l.id === id)?.title ||
    id;
  const reviews = Object.values(state.memory.reviews).sort((a, b) => a.dueAt - b.dueAt);
  const paths = library.filter(
    (c) =>
      state.academy.enrolled.includes(c.id) ||
      courseLearning(c, state).started || courseLearning(c, state).complete,
  );
  return (
    <Page title={t('Mon apprentissage', 'My learning', 'تعلّمي')}>
      <ContinueLearning />
      <Button title={t('Université IA : parcours et révisions', 'AI University: paths and revision', 'جامعة الذكاء الاصطناعي: المسارات والمراجعة')} onPress={()=>router.push('/ai-university' as Href)}/>
      <Button title={t('Mon programme hebdomadaire', 'My weekly learning plan', 'خطة تعلّمي الأسبوعية')} onPress={() => router.push('/academy-week' as Href)} />
      <Row>
        <Button
          quiet
          title={t('Ma galaxie', 'My knowledge galaxy', 'مجرتي المعرفية')}
          onPress={() => router.push('/galaxy')}
        />
        <Button
          quiet
          title={t('Croissance personnelle', 'Personal Growth', 'نموّي الشخصي')}
          onPress={() => router.push('/growth')}
        />
      </Row>
      <Row>
        {[
          ['paths', t('Parcours', 'Paths', 'مسارات')],
          ['analytics', t('Progrès', 'Progress', 'تقدّم')],
          ['reviews', t('Révisions', 'Reviews', 'مراجعات')],
          ['history', t('Historique', 'History', 'سجل')],
          ['saved', t('Enregistrés', 'Saved', 'محفوظات')],
        ].map(([key, label]) => (
          <Button
            key={key}
            quiet
            selected={section === key}
            title={label!}
            onPress={() => setSection(key!)}
          />
        ))}
      </Row>
      {section === 'paths' && (
        <>
          <Button
            title={t('Choisir un sujet', 'Choose a subject', 'اختر موضوعًا')}
            onPress={() => router.push('/courses')}
          />
          <Label muted>{t(
            'Vos cours ajoutés ou commencés. Retirer un cours du plan conserve votre progression ; les cours commencés restent visibles.',
            'Courses you added or started. Removing a course from your plan keeps your progress; started courses remain visible.',
            'هنا تجد الدورات التي أضفتها أو بدأت تعلّمها. إزالة دورة من خطتك لا تمسح تقدّمك؛ وتبقى الدورات التي بدأت بها ظاهرة هنا.',
          )}</Label>
          {!paths.length && !state.academy.plans.length && (
            <Card>
              <Label bold>
                {t(
                  'Votre première étape vous attend',
                  'Your first step is waiting',
                  'خطوتك الأولى تنتظرك',
                )}
              </Label>
              <Label>
                {t(
                  'Inscrivez un cours à votre plan, ou créez votre propre parcours.',
                  'Add a course to your plan, or create your own learning path.',
                  'أضف دورة إلى خطتك أو أنشئ مسارًا لهدفك.',
                )}
              </Label>
            </Card>
          )}
          {state.academy.plans.map((p) => {
            const done = p.lessons.filter((_, i) => state.completed.includes(`${p.id}:${i}`)).length;
            return (
              <Card key={p.id}>
                <Label bold>{p.title}</Label>
                <Label muted>{p.goal}</Label>
                <ProgressBar value={done / p.lessons.length} />
                <Label>{done} / {p.lessons.length} {t('leçons terminées', 'lessons completed', 'دروس مكتملة')}</Label>
                <Label muted>{t('Leçons enregistrées sur cet appareil, disponibles hors ligne.', 'Lessons saved on this device, available offline.', 'الدروس محفوظة على هذا الجهاز، ويمكنك قراءتها دون إنترنت.')}</Label>
                <Row>
                  <Button title={done === p.lessons.length ? t('Passer au projet', 'Continue to project', 'الانتقال إلى المشروع') : t('Continuer mon parcours', 'Continue my learning plan', 'متابعة مساري التعليمي')}
                    onPress={() => router.push({ pathname: done === p.lessons.length ? '/study-plan' : '/learning-journey', params: { id: p.id } })} />
                  <Button quiet title={t('Voir les leçons', 'View lessons', 'عرض الدروس')}
                    onPress={() => router.push({ pathname: '/study-plan', params: { id: p.id } })} />
                </Row>
              </Card>
            );
          })}
          {paths
            .filter((c) => c.lessons.length)
            .map((c) => {
              const progress = courseLearning(c, state);
              return (
                <Card key={c.id}>
                  <Label bold>{t(c.title[0], c.title[1], c.title[2])}</Label>
                  <ProgressBar value={progress.done / progress.total} />
                  <Label muted>
                    {progress.done} / {progress.total} {t('leçons', 'lessons', 'دروس')}
                  </Label>
                  <Row>
                    {progress.next && (
                      <Button title={progress.started ? t('Reprendre la leçon', 'Resume lesson', 'متابعة الدرس') : t('Commencer le cours', 'Start course', 'بدء الدورة')}
                        onPress={() => router.push({ pathname: '/lesson/[id]', params: { id: progress.next!.id, course: c.id } })} />
                    )}
                    <Button
                      quiet
                      title={t('Ouvrir le cours', 'Open course', 'افتح الدورة')}
                      onPress={() =>
                        router.push({ pathname: '/course/[id]', params: { id: c.id } })
                      }
                    />
                    <Button
                      quiet
                      selected={state.academy.enrolled.includes(c.id)}
                      title={
                        state.academy.enrolled.includes(c.id)
                          ? t('Retirer de mon plan', 'Remove from my plan', 'إزالة من خطتي')
                          : t('Ajouter à mon plan', 'Add to my plan', 'أضف إلى خطتي')
                      }
                      onPress={() =>
                        update((p) => ({
                          ...p,
                          academy: { ...p.academy, enrolled: toggle(p.academy.enrolled, c.id) },
                        }))
                      }
                    />
                  </Row>
                </Card>
              );
            })}
        </>
      )}
      {section === 'analytics' && (
        <>
          <WeeklyChart />
          <Card>
            {[
              [
                t('Temps enregistré', 'Recorded study time', 'وقت التعلّم المسجّل'),
                `${stats.totalMinutes} ${t('min', 'min', 'دقيقة')}`,
              ],
              [
                t('Leçons terminées', 'Completed lessons', 'الدروس المكتملة'),
                state.completed.length,
              ],
              [
                t('Cours terminés', 'Completed courses', 'الدورات المكتملة'),
                library.filter(
                  (c) => c.lessons.length && c.lessons.every((l) => state.completed.includes(l.id)),
                ).length +
                  state.academy.plans.filter((p) =>
                    p.lessons.every((_, i) => state.completed.includes(p.id + ':' + i)),
                  ).length,
              ],
              [
                t(
                  'Précision des rappels indépendants',
                  'Independent recall accuracy',
                  'دقة التذكّر المستقل',
                ),
                stats.accuracy === null ? '—' : `${stats.accuracy}% (${stats.assessed})`,
              ],
              [
                t(
                  'Questions retenues après 3 rappels espacés',
                  'Questions retained after 3 spaced recalls',
                  'أسئلة تذكّرتها بعد 3 مراجعات متباعدة',
                ),
                stats.retained,
              ],
              [t('Série actuelle', 'Current streak', 'سلسلتك الحالية'), stats.streak],
            ].map(([label, value]) => (
              <Row key={label} style={{ justifyContent: 'space-between' }}>
                <Label style={{ flex: 1 }}>{label}</Label>
                <Label bold>{value}</Label>
              </Row>
            ))}
            <Label muted>
              {t(
                'Les rappels réussis indiquent la rétention de questions, pas une maîtrise certifiée de toute une compétence.',
                'Successful recall indicates retention of questions, not certified mastery of an entire skill.',
                'نجاح التذكّر دليل على حفظ أسئلة محددة وليس شهادة بإتقان مهارة كاملة.',
              )}
            </Label>
          </Card>
          <Card>
            <Label bold>{t('Réussites', 'Achievements', 'الإنجازات')}</Label>
            {stats.achievements.length ? (
              stats.achievements.map((id) => (
                <Label key={id}>
                  {
                    {
                      'first-lesson': t(
                        'Première leçon terminée',
                        'First lesson completed',
                        'أول درس مكتمل',
                      ),
                      'ten-lessons': t(
                        'Dix leçons terminées',
                        'Ten lessons completed',
                        'عشرة دروس مكتملة',
                      ),
                      'three-days': t(
                        'Trois jours de suite',
                        'Three days in a row',
                        'ثلاثة أيام متتالية',
                      ),
                      recall: t(
                        'Un concept retenu par rappels espacés',
                        'A concept retained through spaced recall',
                        'مفهوم محفوظ بالمراجعة المتباعدة',
                      ),
                    }[id]
                  }
                </Label>
              ))
            ) : (
              <Label muted>
                {t(
                  'Votre première réussite commencera avec une leçon terminée.',
                  'Your first achievement starts with a completed lesson.',
                  'يبدأ أول إنجاز لك بإكمال درس.',
                )}
              </Label>
            )}
          </Card>
        </>
      )}
      {section === 'reviews' && (
        <>
          <Label muted>
            {t(
              'Les erreurs reviennent plus tôt. Les rappels indépendants espacent les révisions.',
              'Mistakes return sooner. Independent recall gradually spaces out reviews.',
                'نراجع الأسئلة التي أخطأت فيها في وقت أقرب. وعندما تتذكّر الإجابة بنفسك، تطول المدة بين المراجعات تدريجيًا.',
            )}
          </Label>
          {reviews.length ? (
            reviews.map((r) => (
              <ListItem
                key={r.lessonId + r.questionId}
                title={titleFor(r.lessonId)}
                subtitle={`${r.dueAt <= reviewTime ? t('À réviser maintenant', 'Ready to review', 'حان وقت المراجعة') : t('À venir', 'Upcoming', 'مراجعة قادمة')} · ${new Date(r.dueAt).toLocaleString(state.language)} · ${r.recalls} ${t('rappels', 'recalls', 'مراجعات ناجحة')}`}
                onPress={() => openLearningItem(r.lessonId)}
              />
            ))
          ) : (
            <Label>
              {t(
                'Vos quiz créeront votre calendrier de révision.',
                'Quiz attempts will build your review schedule.',
                'ستنشئ محاولات الاختبار جدول مراجعتك.',
              )}
            </Label>
          )}
        </>
      )}
      {section === 'history' &&
        (state.academy.visits.length ? (
          state.academy.visits.map((v) => (
            <ListItem
              key={v.id}
              title={titleFor(v.id)}
              subtitle={new Date(v.at).toLocaleString(state.language)}
              onPress={() => openLearningItem(v.id)}
            />
          ))
        ) : (
          <Label>
            {t(
              'Vos prochaines visites apparaîtront ici.',
              'Your next lesson visits will appear here.',
              'ستظهر زياراتك القادمة للدروس هنا.',
            )}
          </Label>
        ))}
      {section === 'saved' && (
        <>
          {state.bookmarks.map((id) => (
            <ListItem
              key={id}
              title={titleFor(id)}
              subtitle={state.notes[id]?.slice(0, 120)}
              onPress={() => openLearningItem(id)}
            />
          ))}
          {!state.bookmarks.length && (
            <Label>
              {t(
                'Enregistrez une leçon pour la retrouver ici.',
                'Bookmark a lesson to find it here.',
                'احفظ درسًا لتجده هنا.',
              )}
            </Label>
          )}
          <Button
            quiet
            title={t('Mes notes', 'My notes', 'ملاحظاتي')}
            onPress={() => router.push('/collection/notes')}
          />
        </>
      )}
    </Page>
  );
}
