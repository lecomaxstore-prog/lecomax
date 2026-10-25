import React, { useEffect, useRef, useState } from 'react';
import { NativeModules, Platform, ScrollView } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Button, Card, Label } from '../components/UI';
import { useSchool } from '../store/School';
import { parseInternetInvitation } from '../utils/phone-internet';

const remote = NativeModules.PhoneRemote as undefined | { startInternetShare(id: string, token: string): Promise<void>; stop(): void; status(): Promise<{ state: string }> };
export default function PhoneShare() {
  const { t, colors } = useSchool();
  const value = useLocalSearchParams<{ invite?: string | string[] }>().invite;
  const invite = parseInternetInvitation(value);
  const [state, setState] = useState<'consent' | 'starting' | 'sharing' | 'ended'>('consent');
  const [error, setError] = useState('');
  const owns = useRef(false), pending = useRef(false), generation = useRef(0);
  useEffect(() => () => { generation.current++; if (pending.current && owns.current) remote?.stop(); }, []);
  useEffect(() => {
    if (state !== 'sharing') return;
    const timer = setInterval(() => { void remote?.status().then(s => { if (['idle', 'error', 'capture-stopped'].includes(s.state)) { owns.current = false; setState('ended'); } }).catch(() => {}); }, 1000);
    return () => clearInterval(timer);
  }, [state]);
  return <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 24, gap: 18 }}>
    <Stack.Screen options={{ headerShown: false }} />
    <Label bold size={26}>ACADEMY</Label>
    <Card style={{ padding: 22, gap: 16 }}>
      <Label bold size={24}>{t('Partager cet écran ?', 'Share this screen?', 'هل تشارك هذه الشاشة؟')}</Label>
      <Label>{t('La personne qui a envoyé ce lien pourra voir tout ce qui apparaît sur cet écran. Elle ne pourra pas toucher, écrire ou contrôler ton téléphone. Aucun Tailscale ni compte requis.', 'The person who sent this link will be able to watch what appears on this screen. They cannot tap, type, or control your phone. No Tailscale or account required.', 'سيتمكن مرسل الرابط من مشاهدة ما يظهر على هذه الشاشة. لا يمكنه اللمس أو الكتابة أو التحكم بهاتفك. لا حاجة إلى Tailscale أو حساب.')}</Label>
      <Label muted>{t('Le partage passe par le serveur ACADEMY. Tu peux arrêter depuis la notification Android à tout moment.', 'Sharing passes through the ACADEMY server. Stop anytime from the Android notification.', 'تمر المشاركة عبر خادم ACADEMY. يمكنك الإيقاف في أي وقت من إشعار أندرويد.')}</Label>
      {!invite && <Label>{t('Lien invalide. Demande un nouveau lien.', 'Invalid link. Ask for a new invitation.', 'رابط غير صالح. اطلب دعوة جديدة.')}</Label>}
      {(!remote?.startInternetShare || Platform.OS !== 'android') && <Label>{t('Installe la nouvelle version Android de Learn, puis rouvre le lien.', 'Install the new Android version of Learn, then reopen the link.', 'ثبّت إصدار أندرويد الجديد من Learn ثم افتح الرابط مجدداً.')}</Label>}
      {state === 'consent' && <Button disabled={!invite || !remote?.startInternetShare || Platform.OS !== 'android'} title={t('Approuver et partager mon écran', 'Approve and share my screen', 'الموافقة ومشاركة شاشتي')} onPress={async () => {
        if (!invite || pending.current) return;
        const request = ++generation.current; pending.current = true; setState('starting'); setError('');
        try {
          const before = await remote!.status();
          if (request !== generation.current) return;
          if (!['idle', 'error', 'capture-stopped', 'rotation-stopped'].includes(before.state)) throw Error(t('Arrête le partage actuel avant de continuer.', 'Stop existing sharing before continuing.', 'أوقف المشاركة الحالية قبل المتابعة.'));
          owns.current = true; await remote!.startInternetShare(invite.id, invite.token);
          let ready = false;
          for (let i = 0; i < 40 && request === generation.current; i++) {
            const status = await remote!.status();
            if (status.state === 'sharing') { ready = true; break; }
            if (['error', 'capture-stopped'].includes(status.state)) break;
            await new Promise(resolve => setTimeout(resolve, 500));
          }
          if (request !== generation.current) return;
          if (!ready) throw Error(t('Lien expiré ou connexion indisponible. Demande un nouveau lien.', 'Link expired or connection unavailable. Ask for a new link.', 'الرابط منتهي أو الاتصال غير متاح. اطلب رابطاً جديداً.'));
          pending.current = false; setState('sharing');
        } catch (e) {
          if (request !== generation.current) return;
          if (owns.current) remote!.stop(); owns.current = false; pending.current = false; setState('consent'); setError(e instanceof Error ? e.message : 'Unable to share.');
        }
      }} />}
      {state === 'starting' && <Label>{t('Accepte la demande de capture Android…', 'Accept Android’s screen-capture prompt…', 'وافق على طلب التقاط الشاشة من أندرويد…')}</Label>}
      {state === 'sharing' && <Label bold>{t('Partage actif. Ouvre tes applications normalement.', 'Screen sharing is active. Use your apps normally.', 'مشاركة الشاشة نشطة. استخدم تطبيقاتك بشكل عادي.')}</Label>}
      {state === 'ended' && <Label>{t('Partage terminé.', 'Sharing ended.', 'انتهت المشاركة.')}</Label>}
      {state !== 'ended' && <Button quiet title={state === 'sharing' ? t('Arrêter le partage', 'Stop sharing', 'إيقاف المشاركة') : t('Refuser / Annuler', 'Decline / Cancel', 'رفض / إلغاء')} onPress={() => { generation.current++; if (owns.current) remote?.stop(); owns.current = false; pending.current = false; setState('ended'); }} />}
      {!!error && <Label>{error}</Label>}
    </Card>
  </ScrollView>;
}
