import {
  AcademyIntroduction,
  AcademyPractice,
  AcademyReadiness,
} from '../../components/AcademyLesson';
import { LessonFooter } from '../../components/LessonFooter';
import { LessonOrientation } from '../../components/LessonOrientation';
import { CurriculumRubric } from '../../components/CurriculumRubric';
import { SeasonExperiment } from '../../components/SeasonExperiment';
import { practiceReady } from '../../services/curriculum-evidence';
import { PythonEnvironmentGuide } from '../../components/PythonEnvironmentGuide';
import { StudyCoach, GuidedReading, PracticeCoach } from '../../components/StudyCoach';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Card, Field, Label, Page, Row } from '../../components/UI';
import { CodeViewer } from '../../components/CodeViewer';
import { Quiz } from '../../features/Quiz';
import { WebsiteLesson } from '../../components/WebsiteLesson';
import { useSchool } from '../../store/School';
import { getLesson, project } from '../../services/content';
import { toggle } from '../../utils/progress';
import { recordCourseLesson } from '../../services/course-learning';
import { lessonSequence, courseNavigation } from '../../services/course-navigation';
import { getLessonSupport } from '../../data/university/lessons';
import { LessonHeader } from '../../components/LessonHeader';
import { LessonCompanion } from '../../components/LessonCompanion';
import { LessonBrowser } from '../../components/LessonBrowser';
import { LessonTeacherHelp } from '../../components/LessonTeacherHelp';
import { LessonJourney } from '../../features/universe/Journey';
import { LessonAudio } from '../../features/universe/LessonAudio';
export default function LessonScreen() {
  const { id, course } = useLocalSearchParams<{ id: string; course?: string }>();
  return <LessonContent key={id + (course || '')} id={id} course={course} />;
}
function LessonContent({ id, course }: { id: string; course?: string }) {
  const { state, update, t } = useSchool();
  const l = getLesson(id, state.language);
  const support = getLessonSupport(id);
  const stage = state.stages[id] || 0;
  const [hint, setHint] = useState(false);
  const [solution, setSolution] = useState(false);
  const [why, setWhy] = useState(false);
  const [what, setWhat] = useState(false);
  const [checked, setChecked] = useState(false);
  const exists = !!l;
  useEffect(() => {
    if (exists) update((p) => recordCourseLesson(p, id, course));
  }, [id, course, exists, update]);
  const passedQuiz =
    !!l?.quiz.length &&
    l.quiz.every((q) => state.answers[id + '::' + q.id]?.choice === q.correctIndex);
  const practiced = !!l && practiceReady(l, state) && (
    !l.academy ||
    l.academy.readiness.every((_, i) => state.drafts['academy:skill:' + id + ':' + i] === 'yes'));
  useEffect(() => {
    if (stage === 3 && passedQuiz && practiced) {
      update((p) => (p.completed.includes(id) ? p : { ...p, completed: [...p.completed, id] }));
    }
  }, [id, stage, passedQuiz, practiced, update]);
  if (!l) return <Page title={t('Leçon introuvable', 'Lesson not found', 'الدرس غير موجود')} />;
  const change = (n: number) => update((p) => ({ ...p, stages: { ...p.stages, [id]: n } }));
  const draft = state.drafts[id] || '';
  const allCorrect = l.quiz.every(
    (q) => state.answers[id + '::' + q.id]?.choice === q.correctIndex,
  );
  const academyReady = practiced;
  const sequence = lessonSequence(course, id);
  const navigation = courseNavigation(sequence?.courseId, id);
  const nextId = sequence?.lessons[sequence.position + 1]?.id;
  const previousId = sequence?.lessons[sequence.position - 1]?.id;
  return (
    <Page
      key={id + ':' + stage}
      title={l.title}
      compactSpacing
      header={
        <View style={{ gap: 10 }}>
          <LessonBrowser id={id} course={course} />
          <LessonHeader
            hasCode={l.codeExample.length > 0 || l.relatedFiles.length > 0}
            title={l.title}
            minutes={l.estimatedMinutes}
            completed={state.completed.includes(id)}
            stage={stage}
            onStageChange={change}
          />
        </View>
      }
    >
      {state.completed.includes(id) && (
        <Card style={{ padding: 16 }}>
          <Label bold accessibilityLiveRegion="polite">
            {t('Leçon terminée', 'Lesson completed', 'أكملت هذا الدرس')}
          </Label>
          <Label muted size={13}>
            {t(
              'Votre progression dans le cours a été mise à jour.',
              'Your course progress has been updated.',
              'تم تحديث تقدّمك في الدورة.',
            )}
          </Label>
          <Button
            title={
              nextId
                ? t('Leçon suivante', 'Next lesson', 'الدرس التالي')
                : t('Revoir les leçons', 'Review course lessons', 'مراجعة دروس الدورة')
            }
            onPress={() =>
              nextId
                ? router.replace({
                    pathname: '/lesson/[id]',
                    params: { id: nextId, course: sequence?.courseId },
                  })
                : router.push({
                    pathname: sequence?.courseId?.startsWith('path:')
                      ? '/learning-path/[id]'
                      : sequence?.courseId
                        ? '/course/[id]'
                        : '/module/[id]',
                    params: { id: sequence?.courseId?.replace(/^path:/, '') || l.moduleId },
                  })
            }
          />
        </Card>
      )}
      {id === 'science-seasons-capstone' && <SeasonExperiment />}
      {!!l.contentLanguage && l.contentLanguage !== state.language && (
        <Label muted>
          {t(
            'Langue du contenu original : ',
            'Original content language: ',
            'لغة المحتوى الأصلي: ',
          ) + { ar: 'العربية', en: 'English', fr: 'Français' }[l.contentLanguage]}
        </Label>
      )}
      <LessonOrientation lesson={l} courseId={course} />
      <LessonTeacherHelp key={id} title={l.title} lessonId={id} />
      <LessonJourney id={id} title={l.title} stage={stage} onStage={change} />
      <LessonAudio text={`${l.title}. ${l.summary.join(' ')}`} />
      <Row>
        <Button
          quiet
          selected={state.bookmarks.includes(id)}
          style={{ flex: 1 }}
          icon={state.bookmarks.includes(id) ? 'bookmark' : 'bookmark-outline'}
          title={
            state.bookmarks.includes(id)
              ? t('Enregistré', 'Saved', 'محفوظ')
              : t('Enregistrer', 'Save', 'احفظ')
          }
          onPress={() => update((p) => ({ ...p, bookmarks: toggle(p.bookmarks, id) }))}
        />
        <Button
          quiet
          selected={state.difficult.includes(id)}
          icon={state.difficult.includes(id) ? 'flag' : 'flag-outline'}
          style={{ flex: 1 }}
          title={
            state.difficult.includes(id)
              ? t('À revoir ✓', 'Review ✓', 'للمراجعة ✓')
              : t('À revoir', 'Review later', 'راجع لاحقًا')
          }
          onPress={() => update((p) => ({ ...p, difficult: toggle(p.difficult, id) }))}
        />
      </Row>
      {stage === 0 && (
        <StudyCoach lesson={l}>
          {l.academy && <AcademyIntroduction lesson={l.academy} />}
          {support && <LessonCompanion support={support} />}
          {l.websiteLesson ? (
            <WebsiteLesson lesson={l.websiteLesson} />
          ) : (
            <GuidedReading lesson={l} />
          )}
          {l.teaching && (
            <Card>
              <Label bold>
                {t(
                  'Les six questions essentielles',
                  'Six essential questions',
                  'الأسئلة الستة الأساسية',
                )}
              </Label>
              {(
                [
                  ['what', t('Qu’est-ce que c’est ?', 'What is it?', 'ما هو؟')],
                  ['why', t('Pourquoi l’utiliser ?', 'Why use it?', 'لماذا نستخدمه؟')],
                  ['where', t('Où dans L’ECOMAX ?', 'Where in L’ECOMAX?', 'أين في L’ECOMAX؟')],
                  [
                    'how',
                    t('Comment fonctionne le code ?', 'How does the code work?', 'كيف يعمل الكود؟'),
                  ],
                  ['breaks', t('Si cela casse ?', 'What if it breaks?', 'ماذا لو تعطّل؟')],
                  ['modify', t('À toi de modifier', 'Modify it yourself', 'عدّله بنفسك')],
                ] as const
              ).map(([key, title]) =>
                l.teaching?.[key] ? (
                  <React.Fragment key={key}>
                    <Label bold>{title}</Label>
                    <Label selectable>{l.teaching[key]}</Label>
                  </React.Fragment>
                ) : null,
              )}
            </Card>
          )}
          {!!l.why && (
            <>
              <Button
                quiet
                title={t('Pourquoi ?', 'Why?', 'لماذا؟')}
                onPress={() => setWhy(!why)}
              />
              {why && (
                <Card>
                  <Label>{l.why}</Label>
                </Card>
              )}
            </>
          )}
          {!!l.whatIf && (
            <>
              <Button
                quiet
                title={t('Que se passe-t-il si… ?', 'What happens if…?', 'ماذا يحدث إذا…؟')}
                onPress={() => setWhat(!what)}
              />
              {what && (
                <Card>
                  <Label>{l.whatIf}</Label>
                </Card>
              )}
            </>
          )}
        </StudyCoach>
      )}
      {stage === 1 &&
        (l.id === 'guide-python-7' ? (
          <PythonEnvironmentGuide />
        ) : (
          <>
            <Label muted>
              {t(
                'Exemples pédagogiques conservés du cours. Le code actuel est accessible ci-dessous.',
                'Preserved teaching examples. Current project code is linked below.',
                'أمثلة تعليمية محفوظة من الدرس. كود المشروع الحالي متاح أدناه.',
              )}
            </Label>
            {!!l.codeExample.length && (
              <Card>
                <Label bold>
                  {t(
                    'Lis le code comme une histoire',
                    'Read the code as a sequence of actions',
                    'اقرأ الكود كتسلسل خطوات',
                  )}
                </Label>
                <Label size={14}>
                  {t(
                    'Repère les entrées et la sortie. Prédis le résultat, puis suis les valeurs ligne par ligne. Modifie une entrée et explique ce qui devrait changer avant de tester.',
                    'Identify inputs and output. Predict the result, then trace values line by line. Change one input and explain what should change before testing.',
                    'حدّد المدخلات والمخرجات. توقّع النتيجة ثم تتبّع القيم سطرًا بسطر. غيّر مدخلًا واحدًا واشرح ما يجب أن يتغيّر قبل الاختبار.',
                  )}
                </Label>
              </Card>
            )}
            {l.codeExample.map((b, i) => (
              <CodeViewer
                key={i}
                code={b.code || ''}
                filename={b.filename || l.source}
                annotations={b.annotations}
              />
            ))}
            {l.relatedFiles.map((f) => (
              <Button
                key={f}
                quiet
                title={f}
                onPress={() => router.push({ pathname: '/file', params: { path: f } })}
              />
            ))}
            {!l.codeExample.length && !l.relatedFiles.length && (
              <Card>
                <Label bold>
                  {t('Un exemple à comprendre', 'An example to understand', 'مثال للفهم')}
                </Label>
                <Label>{l.exercise.task || l.concept}</Label>
                <Label muted size={13}>
                  {t(
                    'Avant de lire la réponse : propose les étapes avec tes propres mots.',
                    'Before reading the answer: suggest the steps in your own words.',
                    'قبل قراءة الإجابة: اقترح الخطوات بكلماتك.',
                  )}
                </Label>
                <Button
                  quiet
                  title={
                    solution
                      ? t('Masquer l’exemple', 'Hide worked example', 'إخفاء المثال المحلول')
                      : t(
                          'Voir un exemple de réponse',
                          'Show an example answer',
                          'عرض مثال للإجابة',
                        )
                  }
                  onPress={() => setSolution(!solution)}
                />
                {solution && (
                  <Label selectable>{l.exercise.solution || l.summary.join('\n')}</Label>
                )}
              </Card>
            )}
          </>
        ))}
      {stage === 2 && (
        <>
          <PracticeCoach lesson={l} />
          {l.academy ? (
            <AcademyPractice lesson={l.academy} />
          ) : (
            <Card>
              <Label bold>
                {l.exercise.task ||
                  t(
                    'Reformule cette idée avec tes propres mots.',
                    'Explain this idea in your own words.',
                    'اشرح هذه الفكرة بكلماتك.',
                  )}
              </Label>
              <Field
                multiline
                value={draft}
                code
                onChangeText={(s) => update((p) => ({ ...p, drafts: { ...p.drafts, [id]: s } }))}
                placeholder={t('Mon essai / code', 'My attempt / code', 'محاولتي / الكود')}
              />
              <Label muted size={12}>
                {t(
                  'Bloc-notes de code : aucun JavaScript saisi n’est exécuté.',
                  'Code notebook: entered JavaScript is never executed.',
                  'دفتر كود: لا يتم تنفيذ JavaScript الذي تكتبه.',
                )}
              </Label>
              {!!l.exercise.hints.length && (
                <Button quiet title={t('Indice', 'Hint', 'تلميح')} onPress={() => setHint(!hint)} />
              )}
              {hint && l.exercise.hints.map((h, i) => <Label key={i}>{h}</Label>)}
              {l.exercise.checks && (
                <>
                  <Button
                    title={t(
                      'Vérifier les éléments',
                      'Check required elements',
                      'تحقق من العناصر المطلوبة',
                    )}
                    onPress={() => setChecked(true)}
                  />
                  {checked && (
                    <Label>
                      {l.exercise.checks.every((x) => draft.includes(x))
                        ? t(
                            'Éléments présents. Compare le comportement avec le cours.',
                            'Required elements found. Compare behavior with the lesson.',
                            'العناصر المطلوبة موجودة. قارن السلوك مع الدرس.',
                          )
                        : t('Manque : ', 'Missing: ', 'ينقص: ') +
                          l.exercise.checks.filter((x) => !draft.includes(x)).join(', ')}
                    </Label>
                  )}
                </>
              )}
              {!!l.exercise.solution && (
                <Button
                  quiet
                  title={t('Révéler la solution', 'Reveal solution', 'اعرض الحل')}
                  onPress={() => setSolution(!solution)}
                />
              )}
              {solution && <CodeViewer code={l.exercise.solution} filename="Solution" />}
              {solution && (
                <Label muted size={13}>
                  {t(
                    'Compare les étapes, explique une différence, puis refais un exemple sans regarder.',
                    'Compare the steps, explain a difference, then try another example without looking.',
                    'قارن الخطوات واشرح اختلافًا ثم جرّب مثالًا آخر دون النظر.',
                  )}
                </Label>
              )}
            </Card>
          )}
        </>
      )}
      {stage === 3 && (
        <>
          <Label muted size={13}>
            {l.quiz.length
              ? t(
                  'La leçon se valide automatiquement après le quiz et les compétences pratiques requises.',
                  'This lesson completes automatically when the quiz and required practice skills are passed.',
                  'يكتمل الدرس تلقائيًا بعد النجاح في الاختبار وتأكيد مهارات التطبيق المطلوبة.',
                )
              : t(
                  'Après votre travail, utilisez « Terminer le cours » pour enregistrer cette leçon.',
                  'When you finish studying, select Complete lesson to record your progress.',
                  'بعد إنهاء الدراسة، اضغط «أكمل الدرس» لتسجيل تقدّمك.',
                )}
          </Label>
          {l.academy && <AcademyReadiness lesson={l.academy} />}
          <CurriculumRubric lesson={l} />
          {l.quiz.map((q) => (
            <Quiz key={q.id} question={q} lessonId={id} />
          ))}
          <Card>
            <Label bold>{t('Ce que tu as appris', 'What you learned', 'ما تعلمته')}</Label>
            {l.summary.map((s, i) => (
              <Label key={i}>{s}</Label>
            ))}
            {!l.quiz.length && (
              <Label>
                {t(
                  'Référence sans quiz : relis ton essai avant de terminer.',
                  'Reference without a quiz: review your notes before finishing.',
                  'مرجع دون اختبار: راجع ملاحظاتك قبل الإكمال.',
                )}
              </Label>
            )}
            {!academyReady && (
              <Label muted>
                {t(
                  'Confirme les compétences après la pratique pour terminer.',
                  'Confirm the skills after practicing to complete this lesson.',
                  'أكد المهارات من بعد التطبيق باش تكمل الدرس.',
                )}
              </Label>
            )}
            <Button
              disabled={!allCorrect || !academyReady}
              title={
                state.completed.includes(id)
                  ? t('Terminé ✓', 'Completed ✓', 'مكتمل ✓')
                  : t('Terminer la leçon', 'Complete lesson', 'أكمل الدرس')
              }
              onPress={() =>
                update((p) => ({
                  ...p,
                  completed: p.completed.includes(id) ? p.completed : [...p.completed, id],
                }))
              }
            />
          </Card>
        </>
      )}
      <Row>
        {(['helpful', 'difficult'] as const).map((value) => (
          <Button
            key={value}
            quiet
            selected={state.academy?.feedback[id] === value}
            title={
              value === 'helpful'
                ? t('Cette leçon m’aide', 'This lesson helps', 'هذا الدرس مفيد')
                : t('J’ai besoin d’aide', 'I need more help', 'أحتاج إلى مساعدة')
            }
            onPress={() =>
              update((p) => ({
                ...p,
                academy: { ...p.academy, feedback: { ...p.academy.feedback, [id]: value } },
              }))
            }
          />
        ))}
      </Row>
      <LessonFooter
        lesson={l}
        stage={stage}
        onStageChange={change}
        nextId={nextId}
        previousId={previousId}
        courseId={navigation?.courseId}
        hasSource={project.some((file) => file.path === l.source)}
        onRestart={() => {
          update((p) => ({
            ...p,
            stages: { ...p.stages, [id]: 0 },
            answers: Object.fromEntries(
              Object.entries(p.answers).filter(([, answer]) => answer.lessonId !== id),
            ),
            completed: p.completed.filter((value) => value !== id),
            drafts: Object.fromEntries(
              Object.entries(p.drafts).filter(
                ([key]) => !key.startsWith('academy:skill:' + id + ':') && !key.startsWith('curriculum:rubric:' + id + ':'),
              ),
            ),
          }));
          setHint(false);
          setSolution(false);
          setChecked(false);
          setWhy(false);
          setWhat(false);
        }}
      />
    </Page>
  );
}
