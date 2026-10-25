import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import bundled from '../data/change-history.json';
import { archiveReports, mergeReports, readReports, type ChangeReport } from '../utils/change-history';
const shipped = readReports(bundled);
const Context = createContext<{ reports: ChangeReport[]; error: boolean; saved: boolean; retry: () => void } | null>(null);
let queue = Promise.resolve<ChangeReport[]>([]);
export function ChangeHistoryProvider({ children }: { children: React.ReactNode }) {
  const [reports, setReports] = useState(() => mergeReports([], shipped));
  const [error, setError] = useState(false);
  const [saved, setSaved] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    // Serialize StrictMode/retry writes. A damaged archive is never replaced.
    const job = queue.catch(() => []).then(() => archiveReports(AsyncStorage, shipped, items => { if (active) setReports(items); }));
    queue = job;
    job.then(items => { if (active) { setReports(items); setError(false); setSaved(true); } })
      .catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [attempt]);
  return <Context.Provider value={{ reports, error, saved, retry: () => { setSaved(false); setError(false); setAttempt(n => n + 1); } }}>{children}</Context.Provider>;
}
export function useChangeHistory() {
  const context = useContext(Context);
  if (!context) throw new Error('ChangeHistoryProvider required');
  return context;
}
