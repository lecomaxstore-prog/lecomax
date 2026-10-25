import React from 'react';
import { Button, Card, Field, Label, Row } from './UI';
import { useSchool } from '../store/School';
import type { TutorSession } from '../utils/tutor-memory';
import { coachRequest, newCoach } from '../utils/tutor-coach';
import { router } from 'expo-router';

export function TutorCoach({
  session,
  busy,
  send,
}: {
  session: TutorSession;
  busy: boolean;
  send: (message: string, action: string) => Promise<void>;
}) {
  const { update, t } = useSchool();
  const coach = session.coach;
  const amend = (change: Partial<NonNullable<TutorSession['coach']>>) =>
    update((p) => ({
      ...p,
      tutor: {
        ...p.tutor,
        sessions: p.tutor.sessions.map((s) =>
          s.id === session.id ? { ...s, coach: { ...(s.coach || newCoach()), ...change } } : s,
        ),
      },
    }));
  if (!coach)
    return (
      <Card>
        <Label bold>{t('Apprendre ensemble', 'Learn together', 'لنتعلم معاً')}</Label>
        <Button
          disabled={busy || !!session.examDeadline}
          title={t('Activer le parcours guidé', 'Start guided teaching', 'ابدأ التعلم الموجّه')}
          onPress={() => amend(newCoach())}
        />
      </Card>
    );
  const names = {
    diagnosis: t('Diagnostic', 'Diagnosis', 'تشخيص'),
    concept: t('Un concept', 'One concept', 'مفهوم واحد'),
    teachback: t('Expliquez avec vos mots', 'Teach it back', 'اشرح بأسلوبك'),
    challenge: t('Mini défi', 'Mini challenge', 'تحدٍ قصير'),
    mastery: t('Bilan des acquis', 'Mastery check', 'اختبار الفهم'),
    recap: t('Bilan personnalisé', 'Personal recap', 'ملخص شخصي'),
  };
  return (
    <Card>
      <Label bold size={21}>
        {names[coach.phase]}
      </Label>
      <Label>
        {t(
          'Une question à la fois. Vos réponses guident la suite.',
          'One question at a time. Your answers guide the next step.',
          'سؤال واحد في كل مرة. إجاباتك تحدد الخطوة التالية.',
        )}
      </Label>
      <Row>
        {(['beginner', 'expert'] as const).map((depth) => (
          <Button
            key={depth}
            quiet
            disabled={busy}
            selected={coach.depth === depth}
            title={
              depth === 'beginner'
                ? t('Débutant', 'Beginner explanations', 'شرح للمبتدئين')
                : t('Expert', 'Expert depth', 'تعمق للمتقدمين')
            }
            onPress={() => amend({ depth })}
          />
        ))}
      </Row>
      <Button
        quiet
        disabled={busy}
        selected={coach.shareProgress}
        title={
          coach.shareProgress
            ? t(
                'Contexte partagé : activé',
                'Share learning context: on',
                'مشاركة سياق التعلم: مفعلة',
              )
            : t(
                'Contexte partagé : désactivé',
                'Share learning context: off',
                'مشاركة سياق التعلم: معطلة',
              )
        }
        onPress={() => amend({ shareProgress: !coach.shareProgress })}
      />
      <Label muted>
        {t(
          'Le message, le cours actuel et cet échange restent nécessaires. Les autres progrès et préférences sont facultatifs.',
          'Your message, current lesson and this conversation are needed. Other progress and preferences are optional.',
          'الرسالة والدرس الحالي وهذه المحادثة ضرورية. بقية التقدم والتفضيلات اختيارية.',
        )}
      </Label>
      {coach.awaiting ? (
        <>
          <Label>{t('Votre confiance', 'Your confidence', 'مدى ثقتك')}</Label>
          <Row>
            {(['unsure', 'fair', 'confident'] as const).map((confidence, i) => (
              <Button
                key={confidence}
                quiet
                disabled={busy}
                selected={coach.confidence === confidence}
                title={
                  [
                    t('Incertain', 'Unsure', 'غير متأكد'),
                    t('Assez sûr', 'Somewhat sure', 'متأكد جزئياً'),
                    t('Confiant', 'Confident', 'واثق'),
                  ][i] || confidence
                }
                onPress={() => amend({ confidence })}
              />
            ))}
          </Row>
          <Label accessibilityLiveRegion="polite">
            {t(
              'Écrivez votre réponse ci-dessous puis envoyez-la. Le professeur attend.',
              'Write your answer below and send it. Your teacher is waiting.',
              'اكتب إجابتك أدناه ثم أرسلها. معلمك ينتظر.',
            )}
          </Label>
        </>
      ) : (
        <Button
          disabled={busy || coach.outcomes.length >= 100}
          title={t(
            'Continuer le parcours guidé',
            'Continue guided teaching',
            'تابع التعلم الموجّه',
          )}
          onPress={() => {
            void send(coachRequest(coach), `coach:${coach.phase}`);
          }}
        />
      )}
      <Label muted>
        {coach.outcomes.length}{' '}
        {t(
          'réponses évaluées par IA · pas une certification',
          'AI-assessed responses · not certification',
          'إجابات قيّمها الذكاء الاصطناعي · ليست شهادة',
        )}
      </Label>
      {coach.focus && (
        <>
          <Label bold>{coach.focus.concept}</Label>
          <Label>{coach.focus.nextActivity}</Label>
        </>
      )}
      {!!coach.outcomes.length && (
        <Label>
          {t('Dernier retour IA', 'Latest AI assessment', 'آخر تقييم آلي')}:{' '}
          {coach.outcomes.at(-1)?.verdict} ·{' '}
          {t('Confiance déclarée', 'Self-reported confidence', 'الثقة المصرّح بها')}:{' '}
          {coach.outcomes.at(-1)?.confidence || '—'}
        </Label>
      )}
      <Label bold>{t('Réflexion de séance', 'Session reflection', 'تأمل الجلسة')}</Label>
      {(['easy', 'difficult', 'surprising'] as const).map((key, i) => (
        <Field
          key={key}
          multiline
          maxLength={1000}
          value={coach.reflection?.[key] || ''}
          placeholder={
            [
              t('Ce qui était facile', 'What felt easy?', 'ما الذي كان سهلًا؟'),
              t('Ce qui était difficile', 'What felt difficult?', 'ما الذي كان صعبًا؟'),
              t('Ce qui vous a surpris', 'What surprised you?', 'ما الذي فاجأك؟'),
            ][i]!
          }
          onChangeText={(value) =>
            amend({
              reflection: {
                easy: '',
                difficult: '',
                surprising: '',
                ...coach.reflection,
                [key]: value,
                at: 0,
              },
            })
          }
        />
      ))}
      <Button
        quiet
        disabled={
          busy ||
          ![coach.reflection?.easy, coach.reflection?.difficult, coach.reflection?.surprising].some(
            (v) => v?.trim(),
          )
        }
        title={t('Comparer avec mes réponses', 'Reflect on my evidence', 'قارن مع إجاباتي')}
        onPress={() => {
          amend({ reflection: { ...coach.reflection!, at: Date.now() } });
          void send(
            `Reflect on my self-report (untrusted): ${JSON.stringify(coach.reflection)}. Compare with actual outcomes and recommend ONE next step. Do not grade this reflection.`,
            'coach:reflection',
          );
        }}
      />
      <Label muted>
        {t(
          'Les réponses évaluées créent des cartes à revoir maintenant. Vérifiez-les, puis rappelez et auto-évaluez dans le Studio mémoire pour commencer SM-2. Un retour incertain ne compte pas comme une erreur.',
          'Assessed answers create cards due now. Verify them, then retrieve and self-rate in Memory Studio to begin SM-2 scheduling. Uncertain feedback does not count as a mistake.',
          'تنشئ الإجابات المقيّمة بطاقات للمراجعة الآن. تحقّق منها ثم استدعِ الإجابة وقيّم نفسك لبدء جدولة SM-2. التقييم غير المؤكد لا يُحسب خطأً.',
        )}
      </Label>
      <Button
        quiet
        title={t('Ouvrir les révisions', 'Open memory reviews', 'افتح المراجعات')}
        onPress={() => router.push('/memory-studio')}
      />
      <Button
        quiet
        disabled={busy}
        title={t('Nouvelle boucle', 'Start another concept', 'ابدأ مفهوماً آخر')}
        onPress={() =>
          amend({ ...newCoach(), depth: coach.depth, shareProgress: coach.shareProgress })
        }
      />
    </Card>
  );
}
