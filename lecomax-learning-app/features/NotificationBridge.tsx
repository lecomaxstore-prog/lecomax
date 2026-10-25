import { useEffect } from 'react';
import { Platform } from 'react-native';
import { router, useRootNavigationState } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { lessons } from '../services/content';
import { useSchool } from '../store/School';
import '../services/notifications';
export function NotificationBridge() {
  const navigation = useRootNavigationState();
  const { ready } = useSchool();
  useEffect(() => {
    if (Platform.OS === 'web' || !ready || !navigation?.key) return;
    let active = true;
    let handled = '';
    const open = (response: Notifications.NotificationResponse) => {
      const responseKey = `${response.notification.request.identifier}:${response.notification.date}`;
      if (!active || handled === responseKey) return;
      handled = responseKey;
      if (response.notification.request.content.data?.feature === 'wellness')
        router.push({ pathname: '/wellness', params: { reminder: ['morning', 'evening', 'bedtime'].includes(String(response.notification.request.content.data?.category)) ? String(response.notification.request.content.data.category) : 'morning' } });
      const id = response.notification.request.content.data?.lessonId;
      if (typeof id === 'string' && lessons.some((l) => l.id === id))
        router.push({ pathname: '/lesson/[id]', params: { id } });
      void Notifications.clearLastNotificationResponseAsync().catch(() => {});
    };
    const listener = Notifications.addNotificationResponseReceivedListener(open);
    Notifications.getLastNotificationResponseAsync()
      .then((r) => {
        if (r) open(r);
      })
      .catch(() => {});
    return () => {
      active = false;
      listener.remove();
    };
  }, [ready, navigation?.key]);
  return null;
}
