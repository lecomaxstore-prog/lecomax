import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useGlobalSearchParams, usePathname, useRootNavigationState, type Href } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { resumeRoute, savedResumeRoute } from '../utils/resume-route';

const key = 'lecomax.navigation.last-page.v1';
let writes: Promise<unknown> = Promise.resolve();
export function ResumeNavigation() {
  const path = usePathname();
  const params = useGlobalSearchParams();
  const navigation = useRootNavigationState();
  const latest = useRef({ path, params });
  useEffect(() => { latest.current = { path, params }; }, [path, params]);
  const started = useRef(false);
  const [ready, setReady] = useState(false);
  const restoring = useRef('');
  useEffect(() => {
    if (Platform.OS === 'web' || !navigation?.key || started.current) return;
    started.current = true;
    void AsyncStorage.getItem(key).then(value => {
      const target = savedResumeRoute(value);
      // A notification/deep link or navigation during storage loading wins.
      if (latest.current.path === '/' && !Object.keys(latest.current.params).length && target && target !== '/') {
        restoring.current = target.split('?')[0] || '/';
        router.replace(target as Href);
      }
    }).catch(() => {}).finally(() => setReady(true));
  }, [navigation?.key]);
  useEffect(() => {
    if (!ready || Platform.OS === 'web') return;
    if (restoring.current && path !== restoring.current) return;
    restoring.current = '';
    const value = resumeRoute(path, params);
    if (value) writes = writes.catch(() => {}).then(() => AsyncStorage.setItem(key, value));
  }, [ready, path, params]);
  return null;
}
