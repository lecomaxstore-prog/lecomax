import React, { useEffect, useEffectEvent, useState } from 'react';
import { Button, Card, Label } from '../components/UI';
import { useSchool } from '../store/School';
import { auth } from '../services/auth';
type Device = {
  id: string;
  device: string;
  remembered: boolean;
  created_at: string;
  last_seen: string;
  expires_at: string;
};
export function SecuritySettings() {
  const { t } = useSchool();
  const [devices, setDevices] = useState<Device[]>([]),
    [current, setCurrent] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  async function load() {
    const result = await auth.sessions();
    setDevices(result.sessions);
    setCurrent(result.currentSessionId);
  }
  const initialLoad = useEffectEvent(() => {
    void auth
      .sessions()
      .then((result) => {
        setDevices(result.sessions);
        setCurrent(result.currentSessionId);
      })
      .catch(() =>
        setError(
          t(
            'Impossible de charger les appareils.',
            'Could not load devices.',
            'تعذر تحميل الأجهزة.',
          ),
        ),
      );
  });
  useEffect(() => {
    initialLoad();
  }, []);
  async function act(fn: () => Promise<unknown>) {
    setBusy(true);
    setError('');
    try {
      await fn();
      if (auth.snapshot() === 'authenticated') await load();
    } catch {
      setError(
        t(
          'Action non confirmée. Vérifie la connexion et réessaie.',
          'Action not confirmed. Check your connection and retry.',
          'لم يتم تأكيد العملية. تحقق من الاتصال وأعد المحاولة.',
        ),
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Card>
      <Label bold size={20}>
        {t('Sécurité et appareils', 'Security & devices', 'الأمان والأجهزة')}
      </Label>
      <Label muted>
        {t(
          'Sessions privées, révocables à tout moment.',
          'Private sessions you can revoke at any time.',
          'جلسات خاصة يمكنك إلغاءها في أي وقت.',
        )}
      </Label>
      {devices.map((d) => (
        <Card key={d.id}>
          <Label bold>
            {d.device}
            {d.id === current ? ' · ' + t('Cet appareil', 'This device', 'هذا الجهاز') : ''}
          </Label>
          <Label muted>
            {d.remembered
              ? t('Appareil mémorisé', 'Remembered device', 'جهاز محفوظ')
              : t('Session temporaire', 'Session only', 'جلسة مؤقتة')}
          </Label>
          <Label size={12}>
            {t('Connexion', 'Signed in', 'تسجيل الدخول')}: {new Date(d.created_at).toLocaleString()}
          </Label>
          <Label size={12}>
            {t('Dernière activité', 'Last active', 'آخر نشاط')}:{' '}
            {new Date(d.last_seen).toLocaleString()}
          </Label>
          <Label size={12}>
            {t('Expiration', 'Expires', 'تنتهي')}: {new Date(d.expires_at).toLocaleString()}
          </Label>
          <Button
            quiet
            disabled={busy}
            title={
              d.id === current
                ? t(
                    'Exiger une nouvelle connexion',
                    'Require login again',
                    'طلب تسجيل الدخول مجددًا',
                  )
                : t('Révoquer cet appareil', 'Revoke device', 'إلغاء هذا الجهاز')
            }
            onPress={() => void act(() => auth.revoke(d.id))}
          />
        </Card>
      ))}
      {!!error && <Label accessibilityRole="alert">{error}</Label>}
      <Button
        quiet
        disabled={busy}
        title={t('Actualiser les appareils', 'Refresh devices', 'تحديث الأجهزة')}
        onPress={() => void act(load)}
      />
      <Button
        quiet
        disabled={busy}
        title={t(
          'Déconnecter les autres appareils',
          'Sign out other devices',
          'تسجيل خروج الأجهزة الأخرى',
        )}
        onPress={() => void act(() => auth.revoke('others'))}
      />
      <Button
        quiet
        disabled={busy}
        title={t(
          'Déconnecter tous les appareils',
          'Sign out all devices',
          'تسجيل خروج جميع الأجهزة',
        )}
        onPress={() => void act(() => auth.revoke('all'))}
      />
      <Button
        disabled={busy}
        title={t('Se déconnecter', 'Sign out', 'تسجيل الخروج')}
        onPress={() => void act(auth.logout)}
      />
    </Card>
  );
}
