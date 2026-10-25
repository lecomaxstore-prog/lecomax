import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { validTime } from './engine';
import { reminderSuppressed, validQuietHours } from './reminder-policy';
import { reminderMessage } from './daily-content';
import type { Locale, NotificationPreferences, ReminderId } from './types';
const owned = (n: Notifications.NotificationRequest) =>
  n.content.data?.feature === 'wellness' && n.identifier !== 'wellness-test';
let queue: Promise<unknown> = Promise.resolve();
export function syncNotifications(p: NotificationPreferences, language: Locale, request = false) {
  const operation = queue.catch(() => {}).then(() => reconcile(p, language, request));
  queue = operation;
  return operation;
}
async function prepare(sound: boolean, request: boolean, bedtime = false) {
  const channelId = bedtime ? (sound ? 'wellness-bedtime-sound-v1' : 'wellness-bedtime-silent-v1') : sound ? 'wellness-sound-v1' : 'wellness-silent-v1';
  if (Platform.OS === 'android')
    await Notifications.setNotificationChannelAsync(channelId, {
      name: bedtime ? 'Bedtime alerts' : sound ? 'Health journey' : 'Health journey (silent)',
      importance: bedtime ? Notifications.AndroidImportance.HIGH : Notifications.AndroidImportance.DEFAULT,
      sound: sound ? 'default' : null,
      enableVibrate: sound,
      ...(bedtime ? { vibrationPattern: [0, 400, 200, 400], bypassDnd: false } : {}),
    });
  if (Platform.OS === 'android') {
    const channel = await Notifications.getNotificationChannelAsync(channelId);
    if (channel?.importance === Notifications.AndroidImportance.NONE)
      throw new Error('CHANNEL_BLOCKED');
  }
  const allowed = (permission: Notifications.NotificationPermissionsStatus) =>
    permission.granted ||
    (Platform.OS === 'ios' &&
      permission.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL);
  let permission = await Notifications.getPermissionsAsync();
  if (!allowed(permission) && request && permission.canAskAgain)
    permission = await Notifications.requestPermissionsAsync();
  if (!allowed(permission)) throw new Error('PERMISSION_DENIED');
  return channelId;
}
async function reconcile(p: NotificationPreferences, language: Locale, request: boolean) {
  if (!validQuietHours(p)) throw new Error('INVALID_QUIET_HOURS');
  if (Platform.OS === 'web') {
    if (p.enabled) throw new Error('NATIVE_ONLY');
    return;
  }
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const previous = scheduled.filter(owned);
  if (!p.enabled) {
    for (const n of scheduled.filter((item) => item.content.data?.feature === 'wellness'))
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    return;
  }
  const desired = Object.entries(p.categories)
    .filter(([, v]) => v.enabled && !reminderSuppressed(p, v.time))
    .flatMap(([id, v]) => {
      if (!validTime(v.time)) throw new Error('INVALID_TIME');
      return Array.from({ length: 7 }, (_, day) => {
        const weekday = day + 1;
        const message = reminderMessage(id as ReminderId, weekday, language);
        return {
          id: id as ReminderId,
          weekday,
          message,
          time: v.time,
          identifier: `wellness-${id}-${weekday}`,
          signature: JSON.stringify([
            3, // Reschedule when delivery semantics change.
            language,
            p.sound,
            v.time,
            weekday,
            message,
            Intl.DateTimeFormat().resolvedOptions().timeZone,
            new Date().getTimezoneOffset(),
          ]),
        };
      });
    });
  const channelId = desired.length ? await prepare(p.sound, request) : '';
  const bedtimeChannel = desired.some(d => d.id === 'bedtime') ? await prepare(p.sound, request, true) : '';
  // Replace in place before removing obsolete requests: a scheduling failure must
  // not erase the remaining working reminders. Calls are serialized above.
  for (const d of desired) {
    if (
      previous.some(
        (n) => n.identifier === d.identifier && n.content.data?.signature === d.signature,
      )
    )
      continue;
    const [hour, minute] = d.time.split(':').map(Number);
    await Notifications.scheduleNotificationAsync({
      identifier: d.identifier,
      content: {
        title: d.message.title,
        body: d.message.body,
        sound: p.sound ? 'default' : false,
        data: { feature: 'wellness', category: d.id, signature: d.signature, sound: p.sound },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: d.weekday,
        hour: hour!,
        minute: minute!,
        channelId: d.id === 'bedtime' ? bedtimeChannel : channelId,
      },
    });
  }
  const confirmed = (await Notifications.getAllScheduledNotificationsAsync()).filter(owned);
  if (
    desired.some(
      (d) =>
        !confirmed.some(
          (n) => n.identifier === d.identifier && n.content.data?.signature === d.signature,
        ),
    )
  )
    throw new Error('SCHEDULE_INCOMPLETE');
  for (const n of previous) {
    if (!desired.some((d) => d.identifier === n.identifier))
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
  }
}
export async function testNotification(language: Locale, sound: boolean, category: ReminderId = 'morning') {
  if (Platform.OS === 'web') throw new Error('NATIVE_ONLY');
  const channelId = await prepare(sound, true, category === 'bedtime');
  const message = reminderMessage(category, new Date().getDay() + 1, language);
  await Notifications.scheduleNotificationAsync({
    identifier: 'wellness-test',
    content: {
      title: message.title,
      body: message.body,
      sound: sound ? 'default' : false,
      data: { feature: 'wellness', category, sound },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 3,
      channelId,
    },
  });
}

// Web supplies these through notifications.web.ts.
export async function ensureReminderPermission(sound = true) {
  await prepare(sound, true);
}
export function browserReminderPermission(): string {
  return 'unsupported';
}
export function stopBrowserReminders() {}
