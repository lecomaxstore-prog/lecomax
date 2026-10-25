import React, { useEffect, useRef, useState } from 'react';
import { Linking, Platform, Share, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { auth, API } from '../services/auth';
import { Button, Card, Label } from './UI';
import { useSchool } from '../store/School';
import { InternetPhoneViewer } from './InternetPhoneViewer';
import { internetInvitationLink, parseInternetInvitation, PHONE_INTERNET_ORIGIN } from '../utils/phone-internet';

type Session = { id: string; shareToken: string; viewerToken: string; expiresAt: number };
async function revoke(session: Session) {
  const abort = new AbortController(); const timeout = setTimeout(() => abort.abort(), 10000);
  try {
    const response = await fetch(`${PHONE_INTERNET_ORIGIN}/invitations/${session.id}/stop`, { method: 'POST', headers: { Authorization: `Bearer ${session.viewerToken}` }, signal: abort.signal });
    if (!response.ok && response.status !== 410) throw Error('Disconnect unconfirmed');
  } finally { clearTimeout(timeout); }
}
export function PhoneInternetInvitation({ blocked }: { blocked: boolean }) {
  const { t, colors } = useSchool();
  const [session, setSession] = useState<Session | null>(null);
  const current = useRef<Session | null>(null);
  const generation = useRef(0);
  const [busy, setBusy] = useState(false), [connected, setConnected] = useState(false);
  const [error, setError] = useState(''), [paste, setPaste] = useState(''), [notice, setNotice] = useState('');
  useEffect(() => () => { generation.current++; if (current.current) void revoke(current.current).catch(() => {}); }, []);
  const link = session ? internetInvitationLink(session.id, session.shareToken) : null;
  const message = t('Ouvre ce lien dans Learn et approuve le partage de ton écran. Aucun Tailscale nécessaire.', 'Open this link in Learn and approve sharing your screen. No Tailscale needed.', 'افتح هذا الرابط في Learn ووافق على مشاركة شاشتك. لا حاجة إلى Tailscale.') + '\n' + link;
  const ended = () => { current.current = null; setSession(null); setConnected(false); setNotice(t('Partage terminé.', 'Sharing ended.', 'انتهت المشاركة.')); };
  const stopSession = async () => {
    if (!current.current) return;
    setBusy(true); setError('');
    try { await revoke(current.current); ended(); }
    catch { setError(t('Arrêt non confirmé. Réessaie ou arrête sur le téléphone partagé.', 'Stop not confirmed. Retry or stop on the sharing phone.', 'لم يتم تأكيد الإيقاف. حاول مجدداً أو أوقف المشاركة من الهاتف الآخر.')); }
    finally { setBusy(false); }
  };
  return <Card style={{ padding: 18, gap: 12 }}>
    <Label bold size={20}>{t('Voir mon téléphone · Sans Tailscale', 'Watch my phone · No Tailscale', 'مشاهدة هاتفي · بدون Tailscale')}</Label>
    <Label>{t('Envoie le lien via WhatsApp. Sur le deuxième téléphone, ouvre Learn et approuve le partage puis la demande Android. Reviens ici pour regarder.', 'Send the link through WhatsApp. On the second phone, open Learn and approve sharing, then the Android prompt. Return here to watch.', 'أرسل الرابط عبر واتساب. على الهاتف الثاني افتح Learn ووافق على المشاركة ثم طلب أندرويد. ارجع إلى هنا للمشاهدة.')}</Label>
    <Label muted>{t('Wi-Fi ou données mobiles suffisent. Learn doit être installé sur le téléphone partagé. Aucun compte ni réglage réseau demandé au destinataire. Lecture seule, arrêt possible à tout moment.', 'Wi-Fi or mobile data is enough. Learn must be installed on the sharing phone. The recipient needs no account or network setup. View only, with Stop available anytime.', 'يكفي واي فاي أو بيانات الهاتف. يجب تثبيت Learn على الهاتف المشارك. لا يحتاج المستلم إلى حساب أو إعداد شبكة. مشاهدة فقط مع إمكانية الإيقاف في أي وقت.')}</Label>
    {!session && <>
      <Button disabled={blocked || busy || Platform.OS !== 'android'} loading={busy} title={t('Créer un lien Internet', 'Create internet sharing link', 'إنشاء رابط مشاركة عبر الإنترنت')} onPress={async () => {
        if (busy) return; const attempt = ++generation.current; setBusy(true); setError(''); setNotice('');
        const abort = new AbortController(); const timer = setTimeout(() => abort.abort(), 15000);
        try {
          const token = await auth.token();
          const response = await fetch(API + '/api/learning-mobile/phone-invitations', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, signal: abort.signal });
          if (!response.ok) throw Error(t('Le serveur de partage Internet n’est pas encore disponible. Il doit être mis en ligne pour créer ce lien.', 'The internet-sharing server is not available yet. It must be brought online before a link can be created.', 'خادم المشاركة عبر الإنترنت غير متاح حالياً. يجب تشغيله قبل إنشاء الرابط.'));
          const value: Session = await response.json();
          if (!internetInvitationLink(value.id, value.shareToken) || !/^[a-f0-9]{64}$/.test(value.viewerToken) || !Number.isFinite(value.expiresAt) || value.expiresAt <= Date.now()) throw Error('Invalid invitation response');
          if (attempt !== generation.current) { void revoke(value).catch(() => {}); return; }
          current.current = value; setSession(value);
        } catch (e) { if (attempt === generation.current) setError(e instanceof Error ? e.message : 'Connection unavailable'); }
        finally { clearTimeout(timer); if (attempt === generation.current) setBusy(false); }
      }} />
      <Label bold>{t('Ouvrir un lien reçu', 'Open a received link', 'فتح رابط مستلم')}</Label>
      <TextInput value={paste} onChangeText={setPaste} maxLength={1024} autoCapitalize="none" autoCorrect={false} accessibilityLabel="Internet invitation link" placeholder="https://lecomax.com/phone-invite.html#…" style={{ padding: 14, borderWidth: 1, borderRadius: 14, borderColor: colors.muted, color: colors.text }} />
      <Button quiet disabled={blocked || busy || !paste.trim()} title={t('Ouvrir la demande', 'Open sharing request', 'فتح طلب المشاركة')} onPress={() => {
        try {
          const url = new URL(paste.trim()); const params = new URLSearchParams(url.hash.slice(1)); const payload = params.get('invite');
          if (url.origin !== 'https://lecomax.com' || url.pathname !== '/phone-invite.html' || url.search || url.username || url.password || [...params.keys()].length !== 1 || !parseInternetInvitation(payload)) throw Error();
          setPaste(''); router.push({ pathname: '/phone-share', params: { invite: payload! } });
        } catch { setError(t('Colle le lien Internet complet reçu.', 'Paste the complete internet invitation link.', 'الصق رابط الدعوة الكامل.')); }
      }} />
    </>}
    {session && <>
      <Label bold>{connected ? t('Téléphone connecté · Lecture seule', 'Phone connected · View only', 'الهاتف متصل · مشاهدة فقط') : t('En attente de son approbation · Lien valable 10 minutes', 'Waiting for approval · Link valid for 10 minutes', 'بانتظار الموافقة · الرابط صالح لمدة 10 دقائق')}</Label>
      {!connected && <View style={{ gap: 8 }}>
        <Button title={t('Envoyer via WhatsApp', 'Send through WhatsApp', 'الإرسال عبر واتساب')} onPress={() => { void Linking.openURL('whatsapp://send?text=' + encodeURIComponent(message)).catch(() => Share.share({ message })).catch(() => setError('Unable to open sharing. Copy the link.')); }} />
        <Button quiet title={t('Copier le lien', 'Copy link', 'نسخ الرابط')} onPress={() => { void Clipboard.setStringAsync(link!).then(() => setNotice(t('Lien copié.', 'Link copied.', 'تم نسخ الرابط.'))).catch(() => setError('Unable to copy.')); }} />
      </View>}
      <InternetPhoneViewer id={session.id} token={session.viewerToken} onConnected={() => setConnected(true)} onEnded={() => { void stopSession(); }} />
      <Button disabled={busy} title={t('Arrêter / Annuler le lien', 'Stop / Cancel link', 'إيقاف / إلغاء الرابط')} onPress={() => { void stopSession(); }} />
    </>}
    {!!notice && <Label>{notice}</Label>}{!!error && <Label>{error}</Label>}
  </Card>;
}
