import React, { useCallback, useState } from 'react';
import { AppState, Linking, Platform, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Button, Card, Label, Row } from '../components/UI';
import { useSchool } from '../store/School';
import { pendingReminders, setReminder } from '../services/notifications';

/** Home shortcut; preferences and notification deep links use the existing system. */
export function LearningReminder({ lessonId }: { lessonId: string }) {
  const { state, update, colors, t } = useSchool();
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<number | null>(null);
  const [status, setStatus] = useState('');
  const [denied, setDenied] = useState(false);
  const web = Platform.OS === 'web';

  useFocusEffect(useCallback(() => {
    let active = true;
    const refresh = () => {
      void pendingReminders().then(count => { if (active) setPending(count); })
        .catch(() => { if (active) setPending(null); });
    };
    refresh();
    const listener = AppState.addEventListener('change', value => { if (value === 'active') refresh(); });
    return () => { active = false; listener.remove(); };
  }, []));

  const save = async (minutes: number) => {
    if (busy) return;
    setBusy(true);
    setStatus('');
    setDenied(false);
    try {
      await setReminder(minutes, state.language);
      update(p => ({ ...p, reminder: minutes }));
      setPending(minutes ? 14 : 0);
      setStatus(minutes
        ? t('14 rappels programmés à 10 h, dès demain. Touchez une notification pour ouvrir la leçon.', '14 reminders scheduled at 10am, starting tomorrow. Tap a notification to open its lesson.', 'تمت جدولة 14 تذكيرًا، الساعة 10 صباحًا ابتداءً من الغد. اضغط على الإشعار لفتح الدرس.')
        : t('Rappels désactivés.', 'Reminders turned off.', 'تم إيقاف التذكيرات.'));
    } catch (error) {
      const permission = error instanceof Error && error.message === 'PERMISSION_DENIED';
      setDenied(permission);
      setStatus(permission
        ? t('Autorisez les notifications dans les réglages du téléphone, puis réessayez.', 'Allow notifications in your phone settings, then try again.', 'اسمح بالإشعارات من إعدادات الهاتف ثم أعد المحاولة.')
        : t('Impossible de programmer le rappel. Réessayez.', 'Could not schedule the reminder. Please try again.', 'تعذّرت جدولة التذكير. حاول مرة أخرى.'));
    } finally { setBusy(false); }
  };

  return <Card style={{ padding: 14, borderWidth: 0, backgroundColor: colors.soft, shadowOpacity: 0, elevation: 0, gap: 8 }}>
    <Row style={{ flexWrap: 'nowrap', alignItems: 'flex-start' }}>
      <Ionicons name={pending ? 'notifications' : 'notifications-outline'} size={22} color={colors.accent} style={{ marginTop: 3 }} />
      <View style={{ flex: 1, gap: 2 }}>
        <Label bold size={14}>{t('Une nouvelle chose à apprendre', 'Learn something new', 'تعلّم حاجة جديدة')}</Label>
        <Label muted size={12}>{web
          ? t('Les rappels du téléphone sont disponibles dans l’application mobile. Découvrez une leçon ici.', 'Phone reminders are available in the mobile app. Discover a lesson here.', 'تذكيرات الهاتف متاحة في تطبيق الموبايل. اكتشف درسًا جديدًا هنا.')
          : pending
            ? t(`${pending} rappels à venir · renouvelables ici.`, `${pending} upcoming reminders · renew here.`, `${pending} تذكيرًا قادمًا · يمكنك تجديدها هنا.`)
            : t('Un rappel par jour à 10 h, heure de votre téléphone, pendant 14 jours.', 'One reminder at 10am, your phone’s local time, for 14 days.', 'تذكير يومي الساعة 10 صباحًا بتوقيت هاتفك، لمدة 14 يومًا.')}</Label>
      </View>
    </Row>
    <Row>
      {web ? <Button variant="ghost" title={t('Découvrir une leçon', 'Discover a lesson', 'اكتشف درسًا')} onPress={() => router.push({ pathname: '/lesson/[id]', params: { id: lessonId } })} />
        : <>
          <Button loading={busy} title={pending ? t('Renouveler chaque jour', 'Renew daily reminders', 'جدّد التذكير اليومي') : t('Me rappeler chaque jour', 'Remind me daily', 'ذكّرني يوميًا')} onPress={() => { void save(1440); }} />
          {(!!pending || state.reminder > 0) && <Button variant="ghost" disabled={busy} title={t('Arrêter', 'Turn off', 'إيقاف')} onPress={() => { void save(0); }} />}
          <Button variant="ghost" disabled={busy} title={t('Fréquence', 'Frequency', 'التكرار')} onPress={() => router.push('/settings')} />
        </>}
    </Row>
    {!!status && <Label size={12} accessibilityLiveRegion="polite">{status}</Label>}
    {denied && <Button quiet title={t('Réglages du téléphone', 'Phone settings', 'إعدادات الهاتف')} onPress={() => {
      void Linking.openSettings().catch(() => setStatus(t('Ouvrez les réglages du téléphone manuellement.', 'Open your phone settings manually.', 'افتح إعدادات الهاتف يدويًا.')));
    }} />}
  </Card>;
}
