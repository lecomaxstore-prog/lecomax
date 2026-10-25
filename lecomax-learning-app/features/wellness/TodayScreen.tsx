import { TimelyAdvice } from './TimelyAdvice';
import { DailyActionPlan } from './DailyActionPlan';
import { RoutineProgramme } from './RoutineProgramme';
import { DailyCompass } from './DailyCompass';
import { routineSections, routineProgress, suggestedSection, type RoutineSection } from './routine';
import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, Label, Row } from '../../components/UI';
import { useSchool } from '../../store/School';
import { brains, lessons, meals, mindfulness, movement, sleepTips, tasks } from './data';
import { dateKey, dayNumber, mealOptions, percentage, stats } from './engine';
import { Celebration, JourneyPage, Section, TaskCard, useCopy } from './components';
import { useJourney } from './useJourney';
import { CheckIn } from './CheckIn';
import { GuidedLesson } from './GuidedLesson';
import { DailyMoment } from './DailyMoment';
import { ReminderSummary } from './ReminderSummary';
import { JourneyHero } from './JourneyHero';
export default function TodayScreen() {
  const j = useJourney(),
    { t } = useSchool(),
    copy = useCopy();
  const [selection, setSelection] = useState<{ date: string; section: RoutineSection }>();
  const [brainView, setBrainView] = useState({ date: j.today, hide: false, answer: false });
  const hide = brainView.date === j.today && brainView.hide;
  const answer = brainView.date === j.today && brainView.answer;
  const day = j.state?.days[j.today];
  const hour = j.now.getHours();
  const greeting =
    hour < 12
      ? t('Bonjour', 'Good morning', 'صباح الخير')
      : hour < 18
        ? t('Bon après-midi', 'Good afternoon', 'مساء الخير')
        : t('Bonsoir', 'Good evening', 'مساء الخير');
  if (!j.state || !day)
    return (
      <JourneyPage title={t('Ma routine du jour', 'My daily routine', 'روتيني اليومي')}>
        <Label>
          {t('Préparation de votre journée…', 'Preparing your day…', 'جار تجهيز يومك…')}
        </Label>
      </JourneyPage>
    );
  const plan = day.plan,
    brain = brains.find((b) => b.id === plan.brain)!,
    lesson = lessons.find((l) => l.id === plan.lesson)!,
    progress = percentage(day),
    s = stats(j.state, j.today);
  const recommended = suggestedSection(day, hour + j.now.getMinutes() / 60, j.state.preferences);
  const active = selection?.date === j.today ? selection.section : recommended || 'evening';
  const labels = {
    morning: t('Bien commencer', 'Start gently', 'بداية هادئة'),
    body: t('Bouger', 'Move', 'حركة'),
    food: t('Bien manger', 'Eat well', 'غذاء متوازن'),
    mind: t('Esprit & apprentissage', 'Mind & learning', 'العقل والتعلّم'),
    evening: t('Ralentir', 'Wind down', 'راحة المساء'),
  };
  const nextStep = recommended && recommended !== active ? recommended : undefined;
  const checklist = (section: string) =>
    tasks
      .filter((task) => task.section === section)
      .map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          done={!!day.tasks[task.id]}
          onToggle={() =>
            j.update((state) => {
              const key = dateKey();
              const d = state.days[key]!;
              return {
                ...state,
                days: {
                  ...state.days,
                  [key]: { ...d, tasks: { ...d.tasks, [task.id]: !d.tasks[task.id] } },
                },
              };
            })
          }
        />
      ));
  return (
    <JourneyPage title={t('Ma routine du jour', 'My daily routine', 'روتيني اليومي')}>
      <JourneyHero
        date={j.today}
        greeting={greeting}
        day={Math.max(1, dayNumber(j.today) - dayNumber(j.state.startDate) + 1)}
        streak={s.current}
        progress={progress}
        done={tasks.filter((task) => day.tasks[task.id]).length}
        total={tasks.length}
      />
      <RoutineProgramme />
      <TimelyAdvice />
      <DailyActionPlan />
      <DailyCompass key={`compass:${j.today}`} />
      <Card style={{ gap: 16 }}>
        <Label bold size={23}>
          {t('Mon équilibre quotidien', 'My daily foundations', 'أساسيات يومي المتوازن')}
        </Label>
        <Label muted size={14}>
          {t(
            'Du réveil au coucher : prenez soin de votre corps, apprenez et gardez du temps pour récupérer.',
            'From waking up to winding down: care for your body, learn something and make room to recover.',
            'من الاستيقاظ إلى النوم: اهتم بجسمك، تعلّم شيئاً واترك وقتاً لاستعادة نشاطك.',
          )}
        </Label>
        <Label bold size={14}>
          {recommended
            ? t('Suggestion pour maintenant : ', 'Suggested now: ', 'المقترح الآن: ') +
              labels[recommended]
            : t(
                'Votre routine est terminée. Bravo pour vos petits pas.',
                'Your routine is complete. Enjoy the rest of your day.',
                'أكملت روتينك. استمتع ببقية يومك.',
              )}
        </Label>
        <Row style={{ alignItems: 'stretch', gap: 8 }}>
          {routineSections.map((section, i) => {
            const p = routineProgress(day, section);
            return (
              <Button
                key={section}
                quiet
                selected={active === section}
                style={{ flexGrow: 1, flexBasis: '45%' }}
                title={
                  (p.done === p.total ? '✓' : i + 1) +
                  ' · ' +
                  labels[section] +
                  ' (' +
                  p.done +
                  '/' +
                  p.total +
                  ')'
                }
                onPress={() => setSelection({ date: j.today, section })}
              />
            );
          })}
        </Row>
        <Label muted size={12}>
          {t(
            'Les étapes sont facultatives. Une matinée manquée ne bloque pas la suite.',
            'Every step is optional. A missed morning never blocks the rest of your day.',
            'كل خطوة اختيارية. عدم إنجاز الصباح لا يمنعك من متابعة يومك.',
          )}
        </Label>
      </Card>
      {!j.state.preferences.onboarded && (
        <Button
          quiet
          icon="options-outline"
          title={t('Personnaliser mon parcours', 'Personalize my journey', 'خصص رحلتي')}
          onPress={() => router.push('/wellness/preferences')}
        />
      )}
      <Celebration />

      <Section
        active={active === 'morning'}
        icon="sunny-outline"
        tone="amber"
        title={t('Matin', 'Morning', 'الصباح')}
        subtitle={plan.wakeTime}
        initial
      >
        <Label>{copy(mindfulness[plan.mindfulness]!)}</Label>
        <Label muted>
          {t(
            'Faites quelques mouvements doux des épaules et des chevilles, sans forcer. Intention : aujourd’hui, je fais un petit pas pour moi.',
            'Gently move your shoulders and ankles without forcing. Intention: today, I will take one small step for myself.',
            'حرّك كتفيك وكاحليك بلطف دون إجبار. نية اليوم: سأخطو خطوة صغيرة من أجل نفسي.',
          )}
        </Label>
        <Label>{copy(meals[0]!.find((m) => m.id === plan.meals[0])!.title)}</Label>
        {checklist('morning')}
      </Section>
      <Section
        active={active === 'body'}
        icon="walk-outline"
        title={t('Corps & mouvement', 'Body & movement', 'الجسم والحركة')}
      >
        <Label bold>
          {plan.minutes} {t('minutes, à votre rythme', 'minutes, at your pace', 'دقائق حسب قدرتك')}
        </Label>
        <Label>{copy(movement[plan.movement]!)}</Label>
        <Label muted>
          {t(
            'Option : quelques levers de chaise avec appui, si confortables. Faites des pauses, gardez de l’eau à portée de main et arrêtez en cas de douleur ou de malaise.',
            'Optional: a few supported chair stands, if comfortable. Take breaks, keep water nearby and stop if you feel pain or unwell.',
            'اختياري: قم من كرسي مع الاستناد بضع مرات إن كان مريحاً. خذ استراحات وأبق الماء قريباً وتوقف عند الألم أو الشعور بالتوعك.',
          )}
        </Label>
        {checklist('body')}
      </Section>
      <Section
        active={active === 'mind'}
        icon="bulb-outline"
        tone="violet"
        title={t('Esprit & mémoire', 'Mind & memory', 'العقل والذاكرة')}
      >
        <Label bold>{copy(brain.title)}</Label>
        {!hide && <Label>{copy(brain.instruction)}</Label>}
        <Button
          quiet
          title={
            hide
              ? t('Afficher le défi', 'Show challenge', 'إظهار التحدي')
              : t('Masquer pour se rappeler', 'Hide to recall', 'إخفاء للتذكر')
          }
          onPress={() => setBrainView({ date: j.today, hide: !hide, answer })}
        />
        {!!brain.answer && (
          <>
            <Button
              quiet
              title={t('Vérifier la réponse', 'Check the answer', 'تحقق من الإجابة')}
              onPress={() => setBrainView({ date: j.today, hide, answer: !answer })}
            />
            {answer && <Label>{copy(brain.answer)}</Label>}
          </>
        )}
        <TaskCard
          task={tasks.find((v) => v.id === 'brain')!}
          done={!!day.tasks.brain}
          onToggle={() =>
            j.update((state) => ({
              ...state,
              days: {
                ...state.days,
                [j.today]: {
                  ...state.days[j.today]!,
                  tasks: {
                    ...state.days[j.today]!.tasks,
                    brain: !state.days[j.today]!.tasks.brain,
                  },
                },
              },
            }))
          }
        />
      </Section>
      <Section
        active={active === 'mind'}
        icon="book-outline"
        tone="violet"
        title={t('Apprendre aujourd’hui', 'Learn something today', 'تعلم شيئاً اليوم')}
      >
        <Label muted>
          {t(
            'Lecture & pratique · 2–5 min',
            'Read & practice · 2–5 min',
            'قراءة وتطبيق · ٢–٥ دقائق',
          )}
        </Label>
        <GuidedLesson key={`${j.today}:${lesson.id}`} lesson={lesson} />
        <TaskCard
          task={tasks.find((v) => v.id === 'learn')!}
          done={!!day.tasks.learn}
          onToggle={() =>
            j.update((state) => ({
              ...state,
              days: {
                ...state.days,
                [j.today]: {
                  ...state.days[j.today]!,
                  tasks: {
                    ...state.days[j.today]!.tasks,
                    learn: !state.days[j.today]!.tasks.learn,
                  },
                },
              },
            }))
          }
        />
      </Section>
      <Section
        active={active === 'food'}
        icon="restaurant-outline"
        title={t('À table', 'Food for today', 'غذاؤك اليوم')}
      >
        <Label muted>
          {t(
            'Adaptez les ingrédients à vos allergies et besoins. Aucune restriction extrême.',
            'Adapt ingredients to your allergies and needs. No extreme restrictions.',
            'عدّل المكونات حسب حساسيتك واحتياجاتك، دون حرمان قاسٍ.',
          )}
        </Label>
        {plan.meals.map((id, slot) => (
          <View key={slot} style={{ gap: 8, paddingVertical: 10 }}>
            <Label bold>
              {
                [
                  t('Petit déjeuner', 'Breakfast', 'الإفطار'),
                  t('Déjeuner', 'Lunch', 'الغداء'),
                  t('Collation', 'Snack', 'وجبة خفيفة'),
                  t('Dîner', 'Dinner', 'العشاء'),
                ][slot]
              }
            </Label>
            <Label>{copy(meals[slot]!.find((m) => m.id === id)!.title)}</Label>
            <Button
              quiet
              title={t('Autre suggestion', 'Try an alternative', 'اقتراح بديل')}
              onPress={() =>
                void j
                  .update((state) => {
                    const d = state.days[j.today]!,
                      options = mealOptions(slot, state.preferences),
                      next =
                        options[
                          (options.findIndex((m) => m.id === d.plan.meals[slot]) + 1) %
                            options.length
                        ]!;
                    return {
                      ...state,
                      days: {
                        ...state.days,
                        [j.today]: {
                          ...d,
                          plan: {
                            ...d.plan,
                            meals: d.plan.meals.map((m, i) => (i === slot ? next.id : m)),
                          },
                        },
                      },
                    };
                  })
                  .catch(() => {})
              }
            />
          </View>
        ))}
        {checklist('food')}
      </Section>
      <Section
        active={active === 'evening'}
        icon="moon-outline"
        tone="violet"
        title={t('Soir', 'Evening', 'المساء')}
        subtitle={plan.sleepTime}
      >
        <Label>{copy(sleepTips[plan.sleepTip]!)}</Label>
        <Label>
          {t(
            'Une courte marche ou quelques étirements doux. Éloignez les écrans, préparez une chose pour demain et demandez-vous : quel petit moment ai-je apprécié aujourd’hui ? Notez-le dans votre bilan.',
            'Try a short walk or gentle stretch. Put screens aside, prepare one thing for tomorrow, and ask: what small moment did I appreciate today? Add it to your check-in.',
            'جرّب مشياً قصيراً أو تمدداً لطيفاً. أبعد الشاشات وجهز شيئاً للغد واسأل: ما اللحظة الصغيرة التي قدّرتها اليوم؟ سجلها في حالتك اليومية.',
          )}
        </Label>
        {checklist('evening')}
      </Section>
      {nextStep && (
        <Button
          icon="arrow-forward-circle-outline"
          title={t('Étape suivante : ', 'Next step: ', 'الخطوة التالية: ') + labels[nextStep]}
          onPress={() => setSelection({ date: j.today, section: nextStep })}
        />
      )}
      <Section
        icon="happy-outline"
        tone="amber"
        subtitle={t(
          'Un instant pour vous écouter',
          'A moment to check in with yourself',
          'لحظة للاستماع إلى نفسك',
        )}
        title={t('Mon bilan du jour', 'My daily check-in', 'حالتي اليوم')}
      >
        <CheckIn key={j.today} />
      </Section>
      <ReminderSummary />
      <DailyMoment key={j.today} />
      <Button
        quiet
        icon="notifications-outline"
        title={t('Mes rappels', 'My reminders', 'تذكيراتي')}
        onPress={() => router.push('/wellness/notifications')}
      />
      <Label muted size={12}>
        {t(
          'Informations générales de bien-être, sans diagnostic ni traitement. Pour des symptômes sérieux ou persistants, consultez un professionnel de santé.',
          'General wellness information, not diagnosis or treatment. For serious or persistent symptoms, seek professional medical advice.',
          'معلومات للعافية العامة وليست تشخيصاً أو علاجاً. للأعراض الخطيرة أو المستمرة استشر مختصاً صحياً.',
        )}
      </Label>
    </JourneyPage>
  );
}
