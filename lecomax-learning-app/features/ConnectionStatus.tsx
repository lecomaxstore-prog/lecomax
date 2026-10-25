import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { Label } from '../components/UI';
import { useSchool } from '../store/School';
export function ConnectionStatus() {
  const [online, setOnline] = useState<boolean | null>(null);
  const { t } = useSchool();
  useEffect(() => {
    let mounted = true;
    let controller: AbortController | undefined;
    const check = async () => {
      controller?.abort();
      const active = new AbortController();
      controller = active;
      const timer = setTimeout(() => active.abort(), 6000);
      try {
        await fetch('https://lecomax.com/favicon.ico', {
          method: 'HEAD',
          mode: 'no-cors',
          signal: active.signal,
        });
        if (mounted) setOnline(true);
      } catch {
        if (mounted) setOnline(false);
      } finally {
        clearTimeout(timer);
      }
    };
    void check();
    const listener = AppState.addEventListener('change', (s) => {
      if (s === 'active') void check();
    });
    return () => {
      mounted = false;
      controller?.abort();
      listener.remove();
    };
  }, []);
  return (
    <Label muted size={12}>
      {online === false
        ? t(
            'Connexion indisponible · les cours restent accessibles hors ligne',
            'Connection unavailable · lessons remain available offline',
            'الاتصال غير متاح · الدروس متاحة دون إنترنت',
          )
        : online
          ? t(
              'Connecté · cours également disponibles hors ligne',
              'Connected · lessons also available offline',
              'متصل · الدروس متاحة دون إنترنت أيضًا',
            )
          : t(
              'Cours disponibles hors ligne',
              'Lessons available offline',
              'الدروس متاحة دون إنترنت',
            )}
    </Label>
  );
}
