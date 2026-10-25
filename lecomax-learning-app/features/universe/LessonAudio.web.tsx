import React, { useEffect, useState } from 'react';
import { Button, Label, Row } from '../../components/UI';
import { useSchool } from '../../store/School';
import type { LessonAudioProps } from './LessonAudio';
export function LessonAudio({ text }: LessonAudioProps) {
  const { state, t } = useSchool();
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState(false);
  const available = typeof window !== 'undefined' && 'speechSynthesis' in window;
  useEffect(
    () => () => {
      if (available) window.speechSynthesis.cancel();
    },
    [available, text, state.language],
  );
  if (!available)
    return (
      <Label muted>
        {t(
          'Audio non pris en charge par ce navigateur.',
          'Audio is unavailable in this browser.',
          'الصوت غير متاح في هذا المتصفح.',
        )}
      </Label>
    );
  return (
    <Row>
      <Button
        quiet
        icon={speaking ? 'stop-outline' : 'volume-medium-outline'}
        title={
          speaking
            ? t('Arrêter l’écoute', 'Stop listening', 'أوقف الاستماع')
            : t('Écouter le résumé', 'Listen to the summary', 'استمع إلى الملخص')
        }
        onPress={() => {
          window.speechSynthesis.cancel();
          if (speaking) {
            setSpeaking(false);
            return;
          }
          setError(false);
          const utterance = new SpeechSynthesisUtterance(text.slice(0, 3000));
          utterance.lang = { ar: 'ar', fr: 'fr-FR', en: 'en-US' }[state.language];
          utterance.onend = () => setSpeaking(false);
          utterance.onerror = () => {
            setSpeaking(false);
            setError(true);
          };
          setSpeaking(true);
          window.speechSynthesis.speak(utterance);
        }}
      />
      {error && (
        <Label accessibilityRole="alert">
          {t(
            'Voix indisponible. Vous pouvez lire le résumé.',
            'Voice unavailable. You can read the summary.',
            'الصوت غير متاح. يمكنك قراءة الملخص.',
          )}
        </Label>
      )}
    </Row>
  );
}
