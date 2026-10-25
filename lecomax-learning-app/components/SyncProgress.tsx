import { useEffect, useRef, useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, API } from '../services/auth';
import { useSchool } from '../store/School';
import { readProgress, type Progress } from '../utils/progress';
import { mergeProgress, ProgressConflict, synchronizeProgress } from '../utils/progress-sync';
import { Button, Card, Label } from './UI';

let status = 'idle';
const listeners = new Set<() => void>();
const publish = (value: string) => {
  status = value;
  listeners.forEach((fn) => fn());
};
let retrySync = () => {};
const BASE = 'lecomax-progress-sync-baseline-v1';

export function ProgressSyncRunner() {
  const { state, update, ready, saveStatus } = useSchool();
  const current = useRef(state);
  useEffect(() => {
    current.current = state;
  }, [state]);
  useEffect(() => {
    if (!ready) return;
    let disposed = false,
      busy = false;
    const run = async () => {
      if (busy || disposed || auth.snapshot() !== 'authenticated') return;
      busy = true;
      const captured = current.current;
      publish('syncing');
      try {
        const access = await auth.token();
        if (!access || disposed) return;
        const raw = await AsyncStorage.getItem(BASE);
        const base: Progress | null = raw ? readProgress(raw) : null;
        const request = async (method: string, body?: unknown) => {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 15000);
          try {
            if (disposed || auth.snapshot() !== 'authenticated') throw new Error('SESSION_CHANGED');
            const response = await fetch(API + '/api/learning-mobile/progress', {
              method,
              headers: { Authorization: 'Bearer ' + access, 'Content-Type': 'application/json' },
              body: body === undefined ? undefined : JSON.stringify(body),
              signal: controller.signal,
              cache: 'no-store',
            });
            const data = await response.json();
            if (!response.ok)
              throw new Error(response.status === 409 ? 'BACKUP_CONFLICT' : 'SYNC_UNAVAILABLE');
            return data;
          } finally {
            clearTimeout(timeout);
          }
        };
        const merged = await synchronizeProgress(captured, base, {
          get: () => request('GET'),
          put: (revision, snapshot) => request('PUT', { revision, snapshot }),
        });
        if (disposed || auth.snapshot() !== 'authenticated') return;
        const beforeApply = current.current;
        const latest = mergeProgress(captured, beforeApply, merged);
        const serialized = JSON.stringify(latest);
        if (serialized !== JSON.stringify(beforeApply))
          update((latestState) => (latestState === beforeApply ? latest : latestState));
        // Advance the merge base only after School's serialized writer durably saves
        // the merged state. A crash or an intervening edit must not discard remote work.
        let persisted = false;
        for (let attempt = 0; attempt < 40 && !disposed; attempt++) {
          if ((await AsyncStorage.getItem('lecomax-school-v1')) === serialized) {
            persisted = true;
            break;
          }
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
        if (!persisted || disposed || auth.snapshot() !== 'authenticated')
          throw new Error('LOCAL_SAVE_PENDING');
        await AsyncStorage.setItem(BASE, JSON.stringify(merged));
        publish('synced');
      } catch (e) {
        if (!disposed)
          publish(
            e instanceof ProgressConflict || (e instanceof Error && e.message === 'BACKUP_CONFLICT')
              ? 'conflict'
              : 'offline',
          );
      } finally {
        busy = false;
      }
    };
    retrySync = () => {
      void run();
    };
    const start = setTimeout(() => void run(), 2000);
    const timer = setInterval(() => void run(), 30000);
    const unsubscribe = auth.subscribe(() => {
      if (auth.snapshot() === 'authenticated') void run();
      else publish('idle');
    });
    return () => {
      disposed = true;
      clearTimeout(start);
      clearInterval(timer);
      unsubscribe();
      retrySync = () => {};
    };
  }, [ready, update]);
  useEffect(() => {
    if (saveStatus === 'saved') retrySync();
  }, [saveStatus]);
  return null;
}
export function SyncProgress() {
  const { t, error, retry } = useSchool();
  const value = useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    () => status,
    () => 'idle',
  );
  return (
    <Card>
      <Label bold>
        {t('Sauvegarde et synchronisation', 'Saving and synchronization', 'الحفظ والمزامنة')}
      </Label>
      <Label accessibilityLiveRegion="polite">
        {error ||
          (value === 'synced'
            ? t(
                'Dernière synchronisation réussie.',
                'Last synchronization succeeded.',
                'نجحت آخر مزامنة.',
              )
            : value === 'syncing'
              ? t('Synchronisation…', 'Synchronizing…', 'جارٍ المزامنة…')
              : value === 'conflict'
                ? t(
                    'Modifications concurrentes : aucune donnée locale remplacée. Exportez vos données dans Réglages avant de comparer la sauvegarde cloud.',
                    'Conflicting edits: local data was preserved. Export your data in Settings before comparing the cloud backup.',
                    'تعديلات متعارضة: حُفظت البيانات المحلية. صدّر بياناتك في الإعدادات قبل مقارنة النسخة السحابية.',
                  )
                : t(
                    'Progression locale conservée. La synchronisation réessaie à la connexion.',
                    'Local progress is retained. Sync retries when connected and signed in.',
                    'يبقى تقدمك محفوظاً محلياً. تُعاد المزامنة عند الاتصال وتسجيل الدخول.',
                  ))}
      </Label>
      <Button
        quiet
        title={t('Réessayer', 'Retry saving / sync', 'أعد الحفظ والمزامنة')}
        onPress={() => {
          retry();
          retrySync();
        }}
      />
    </Card>
  );
}
