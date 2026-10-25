import { router } from 'expo-router';
import { dateKey, validTime } from './engine';
import { reminderSuppressed, validQuietHours } from './reminder-policy';
import { reminderMessage } from './daily-content';
import type { Locale, NotificationPreferences, ReminderId } from './types';
let generation = 0;
let removeWakeListeners: (() => void) | undefined;
let timer: ReturnType<typeof setInterval> | undefined;
let preferences: NotificationPreferences | undefined;
let locale: Locale = 'en';
const delivered = new Set<string>();
const storageKey = 'lecomax-wellness-web-delivery-v1';
export function browserReminderPermission() {
  return typeof window !== 'undefined' && window.isSecureContext && 'Notification' in window
    ? Notification.permission
    : 'unsupported';
}
export async function ensureReminderPermission(_sound = true) {
  const status = browserReminderPermission();
  if (status === 'unsupported') throw new Error('BROWSER_UNSUPPORTED');
  const permission = status === 'default' ? await Notification.requestPermission() : status;
  if (permission !== 'granted') throw new Error('PERMISSION_DENIED');
}
function show(id: ReminderId, language: Locale, sound: boolean, tag: string, now = new Date()) {
  const message = reminderMessage(id, now.getDay() + 1, language);
  const notice = new Notification(message.title, { body: message.body, tag, silent: !sound, requireInteraction: id === 'bedtime' });
  notice.onclick = () => {
    window.focus();
    router.push({ pathname: '/wellness', params: { reminder: id } });
    notice.close();
  };
}
export function stopBrowserReminders() {
  generation++;
  removeWakeListeners?.();
  removeWakeListeners = undefined;
  if (timer) clearInterval(timer);
  timer = undefined;
  preferences = undefined;
}
export function checkBrowserReminders(now = new Date()) {
  if (!preferences?.enabled || browserReminderPermission() !== 'granted') return;
  if (reminderSuppressed(preferences, `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`)) return;
  const today = dateKey(now);
  let saved: string[] = [];
  try {
    const raw = JSON.parse(localStorage.getItem(storageKey) || '[]');
    if (Array.isArray(raw)) saved = raw.filter((v) => typeof v === 'string' && v.startsWith(today));
  } catch {
    /* In-memory delivery still works when storage is blocked. */
  }
  for (const key of delivered) if (!key.startsWith(today)) delivered.delete(key);
  for (const [id, value] of Object.entries(preferences.categories)) {
    if (!value.enabled || !validTime(value.time) || reminderSuppressed(preferences, value.time)) continue;
    const key = today + ':' + id + ':' + value.time;
    const [hour, minute] = value.time.split(':').map(Number);
    const due = new Date(now);
    due.setHours(hour!, minute!, 0, 0);
    const delay = now.getTime() - due.getTime();
    // A short catch-up window tolerates timer throttling without flooding the user on return.
    if (delay < 0 || delay > 15 * 60000 || delivered.has(key) || saved.includes(key)) continue;
    try {
      show(id as ReminderId, locale, preferences.sound, key, now);
      delivered.add(key);
      saved.push(key);
      try {
        localStorage.setItem(storageKey, JSON.stringify(saved));
      } catch {
        /* Keep in-memory deduplication. */
      }
    } catch {
      /* Permission/support can change while the tab is open; settings shows current status. */
    }
  }
}
export async function syncNotifications(
  p: NotificationPreferences,
  language: Locale,
  request = false,
) {
  // Invalid drafts must not interrupt the last working schedule.
  if (!validQuietHours(p)) throw new Error('INVALID_QUIET_HOURS');
  if (
    p.enabled &&
    !Object.values(p.categories)
      .filter((v) => v.enabled)
      .every((v) => validTime(v.time))
  )
    throw new Error('INVALID_TIME');
  stopBrowserReminders();
  const operation = generation;
  if (!p.enabled) return;
  if (request) await ensureReminderPermission();
  else if (browserReminderPermission() !== 'granted') throw new Error('PERMISSION_DENIED');
  // Permission may resolve after a newer save, disable, or provider cleanup.
  if (operation !== generation) return;
  preferences = JSON.parse(JSON.stringify(p)) as NotificationPreferences;
  locale = language;
  timer = setInterval(checkBrowserReminders, 15000);
  const wake = () => checkBrowserReminders();
  window.addEventListener?.('focus', wake);
  if (typeof document !== 'undefined') document.addEventListener('visibilitychange', wake);
  removeWakeListeners = () => {
    window.removeEventListener?.('focus', wake);
    if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', wake);
  };
  checkBrowserReminders();
}
export async function testNotification(language: Locale, sound: boolean) {
  await ensureReminderPermission();
  // A test is immediate on web, so blocked browser notifications are visible during setup.
  show('morning', language, sound, 'wellness-test');
}
