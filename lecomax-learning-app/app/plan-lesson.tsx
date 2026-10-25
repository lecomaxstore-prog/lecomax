import React, { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Card, Field, Label, Page, Row } from '../components/UI';
import { useSchool } from '../store/School';
import { canCompletePlanLesson, planLessonId, visitLesson } from '../utils/academy';
import { recordAnswer, toggle } from '../utils/progress';

export default function PlanLesson() {
  const params = useLocalSearchParams<{ plan: string; step: string }>();
  return (
    <Player
      key={params.plan + ':' + params.step}
      planId={params.plan}
      index={Number(params.step)}
    />
  );
}
function Player({ planId, index }: { planId: string; index: number }) {
  const { state, update, t } = useSchool();
  const plan = state.academy.plans.find((p) => p.id === planId);
  const lesson = Number.isInteger(index) ? plan?.lessons[index] : undefined;
  const id = plan ? planLessonId(plan, index) : '';
  const [solution, setSolution] = useState(false);
  const [revealed, setRevealed] = useState<number[]>([]);
  useEffect(() => {
    if (lesson) update((p) => visitLesson(p, id));
  }, [id, lesson, update]);
  if (!lesson || !plan)
    return (
      <Page title={t('Leçon introuvable', 'Lesson not found', 'الدرس غير موجود')}>
        <Button
          title={t('Mes parcours', 'My learning', 'تعلّمي')}
          onPress={() => router.replace('/my-learning')}
        />
      </Page>
    );
  const stage = state.stages[id] || 0;
  return (
    <Page
      title={lesson.title}
      subtitle={`${index + 1} / ${plan.lessons.length} · ${lesson.minutes} ${t('min', 'min', 'دقيقة')}`}
    >
      <Label muted>
        {t(
          'Contenu généré par IA. Vérifiez les faits spécialisés et les sources.',
          'AI-generated content. Verify specialized facts and sources.',
          'محتوى مولّد بالذكاء الاصطناعي. تحقّق من المعلومات المتخصصة ومصادرها.',
        )}
      </Label>
      <Row>
        {[
          t('Comprendre', 'Learn', 'افهم'),
          t('Pratiquer', 'Practice', 'طبّق'),
          t('Quiz', 'Quiz', 'اختبار'),
          t('Bilan', 'Summary', 'خلاصة'),
        ].map((title, i) => (
          <Button
            key={i}
            quiet
            selected={stage === i}
            title={title}
            onPress={() => update((p) => ({ ...p, stages: { ...p.stages, [id]: i } }))}
          />
        ))}
      </Row>
      <Row>
        <Button quiet title={t('Mon parcours intelligent', 'My learning journey', 'مساري التعليمي')} onPress={() => router.push({ pathname: '/learning-journey', params: { id: plan.id } })} />
        <Button
          quiet
          selected={state.bookmarks.includes(id)}
          title={t('Enregistrer', 'Bookmark', 'احفظ')}
          icon="bookmark-outline"
          onPress={() => update((p) => ({ ...p, bookmarks: toggle(p.bookmarks, id) }))}
        />
        <Button
          quiet
          title={t('Aide du professeur', 'Ask the teacher', 'اسأل المعلّم')}
          onPress={() =>
            router.push({
              pathname: '/tutor',
              params: {
                plan: planId,
                step: String(index),
              },
            })
          }
        />
      </Row>
      {stage === 0 && (
        <>
          <Card>
            <Label bold>{lesson.objective}</Label>
            <Label selectable>{lesson.explanation}</Label>
          </Card>
          <Card>
            <Label bold>{t('Exemple expliqué', 'Worked example', 'مثال مشروح')}</Label>
            <Label selectable>{lesson.example}</Label>
            <Label bold>{t('Erreur à éviter', 'Common mistake', 'خطأ شائع')}</Label>
            <Label>{lesson.mistake}</Label>
          </Card>
        </>
      )}
      {stage === 1 && (
        <Card>
          <Label bold>{lesson.exercise}</Label>
          <Field
            multiline
            value={state.drafts[id] || ''}
            onChangeText={(draft) =>
              update((p) => ({ ...p, drafts: { ...p.drafts, [id]: draft } }))
            }
            placeholder={t('Votre réponse', 'Your attempt', 'محاولتك')}
          />
          <Button
            quiet
            title={t('Afficher la solution expliquée', 'Show worked solution', 'اعرض الحل المشروح')}
            onPress={() => setSolution(!solution)}
          />
          {solution && <Label selectable>{lesson.solution}</Label>}
        </Card>
      )}
      {stage === 2 &&
        lesson.quiz.map((q, i) => {
          const answer = state.answers[id + '::q' + i];
          return (
            <Card key={i}>
              <Label bold>{q.prompt}</Label>
              {q.options.map((option, choice) => (
                <Button
                  key={choice}
                  quiet
                  selected={revealed.includes(i) && answer?.choice === choice}
                  title={option}
                  onPress={() => {
                    update((p) => recordAnswer(p, id, 'q' + i, choice, choice === q.correctIndex));
                    setRevealed((r) => [...new Set([...r, i])]);
                  }}
                />
              ))}
              {revealed.includes(i) && answer && (
                <Label accessibilityLiveRegion="polite">
                  {answer.correct
                    ? t('Correct. ', 'Correct. ', 'صحيح. ')
                    : t('À revoir. ', 'Try again. ', 'حاول مجددًا. ')}
                  {q.explanation}
                </Label>
              )}
            </Card>
          );
        })}
      {stage === 3 && (
        <Card>
          <Label>{lesson.summary}</Label>
          <Label muted>
            {t(
              'Terminez votre exercice et réussissez le quiz. La fin de lecture n’est pas une preuve de maîtrise.',
              'Write your exercise attempt and pass the quiz. Finishing a reading is not evidence of mastery.',
              'اكتب محاولتك وأجب عن الاختبار. إنهاء القراءة لا يعني الإتقان.',
            )}
          </Label>
          <Button
            disabled={!canCompletePlanLesson(state, id, lesson) || state.completed.includes(id)}
            title={
              state.completed.includes(id)
                ? t('Leçon terminée', 'Lesson completed', 'الدرس مكتمل')
                : t('Terminer la leçon', 'Complete lesson', 'أكمل الدرس')
            }
            onPress={() =>
              update((p) =>
                canCompletePlanLesson(p, id, lesson)
                  ? { ...p, completed: [...new Set([...p.completed, id])] }
                  : p,
              )
            }
          />
          <Button
            quiet
            title={
              index + 1 < plan.lessons.length
                ? t('Leçon suivante', 'Next lesson', 'الدرس التالي')
                : t('Ouvrir le projet', 'Open project', 'افتح المشروع')
            }
            onPress={() =>
              index + 1 < plan.lessons.length
                ? router.replace({
                    pathname: '/plan-lesson',
                    params: { plan: plan.id, step: String(index + 1) },
                  })
                : router.push({ pathname: '/study-plan', params: { id: plan.id } })
            }
          />
        </Card>
      )}
      {stage < 3 && (
        <Button
          title={t('Continuer', 'Continue', 'متابعة')}
          onPress={() => update((p) => ({ ...p, stages: { ...p.stages, [id]: stage + 1 } }))}
        />
      )}
      <Card>
        <Label bold>{t('Mes notes', 'My notes', 'ملاحظاتي')}</Label>
        <Field
          multiline
          value={state.notes[id] || ''}
          onChangeText={(note) => update((p) => ({ ...p, notes: { ...p.notes, [id]: note } }))}
          placeholder={t('Une idée à retenir…', 'Something to remember…', 'فكرة تريد تذكّرها…')}
        />
        <Button quiet title={t('Créer une carte mémoire', 'Create a memory card', 'إنشاء بطاقة ذاكرة')} onPress={() => router.push({ pathname: '/memory-studio', params: { source: id } })} />
        <Row>
          {(['helpful', 'difficult'] as const).map((v) => (
            <Button
              key={v}
              quiet
              selected={state.academy.feedback[id] === v}
              title={
                v === 'helpful' ? t('Utile', 'Helpful', 'مفيد') : t('Difficile', 'Difficult', 'صعب')
              }
              onPress={() =>
                update((p) => ({
                  ...p,
                  academy: { ...p.academy, feedback: { ...p.academy.feedback, [id]: v } },
                }))
              }
            />
          ))}
        </Row>
      </Card>
    </Page>
  );
}
