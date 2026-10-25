import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Button, Card, Label, ProgressBar, Row } from '../../components/UI';
import { useSchool } from '../../store/School';
import { useCopy } from './components';
import { lessonGuides } from './lesson-guides';
import type { LearningLesson } from './types';

/** Reading state is intentionally separate from the user's durable daily completion. */
export function GuidedLesson({ lesson }: { lesson: LearningLesson }) {
  const { t, colors, rtl } = useSchool();
  const copy = useCopy();
  const guide = lessonGuides[lesson.category];
  const [step, setStep] = useState(0);
  const [simple, setSimple] = useState(false);
  const [detail, setDetail] = useState(false);
  const [choice, setChoice] = useState<number | null>(null);
  const [done, setDone] = useState<number[]>([]);
  const titles = [
    t('Comprendre', 'Understand', 'افهم'),
    t('Voir un exemple', 'See an example', 'شاهد مثالاً'),
    t('Essayer', 'Try it', 'جرّب'),
    t('Vérifier', 'Check yourself', 'اختبر فهمك'),
  ];
  return (
    <View style={{ gap: 16 }}>
      <Label muted size={12}>
        {t(
          '4 petites étapes · à votre rythme',
          '4 small steps · at your pace',
          '٤ خطوات صغيرة · حسب إيقاعك',
        )}
      </Label>
      <Label bold size={23}>
        {copy(lesson.title)}
      </Label>
      <Label>{copy(guide.outcome)}</Label>
      <Row>
        {titles.map((title, index) => (
          <Button
            key={title}
            quiet
            selected={index === step}
            title={`${index + 1}. ${title}`}
            onPress={() => setStep(index)}
          />
        ))}
      </Row>
      <ProgressBar value={(step + 1) / titles.length} />
      <Label bold accessibilityRole="header" accessibilityLiveRegion="polite">
        {t(`Étape ${step + 1} sur 4`, `Step ${step + 1} of 4`, `الخطوة ${step + 1} من ٤`)} · {titles[step]}
      </Label>

      {step === 0 && (
        <>
          <Label size={18}>{copy(guide.simple)}</Label>
          <Button
            quiet
            title={
              simple
                ? t('Masquer le résumé', 'Hide the summary', 'إخفاء الخلاصة')
                : t('Encore plus simple', 'Make it even simpler', 'اشرحها ببساطة أكثر')
            }
            onPress={() => setSimple((v) => !v)}
          />
          {simple && (
            <Card style={{ backgroundColor: colors.soft, padding: 16 }}>
              <Label bold>{copy(guide.takeaway)}</Label>
            </Card>
          )}
          <Button
            quiet
            title={
              detail
                ? t('Réduire les détails', 'Hide extra detail', 'إخفاء التفاصيل')
                : t('En savoir un peu plus', 'A little more detail', 'تفاصيل إضافية')
            }
            onPress={() => setDetail((v) => !v)}
          />
          {detail && <Label>{copy(lesson.body)}</Label>}
        </>
      )}

      {step === 1 && (
        <>
          <Card style={{ backgroundColor: colors.soft, padding: 18 }}>
            <Label bold>{t('Dans la vraie vie', 'In everyday life', 'في الحياة اليومية')}</Label>
            <Label size={18}>{copy(guide.example)}</Label>
          </Card>
          <Label bold>{t('Le piège à éviter', 'A common mistake', 'خطأ شائع تجنبه')}</Label>
          <Label>{copy(guide.pitfall)}</Label>
        </>
      )}

      {step === 2 && (
        <>
          <Label muted>
            {t(
              'Faites un geste à la fois. Cochez pour vous repérer pendant cette lecture.',
              'Try one action at a time. Tick each step to keep your place during this reading.',
              'جرّب فعلاً واحداً كل مرة. حدد الخطوات لتتابع تقدمك أثناء هذه القراءة.',
            )}
          </Label>
          {guide.steps.map((action, index) => (
            <Pressable
              key={index}
              accessibilityRole="checkbox"
              accessibilityLabel={`${index + 1}. ${copy(action)}`}
              accessibilityState={{ checked: done.includes(index) }}
              aria-checked={done.includes(index)}
              onPress={() =>
                setDone((values) =>
                  values.includes(index) ? values.filter((v) => v !== index) : [...values, index],
                )
              }
              style={{
                padding: 16,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: done.includes(index) ? colors.accent : colors.line,
                backgroundColor: done.includes(index) ? colors.soft : colors.card,
                flexDirection: rtl ? 'row-reverse' : 'row',
                gap: 12,
                alignItems: 'center',
                minHeight: 56,
              }}
            >
              <Label bold style={{ color: colors.accent }}>
                {done.includes(index) ? '✓' : `${index + 1}`}
              </Label>
              <Label style={{ flex: 1 }}>{copy(action)}</Label>
            </Pressable>
          ))}
          <Label muted size={13}>
            {t(
              'Ces étapes ne modifient pas le score de votre journée.',
              'These practice steps do not change your daily score.',
              'خطوات التدريب هذه لا تغيّر نسبة إنجاز يومك.',
            )}
          </Label>
        </>
      )}

      {step === 3 && (
        <>
          <Label muted>
            {t(
              'Sans regarder l’explication, choisissez une réponse. Vous pouvez réessayer.',
              'Without looking back, choose an answer. You can try again.',
              'دون الرجوع للشرح، اختر إجابة. يمكنك المحاولة مجدداً.',
            )}
          </Label>
          <Label bold size={18}>
            {copy(guide.question)}
          </Label>
          {guide.choices.map((option, index) => (
            <Pressable
              key={index}
              accessibilityRole="radio"
              accessibilityLabel={copy(option.text)}
              accessibilityState={{ checked: choice === index }}
              aria-checked={choice === index}
              onPress={() => setChoice(index)}
              style={{
                padding: 16,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: choice === index ? colors.accent : colors.line,
                backgroundColor: choice === index ? colors.soft : colors.card,
                minHeight: 56,
              }}
            >
              <Label>
                {choice === index ? '● ' : '○ '}
                {copy(option.text)}
              </Label>
            </Pressable>
          ))}
          {choice !== null && (
            <Card style={{ backgroundColor: colors.soft, padding: 18 }}>
              <Label bold accessibilityLiveRegion="polite">
                {choice === guide.correct
                  ? t('Vous avez compris l’idée.', 'You have the idea.', 'فهمت الفكرة.')
                  : t('Voyons pourquoi.', 'Let’s look at why.', 'لنرَ السبب.')}
              </Label>
              <Label accessibilityLiveRegion="polite">
                {copy(guide.choices[choice]!.feedback)}
              </Label>
              {choice !== guide.correct && (
                <Button
                  quiet
                  title={t('Revoir l’exemple', 'Review the example', 'راجع المثال')}
                  onPress={() => setStep(1)}
                />
              )}
            </Card>
          )}
          {choice === guide.correct && (
            <>
              <Label bold>{t('À retenir', 'Keep this idea', 'تذكر هذه الفكرة')}</Label>
              <Label>{copy(guide.takeaway)}</Label>
              <Label muted>
                {t(
                  'Expliquez-la avec vos mots, puis imaginez où l’utiliser demain. Vous pouvez ensuite cocher la leçon ci-dessous.',
                  'Explain it in your own words, then name a situation where you could use it tomorrow. You can then mark the lesson complete below.',
                  'اشرحها بكلماتك ثم اذكر موقفاً قد تستخدمها فيه غداً. يمكنك بعدها تحديد الدرس كمكتمل أدناه.',
                )}
              </Label>
            </>
          )}
        </>
      )}

      <Row style={{ justifyContent: 'space-between' }}>
        <Button
          quiet
          disabled={step === 0}
          title={t('Précédent', 'Previous', 'السابق')}
          onPress={() => setStep((v) => Math.max(0, v - 1))}
        />
        {step < 3 ? (
          <Button title={titles[step + 1]!} onPress={() => setStep((v) => v + 1)} />
        ) : (
          <Button
            quiet
            title={t('Relire depuis le début', 'Read again', 'اقرأ من البداية')}
            onPress={() => {
              setStep(0);
              setChoice(null);
            }}
          />
        )}
      </Row>
    </View>
  );
}
