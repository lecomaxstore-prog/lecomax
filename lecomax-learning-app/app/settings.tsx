import { LearningReminderSettings } from '../features/LearningReminderSettings';
import {SecuritySettings} from '../features/SecuritySettings';
import React, { useState } from 'react';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Share, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { space } from '../constants/design';
import { Button, Card, Field, Label, Page, Row } from '../components/UI';
import { readProgress } from '../utils/progress';
import { useSchool } from '../store/School';
import { setReminder } from '../services/notifications';
export default function Settings() {
  const { state, update, reset, t, colors } = useSchool();
  const [confirm, setConfirm] = useState(false);
  const [status, setStatus] = useState('');
  const [backup, setBackup] = useState('');
  const [importing, setImporting] = useState(false);
  return (
    <Page title={t('Réglages', 'Settings', 'الإعدادات')}>
      <Button quiet title={t('Mon profil étudiant', 'My learner profile', 'ملفي التعليمي')} onPress={() => router.push('/profile')} />
      <SecuritySettings />
      <Card>
        <Row>
          <Ionicons name="language-outline" size={20} color={colors.accent} />
          <Label bold>{t('Langue', 'Language', 'اللغة')}</Label>
        </Row>
        <Row>
          {(['ar', 'fr', 'en'] as const).map((l) => (
            <Button
              key={l}
              quiet
              selected={state.language === l}
              title={{ ar: 'العربية', fr: 'Français', en: 'English' }[l]}
              onPress={() => update((p) => ({ ...p, language: l }))}
            />
          ))}
        </Row>
        <View style={{ height: 1, backgroundColor: colors.line, marginVertical: space.sm }} />
        <Row>
          <Ionicons name="contrast-outline" size={20} color={colors.accent} />
          <Label bold>{t('Apparence', 'Theme', 'المظهر')}</Label>
        </Row>
        <Row>
          {(['system', 'light', 'dark'] as const).map((theme) => (
            <Button
              key={theme}
              quiet
              selected={state.theme === theme}
              title={
                {
                  system: t('Système', 'System', 'النظام'),
                  light: t('Clair', 'Light', 'فاتح'),
                  dark: t('Sombre', 'Dark', 'داكن'),
                }[theme]
              }
              onPress={() => update((p) => ({ ...p, theme }))}
            />
          ))}
        </Row>
        <View style={{ height: 1, backgroundColor: colors.line, marginVertical: space.sm }} />
        <Row>
          <Ionicons name="bar-chart-outline" size={20} color={colors.accent} />
          <Label bold>{t('Niveau', 'Level', 'المستوى')}</Label>
        </Row>
        <Row>
          {[
            t('Débutant', 'Beginner', 'مبتدئ'),
            t('Intermédiaire', 'Intermediate', 'متوسط'),
            t('Avancé', 'Advanced', 'متقدم'),
          ].map((label, i) => (
            <Button
              key={label}
              quiet
              selected={state.level === i + 1}
              title={label}
              onPress={() => update((p) => ({ ...p, level: i + 1 }))}
            />
          ))}
        </Row>
      </Card>
      <LearningReminderSettings />
      {!!status && <Label accessibilityRole="alert">{status}</Label>}
      <Button
        quiet
        title={t('Exporter ma progression', 'Export progress', 'تصدير تقدمي')}
        onPress={() =>
          Share.share({
            message: JSON.stringify(state, null, 2),
            title: 'L’ECOMAX progress',
          }).catch(() => setStatus(t('Export impossible', 'Export failed', 'تعذر التصدير')))
        }
      />
      <Button
        quiet
        title={t('Réinitialiser la progression', 'Reset progress', 'إعادة ضبط التقدم')}
        onPress={() => setConfirm(!confirm)}
      />
      <Button
        quiet
        title={t('Restaurer une sauvegarde', 'Restore a backup', 'استعادة نسخة احتياطية')}
        onPress={() => setImporting(!importing)}
      />
      {importing && (
        <Card>
          <Label>
            {t(
              'Colle ton export JSON. La restauration remplace les données de cet appareil.',
              'Paste your JSON export. Restoring replaces this device’s learning data.',
              'ألصق ملف JSON المصدّر. تحل الاستعادة محل بيانات التعلم على هذا الجهاز.',
            )}
          </Label>
          <Field multiline code value={backup} onChangeText={setBackup} placeholder="JSON" />
          <Button
            disabled={!backup.trim()}
            title={t('Valider et restaurer', 'Validate and restore', 'تحقق واستعد')}
            onPress={() => {
              try {
                const restored = readProgress(backup);
                update(() => ({ ...restored, reminder: state.reminder }));
                setBackup('');
                setImporting(false);
                setStatus(t('Sauvegarde restaurée', 'Backup restored', 'تمت استعادة النسخة'));
              } catch {
                setStatus(
                  t(
                    'Sauvegarde invalide. Rien n’a été remplacé.',
                    'Invalid backup. Nothing was replaced.',
                    'نسخة غير صالحة. لم تتغير البيانات.',
                  ),
                );
              }
            }}
          />
        </Card>
      )}
      {confirm && (
        <Card>
          <Label>
            {t(
              'Effacer les notes, favoris et résultats de cet appareil ?',
              'Erase notes, bookmarks and results on this device?',
              'حذف الملاحظات والمحفوظات والنتائج على هذا الجهاز؟',
            )}
          </Label>
          <Button
            title={t('Confirmer la suppression', 'Confirm reset', 'تأكيد الحذف')}
            onPress={() =>
              reset()
                .then(() => {
                  setConfirm(false);
                  setReminder(0, state.language).catch(() => {});
                })
                .catch(() => setStatus(t('Échec de la suppression', 'Reset failed', 'تعذر الحذف')))
            }
          />
        </Card>
      )}
      <Label muted>ACADEMY · {Constants.expoConfig?.version}</Label>
    </Page>
  );
}
