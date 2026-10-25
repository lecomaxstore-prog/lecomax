import React, { useEffect, useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Card, Field, Label, ListItem, Page, ProgressBar, Row } from '../components/UI';
import { useSchool } from '../store/School';
import { generateStudyPlan } from '../services/study-plan';
import { planLessonId, type LearnerProfile } from '../utils/academy';

export default function StudyPlanScreen() {
  const params = useLocalSearchParams<{ id?: string; goal?: string }>();
  const { state, update, t } = useSchool();
  const [goal, setGoal] = useState(params.goal || state.academy.profile.goal);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [language, setLanguage] = useState<LearnerProfile['teacherLanguage']>(state.academy.profile.teacherLanguage);
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);
  const plan = state.academy.plans.find((p) => p.id === params.id);
  const generate = async () => {
    if (request.current || !goal.trim()) return;
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    setError('');
    try {
      const result = await generateStudyPlan(goal.trim(), { ...state.academy.profile, goal: goal.trim(), teacherLanguage: language }, controller.signal);
      if (controller.signal.aborted) return;
      update((p) => ({ ...p, academy: { ...p.academy, plans: [...p.academy.plans, result] } }));
      router.replace({ pathname: '/learning-journey', params: { id: result.id } });
    } catch (cause) {
      if (!controller.signal.aborted)
        setError(
          cause instanceof Error && cause.message === 'OWNER_LOGIN_REQUIRED'
            ? t('Reconnectez-vous pour créer vos leçons.', 'Sign in again to create your lessons.', 'انتهت جلسة الدخول. سجّل الدخول من جديد لإنشاء دروسك.')
            : cause instanceof Error && cause.message === 'RATE_LIMIT'
              ? t('Trop de demandes. Patientez un instant, puis réessayez.', 'Too many requests. Wait a moment, then try again.', 'أُرسلت طلبات كثيرة خلال وقت قصير. انتظر قليلًا ثم حاول مجددًا.')
              : cause instanceof Error && cause.message === 'NETWORK_OR_TIMEOUT'
                ? t('La connexion a été interrompue ou la création a pris trop de temps. Vérifiez Internet puis réessayez.', 'The connection was interrupted or generation took too long. Check your connection and retry.', 'انقطع الاتصال أو استغرق إعداد الدروس وقتًا طويلًا. تأكّد من اتصالك بالإنترنت ثم حاول مجددًا.')
                : t('Les leçons n’ont pas pu être créées. Votre objectif est conservé : vous pouvez réessayer.', 'We could not finish creating the lessons. Your goal is still here; you can try again.', 'لم نتمكّن من إكمال إعداد الدروس. ما زال هدفك مكتوبًا هنا؛ يمكنك المحاولة مجددًا.'),
        );
    } finally {
      request.current = null;
      setBusy(false);
    }
  };
  if (!plan)
    return (
      <Page title={t('Votre nouveau parcours', 'Your new learning plan', 'مسارك التعليمي الجديد')}>
        {params.id && (
          <Label accessibilityRole="alert">
            {t(
              'Parcours introuvable sur cet appareil.',
              'Plan not found on this device.',
              'لم نعثر على المسار في هذا الجهاز.',
            )}
          </Label>
        )}
        <Card>
          <Label bold>
            {t(
              'Un objectif, trois premières leçons',
              'One goal, three starting lessons',
              'ماذا تريد أن تتعلّم؟',
            )}
          </Label>
          <Field
            value={goal}
            onChangeText={setGoal}
            editable={!busy}
            maxLength={500}
            multiline
            placeholder={t('Ex. : apprendre l’anglais pour les conversations du quotidien', 'Example: learn English for everyday conversations', 'مثال: أريد تعلّم الإنجليزية للمحادثات اليومية')}
          />
          <Label muted>{t('Trois leçons progressives avec exemples, exercices et quiz.', 'Three step-by-step lessons with examples, practice and quizzes.', 'سنجهّز لك ثلاثة دروس متدرّجة، مع أمثلة وتمارين وأسئلة قصيرة لتختبر فهمك.')}</Label>
          <Label bold>{t('Langue des explications', 'Explanation language', 'لغة الشرح')}</Label>
          <Row>
            {(['ar', 'en', 'fr', 'darija'] as const).map((value) => (
              <Button key={value} quiet selected={language === value} disabled={busy}
                title={{ ar: 'العربية', en: 'English', fr: 'Français', darija: 'الدارجة المغربية' }[value]}
                onPress={() => setLanguage(value)} />
            ))}
          </Row>
          <Label muted>{t('Pour apprendre une langue, les exemples restent dans cette langue.', 'When learning a language, examples stay in the language you are studying.', 'إذا كنت تتعلّم الإنجليزية مثلًا، ستكون الأمثلة بالإنجليزية والشرح باللغة التي تختارها هنا.')}</Label>
          <Label muted>
            {t(
              'Connexion Internet et professeur configuré requis. Le contenu généré doit être vérifié ; il ne constitue pas une certification.',
              'Requires internet and a configured AI teacher. Generated material needs verification and is not a certification.',
              'يلزم الاتصال بالإنترنت لإعداد الدروس. يُنشئ الذكاء الاصطناعي المحتوى وقد يخطئ؛ راجع المعلومات المهمة. هذا المسار للتعلّم ولا يمنح شهادة.',
            )}{' '}
          </Label>
          <Button
            quiet
            disabled={busy}
            title={t(
              'Modifier mes préférences',
              'Edit learning preferences',
              'تعديل المستوى وتفضيلات التعلّم',
            )}
            onPress={() => router.push('/onboarding')}
          />
          <Button
            loading={busy}
            disabled={!goal.trim() || state.academy.plans.length >= 30}
            title={busy ? t('Préparation des leçons…', 'Preparing your lessons…', 'جارٍ إعداد دروسك…') : t('Générer les leçons', 'Generate lessons', 'إنشاء دروسي')}
            onPress={generate}
          />
          {busy && (
            <Label accessibilityLiveRegion="polite">{t('Préparation des exemples et des exercices. Cela peut prendre jusqu’à trois minutes.', 'Preparing examples and exercises. This may take up to three minutes.', 'نُعدّ الآن الشرح والأمثلة والتمارين. قد يستغرق ذلك حتى ثلاث دقائق.')}</Label>
          )}
          {busy && (
            <Button
              quiet
              title={t('Annuler', 'Cancel', 'إلغاء')}
              onPress={() => {
                request.current?.abort();
              }}
            />
          )}
          {state.academy.plans.length >= 30 && (
            <Label>
              {t(
                'Limite de 30 parcours enregistrés atteinte.',
                'The limit of 30 saved plans has been reached.',
                'وصلت إلى حد 30 مسارًا محفوظًا.',
              )}
            </Label>
          )}
          {!!error && <Label accessibilityRole="alert">{error}</Label>}
        </Card>
      </Page>
    );
  const done = plan.lessons.filter((_, i) =>
    state.completed.includes(planLessonId(plan, i)),
  ).length;
  return (
    <Page title={plan.title} subtitle={plan.goal}>
      <Button title={t('Mon parcours intelligent', 'My learning journey', 'مساري التعليمي')} onPress={() => router.push({ pathname: '/learning-journey', params: { id: plan.id } })} />
      <Card>
        <Label bold>
          {t(
            'Parcours généré par l’IA · enregistré hors ligne',
            'AI-generated starter course · saved offline',
            'دورة بداية مولّدة بالذكاء الاصطناعي · محفوظة دون اتصال',
          )}
        </Label>
        <Label muted>{plan.verification}</Label>
        <ProgressBar value={done / plan.lessons.length} />
        <Label>
          {done} / {plan.lessons.length} {t('leçons terminées', 'lessons completed', 'دروس مكتملة')}
        </Label>
      </Card>
      {plan.lessons.map((l, i) => (
        <ListItem
          key={i}
          title={`${i + 1}. ${l.title}`}
          subtitle={`${l.minutes} ${t('min', 'min', 'دقيقة')} · ${l.objective}`}
          icon={
            state.completed.includes(planLessonId(plan, i))
              ? 'checkmark-circle-outline'
              : 'book-outline'
          }
          onPress={() =>
            router.push({ pathname: '/plan-lesson', params: { plan: plan.id, step: String(i) } })
          }
        />
      ))}
      <Card>
        <Label bold size={20}>
          {t('Projet de synthèse', 'Apply what you learned', 'طبّق ما تعلّمته')}
        </Label>
        <Label>{plan.project}</Label>
        {plan.criteria.map((c) => (
          <Label key={c}>• {c}</Label>
        ))}
        <Field
          multiline
          value={state.drafts[plan.id + ':project'] || ''}
          onChangeText={(draft) =>
            update((p) => ({ ...p, drafts: { ...p.drafts, [plan.id + ':project']: draft } }))
          }
          placeholder={t(
            'Votre travail et les preuves de réussite',
            'Your work and evidence for each criterion',
            'عملك ودليل تحقيق كل معيار',
          )}
        />
        <Label muted>
          {t(
            'Le professeur peut commenter votre travail. La maîtrise pratique exige une évaluation indépendante.',
            'The teacher can give feedback on your work. Practical mastery requires independent assessment.',
            'يمكن للمعلّم تقديم ملاحظات على عملك. إتقان التطبيق يحتاج إلى تقييم مستقل.',
          )}
        </Label>
        <Row>
          <Button
            title={t('Demander un retour', 'Ask for feedback', 'اطلب ملاحظات')}
            disabled={!state.drafts[plan.id + ':project']?.trim()}
            onPress={() =>
              router.push({
                pathname: '/teacher',
                params: {
                  question: `${plan.project}\nCriteria: ${plan.criteria.join('; ')}\nMy work: ${(state.drafts[plan.id + ':project'] || '').slice(0, 3000)}\nEvaluate against the criteria; distinguish evidence from claims. Give feedback, not certification.`,
                },
              })
            }
          />
        </Row>
      </Card>
    </Page>
  );
}
