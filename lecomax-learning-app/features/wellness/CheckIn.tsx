import React, { useState } from 'react';
import { Button, Field, Label, Row } from '../../components/UI';
import { useSchool } from '../../store/School';
import { useJourney } from './useJourney';
import type { DailyCheckIn } from './types';
export function CheckIn() {
  const { state, today, update } = useJourney(),
    { t } = useSchool();
  const saved = state?.days[today]?.checkIn;
  const [value, setValue] = useState<DailyCheckIn>(saved || { note: '' }),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(false);
  const moods = [
    ['😴', t('Fatigué', 'Tired', 'متعب')],
    ['😔', t('Moral bas', 'Low', 'منخفض')],
    ['😐', t('Moyen', 'Okay', 'عادي')],
    ['🙂', t('Bien', 'Good', 'جيد')],
    ['😄', t('Très bien', 'Great', 'رائع')],
  ];
  return (
    <>
      <Label bold>
        {t('Comment vous sentez-vous ?', 'How are you feeling today?', 'كيف تشعر اليوم؟')}
      </Label>
      <Row>
        {moods.map(([emoji, label], i) => (
          <Button
            key={label}
            quiet
            selected={value.mood === i + 1}
            title={`${emoji} ${label}`}
            onPress={() => {
              setValue((v) => ({ ...v, mood: i + 1 }));
              setMessage(false);
            }}
          />
        ))}
      </Row>
      {(
        [
          ['energy', t('Énergie', 'Energy', 'الطاقة')],
          ['focus', t('Concentration', 'Focus', 'التركيز')],
          ['sleep', t('Qualité du sommeil', 'Sleep quality', 'جودة النوم')],
          ['stress', t('Stress', 'Stress', 'التوتر')],
        ] as const
      ).map(([key, title]) => (
        <React.Fragment key={key}>
          <Label>
            {title} ·{' '}
            {t(
              'facultatif, 1 faible → 5 élevé',
              'optional, 1 low → 5 high',
              'اختياري، ١ منخفض ← ٥ مرتفع',
            )}
          </Label>
          <Row>
            {[1, 2, 3, 4, 5].map((n) => (
              <Button
                key={n}
                quiet
                selected={value[key] === n}
                title={`${n}`}
                onPress={() => {
                  setValue((v) => ({ ...v, [key]: v[key] === n ? undefined : n }));
                  setMessage(false);
                }}
              />
            ))}
          </Row>
        </React.Fragment>
      ))}
      <Field
        value={value.note}
        onChangeText={(note) => {
          setValue((v) => ({ ...v, note: note.slice(0, 2000) }));
          setMessage(false);
        }}
        placeholder={t(
          'Une chose qui vous a fait du bien… (facultatif)',
          'One thing that felt good… (optional)',
          'شيء أسعدك اليوم… (اختياري)',
        )}
        multiline
      />
      <Button
        title={t('Enregistrer mon bilan', 'Save check-in', 'حفظ حالتي')}
        disabled={!value.mood}
        loading={busy}
        onPress={() => {
          setBusy(true);
          void update((s) => ({
            ...s,
            days: { ...s.days, [today]: { ...s.days[today]!, checkIn: value } },
          }))
            .then(() => setMessage(true))
            .catch(() => {})
            .finally(() => setBusy(false));
        }}
      />
      {message && (
        <Label accessibilityLiveRegion="polite">
          {t('Bilan enregistré.', 'Check-in saved.', 'تم حفظ حالتك.')}
        </Label>
      )}
    </>
  );
}
