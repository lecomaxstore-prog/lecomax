import { browserReminderPermission } from './notifications';
import { nextReminder } from './daily-content';
import { Platform, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Button, Card, Label, Row } from '../../components/UI';
import { useSchool } from '../../store/School';
import { useJourney } from './useJourney';

export function ReminderSummary() {
  const { state, notificationError } = useJourney();
  const { t, colors, state: school } = useSchool();
  if (!state) return null;
  const enabled = state.notifications.enabled;
  const times = Object.values(state.notifications.categories)
    .filter((v) => v.enabled)
    .map((v) => v.time)
    .sort();
  const next = nextReminder(state.notifications);
  const browserReady = Platform.OS === 'web' && browserReminderPermission() === 'granted';
  return (
    <Card
      style={{ gap: 12, padding: 18, backgroundColor: colors.soft, borderColor: 'transparent' }}
    >
      <Row style={{ flexWrap: 'nowrap' }}>
        <View
          style={{
            width: 38,
            height: 38,
            backgroundColor: colors.card,
            borderRadius: 13,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="notifications-outline" size={20} color={colors.accent} />
        </View>
        <Label bold size={16} style={{ flex: 1 }}>
          {t('Vos rappels quotidiens', 'Your daily reminders', 'تذكيراتك اليومية')}
        </Label>
      </Row>
      <Label muted size={13}>
        {Platform.OS === 'web'
          ? enabled && browserReady && !notificationError
            ? t(
                'Rappels actifs pendant que cet onglet reste ouvert.',
                'Reminders are active while this tab stays open.',
                'التذكيرات مفعّلة ما دام هذا التبويب مفتوحًا.',
              )
            : t(
                'Vous ne recevez pas encore de rappels ici. Activez-les et envoyez un test.',
                'You are not receiving reminders here yet. Enable them and send a test.',
                'لا تصلك تذكيرات هنا بعد. فعّلها وأرسل إشعارًا تجريبيًا.',
              )
          : notificationError
            ? t(
                'Vos rappels ont besoin d’attention. Ouvrez les réglages pour réessayer.',
                'Your reminders need attention. Open settings to retry.',
                'تحتاج تذكيراتك إلى المراجعة. افتح الإعدادات لإعادة المحاولة.',
              )
            : enabled && times.length
              ? `${t('Horaires choisis', 'Selected times', 'الأوقات المختارة')}: ${times.join(' · ')}`
              : t(
                  'Choisissez une heure pour recevoir une pensée encourageante chaque jour.',
                  'Choose a time for a little encouragement every day.',
                  'اختر وقتًا لتصلك كل يوم رسالة تشجيع لطيفة.',
                )}
      </Label>
      {enabled && next && !notificationError && (Platform.OS !== 'web' || browserReady) && (
        <Label bold size={13}>
          {t('Prochain rappel : ', 'Next reminder: ', 'التذكير القادم: ') +
            next.date.toLocaleString(school.language, {
              weekday: 'long',
              hour: '2-digit',
              minute: '2-digit',
            })}
        </Label>
      )}
      <Button
        quiet
        icon="notifications-outline"
        title={t(
          'Choisir mes messages quotidiens',
          'Set up my daily messages',
          'إعداد رسائلي اليومية',
        )}
        onPress={() => router.push('/wellness/notifications')}
      />
    </Card>
  );
}
