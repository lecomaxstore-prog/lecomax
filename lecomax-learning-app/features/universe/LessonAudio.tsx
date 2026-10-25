import React from 'react';
import { Label } from '../../components/UI';
import { useSchool } from '../../store/School';
export type LessonAudioProps = { text: string };
export function LessonAudio(_props: LessonAudioProps) {
  const { t } = useSchool();
  return (
    <Label muted size={12}>
      {t(
        'Écoute disponible dans un navigateur compatible. Le texte reste accessible au lecteur d’écran.',
        'Listening is available in supported browsers. Lesson text remains available to your screen reader.',
        'الاستماع متاح في المتصفحات المدعومة. يبقى نص الدرس متاحاً لقارئ الشاشة.',
      )}
    </Label>
  );
}
