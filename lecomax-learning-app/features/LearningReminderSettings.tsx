import React, { useEffect, useState } from 'react';
import { AppState, Linking, Platform } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, Label, Row } from '../components/UI';
import { useSchool } from '../store/School';
import { pendingReminders, setReminder, testLearningNotification } from '../services/notifications';

export function LearningReminderSettings() {
  const { state, update, t } = useSchool();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [pending, setPending] = useState<number | null>(null);
  useEffect(() => {
    let active = true;
    const check = () =>
      void pendingReminders()
        .then((n) => {
          if (active) setPending(n);
        })
        .catch(() => {
          if (active) setPending(null);
        });
    check();
    const sub = AppState.addEventListener('change', (value) => {
      if (value === 'active') check();
    });
    return () => {
      active = false;
      sub.remove();
    };
  }, [state.reminder, state.language]);
  const run = async (action: () => Promise<unknown>, success: string) => {
    setBusy(true);
    setStatus('');
    try {
      await action();
      setStatus(success);
      setPending(await pendingReminders());
    } catch (e) {
      const code = e instanceof Error ? e.message : '';
      setStatus(
        code === 'PERMISSION_DENIED'
          ? t(
              'Autorisez les notifications dans les réglages du téléphone.',
              'Allow notifications in your phone settings.',
              'اسمح للتطبيق بإرسال الإشعارات من إعدادات الهاتف.',
            )
          : code === 'CHANNEL_BLOCKED'
            ? t(
                'Le canal des rappels est désactivé dans Android.',
                'The learning reminder channel is disabled in Android settings.',
                'قناة تذكيرات التعلّم معطّلة. فعّلها من إعدادات إشعارات التطبيق في أندرويد.',
              )
            : code === 'NATIVE_ONLY'
              ? t(
                  'Ces rappels nécessitent l’application mobile.',
                  'These reminders require the mobile app.',
                  'تتطلّب هذه التذكيرات تطبيق الهاتف.',
                )
              : t(
                  'Impossible de vérifier la programmation. Réessayez.',
                  'Could not verify the schedule. Please retry.',
                  'تعذّر التأكّد من جدولة التذكيرات. أعد المحاولة.',
                ),
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <Card>
      <Label bold size={22}>
        {t('Rappels d’apprentissage', 'Learning reminders', 'تذكيرات التعلّم')}
      </Label>
      <Label muted>
        {t(
          'Entre 9 h et 20 h, au maximum 3 par jour. Le lot de 14 rappels se renouvelle à l’ouverture de l’application.',
          'Between 9am and 8pm, at most 3 per day. The batch of 14 renews when you open the app.',
          'من التاسعة صباحًا إلى الثامنة مساءً، بحدّ أقصى ثلاثة تذكيرات يوميًا. تتجدّد دفعة التذكيرات الأربعة عشر عند فتح التطبيق.',
        )}
      </Label>
      {Platform.OS === 'web' && (
        <Label>
          {t(
            'Sur le web, les rappels du programme quotidien nécessitent un onglet ouvert.',
            'On the web, daily routine reminders require an open tab.',
            'في المتصفّح، تعمل تذكيرات البرنامج اليومي ما دامت صفحة التطبيق مفتوحة.',
          )}
        </Label>
      )}
      <Row>
        {[0, 10, 30, 60, 1440].map((n) => (
          <Button
            key={n}
            quiet
            disabled={busy || (Platform.OS === 'web' && n !== 0)}
            selected={state.reminder === n}
            title={
              n === 0
                ? t('Désactivés', 'Off', 'إيقاف')
                : n === 1440
                  ? t('Chaque jour', 'Daily', 'يوميًا')
                  : `${n} ${t('min', 'min', 'دقيقة')}`
            }
            onPress={() =>
              void run(
                async () => {
                  await setReminder(n, state.language);
                  update((p) => ({ ...p, reminder: n }));
                },
                t('Préférence enregistrée.', 'Preference saved.', 'تمّ حفظ إعداد التذكيرات.'),
              )
            }
          />
        ))}
      </Row>
      <Label>
        {pending === null
          ? t(
              'Vérification indisponible.',
              'Schedule status unavailable.',
              'تعذّر قراءة حالة الجدولة.',
            )
          : t(
              `${pending} rappels autorisés et planifiés.`,
              `${pending} permitted reminders scheduled.`,
              `عدد التذكيرات المجدولة والمسموح بها: ${pending}.`,
            )}
      </Label>
      <Label muted>
        {t(
          'Un rappel planifié n’est pas une preuve de réception. Le système contrôle la livraison.',
          'A scheduled reminder is not proof of delivery. Your operating system controls delivery.',
          'الجدولة لا تعني تأكيد وصول الإشعار؛ يتحكّم نظام الهاتف في عرضه. جرّب الإشعار للتأكّد من إعدادات جهازك.',
        )}
      </Label>
      {!!status && (
        <Label accessibilityRole="alert" accessibilityLiveRegion="polite">
          {status}
        </Label>
      )}
      <Row>
        <Button
          disabled={busy || Platform.OS === 'web'}
          title={t('Tester dans 5 secondes', 'Test in 5 seconds', 'إرسال إشعار تجريبي بعد ٥ ثوانٍ')}
          onPress={() =>
            void run(
              () => testLearningNotification(state.language),
              t(
                'Test programmé. Attendez 5 secondes.',
                'Test scheduled. Wait 5 seconds.',
                'تمّت جدولة الاختبار. انتظر خمس ثوانٍ.',
              ),
            )
          }
        />
        {Platform.OS !== 'web' && (
          <Button
            quiet
            disabled={busy}
            title={t(
              'Réglages du téléphone',
              'Phone notification settings',
              'إعدادات الإشعارات في الهاتف',
            )}
            onPress={() =>
              void Linking.openSettings().catch(() =>
                setStatus(
                  t('Ouverture impossible.', 'Could not open settings.', 'تعذّر فتح الإعدادات.'),
                ),
              )
            }
          />
        )}
        <Button
          quiet
          title={t('Programme quotidien', 'Daily routine reminders', 'تذكيرات البرنامج اليومي')}
          onPress={() => router.push('/wellness/notifications')}
        />
      </Row>
    </Card>
  );
}
