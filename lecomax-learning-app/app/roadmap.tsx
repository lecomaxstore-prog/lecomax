import { useState } from 'react';
import { router } from 'expo-router';
import { useSchool } from '../store/School';
import { Button, Card, Field, Label, Page, ProgressBar } from '../components/UI';
import {
  activeJourney,
  diagnosticQuestions,
  enrollJourney,
  journeyCourses,
  placement,
  roadmap,
} from '../services/learning-roadmap';
import { getLesson } from '../services/content';
import { recordCourseLesson } from '../services/course-learning';
import { CourseProgram } from '../components/CourseProgram';

export default function Roadmap() {
  const { state, update, t } = useSchool();
  const [selected, setSelected] = useState(activeJourney(state)?.id || '');
  const [testing, setTesting] = useState(false);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<ReturnType<typeof placement>>();
  const plan = roadmap(selected, state);
  const questions = testing ? diagnosticQuestions(selected, state.language) : [];
  const projectLesson = plan?.milestone && getLesson(plan.milestone.lessonId, state.language);
  const enroll = (module?: string) => {
    update((p) => {
      const next = enrollJourney(p, selected);
      const first = plan?.stages.find((s) => s.module.id === module)?.module.lessons[0];
      const positioned = first ? recordCourseLesson(next, first.id, selected) : next;
      return module
        ? {
            ...positioned,
            journey: {
              ...positioned.journey,
              starts: { ...positioned.journey.starts, [selected]: module },
            },
          }
        : next;
    });
    router.replace('/');
  };
  return (
    <Page
      title={t(
        'Mon parcours et mes étapes',
        'My roadmap and starting point',
        'مساري ونقطة البداية',
      )}
    >
      <Label>
        {t(
          'Choisissez un cours. Vos acquis et vos notes sont conservés quand vous changez de parcours.',
          'Choose a course. Switching paths preserves your completions and notes.',
          'اختر مقرراً. تغيير المسار يحافظ على إنجازاتك وملاحظاتك.',
        )}
      </Label>
      {journeyCourses.map((c) => (
        <Button
          key={c.id}
          quiet
          selected={selected === c.id}
          title={t(c.title[0], c.title[1], c.title[2])}
          onPress={() => {
            setSelected(c.id);
            setTesting(false);
            setAnswers({});
            setResult(undefined);
          }}
        />
      ))}
      {plan && (
        <>
          <CourseProgram courseId={selected} />
          <Card>
            <Label bold size={22}>
              {t(plan.course.title[0], plan.course.title[1], plan.course.title[2])}
            </Label>
            <Label>
              {t(plan.course.summary[0], plan.course.summary[1], plan.course.summary[2])}
            </Label>
            <ProgressBar value={plan.done / Math.max(1, plan.total)} />
            <Label>
              {plan.done}/{plan.total} · {plan.percent}%
            </Label>
            <Label muted>
              {t(
                'Progression = leçons terminées / leçons uniques du cours. Les modules ont leurs propres totaux. Le niveau décrit le contenu, pas une qualification.',
                'Progress = completed / unique course lessons. Each module has its own total. Level describes the content, not a qualification.',
                'التقدم = الدروس المكتملة ÷ دروس المقرر الفريدة. لكل وحدة تقدم مستقل. المستوى يصف المحتوى وليس مؤهلاً.',
              )}
            </Label>
            <Button
              title={t('Choisir ce parcours', 'Make this my active path', 'اجعل هذا مساري الحالي')}
              onPress={() => enroll()}
            />
            <Button
              quiet
              title={t(
                'Commencer aux bases sans test',
                'Start at the beginning — no test',
                'ابدأ من الأساسيات دون اختبار',
              )}
              onPress={() => enroll(plan.stages[0]?.module.id)}
            />
            <Button
              quiet
              title={t(
                'Diagnostic facultatif',
                'Optional starting-point assessment',
                'تقييم اختياري لنقطة البداية',
              )}
              onPress={() => {
                setTesting(!testing);
                setResult(undefined);
                setAnswers({});
              }}
            />
          </Card>
          {testing && (
            <Card>
              <Label bold>
                {t('Diagnostic indicatif', 'Starting-point sample', 'عينة لتحديد نقطة البداية')}
              </Label>
              <Label>
                {t(
                  'Quelques questions ne mesurent pas la maîtrise. Aucune leçon ne sera validée.',
                  'A small question sample cannot measure mastery. No lesson will be marked complete.',
                  'عينة صغيرة لا تقيس الإتقان. لن تُسجّل أي دروس كمكتملة.',
                )}
              </Label>
              {questions.map((q) => (
                <Card key={q.key}>
                  <Label bold>{q.question}</Label>
                  {q.options.map((o, i) => (
                    <Button
                      key={i}
                      quiet
                      selected={answers[q.key] === i}
                      title={o}
                      onPress={() => {
                        setAnswers((a) => ({ ...a, [q.key]: i }));
                        setResult(undefined);
                      }}
                    />
                  ))}
                  {result && <Label>{q.explanation}</Label>}
                </Card>
              ))}
              {!questions.length && (
                <Label>
                  {t(
                    'Pas de diagnostic disponible pour ce cours.',
                    'No diagnostic is available for this course.',
                    'لا يتوفر تقييم لهذا المقرر.',
                  )}
                </Label>
              )}
              <Button
                disabled={!questions.length || questions.some((q) => answers[q.key] === undefined)}
                title={t('Voir la recommandation', 'Show recommendation', 'اعرض التوصية')}
                onPress={() => {
                  const r = placement(selected, answers, state.language);
                  setResult(r);
                  update((p) => ({
                    ...p,
                    journey: {
                      ...p.journey,
                      diagnostics: [
                        ...p.journey.diagnostics,
                        {
                          courseId: selected,
                          at: Date.now(),
                          answers: { ...answers },
                          recommendedModule: r.recommendedModule,
                        },
                      ],
                    },
                  }));
                }}
              />
              {result && (
                <>
                  <Label>
                    {result.correct}/{result.total} ·{' '}
                    {
                      plan.stages.find((s) => s.module.id === result.recommendedModule)?.module
                        .title[state.language]
                    }
                  </Label>
                  <Label>
                    {t(
                      'Recommandation provisoire : chaque étape proposée comme acquise nécessite trois réponses correctes. Vous pouvez toujours revoir les bases.',
                      'Tentative recommendation: moving past a sampled stage requires three correct answers. You can always revisit the basics.',
                      'توصية مبدئية: تجاوز مرحلة في العينة يتطلب ثلاث إجابات صحيحة. يمكنك دائماً مراجعة الأساسيات.',
                    )}
                  </Label>
                  <Button
                    title={t(
                      'Utiliser ce point de départ',
                      'Use this starting point',
                      'استخدم نقطة البداية',
                    )}
                    onPress={() => enroll(result.recommendedModule)}
                  />
                </>
              )}
            </Card>
          )}
          {plan.stages.map((s, i) => (
            <Card key={s.module.id}>
              <Label bold size={20}>
                {i + 1}. {s.module.title[state.language]}
              </Label>
              <Label>
                {s.done}/{s.total} ·{' '}
                {s.status === 'completed'
                  ? t('Terminé', 'Completed', 'مكتمل')
                  : s.status === 'upcoming'
                    ? t('À venir', 'Upcoming', 'قادم')
                    : s.status === 'in-progress'
                      ? t('En cours', 'In progress', 'قيد التعلم')
                      : t('Disponible', 'Available', 'متاح')}
              </Label>
              <Label muted>{s.module.summary[state.language]}</Label>
              {!!s.required.length && (
                <Label>
                  {t(
                    'Préparation recommandée : ',
                    'Recommended preparation: ',
                    'التحضير الموصى به: ',
                  )}
                  {s.required
                    .map(
                      (id) =>
                        plan.stages.find((x) => x.module.id === id)?.module.title[state.language],
                    )
                    .join(' · ')}
                </Label>
              )}
              <Label muted>
                {t(
                  'Terminez les leçons et leurs évaluations. Les prérequis sont une recommandation pédagogique, pas une interdiction.',
                  'Complete the lessons and their assessments. Prerequisites guide the sequence; experienced learners may override them.',
                  'أكمل الدروس وتقييماتها. المتطلبات توجه التسلسل ويمكن للمتعلم ذي الخبرة تجاوزها.',
                )}
              </Label>
              {s.status === 'upcoming' ? (
                <Button
                  quiet
                  title={t(
                    'J’ai les bases : ouvrir cette étape',
                    'I have the preparation: unlock this stage',
                    'لدي المتطلبات: افتح هذه المرحلة',
                  )}
                  onPress={() =>
                    update((p) => ({
                      ...enrollJourney(p, selected),
                      journey: {
                        ...p.journey,
                        activeCourse: selected,
                        overrides: [
                          ...new Set([...p.journey.overrides, selected + ':' + s.module.id]),
                        ],
                      },
                    }))
                  }
                />
              ) : (
                s.module.lessons.map((l) => (
                  <Button
                    quiet
                    key={l.id}
                    title={`${state.completed.includes(l.id) ? '✓ ' : ''}${l.title[state.language]}`}
                    onPress={() => {
                      update((p) => enrollJourney(p, selected));
                      router.push({
                        pathname: '/lesson/[id]',
                        params: { id: l.id, course: selected },
                      });
                    }}
                  />
                ))
              )}
              {s.override && (
                <Button
                  quiet
                  title={t(
                    'Rétablir la préparation recommandée',
                    'Restore recommended prerequisites',
                    'أعد المتطلبات الموصى بها',
                  )}
                  onPress={() =>
                    update((p) => ({
                      ...p,
                      journey: {
                        ...p.journey,
                        starts: { ...p.journey.starts, [selected]: '' },
                        overrides: p.journey.overrides.filter(
                          (id) => id !== selected + ':' + s.module.id,
                        ),
                      },
                    }))
                  }
                />
              )}
            </Card>
          ))}
          {plan.milestone && projectLesson && (
            <Card>
              <Label bold size={22}>
                {t('Projet de fin de parcours', 'Milestone project', 'مشروع نهاية المسار')}
              </Label>
              <Label bold>{t(...plan.workshop.title)}</Label>
              <Label>{t(...plan.workshop.brief)}</Label>
              <Label>{t(...plan.workshop.deliverable)}</Label>
              {plan.workshop.stages.map((stage) => (
                <Card key={stage.id}>
                  <Label bold>{t(...stage.title)}</Label>
                  <Label>{t(...stage.task)}</Label>
                  <Label muted>{t(...stage.verify)}</Label>
                </Card>
              ))}
              <Label>{t(...plan.workshop.defense)}</Label>
              <Label muted>
                {t(
                  'Conservez le code ou le lien du projet et vos résultats de test. La revue est déclarée par vous, pas certifiée par IA.',
                  'Save your project code or link and test results. Review is self-reported, not certified by AI.',
                  'احفظ كود المشروع أو رابطه ونتائج الاختبار. المراجعة ذاتية وليست شهادة من الذكاء الاصطناعي.',
                )}
              </Label>
              <Field
                multiline
                value={state.journey.projects[plan.milestone.id]?.artifact || ''}
                maxLength={20000}
                placeholder={t(
                  'Code, lien et résultats de test',
                  'Code, link and test results',
                  'الكود والرابط ونتائج الاختبار',
                )}
                onChangeText={(artifact) =>
                  update((p) => ({
                    ...p,
                    journey: {
                      ...p.journey,
                      projects: {
                        ...p.journey.projects,
                        [plan.milestone!.id]: { artifact, reviewed: false, at: Date.now() },
                      },
                    },
                  }))
                }
              />
              <Button
                quiet
                title={t(
                  'Ouvrir les consignes et tests',
                  'Open project instructions and tests',
                  'افتح تعليمات المشروع واختباراته',
                )}
                onPress={() =>
                  router.push({
                    pathname: '/lesson/[id]',
                    params: { id: projectLesson.id, course: selected },
                  })
                }
              />
              <Button
                disabled={
                  !state.journey.projects[plan.milestone.id]?.artifact.trim() || !plan.complete
                }
                title={
                  plan.projectDone
                    ? t(
                        'Revue personnelle enregistrée',
                        'Self-review recorded',
                        'حُفظت المراجعة الذاتية',
                      )
                    : t(
                        'J’ai exécuté les tests et vérifié le résultat',
                        'I ran the tests and reviewed the result',
                        'شغّلت الاختبارات وراجعت النتيجة',
                      )
                }
                onPress={() =>
                  update((p) => ({
                    ...p,
                    journey: {
                      ...p.journey,
                      projects: {
                        ...p.journey.projects,
                        [plan.milestone!.id]: {
                          ...p.journey.projects[plan.milestone!.id]!,
                          reviewed: true,
                          at: Date.now(),
                        },
                      },
                    },
                  }))
                }
              />
              {!plan.complete && (
                <Label muted>
                  {t(
                    'Terminez les leçons avant de valider la revue du projet.',
                    'Complete the course lessons before recording the project review.',
                    'أكمل دروس المقرر قبل تسجيل مراجعة المشروع.',
                  )}
                </Label>
              )}
              <Label>
                {t(
                  `Parcours : ${plan.pathDone}/${plan.pathTotal} (leçons + projet revu)`,
                  `Path: ${plan.pathDone}/${plan.pathTotal} (lessons + reviewed project)`,
                  `المسار: ${plan.pathDone}/${plan.pathTotal} (الدروس والمشروع المراجع)`,
                )}
              </Label>
            </Card>
          )}
        </>
      )}
    </Page>
  );
}
