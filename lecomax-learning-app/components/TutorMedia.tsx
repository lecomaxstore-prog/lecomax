import React from 'react';
import { Label } from './UI';
import { useSchool } from '../store/School';
import type { TutorAttachment } from '../utils/tutor-contract';
export type TutorMediaProps = {
  onAttachment: (a: TutorAttachment | undefined) => void;
  onTranscript: (text: string) => void;
  onError: (error: string) => void;
  answer: string;
  language: string;
  disabled: boolean;
};
export function TutorMedia(_props: TutorMediaProps) {
  const { t } = useSchool();
  return (
    <Label muted>
      {t(
        'Pièces jointes et voix disponibles dans un navigateur compatible. Vous pouvez coller du texte ici.',
        'Attachments and voice are available in a supported browser. You can paste text here.',
        'المرفقات والصوت متاحان في متصفح مدعوم. يمكنك لصق النص هنا.',
      )}
    </Label>
  );
}
