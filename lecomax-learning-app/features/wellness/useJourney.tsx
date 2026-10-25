import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { useSchool } from '../../store/School';
import { dateKey, earned, ensureDay } from './engine';
import { readJourney, saveJourney } from './storage';
import { syncNotifications, stopBrowserReminders } from './notifications';
import type { JourneyState } from './types';
interface Context {
  state: JourneyState | null;
  today: string;
  now: Date;
  error: string;
  notificationError: string;
  clearNotificationError: () => void;
  celebration: string[];
  clearCelebration: () => void;
  retry: () => void;
  update: (fn: (s: JourneyState) => JourneyState) => Promise<void>;
}
const JourneyContext = createContext<Context | null>(null);
export function JourneyProvider({ children }: { children: React.ReactNode }) {
  const { state: school } = useSchool();
  const [state, setState] = useState<JourneyState | null>(null),
    [today, setToday] = useState(dateKey),
    [now, setNow] = useState(() => new Date()),
    [error, setError] = useState(''),
    [notificationError, setNotificationError] = useState(''),
    [celebration, setCelebration] = useState<string[]>([]),
    [attempt, setAttempt] = useState(0);
  const current = useRef<JourneyState | null>(null);
  const serial = useRef<Promise<unknown>>(Promise.resolve());
  const update = useCallback((fn: (s: JourneyState) => JourneyState) => {
    const operation = serial.current
      .catch(() => {})
      .then(async () => {
        if (!current.current) throw new Error('NOT_READY');
        let next = fn(ensureDay(current.current, dateKey()));
        const unlocked = earned(next, dateKey()).filter((id) => !next.achievements.includes(id));
        next = { ...next, achievements: [...next.achievements, ...unlocked] };
        await saveJourney(next);
        current.current = next;
        setState(next);
        setError('');
        if (unlocked.length) setCelebration(unlocked);
      })
      .catch((e) => {
        setError('SAVE_FAILED');
        throw e;
      });
    serial.current = operation;
    return operation;
  }, []);
  useEffect(() => {
    let active = true;
    readJourney()
      .then(async (s) => {
        const next = ensureDay(s, dateKey());
        await saveJourney(next);
        if (active) {
          current.current = next;
          setState(next);
          setError('');
        }
      })
      .catch(() => {
        if (active) setError('LOAD_FAILED');
      });
    return () => {
      active = false;
    };
  }, [attempt]);
  useEffect(() => {
    const refresh = () => {
      const deviceNow = new Date();
      setNow(deviceNow);
      const key = dateKey(deviceNow);
      setToday(key);
      if (current.current && !current.current.days[key])
        void update((s) => ensureDay(s, key)).catch(() => {});
    };
    const interval = setInterval(refresh, 30000);
    const listener = AppState.addEventListener('change', (s) => {
      if (s === 'active') refresh();
    });
    return () => {
      clearInterval(interval);
      listener.remove();
    };
  }, [update]);
  const preferences = state?.notifications;
  const clockZone = Intl.DateTimeFormat().resolvedOptions().timeZone + ":" + now.getTimezoneOffset();
  useEffect(() => {
    if (!preferences) return;
    let active = true;
    const reconcile = () =>
      void syncNotifications(preferences, school.language)
        .then(() => {
          if (active) setNotificationError('');
        })
        .catch(() => {
          if (active) setNotificationError('SYNC_FAILED');
        });
    reconcile();
    const listener = AppState.addEventListener('change', (s) => {
      if (s === 'active') reconcile();
    });
    return () => {
      active = false;
      listener.remove();
      if (Platform.OS === 'web') stopBrowserReminders();
    };
  }, [preferences, school.language, clockZone]);
  return (
    <JourneyContext.Provider
      value={{
        state,
        today,
        now,
        error,
        notificationError,
        clearNotificationError: () => setNotificationError(''),
        celebration,
        clearCelebration: () => setCelebration([]),
        retry: () => {
          if (current.current) void update((s) => s).catch(() => {});
          else setAttempt((v) => v + 1);
        },
        update,
      }}
    >
      {children}
    </JourneyContext.Provider>
  );
}
export function useJourney() {
  const value = useContext(JourneyContext);
  if (!value) throw new Error('JourneyProvider missing');
  return value;
}
