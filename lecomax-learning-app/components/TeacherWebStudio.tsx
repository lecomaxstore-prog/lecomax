import React from 'react';
import { Label } from './UI';
import { TeacherSheet } from './TeacherUI';
import { useSchool } from '../store/School';
export type WebSeed = { language: string; code: string };
export function TeacherWebStudio({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
  seed?: WebSeed | null;
  onExplain: (prompt: string) => void;
}) {
  const { t } = useSchool();
  return (
    <TeacherSheet
      visible={visible}
      onClose={onClose}
      title={t('Éditeur web', 'Web editor', 'محرر الويب')}
    >
      <Label>
        {t(
          'Ouvre cette fonction dans la version web locale.',
          'Open this feature in the local web app.',
          'افتح هذه الميزة في نسخة الويب المحلية.',
        )}
      </Label>
    </TeacherSheet>
  );
}
