import { isQuiet, isTime } from './life-model';
import type { NotificationPreferences } from './types';
export function validQuietHours(p: Pick<NotificationPreferences, 'quietStart' | 'quietEnd'>) {
  return (
    (!p.quietStart && !p.quietEnd) ||
    (!!p.quietStart && !!p.quietEnd && isTime(p.quietStart) && isTime(p.quietEnd))
  );
}
export function reminderSuppressed(p: NotificationPreferences, time: string) {
  return isQuiet(time, p.quietStart, p.quietEnd);
}
