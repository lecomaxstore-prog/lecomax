import React from 'react';
import { router } from 'expo-router';
import { Button, Card, Label } from '../../components/UI';
import { IconTile } from '../../components/AcademySignature';
import { useSchool } from '../../store/School';
export function PythonLab() {
  const { t } = useSchool();
  return (
    <Card>
      <IconTile icon="logo-python" large />
      <Label bold size={23}>
        Python Studio
      </Label>
      <Label muted>
        {t(
          'Un véritable espace de programmation : fichiers, exercices, exécution Python et console.',
          'A complete coding workspace: files, exercises, real Python execution and console.',
          'مساحة برمجة متكاملة: ملفات وتمارين وتنفيذ Python حقيقي ووحدة إخراج.',
        )}
      </Label>
      <Button
        icon="play-outline"
        title={t('Ouvrir Python Studio', 'Open Python Studio', 'افتح استوديو Python')}
        onPress={() => router.push({ pathname: '/terminal', params: { runtime: 'python' } })}
      />
    </Card>
  );
}
