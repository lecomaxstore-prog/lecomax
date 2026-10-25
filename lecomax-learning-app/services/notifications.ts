import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import type { Language } from '../types/content';
import { getLesson, lessons } from './content';
import { reminderDates } from '../utils/reminders';
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: notification.request.content.data?.sound !== false,
      shouldSetBadge: false,
    }),
  });
}
let queue: Promise<unknown> = Promise.resolve();
export function setReminder(minutes: number, language: Language, request = true, refresh = false) {
  const operation = queue.catch(() => {}).then(() => schedule(minutes, language, request, refresh));
  queue = operation;
  return operation;
}
const allowed = (p: Notifications.NotificationPermissionsStatus) =>
  p.granted ||
  (Platform.OS === 'ios' && p.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL);
async function prepare(language: Language, request: boolean) {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('learning', {
      name:
        language === 'ar'
          ? 'تذكيرات التعلّم'
          : language === 'fr'
            ? 'Rappels d’apprentissage'
            : 'Learning reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
    const channel = await Notifications.getNotificationChannelAsync('learning');
    if (channel?.importance === Notifications.AndroidImportance.NONE)
      throw new Error('CHANNEL_BLOCKED');
  }
  let permission = await Notifications.getPermissionsAsync();
  if (!allowed(permission) && request && permission.canAskAgain)
    permission = await Notifications.requestPermissionsAsync();
  if (!allowed(permission)) throw new Error('PERMISSION_DENIED');
}
async function schedule(minutes: number, language: Language, request: boolean, refresh: boolean) {
  if (Platform.OS === 'web') {
    if (!minutes) return;
    throw new Error('NATIVE_ONLY');
  }
  let dates = reminderDates(minutes);
  if (!minutes) {
    const existing = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      existing
        .filter((n) => typeof n.content.data?.lessonId === 'string')
        .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
    );
    return;
  }
  await prepare(language, request);
  const previous = (await Notifications.getAllScheduledNotificationsAsync()).filter(
    (n) => typeof n.content.data?.lessonId === 'string' && n.identifier !== 'learning-test',
  );
  const daily = lessons.filter((l) => l.moduleId === 'daily');
  if (!daily.length) throw new Error('NO_LESSONS');
  const signature = JSON.stringify([
    minutes,
    language,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    new Date().getTimezoneOffset(),
  ]);
  // Keep the existing clock stable on ordinary foreground events. Refill only
  // when the batch is running low, or preferences/time zone have changed.
  if (
    refresh &&
    previous.length >= 7 &&
    previous.every((n) => n.content.data?.signature === signature)
  )
    return;
  const retain = refresh && previous.every(n => n.content.data?.signature === signature && Number.isFinite(n.content.data?.scheduledAt));
  if (retain) {
    // Extend beyond the last scheduled day instead of replacing pending times
    // or adding another burst on a day that already had reminders.
    const anchor = new Date(Math.max(Date.now(), ...previous.map(n => Number(n.content.data?.scheduledAt))));
    anchor.setHours(23, 59, 0, 0);
    dates = reminderDates(minutes, anchor).slice(0, Math.max(0, 14 - previous.length));
  }
  const scheduled: string[] = [];
  try {
    for (const [index, date] of dates.entries()) {
      const l = getLesson(daily[index % daily.length]!.id, language)!;
      scheduled.push(
        await Notifications.scheduleNotificationAsync({
          content: {
            title: l.title,
            body: (l.summary[0] || l.concept).slice(0, 220),
            data: { lessonId: l.id, feature: 'learning', signature, scheduledAt: date.getTime() },
            sound: 'default',
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date,
            channelId: 'learning',
          },
        }),
      );
    }
    const confirmed = await Notifications.getAllScheduledNotificationsAsync();
    if (scheduled.some((id) => !confirmed.some((n) => n.identifier === id)))
      throw new Error('SCHEDULE_INCOMPLETE');
  } catch (error) {
    await Promise.allSettled(
      scheduled.map((id) => Notifications.cancelScheduledNotificationAsync(id)),
    );
    throw error;
  }
  if (!retain) await Promise.all(
    previous.map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
}

export async function pendingReminders(): Promise<number> {
  if (Platform.OS === 'web') return 0;
  const permission = await Notifications.getPermissionsAsync();
  if (!allowed(permission)) return 0;
  if (
    Platform.OS === 'android' &&
    (await Notifications.getNotificationChannelAsync('learning'))?.importance ===
      Notifications.AndroidImportance.NONE
  )
    return 0;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled.filter(
    (n) => typeof n.content.data?.lessonId === 'string' && n.identifier !== 'learning-test',
  ).length;
}

export async function testLearningNotification(language: Language) {
  if (Platform.OS === 'web') throw new Error('NATIVE_ONLY');
  await prepare(language, true);
  const lesson = lessons.find((l) => l.moduleId === 'daily');
  if (!lesson) throw new Error('NO_LESSONS');
  await Notifications.scheduleNotificationAsync({
    identifier: 'learning-test',
    content: {
      title:
        language === 'ar'
          ? 'تذكير تجريبي من أكاديمية ليكوماكس'
          : language === 'fr'
            ? 'Test de rappel L’ECOMAX'
            : 'L’ECOMAX reminder test',
      body:
        language === 'ar'
          ? 'وصل التذكير! اضغط هنا لفتح درس اليوم.'
          : language === 'fr'
            ? 'Appuyez pour ouvrir votre leçon.'
            : 'Tap to open your lesson.',
      data: { feature: 'learning-test', lessonId: lesson.id },
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 5,
      channelId: 'learning',
    },
  });
}
