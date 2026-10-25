import React, { useEffect, useRef, useState } from 'react';
import { Linking, NativeModules, Platform, Share, TextInput, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { Button, Card, Label } from './UI';
import { useSchool } from '../store/School';
import { parsePhoneInvitation, phoneInvitationLink, phoneInvitationPayload, type PhoneInvitation as Invitation } from '../utils/phone-invitation';
import { parsePhonePairingPayload, type PhonePairing } from '../utils/phone-pairing';

type InviteNative = {
  createInvitation(): Promise<string>;
  invitationStatus(): Promise<{ expired: boolean; pair: string }>;
  cancelInvitation(): void;
  finishInvitation(): void;
  startViewOnly(): Promise<void>;
  allowQrConnection(): Promise<string>;
  status(): Promise<{ state: string; directUrl: string; tailscaleIp: string; viewOnly: boolean }>;
  stop(): void;
};
const remote = NativeModules.PhoneRemote as InviteNative | undefined;

export function PhoneInvitation({ incoming, blocked, onOpen, onConnect }: {
  incoming?: string | string[]; blocked: boolean;
  onOpen: (open: boolean) => void; onConnect: (pair: PhonePairing) => void;
}) {
  const { t, colors } = useSchool();
  const [invite, setInvite] = useState<Invitation | null>(null);
  const [link, setLink] = useState('');
  const [phase, setPhase] = useState<'idle' | 'waiting' | 'consent' | 'starting' | 'shared'>('idle');
  const [error, setError] = useState('');
  const [receivedLink, setReceivedLink] = useState('');
  const [notice, setNotice] = useState('');
  const [remaining, setRemaining] = useState(600);
  const deadline = useRef(0);
  const generation = useRef(0);
  const starting = useRef(false);
  const captureRequested = useRef(false);
  const transferred = useRef(false);
  const consumed = useRef<unknown>(undefined);
  const callbacks = useRef({ onOpen, onConnect });
  useEffect(() => { callbacks.current = { onOpen, onConnect }; }, [onOpen, onConnect]);
  const supported = Platform.OS === 'android' && !!remote?.createInvitation && !!remote?.startViewOnly;
  useEffect(() => {
    if (incoming === undefined) { consumed.current = undefined; return; }
    if (incoming === consumed.current) return;
    consumed.current = incoming;
    const request = ++generation.current;
    void (remote ? remote.status() : Promise.resolve(null)).then(current => {
      if (request !== generation.current) return;
      router.setParams({ invite: undefined });
      if (blocked || phase !== 'idle' || (current && !['idle', 'error', 'capture-stopped', 'rotation-stopped'].includes(current.state))) {
        setError(t('Termine la session actuelle puis rouvre le lien.', 'End the current session, then reopen the link.', 'أنه الجلسة الحالية ثم افتح الرابط مجدداً.')); return;
      }
      const parsed = parsePhoneInvitation(incoming);
      if (!parsed) { setError(t('Lien invalide.', 'Invalid invitation link.', 'رابط الدعوة غير صالح.')); return; }
      setInvite(parsed); setPhase('consent'); callbacks.current.onOpen(true);
    }).catch(() => { if (request === generation.current) setError(t('Impossible de vérifier le partage. Rouvre le lien.', 'Unable to check sharing. Reopen the link.', 'تعذر التحقق من المشاركة. افتح الرابط مجدداً.')); });
  }, [incoming, blocked, phase, t]);
  useEffect(() => () => {
    generation.current++;
    if (!transferred.current) remote?.cancelInvitation?.();
    if (starting.current && captureRequested.current) remote?.stop();
  }, []);
  useEffect(() => {
    if (phase !== 'waiting' && phase !== 'shared') return;
    let alive = true, polling = false;
    const poll = async () => {
      if (polling) return;
      polling = true;
      try {
        if (phase === 'shared') {
          const status = await remote!.status();
          if (alive && ['idle', 'error', 'capture-stopped'].includes(status.state)) {
            setPhase('idle'); callbacks.current.onOpen(false);
            setError(t('Partage terminé. Crée une nouvelle invitation pour reprendre.', 'Sharing ended. Create a new invitation to share again.', 'انتهت المشاركة. أنشئ دعوة جديدة للاستئناف.'));
          }
        } else {
          if (alive) setRemaining(Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000)));
          const status = await remote!.invitationStatus();
          if (!alive) return;
          const pair = parsePhonePairingPayload(status.pair);
          if (pair) {
            transferred.current = true; remote!.finishInvitation(); setLink(''); setPhase('idle'); callbacks.current.onOpen(false);
            callbacks.current.onConnect(pair);
          } else if (status.expired) {
            setLink(''); setPhase('idle'); callbacks.current.onOpen(false);
            setError(t('Invitation expirée. Crée un nouveau lien.', 'Invitation expired. Create a new link.', 'انتهت صلاحية الدعوة. أنشئ رابطاً جديداً.'));
          }
        }
      } catch { if (alive) setError(t('Vérifie Tailscale. Nouvelle tentative automatique.', 'Check Tailscale. Retrying automatically.', 'تحقق من Tailscale. تجري إعادة المحاولة تلقائياً.')); }
      finally { polling = false; }
    };
    void poll(); const timer = setInterval(() => void poll(), 1000);
    return () => { alive = false; clearInterval(timer); };
  }, [phase, t]);
  const cancel = () => {
    generation.current++; remote?.cancelInvitation?.();
    if (captureRequested.current) remote?.stop();
    captureRequested.current = false;
    starting.current = false; setInvite(null); setLink(''); setPhase('idle'); setError(''); setNotice(''); onOpen(false);
  };
  const accept = async () => {
    if (!invite || starting.current || blocked) return;
    const id = ++generation.current; starting.current = true; setPhase('starting'); setError('');
    try {
      const before = await remote!.status();
      if (id !== generation.current) return;
      if (invite.origin === `http://${before.tailscaleIp}:8093`) throw new Error(t('Ouvre ce lien sur ton autre téléphone.', 'Open this link on your other phone.', 'افتح هذا الرابط على هاتفك الآخر.'));
      if (!['idle', 'error', 'capture-stopped', 'rotation-stopped'].includes(before.state)) throw new Error(t('Arrête le partage actuel avant de continuer.', 'Stop the current sharing session before continuing.', 'أوقف المشاركة الحالية قبل المتابعة.'));
      captureRequested.current = true;
      await remote!.startViewOnly();
      let ready = false;
      for (let i = 0; i < 30 && id === generation.current; i++) {
        const status = await remote!.status();
        if (status.state === 'waiting' && status.viewOnly && status.directUrl) { ready = true; break; }
        if (['error', 'capture-stopped'].includes(status.state)) break;
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      if (id !== generation.current) return;
      if (!ready) throw new Error(t('Impossible de démarrer le partage.', 'Unable to start sharing.', 'تعذر بدء المشاركة.'));
      // The explicit approval above plus Android consent authorize exactly one viewer.
      const code = await remote!.allowQrConnection();
      let delivered = false;
      for (let i = 0; i < 3 && id === generation.current; i++) {
        const abort = new AbortController(); const timer = setTimeout(() => abort.abort(), 8000);
        try {
          const response = await fetch(invite.origin + '/accept', { method: 'POST',
            headers: { Authorization: `Bearer ${invite.token}`, 'X-Pairing-Code': code }, signal: abort.signal });
          if (!response.ok) throw new Error('Invitation unavailable');
          delivered = true; break;
        } catch { /* The native receiver accepts identical retries only. */ }
        finally { clearTimeout(timer); }
      }
      if (id !== generation.current) return;
      if (!delivered) throw new Error(t('Lien expiré ou téléphone inaccessible. Rouvre la page sur le téléphone principal et crée un nouveau lien.', 'Link expired or phone unreachable. Reopen this page on the main phone and create a new link.', 'الرابط منتهي أو الهاتف غير متاح. افتح هذه الصفحة على الهاتف الرئيسي وأنشئ رابطاً جديداً.'));
      starting.current = false; setPhase('shared'); setInvite(null);
    } catch (e) {
      if (id !== generation.current) return;
      if (captureRequested.current) remote?.stop();
      captureRequested.current = false; starting.current = false; setPhase('consent');
      setError(e instanceof Error ? e.message : 'Unable to share.');
    }
  };
  const shareMessage = t('Ouvre ce lien sur mon deuxième téléphone Android pour approuver la diffusion de son écran en lecture seule dans ACADEMY :', 'Open this link on my second Android phone to approve view-only screen sharing in ACADEMY:', 'افتح هذا الرابط على هاتفي الثاني للموافقة على مشاركة شاشته للمشاهدة فقط في ACADEMY:') + '\n' + link;
  const shareFailed = () => setError(t('Impossible de partager. Copie le lien et colle-le dans WhatsApp.', 'Unable to share. Copy the link and paste it into WhatsApp.', 'تعذرت المشاركة. انسخ الرابط والصقه في واتساب.'));
  return <Card style={{ padding: 18, gap: 12 }}>
    <Label bold size={18}>{t('Option 3 · Lien WhatsApp', 'Option 3 · WhatsApp invitation', 'الخيار 3 · دعوة عبر واتساب')}</Label>
    <Label>{t('Envoie le lien à ton deuxième téléphone Android. Après son accord et la confirmation Android, son écran apparaît ici en lecture seule.', 'Send a link to your second Android phone. After approval and Android screen-capture consent, its screen appears here for viewing only.', 'أرسل الرابط إلى هاتفك الثاني الذي يعمل بأندرويد. بعد الموافقة وتأكيد التقاط الشاشة، تظهر شاشته هنا للمشاهدة فقط.')}</Label>
    <Label muted>{t('Application à jour et Tailscale requis sur les deux téléphones. Garde cette page ouverte en attendant. Le lien privé expire après 10 minutes et accepte un seul appareil.', 'Both phones need the updated app and Tailscale. Keep this page open while waiting. The private link expires after 10 minutes and accepts one device.', 'يلزم التطبيق المحدّث وTailscale على الهاتفين. أبقِ هذه الصفحة مفتوحة أثناء الانتظار. الرابط الخاص صالح لمدة 10 دقائق ولهاتف واحد.')}</Label>
    {!supported && <Label>{t('Installe la nouvelle version Android sur les deux téléphones pour utiliser les invitations.', 'Install the new Android build on both phones to use invitations.', 'ثبّت إصدار أندرويد الجديد على الهاتفين لاستخدام الدعوات.')}</Label>}
    {phase === 'idle' && <Button disabled={!supported || blocked} title={t('Créer un lien de visionnage', 'Create viewing invitation', 'إنشاء رابط دعوة للمشاهدة')} onPress={async () => {
      setError(''); setNotice(''); transferred.current = false; const id = ++generation.current; setPhase('starting'); onOpen(true);
      try {
        const value = await remote!.createInvitation();
        if (id !== generation.current) { remote!.cancelInvitation(); return; }
        const url = phoneInvitationLink(value); if (!url) throw new Error('Invalid invitation.');
        deadline.current = Date.now() + 600000; setRemaining(600); setLink(url); setPhase('waiting');
      } catch (e) { if (id === generation.current) { setPhase('idle'); onOpen(false); setError(e instanceof Error ? e.message : 'Unable to create invitation.'); } }
    }} />}
    {phase === 'idle' && <>
      <Label bold>{t('Ouvrir un lien reçu', 'Open a received link', 'فتح رابط مستلم')}</Label>
      <TextInput accessibilityLabel={t('Lien d’invitation reçu', 'Received invitation link', 'رابط الدعوة المستلم')} placeholder="https://lecomax.com/phone-invite.html#…" value={receivedLink} onChangeText={setReceivedLink} maxLength={1024} autoCapitalize="none" autoCorrect={false} keyboardType="url" style={{ padding: 14, borderWidth: 1, borderColor: colors.muted, borderRadius: 14, color: colors.text, writingDirection: 'ltr' }} />
      <Button quiet disabled={!supported || blocked || !receivedLink.trim()} title={t('Vérifier l’invitation', 'Review invitation', 'مراجعة الدعوة')} onPress={() => {
        const payload = phoneInvitationPayload(receivedLink);
        if (!payload) { setError(t('Colle le lien complet reçu sur WhatsApp.', 'Paste the complete invitation link received in WhatsApp.', 'الصق رابط الدعوة الكامل المستلم في واتساب.')); return; }
        setError(''); setReceivedLink(''); router.setParams({ invite: payload });
      }} />
    </>}
    {phase === 'waiting' && <>
      <Label bold>{t('En attente de ton deuxième téléphone…', 'Waiting for your second phone…', 'بانتظار هاتفك الثاني…')}</Label>
      <Label>{t('Lien valable encore : ', 'Link expires in: ', 'تنتهي صلاحية الرابط خلال: ') + `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}`}</Label>
      <Label>{t('Après l’envoi dans WhatsApp, reviens ici. Sur le deuxième téléphone : ouvre le lien, ouvre Learn, puis approuve le partage et la capture Android.', 'After sending in WhatsApp, return here. On the second phone: open the link, open Learn, then approve sharing and Android screen capture.', 'بعد الإرسال في واتساب ارجع إلى هنا. على الهاتف الثاني: افتح الرابط ثم Learn ووافق على المشاركة والتقاط الشاشة من أندرويد.')}</Label>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <Button title={t('Envoyer via WhatsApp', 'Send through WhatsApp', 'الإرسال عبر واتساب')} onPress={() => {
          void Linking.openURL('whatsapp://send?text=' + encodeURIComponent(shareMessage)).catch(() => Share.share({ message: shareMessage })).catch(shareFailed);
        }} />
        <Button quiet title={t('Partager le lien', 'Share link', 'مشاركة الرابط')} onPress={() => { void Share.share({ message: shareMessage }).catch(shareFailed); }} />
        <Button quiet title={t('Copier le lien', 'Copy link', 'نسخ الرابط')} onPress={() => { void Clipboard.setStringAsync(link).then(() => setNotice(t('Lien copié. Colle-le dans WhatsApp.', 'Link copied. Paste it into WhatsApp.', 'تم نسخ الرابط. الصقه في واتساب.'))).catch(shareFailed); }} />
      </View>
    </>}
    {phase === 'consent' && <>
      <Label bold>{t('Autoriser ce téléphone à voir ton écran ?', 'Allow this phone to watch your screen?', 'هل تسمح لهذا الهاتف بمشاهدة شاشتك؟')}</Label>
      <Label selectable>{invite?.origin}</Label>
      <Label>{t('Tu partageras ce téléphone. Aucun toucher, clavier ou contrôle à distance. Tu peux arrêter dans la notification Android.', 'You will share this phone’s screen. No remote taps, typing, or control. Stop at any time from the Android notification.', 'ستشارك شاشة هذا الهاتف. لا لمس أو كتابة أو تحكم عن بُعد. يمكنك الإيقاف في أي وقت من إشعار أندرويد.')}</Label>
      <Button disabled={!supported || blocked} title={t('Approuver le partage en lecture seule', 'Approve view-only sharing', 'الموافقة على المشاركة للمشاهدة فقط')} onPress={() => { void accept(); }} />
    </>}
    {phase === 'starting' && <Label>{t('Connexion… Accepte la demande Android si elle apparaît.', 'Connecting… Approve the Android prompt if it appears.', 'جارٍ الاتصال… وافق على طلب أندرويد إذا ظهر.')}</Label>}
    {phase === 'shared' && <Label bold>{t('Partage en lecture seule prêt. Utilise tes applications normalement.', 'View-only sharing is ready. Use your apps normally.', 'المشاركة للمشاهدة فقط جاهزة. استخدم تطبيقاتك بشكل عادي.')}</Label>}
    {phase !== 'idle' && <Button quiet title={phase === 'shared' ? t('Arrêter le partage', 'Stop sharing', 'إيقاف المشاركة') : t('Annuler', 'Cancel', 'إلغاء')} onPress={cancel} />}
    {!!error && <Label>{error}</Label>}
    {!!notice && <Label>{notice}</Label>}
  </Card>;
}
