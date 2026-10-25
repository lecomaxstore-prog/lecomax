import React, { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Card, Label, Page, Row } from '../components/UI';
import { useSchool } from '../store/School';
import { planLessonId, type StudyPlan } from '../utils/academy';
import { journeyRecommendation, lessonEvidence, recordDiagnostic } from '../utils/learning-journey';
import { createCard } from '../utils/flashcards';

function Diagnostic({ plan, index }: { plan: StudyPlan; index: number }) {
  const { update, t } = useSchool();
  const [choice, setChoice] = useState<number | null>(null);
  const [confidence, setConfidence] = useState<'unsure' | 'certain' | null>(null);
  const q = plan.design!.diagnostic[index]!;
  return (
    <Card>
      <Label bold>
        {t('Point de départ', 'Starting assessment', 'تقييم البداية')} · {index + 1} /{' '}
        {plan.lessons.length}
      </Label>
      <Label>{q.prompt}</Label>
      {q.options.map((option, i) => (
        <Button key={i} quiet selected={choice === i} title={option} onPress={() => setChoice(i)} />
      ))}
      <Label>{t('Votre confiance', 'How confident are you?', 'ما مدى ثقتك بإجابتك؟')}</Label>
      <Row>
        <Button
          quiet
          selected={confidence === 'unsure'}
          title={t('Pas sûr', 'Unsure', 'غير متأكد')}
          onPress={() => setConfidence('unsure')}
        />
        <Button
          quiet
          selected={confidence === 'certain'}
          title={t('Sûr', 'Confident', 'واثق')}
          onPress={() => setConfidence('certain')}
        />
      </Row>
      <Button
        disabled={choice === null || confidence === null}
        title={t('Enregistrer ma réponse', 'Record my answer', 'سجّل إجابتي')}
        onPress={() => {
          if (choice !== null && confidence)
            update((p) => recordDiagnostic(p, plan.id, index, choice, confidence));
        }}
      />
      <Label muted>
        {t(
          'Ce point de départ ne valide pas une compétence et ne réduit pas la difficulté après une seule erreur.',
          'This baseline does not certify a skill or lower difficulty after one mistake.',
          'هذا التقييم لا يثبت الإتقان ولا يخفض الصعوبة بعد خطأ واحد.',
        )}
      </Label>
    </Card>
  );
}

export default function LearningJourney() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { state, update, ready, error, saveStatus, retry, t } = useSchool();
  const plan = state.academy.plans.find((p) => p.id === id);
  if (!ready)
    return (
      <Page title={t('Chargement', 'Loading', 'جارٍ التحميل')}>
        <Label>
          {error ||
            t('Lecture de votre progression…', 'Loading your progress…', 'جارٍ تحميل تقدمك…')}
        </Label>
        {!!error && <Button title={t('Réessayer', 'Retry save', 'أعد المحاولة')} onPress={retry} />}
      </Page>
    );
  if (!plan)
    return (
      <Page title={t('Parcours introuvable', 'Plan not found', 'المسار غير موجود')}>
        <Button
          title={t('Créer un parcours', 'Create a learning plan', 'أنشئ مسارًا')}
          onPress={() => router.push('/study-plan')}
        />
      </Page>
    );
  const next = journeyRecommendation(state, plan);
  const reasons = {
    baseline: t(
      'Répondez à une question par objectif avant de commencer.',
      'Answer one question per objective before starting.',
      'أجب عن سؤال لكل هدف قبل البدء.',
    ),
    'starting-gap': t(
      'Votre réponse initiale suggère de travailler cette notion. Nous la vérifierons avec un autre exercice.',
      'Your starting answer suggests this topic needs attention. A different exercise will check your understanding.',
      'تشير إجابتك الأولى إلى أن هذا الموضوع يحتاج إلى اهتمام. سنتحقق بتمرين مختلف.',
    ),
    sequence: t(
      'La prochaine leçon non terminée dans la progression enregistrée.',
      'The next unfinished lesson in your saved sequence.',
      'الدرس التالي غير المكتمل في مسارك المحفوظ.',
    ),
    prerequisite: t(
      'Des erreurs répétées justifient de revoir cette base non terminée.',
      'Repeated mistakes suggest revisiting this unfinished prerequisite.',
      'تشير الأخطاء المتكررة إلى ضرورة مراجعة هذا المتطلب غير المكتمل.',
    ),
    'repeated-errors': t(
      'Plusieurs erreurs ont été enregistrées. Demandez une autre explication et une question guidée.',
      'Several mistakes were recorded. Ask for another explanation and a guided question.',
      'تم تسجيل عدة أخطاء. اطلب شرحًا مختلفًا وسؤالًا موجّهًا.',
    ),
    due: t(
      'Une question de ce cours est arrivée à sa date de révision.',
      'A question in this lesson is due for review.',
      'حان موعد مراجعة سؤال في هذا الدرس.',
    ),
    project: t(
      'Les leçons sont terminées. Appliquez-les au projet ; sa qualité reste à évaluer.',
      'The lessons are complete. Apply them in the project; its quality still needs assessment.',
      'اكتملت الدروس. طبّقها في المشروع؛ جودة المشروع لا تزال بحاجة إلى تقييم.',
    ),
  };
  const openLesson = (i: number, review = false) => {
    if (review) update((p) => ({ ...p, stages: { ...p.stages, [planLessonId(plan, i)]: 2 } }));
    router.push({ pathname: '/plan-lesson', params: { plan: plan.id, step: String(i) } });
  };
  return (
    <Page title={plan.title} subtitle={plan.goal}>
      {saveStatus === 'error' ? (
        <Card>
          <Label accessibilityRole="alert">
            {t(
              'La sauvegarde a échoué. Vos modifications ne sont pas encore durables.',
              'Saving failed. Your changes are not yet safely stored.',
              'فشل الحفظ. لم تُحفظ تغييراتك بشكل دائم بعد.',
            )}
          </Label>
          <Button title={t('Réessayer', 'Retry save', 'أعد محاولة الحفظ')} onPress={retry} />
        </Card>
      ) : (
        <Label muted accessibilityLiveRegion="polite">
          {saveStatus === 'saved'
            ? t('Enregistré sur cet appareil', 'Saved on this device', 'محفوظ على هذا الجهاز')
            : t('Enregistrement…', 'Saving…', 'جارٍ الحفظ…')}
        </Label>
      )}
      <Card>
        <Label bold>{t('Pourquoi cette étape ?', 'Why this step?', 'لماذا هذه الخطوة؟')}</Label>
        <Label>{reasons[next.reason]}</Label>
        <Label muted>{plan.verification}</Label>
        {next.state !== 'ASSESS' && (
          <Button
            title={
              next.state === 'ADVANCE'
                ? t('Ouvrir le projet', 'Open project', 'افتح المشروع')
                : next.state === 'GUIDED_PRACTICE'
                  ? t('Pratique guidée', 'Guided practice', 'تدريب موجّه')
                  : next.state === 'REVIEW'
                    ? t('Réviser maintenant', 'Review now', 'راجع الآن')
                    : t('Continuer à apprendre', 'Continue learning', 'تابع التعلم')
            }
            onPress={() => {
              if (next.state === 'ADVANCE')
                router.push({ pathname: '/study-plan', params: { id: plan.id } });
              else if (next.state === 'GUIDED_PRACTICE')
                router.push({
                  pathname: '/tutor',
                  params: { plan: plan.id, step: String(next.index) },
                });
              else openLesson(next.index, next.state === 'REVIEW');
            }}
          />
        )}
      </Card>
      {next.state === 'ASSESS' && (
        <Diagnostic key={`${plan.id}:${next.index}`} plan={plan} index={next.index} />
      )}
      <Label bold>{t('Votre carte de progression', 'Your learning map', 'خريطة تعلمك')}</Label>
      <Label muted>
        {t(
          'Liens proposés par l’IA, à vérifier. Les réponses à choix évaluent la reconnaissance, pas le rappel libre. Vous pouvez explorer dans un autre ordre.',
          'AI-proposed connections need verification. Multiple-choice answers measure recognition, not free recall. You can explore in another order.',
          'روابط يقترحها الذكاء الاصطناعي وتحتاج إلى تحقق. أسئلة الاختيار تقيس التعرّف لا الاستدعاء الحر. يمكنك الاستكشاف بترتيب آخر.',
        )}
      </Label>
      {plan.lessons.map((lesson, i) => {
        const evidence = lessonEvidence(state, plan, i);
        const cardId = `journey-${plan.id}-${i}`;
        const hasCard = state.flashcards.cards.some((c) => c.id === cardId);
        const baseline = evidence.baseline;
        const prerequisites = plan.design?.prerequisites[i] || [];
        const diagnostic = plan.design?.diagnostic[i];
        return (
          <Card key={i}>
            <Label bold>
              {i + 1}. {lesson.title}
            </Label>
            <Label>{lesson.objective}</Label>
            {!!prerequisites.length && (
              <Label muted>
                {t('Bases', 'Prerequisites', 'المتطلبات')}:{' '}
                {prerequisites.map((n) => plan.lessons[n]?.title).join(' · ')}
              </Label>
            )}
            <Label>
              {evidence.completed
                ? t(
                    'Leçon terminée · maîtrise non certifiée',
                    'Lesson complete · mastery not certified',
                    'الدرس مكتمل · الإتقان غير معتمد',
                  )
                : t('Leçon à travailler', 'Lesson to work on', 'درس للتعلم')}
            </Label>
            <Label>
              {t(
                'Réponses correctes / tentatives',
                'Correct answers / attempts',
                'الإجابات الصحيحة / المحاولات',
              )}
              : {evidence.correct} / {evidence.attempts}
            </Label>
            {baseline && diagnostic && (
              <>
                <Label>
                  {t('Point de départ', 'Starting assessment', 'تقييم البداية')}:{' '}
                  {baseline.choice === diagnostic.correctIndex
                    ? t('Correct', 'Correct', 'صحيح')
                    : t('À revoir', 'Needs review', 'يحتاج إلى مراجعة')}{' '}
                  ·{' '}
                  {baseline.confidence === 'certain'
                    ? t('Confiant', 'Confident', 'واثق')
                    : t('Incertain', 'Unsure', 'غير متأكد')}
                </Label>
                <Label>{diagnostic.explanation}</Label>
              </>
            )}
            <Button
              quiet
              title={t('Ouvrir cette leçon', 'Open this lesson', 'افتح هذا الدرس')}
              onPress={() => openLesson(i)}
            />
            <Button
              quiet
              disabled={hasCard || state.flashcards.cards.length >= 5000}
              title={
                hasCard
                  ? t('Carte créée', 'Recall card created', 'تم إنشاء بطاقة')
                  : t('Créer une carte de rappel', 'Create recall card', 'أنشئ بطاقة استدعاء')
              }
              onPress={() =>
                update((p) =>
                  p.flashcards.cards.some((c) => c.id === cardId) ||
                  p.flashcards.cards.length >= 5000
                    ? p
                    : {
                        ...p,
                        flashcards: {
                          ...p.flashcards,
                          cards: [
                            ...p.flashcards.cards,
                            createCard(
                              cardId,
                              lesson.exercise,
                              lesson.solution,
                              planLessonId(plan, i),
                            ),
                          ],
                        },
                      },
                )
              }
            />
          </Card>
        );
      })}
      <Button
        title={t('Ouvrir Memory Studio', 'Open Memory Studio', 'افتح استوديو الذاكرة')}
        onPress={() => router.push('/memory-studio')}
      />
      <Label muted>
        {t(
          'Les cartes utilisent le calendrier SM-2 et une auto-évaluation. Vous pouvez les modifier ou les supprimer dans Memory Studio.',
          'Cards use SM-2 scheduling and self-ratings. Edit or delete them in Memory Studio.',
          'تستخدم البطاقات جدولة SM-2 والتقييم الذاتي. يمكنك تعديلها أو حذفها في استوديو الذاكرة.',
        )}
      </Label>
    </Page>
  );
}
