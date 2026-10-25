import React, { useState } from 'react';
import { Linking, Platform, Switch } from 'react-native';
import { Button, Card, Field, Label, Row } from '../../components/UI';
import { useSchool } from '../../store/School';
import { validQuietHours } from './reminder-policy';
import { reminders } from './data';
import { validTime } from './engine';
import { JourneyPage, useCopy } from './components';
import { useJourney } from './useJourney';
import { syncNotifications, testNotification, ensureReminderPermission } from './notifications';
import { nextReminder, reminderMessage, reminderPreset } from './daily-content';
import type { NotificationPreferences, ReminderId } from './types';
export default function NotificationsScreen() {
  const { state } = useJourney(),
    { t } = useSchool();
  return (
    <JourneyPage title={t('Mes rappels bien-être', 'Wellness reminders', 'تذكيرات العافية')}>
      {state && <Form initial={state.notifications} />}
    </JourneyPage>
  );
}
function Form({ initial }: { initial: NotificationPreferences }) {
  const [p, setP] = useState(initial),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState('');
  const {
      update,
      notificationError,
      clearNotificationError,
      now,
      state: journeyState,
    } = useJourney(),
    { t, state } = useSchool(),
    copy = useCopy();
  const dirty = JSON.stringify(p) !== JSON.stringify(initial);
  const activeCount = Object.values(initial.categories).filter((v) => v.enabled).length;
  const next = nextReminder(p, now);
  const preview = next
    ? reminderMessage(next.id, next.date.getDay() + 1, state.language)
    : undefined;
  const fail = (e: unknown) =>
    setMessage(
      e instanceof Error && (e.message === 'PERMISSION_DENIED' || e.message === 'CHANNEL_BLOCKED')
        ? t(
            'Autorisez les notifications de cette application dans votre navigateur ou appareil, puis réessayez.',
            'Allow notifications for this app in your browser or device settings, then retry.',
            'اسمح بإشعارات التطبيق من إعدادات المتصفح أو الجهاز ثم أعد المحاولة.',
          )
        : e instanceof Error && e.message === 'BROWSER_UNSUPPORTED'
          ? t(
              'Ce navigateur ne permet pas ces notifications. Utilisez un navigateur de bureau compatible ou l’application mobile.',
              'This browser does not support these notifications. Use a supported desktop browser or the mobile app.',
              'هذا المتصفح لا يدعم هذه الإشعارات. استخدم متصفح حاسوب متوافقًا أو تطبيق الهاتف.',
            )
          : t(
              'Impossible de programmer les rappels. Vérifiez les autorisations et réessayez.',
              'Unable to schedule reminders. Check permissions and retry.',
              'تعذرت جدولة التذكيرات. تحقق من الصلاحيات وأعد المحاولة.',
            ),
    );
  const save = () => {
    if (!validQuietHours(p)) {
      setMessage('Enter both quiet-hour times as HH:MM, or clear both.');
      return;
    }
    const savedPreferences = {
      ...p,
      quietStart: p.quietStart || undefined,
      quietEnd: p.quietEnd || undefined,
    };
    if (p.enabled && !Object.values(p.categories).some((v) => v.enabled)) {
      setMessage(
        t(
          'Choisissez au moins un message ou désactivez les rappels.',
          'Choose at least one message or turn reminders off.',
          'اختر رسالة واحدة على الأقل أو عطّل التذكيرات.',
        ),
      );
      return;
    }
    if (
      p.enabled &&
      !Object.values(p.categories)
        .filter((v) => v.enabled)
        .every((v) => validTime(v.time))
    ) {
      setMessage(
        t(
          'Utilisez HH:MM, de 00:00 à 23:59.',
          'Use HH:MM, from 00:00 to 23:59.',
          'استخدم HH:MM من 00:00 إلى 23:59.',
        ),
      );
      return;
    }
    setBusy(true);
    setMessage('');
    // Persist intent first: startup/foreground retries can repair interrupted scheduling.
    const permission = p.enabled ? ensureReminderPermission(p.sound) : Promise.resolve();
    void permission
      .then(() => update((s) => ({ ...s, notifications: savedPreferences })))
      .then(() => syncNotifications(savedPreferences, state.language, true))
      .then(() => {
        clearNotificationError();
        setMessage(
          Platform.OS === 'web' && p.enabled
            ? t(
                'Rappels activés dans ce navigateur. Gardez cet onglet ouvert et envoyez un test ci-dessous.',
                'Browser reminders enabled. Keep this tab open and send a test below.',
                'فُعّلت تذكيرات المتصفح. أبقِ التبويب مفتوحًا وأرسل إشعارًا تجريبيًا أدناه.',
              )
            : p.enabled
              ? t(
                  'Vos messages sont programmés. Vous pouvez maintenant envoyer un test.',
                  'Your messages are scheduled. You can send a test now.',
                  'تمت جدولة رسائلك. يمكنك الآن إرسال اختبار.',
                )
              : t('Rappels désactivés.', 'Reminders turned off.', 'تم تعطيل التذكيرات.'),
        );
      })
      .catch(fail)
      .finally(() => setBusy(false));
  };
  return (
    <>
      <Card>
        <Label bold accessibilityLiveRegion="polite">
          {dirty
            ? t(
                'Modifications non enregistrées',
                'Unsaved schedule changes',
                'تغييرات لم تُحفظ بعد',
              )
            : notificationError
              ? t('Rappels à vérifier', 'Reminders need attention', 'تحتاج التذكيرات إلى مراجعة')
              : initial.enabled
                ? t('Programme enregistré', 'Schedule saved', 'تم حفظ البرنامج')
                : t('Rappels désactivés', 'Reminders are off', 'التذكيرات معطّلة')}
        </Label>
        <Label muted size={13}>
          {dirty
            ? t(
                'Enregistrez pour appliquer ces horaires. Le programme précédent reste actif.',
                'Save to apply these times. Your previous schedule remains in effect.',
                'احفظ لتطبيق هذه الأوقات. يبقى البرنامج السابق ساريًا.',
              )
            : initial.enabled
              ? t(
                  activeCount + ' rappels par jour · heure locale de cet appareil.',
                  activeCount + ' reminders each day · this device’s local time.',
                  activeCount + ' تذكيرات يوميًا · بالتوقيت المحلي لهذا الجهاز.',
                )
              : t(
                  'Choisissez un rythme, puis enregistrez pour commencer.',
                  'Choose a rhythm, then save to get started.',
                  'اختر إيقاعك ثم احفظ للبدء.',
                )}
        </Label>
      </Card>
      <Card>
        <Label bold size={21}>
          {t(
            'Une petite attention, chaque jour',
            'A little encouragement, every day',
            'رسالة لطيفة، كل يوم',
          )}
        </Label>
        <Label muted size={14}>
          {t(
            'Choisissez votre rythme. Les messages changent selon le jour de la semaine et le cycle se répète automatiquement.',
            'Choose your rhythm. Messages vary by weekday, and the cycle repeats automatically.',
            'اختر إيقاعك. تتنوع الرسائل حسب يوم الأسبوع وتتكرر الدورة تلقائيًا.',
          )}
        </Label>
        {Platform.OS === 'web' && (
          <Label>
            {t(
              'Sur cet ordinateur, gardez cet onglet ouvert pour recevoir les rappels. Ils peuvent être retardés si le navigateur est en veille. Pour être rappelé quand l’application est fermée, activez les rappels dans l’application mobile. Les réglages restent propres à chaque appareil.',
              'On this computer, keep this tab open to receive reminders. A sleeping browser may delay them. For reminders with the app closed, enable them in the mobile app. Settings are saved separately on each device.',
              'على هذا الحاسوب، أبقِ التبويب مفتوحًا لتصلك التذكيرات. قد تتأخر إذا دخل المتصفح في وضع السكون. لاستلامها والتطبيق مغلق، فعّلها في تطبيق الهاتف. تُحفظ إعدادات كل جهاز بشكل مستقل.',
            )}
          </Label>
        )}
        <Button
          quiet
          disabled={busy}
          title={t('Un message par jour', 'One daily message', 'رسالة واحدة يوميًا')}
          onPress={() => {
            setP((v) => reminderPreset(v, 'daily'));
            setMessage('');
          }}
        />
        <Button
          quiet
          disabled={busy}
          title={t('Matin et soir', 'Morning and evening', 'صباحًا ومساءً')}
          onPress={() => {
            setP((v) => reminderPreset(v, 'twice'));
            setMessage('');
          }}
        />
        <Button
          quiet
          disabled={busy}
          title={t('Tous les rappels', 'All daily reminders', 'جميع التذكيرات اليومية')}
          onPress={() => {
            setP((v) => reminderPreset(v, 'all'));
            setMessage('');
          }}
        />
        <Label muted size={12}>
          {t(
            'Ajustez les heures ci-dessous, puis enregistrez.',
            'Adjust the times below, then save.',
            'عدّل الأوقات أدناه ثم احفظ.',
          )}
        </Label>
        <Button
          quiet
          disabled={busy}
          title={t(
            'Matin, soir et coucher',
            'Morning, evening and bedtime',
            'الصباح والمساء وموعد النوم',
          )}
          onPress={() => {
            setP((v) =>
              reminderPreset(
                {
                  ...v,
                  categories: {
                    ...v.categories,
                    morning: { ...v.categories.morning, time: journeyState!.preferences.wakeTime },
                    bedtime: { ...v.categories.bedtime, time: journeyState!.preferences.sleepTime },
                  },
                },
                'routine',
              ),
            );
            setMessage('');
          }}
        />
        <Label muted>
          {t(
            'Le coucher utilise une alerte Android prioritaire, avec son et vibration si activés. Les réglages du téléphone et Ne pas déranger restent prioritaires.',
            'Bedtime uses a high-priority Android alert, with sound and vibration when enabled. Phone settings and Do Not Disturb still apply.',
            'يستخدم موعد النوم تنبيهًا بارزًا على أندرويد، مع الصوت والاهتزاز عند تفعيلهما. تبقى إعدادات الهاتف ووضع عدم الإزعاج سارية.',
          )}
        </Label>
        <Button
          loading={busy}
          icon="notifications-outline"
          title={t('Enregistrer ce programme', 'Save this schedule', 'احفظ هذا البرنامج')}
          onPress={save}
        />
        {!!message && <Label accessibilityLiveRegion="polite">{message}</Label>}
      </Card>
      {Platform.OS === 'android' && (
        <Card>
          <Label bold>
            {t('Prêt sur votre téléphone', 'Ready on your phone', 'جاهز على هاتفك')}
          </Label>
          <Label muted size={13}>
            {t(
              'Enregistrez vos horaires, puis envoyez un test. Touchez une notification pour ouvrir votre journée. Android peut retarder les rappels en économie de batterie.',
              'Save your times, then send a test. Tap a notification to open your day. Android may delay reminders in battery-saving mode.',
              'احفظ أوقاتك ثم أرسل إشعارًا تجريبيًا. اضغط على الإشعار لفتح يومك. قد يؤخر أندرويد التذكيرات عند تفعيل توفير البطارية.',
            )}
          </Label>
        </Card>
      )}
      {next && preview && (
        <Card>
          <Label muted size={12}>
            {dirty
              ? t('APERÇU NON ENREGISTRÉ', 'UNSAVED MESSAGE PREVIEW', 'معاينة لم تُحفظ بعد')
              : t('APERÇU DU PROCHAIN MESSAGE', 'NEXT MESSAGE PREVIEW', 'معاينة الرسالة القادمة')}
          </Label>
          <Label bold>
            {next.date.toLocaleString(state.language, {
              weekday: 'long',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Label>
          <Label bold>{preview.title}</Label>
          <Label>{preview.body}</Label>
        </Card>
      )}
      <Card>
        <Label muted>
          {t(
            'Les rappels suivent l’heure locale du téléphone. Ils restent facultatifs.',
            'Reminders use your phone’s local time and are optional.',
            'التذكيرات اختيارية وتتبع التوقيت المحلي لهاتفك.',
          )}
        </Label>
        <Row>
          <Switch
            accessibilityLabel={t('Activer les rappels', 'Enable reminders', 'تفعيل التذكيرات')}
            value={p.enabled}
            onValueChange={(enabled) => setP((v) => ({ ...v, enabled }))}
            disabled={busy}
          />
          <Label>{t('Activer les rappels', 'Enable reminders', 'تفعيل التذكيرات')}</Label>
        </Row>
        <Row>
          <Switch
            accessibilityLabel={t('Son', 'Sound', 'الصوت')}
            value={p.sound}
            onValueChange={(sound) => setP((v) => ({ ...v, sound }))}
            disabled={busy}
          />
          <Label>{t('Son', 'Sound', 'الصوت')}</Label>
        </Row>
      </Card>
      <Card>
        <Label bold>Quiet hours</Label>
        <Label muted>
          Scheduled wellness reminders are suppressed during this local-time interval, including
          bedtime alerts. Equal times silence the whole day. Leave both blank for no quiet interval.
          An explicit test below sends immediately.
        </Label>
        <Field
          accessibilityLabel="Quiet hours start"
          placeholder="Quiet hours start (HH:MM)"
          value={p.quietStart || ''}
          maxLength={5}
          onChangeText={(quietStart) => setP((v) => ({ ...v, quietStart }))}
        />
        <Field
          accessibilityLabel="Quiet hours end"
          placeholder="Quiet hours end (HH:MM)"
          value={p.quietEnd || ''}
          maxLength={5}
          onChangeText={(quietEnd) => setP((v) => ({ ...v, quietEnd }))}
        />
      </Card>
      {(Object.keys(reminders) as ReminderId[]).map((id) => (
        <Card key={id}>
          <Row>
            <Switch
              accessibilityLabel={copy(reminders[id].title)}
              value={p.categories[id].enabled}
              disabled={busy}
              onValueChange={(enabled) =>
                setP((v) => ({
                  ...v,
                  categories: { ...v.categories, [id]: { ...v.categories[id], enabled } },
                }))
              }
            />
            <Label bold>{copy(reminders[id].title)}</Label>
          </Row>
          <Field
            value={p.categories[id].time}
            editable={!busy && p.enabled && p.categories[id].enabled}
            code
            maxLength={5}
            accessibilityLabel={copy(reminders[id].title) + ' · HH:MM'}
            placeholder={`${copy(reminders[id].title)} · HH:MM`}
            onChangeText={(time) =>
              setP((v) => ({
                ...v,
                categories: { ...v.categories, [id]: { ...v.categories[id], time } },
              }))
            }
          />
        </Card>
      ))}
      {!!notificationError && (
        <Label>
          {t(
            'La dernière synchronisation a échoué. Enregistrez pour réessayer.',
            'Last reminder sync failed. Save to retry.',
            'فشلت مزامنة التذكيرات الأخيرة. احفظ لإعادة المحاولة.',
          )}
        </Label>
      )}
      {!!message && <Label accessibilityLiveRegion="polite">{message}</Label>}
      <Button
        loading={busy}
        title={t('Enregistrer les rappels', 'Save reminders', 'حفظ التذكيرات')}
        onPress={save}
      />
      <Button
        quiet
        disabled={busy}
        title={
          Platform.OS === 'web'
            ? t('Envoyer un test maintenant', 'Send a test now', 'أرسل إشعارًا تجريبيًا الآن')
            : t('Tester dans 3 secondes', 'Test in 3 seconds', 'اختبار بعد ٣ ثوانٍ')
        }
        onPress={() => {
          setBusy(true);
          void testNotification(state.language, p.sound)
            .then(() =>
              setMessage(
                Platform.OS === 'web'
                  ? t(
                      'Test envoyé. S’il n’apparaît pas, vérifiez les notifications du navigateur et le mode Ne pas déranger.',
                      'Test sent. If it does not appear, check browser notifications and Do Not Disturb settings.',
                      'أُرسل الاختبار. إن لم يظهر، تحقق من إشعارات المتصفح ووضع عدم الإزعاج.',
                    )
                  : t(
                      'Notification test programmée.',
                      'Test notification scheduled.',
                      'تمت جدولة إشعار الاختبار.',
                    ),
              ),
            )
            .catch(fail)
            .finally(() => setBusy(false));
        }}
      />
      {Platform.OS !== 'web' && (
        <Button
          quiet
          title={t('Réglages du téléphone', 'Phone settings', 'إعدادات الهاتف')}
          onPress={() => void Linking.openSettings().catch(fail)}
        />
      )}
    </>
  );
}
