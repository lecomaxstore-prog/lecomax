import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import { useSchool } from '../store/School';
import { setReminder } from '../services/notifications';

export function LearningReminderRenewal() {
  const { state, ready } = useSchool();
  useEffect(() => {
    if (!ready || Platform.OS === 'web' || !state.reminder) return;
    // Never prompt for permission in the background. Settings offers recovery.
    const renew = () =>
      void setReminder(state.reminder, state.language, false, true).catch(() => {});
    renew();
    const subscription = AppState.addEventListener('change', (value) => {
      if (value === 'active') renew();
    });
    return () => subscription.remove();
  }, [ready, state.reminder, state.language]);
  return null;
}
