import {auth} from '../services/auth';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AppState, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initial, readProgress, dayKey, type Progress } from '../utils/progress';
import { light, dark } from '../constants/design';
import { usePathname } from 'expo-router';
const KEY = 'lecomax-school-v1';
type Context = {
  state: Progress;
  update: (fn: (p: Progress) => Progress) => void;
  ready: boolean;
  error: string;
  saveStatus: 'loading' | 'saving' | 'saved' | 'error';
  retry: () => void;
  reset: () => Promise<void>;
  colors: typeof light;
  rtl: boolean;
  t: (fr: string, en: string, ar: string) => string;
};
const School = createContext<Context | null>(null);
export function SchoolProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<Progress>(initial);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [persistedState, setPersistedState] = useState<Progress | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [saveAttempt, setSaveAttempt] = useState(0);
  const scheme = useColorScheme();
  const pathname = usePathname();
  const queue = useRef(Promise.resolve());
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        const parsed = readProgress(raw);
        if (active) {
          setState(parsed);
          setReady(true);
          setError('');
        }
      })
      .catch(() => {
        if (active)
          setError(
            'Impossible de lire la sauvegarde / Could not load progress / تعذر قراءة التقدم',
          );
      });
    return () => {
      active = false;
    };
  }, [attempt]);
  useEffect(() => {
    if (!ready) return;
    let current = true;
    const raw = JSON.stringify(state);
    queue.current = queue.current
      .catch(() => {})
      .then(() => AsyncStorage.setItem(KEY, raw))
      .then(() => {
        if (current) { setPersistedState(state); setError(''); }
      })
      .catch(() => { if (current) setError('Sauvegarde impossible / Save failed / تعذر الحفظ'); });
    return () => { current = false; };
  }, [state, ready, saveAttempt]);
  useEffect(() => {
    if (!ready) return;
    const timer = setInterval(() => {
      const learning = /^\/(lesson|plan-lesson|teacher|tutor|practice|practice-lab|memory-studio|interactive-studio|terminal|knowledge|speaking|mission|car-studio|pc-lab|phone-lab)(\/|$)/.test(pathname);
      const visible = typeof document === 'undefined' || document.visibilityState === 'visible';
      if (learning && visible && AppState.currentState === 'active' && auth.snapshot() === 'authenticated')
        setState((p) => ({ ...p, days: { ...p.days, [dayKey()]: (p.days[dayKey()] || 0) + 15 } }));
    }, 15000);
    return () => clearInterval(timer);
  }, [ready, pathname]);
  const colors =
    state.theme === 'dark' || (state.theme === 'system' && scheme === 'dark') ? dark : light;
  const reset = async () => {
    await queue.current;
    await AsyncStorage.setItem(KEY, JSON.stringify(initial));
    setState({ ...initial });
    setReady(true);
    setError('');
  };
  return (
    <School.Provider
      value={{
        state,
        update: setState,
        ready,
        error,
        saveStatus: error ? 'error' : !ready ? 'loading' : persistedState === state ? 'saved' : 'saving',
        retry: () => {
          // A failed write must retry the current in-memory notes, never reload stale disk data.
          if (ready) {
            setSaveAttempt((a) => a + 1);
            return;
          }
          setReady(false);
          setAttempt((a) => a + 1);
        },
        reset,
        colors,
        rtl: state.language === 'ar',
        t: (fr, en, ar) => ({ fr, en, ar })[state.language],
      }}
    >
      {children}
    </School.Provider>
  );
}
export function useSchool() {
  const context = useContext(School);
  if (!context) throw new Error('School provider required');
  return context;
}
