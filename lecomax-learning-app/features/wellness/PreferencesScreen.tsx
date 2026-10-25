import React, { useState } from 'react';
import { router } from 'expo-router';
import { Button, Card, Field, Label, Row } from '../../components/UI';
import { useSchool } from '../../store/School';
import { goals, interests } from './data';
import { createPlan, validTime } from './engine';
import { JourneyPage, useCopy } from './components';
import { useJourney } from './useJourney';
import type { Goal, Interest, UserPreferences } from './types';
export default function PreferencesScreen() {
  const { state } = useJourney(),
    { t } = useSchool();
  return (
    <JourneyPage title={t('Mon parcours, mes choix', 'My journey, my choices', 'رحلتي واختياراتي')}>
      {state && <Form initial={state.preferences} />}
    </JourneyPage>
  );
}
function Form({ initial }: { initial: UserPreferences }) {
  const [p, setP] = useState(initial),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(false);
  const { update, today } = useJourney(),
    { t } = useSchool(),
    copy = useCopy();
  return (
    <>
      <Card>
        <Label bold>{t('Mes objectifs', 'My goals', 'أهدافي')}</Label>
        <Row>
          {(Object.keys(goals) as Goal[]).map((id) => (
            <Button
              key={id}
              quiet
              selected={p.goals.includes(id)}
              title={copy(goals[id])}
              onPress={() =>
                setP((v) => ({
                  ...v,
                  goals: v.goals.includes(id) ? v.goals.filter((g) => g !== id) : [...v.goals, id],
                }))
              }
            />
          ))}
        </Row>
      </Card>
      <Card>
        <Label bold>{t('Mon rythme', 'My rhythm', 'إيقاعي اليومي')}</Label>
        <Label>{t('Réveil · HH:MM', 'Wake-up · HH:MM', 'الاستيقاظ · HH:MM')}</Label>
        <Field
          value={p.wakeTime}
          onChangeText={(wakeTime) => setP((v) => ({ ...v, wakeTime }))}
          placeholder="07:30"
        />
        <Label>{t('Coucher · HH:MM', 'Bedtime · HH:MM', 'النوم · HH:MM')}</Label>
        <Field
          value={p.sleepTime}
          onChangeText={(sleepTime) => setP((v) => ({ ...v, sleepTime }))}
          placeholder="22:30"
        />
        <Label>{t('Niveau d’activité', 'Activity level', 'مستوى النشاط')}</Label>
        <Row>
          {(['gentle', 'moderate', 'active'] as const).map((activity, i) => (
            <Button
              key={activity}
              quiet
              selected={p.activity === activity}
              title={
                [
                  t('Doux', 'Gentle', 'خفيف'),
                  t('Modéré', 'Moderate', 'متوسط'),
                  t('Actif', 'Active', 'نشيط'),
                ][i]!
              }
              onPress={() => setP((v) => ({ ...v, activity }))}
            />
          ))}
        </Row>
        <Label>
          {t('Temps disponible · minutes', 'Available time · minutes', 'الوقت المتاح · دقائق')}
        </Label>
        <Row>
          {[5, 10, 15, 20, 30].map((exerciseMinutes) => (
            <Button
              key={exerciseMinutes}
              quiet
              selected={p.exerciseMinutes === exerciseMinutes}
              title={String(exerciseMinutes)}
              onPress={() => setP((v) => ({ ...v, exerciseMinutes }))}
            />
          ))}
        </Row>
      </Card>
      <Card>
        <Label bold>{t('Préférences alimentaires', 'Dietary preferences', 'تفضيلات الغذاء')}</Label>
        <Row>
          {(['balanced', 'vegetarian', 'vegan'] as const).map((diet, i) => (
            <Button
              key={diet}
              quiet
              selected={p.diet === diet}
              title={
                [
                  t('Variée', 'Balanced', 'متوازن'),
                  t('Végétarienne', 'Vegetarian', 'نباتي مع البيض والألبان'),
                  t('Végétalienne', 'Vegan', 'نباتي بالكامل'),
                ][i]!
              }
              onPress={() => setP((v) => ({ ...v, diet }))}
            />
          ))}
        </Row>
      </Card>
      <Card>
        <Label bold>{t('Ce que j’aime apprendre', 'Learning interests', 'اهتمامات التعلم')}</Label>
        <Label muted>
          {t(
            'Aucun choix : tous les thèmes. Les thèmes préférés alternent avec des découvertes.',
            'No selection: all topics. Preferred topics alternate with discoveries.',
            'دون اختيار: كل المواضيع. تتناوب اهتماماتك مع اكتشافات جديدة.',
          )}
        </Label>
        <Row>
          {(Object.keys(interests) as Interest[]).map((id) => (
            <Button
              key={id}
              quiet
              selected={p.interests.includes(id)}
              title={copy(interests[id])}
              onPress={() =>
                setP((v) => ({
                  ...v,
                  interests: v.interests.includes(id)
                    ? v.interests.filter((g) => g !== id)
                    : [...v.interests, id],
                }))
              }
            />
          ))}
        </Row>
      </Card>
      <Label muted>
        {t(
          'Les changements s’appliquent aujourd’hui, sans effacer vos cases cochées ni votre historique.',
          'Changes apply today, preserving checked habits and history.',
          'تطبق التغييرات اليوم مع الاحتفاظ بالعادات المكتملة والسجل.',
        )}
      </Label>
      {error && (
        <Label accessibilityRole="alert">
          {t(
            'Choisissez un objectif et des heures valides au format 24 h (HH:MM).',
            'Choose a goal and valid 24-hour times (HH:MM).',
            'اختر هدفاً وأدخل أوقاتاً صحيحة بنظام ٢٤ ساعة (HH:MM).',
          )}
        </Label>
      )}
      <Button
        loading={busy}
        title={t('Enregistrer mes choix', 'Save my preferences', 'حفظ اختياراتي')}
        onPress={() => {
          if (!p.goals.length || !validTime(p.wakeTime) || !validTime(p.sleepTime)) {
            setError(true);
            return;
          }
          setError(false);
          setBusy(true);
          void update((s) => ({
            ...s,
            preferences: { ...p, onboarded: true },
            days: { ...s.days, [today]: { ...s.days[today]!, plan: createPlan(today, p) } },
          }))
            .then(() => router.replace('/wellness'))
            .catch(() => {})
            .finally(() => setBusy(false));
        }}
      />
      <Button
        quiet
        title={t('Choisir mes heures de rappel', 'Choose reminder times', 'اختيار أوقات التذكير')}
        onPress={() => router.push('/wellness/notifications')}
      />
    </>
  );
}
