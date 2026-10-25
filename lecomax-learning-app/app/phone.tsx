import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { NativeModules, Platform, ScrollView, TextInput, View, useWindowDimensions } from 'react-native';
import { PhoneViewer } from '../components/PhoneViewer';
import { PhonePairingScanner } from '../components/PhonePairingScanner';
import { PhoneInvitation } from '../components/PhoneInvitation';
import QRCode from 'react-native-qrcode-svg';
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { parsePhonePairingPayload, phonePairingQr, type PhonePairing } from '../utils/phone-pairing';
import { Button, Card, Label } from '../components/UI';
import { useSchool } from '../store/School';
import { readPhoneSession } from '../utils/phone-session';

type Status = { state: string; code: string; inputEnabled: boolean; directSupported?: boolean; directUrl?: string; tailscaleIp?: string; rememberedPhone?: boolean; viewOnly?: boolean };
const remote = NativeModules.PhoneRemote as undefined | {
  start(url: string, key: string): Promise<void>; status(): Promise<Status>;
  allowQrConnection?(): Promise<string>; cancelQrConnection?(): void; approve(): void; stop(): void; openInputSettings(): void;
};
function relayOrigin(value: string) {
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' && !url.username && !url.password && !url.search && !url.hash && url.pathname === '/' ? url.origin : null;
  } catch { return null; }
}
function phoneOrigin(value: string) {
  const secure = relayOrigin(value); if (secure) return secure;
  try {
    const url = new URL(value.trim()); const p = url.hostname.split('.').map(Number);
    return url.protocol === 'http:' && p.length === 4 && p[0] === 100 && (p[1] ?? 0) >= 64 && (p[1] ?? 256) <= 127 && p.slice(2).every(n => Number.isInteger(n) && n >= 0 && n <= 255) && url.port === '8092' && !url.username && !url.password && url.pathname === '/' && !url.search && !url.hash ? url.origin : null;
  } catch { return null; }
}
export default function Phone() {
  const { colors, t, rtl } = useSchool();
  const { width } = useWindowDimensions();
  const [address, setAddress] = useState('');
  const [mode, setMode] = useState<'direct' | 'relay'>('direct');
  const [role, setRole] = useState<'share' | 'view'>('share');
  const [viewerOrigin, setViewerOrigin] = useState('');
  const [pairingCode, setPairingCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [quickCode, setQuickCode] = useState('');
  const [invitationOpen, setInvitationOpen] = useState(false);
  const incomingInvite = useLocalSearchParams<{ invite?: string | string[] }>().invite;
  const qrUntil = useRef(0);
  const incomingPair = useLocalSearchParams<{ pair?: string | string[] }>().pair;
  const pairingStarted = useRef(false);
  const pendingPair = useRef(0);
  const consumedLink = useRef<unknown>(undefined);
  const closeScanner = useCallback(() => setScanning(false), []);
  const closeViewer = useCallback(() => { setViewerOrigin(''); setPairingCode(''); }, []);
  useFocusEffect(useCallback(() => () => { pendingPair.current++; pairingStarted.current = false; setViewerOrigin(''); setPairingCode(''); setScanning(false); }, []));
  useEffect(() => {
    void AsyncStorage.getItem('lecomax.phone.viewer-address').then(value => { if (value && !pairingStarted.current) setAddress(value); }).catch(() => {});
    void AsyncStorage.getItem('lecomax.phone.role').then(value => { if (value === 'view' && !pairingStarted.current) setRole('view'); }).catch(() => {});
  }, []);
  useFocusEffect(useCallback(() => {
    let alive = true;
    if (Platform.OS !== 'web' && !pairingStarted.current && !incomingPair && !incomingInvite && !invitationOpen) {
      void AsyncStorage.getItem('lecomax.phone.viewer-address').then(async value => {
        const origin = value && phoneOrigin(value);
        if (!origin || !(await readPhoneSession(origin))) return;
        const current = await remote?.status();
        if (alive && !pairingStarted.current && (!current || ['idle', 'error', 'capture-stopped', 'rotation-stopped'].includes(current.state))) {
          setRole('view'); setAddress(origin); setViewerOrigin(origin);
        }
      }).catch(() => {});
    }
    return () => { alive = false; };
  }, [incomingPair, incomingInvite, invitationOpen]));
  const selectRole = (value: 'share' | 'view') => {
    setRole(value); void AsyncStorage.setItem('lecomax.phone.role', value).catch(() => {});
  };
  const [key, setKey] = useState('');
  const [status, setStatus] = useState<Status>({ state: 'idle', code: '', inputEnabled: false });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const available = Platform.OS === 'android' && !!remote;
  useEffect(() => {
    if (!available) return;
    let alive = true;
    const poll = () => remote!.status().then(value => {
      if (!alive) return;
      setStatus(value);
      if (value.state !== 'waiting' || (qrUntil.current && Date.now() >= qrUntil.current)) { setQuickCode(''); qrUntil.current = 0; }
    }).catch(() => { if (alive) setError('Unable to read sharing status.'); });
    void poll(); const timer = setInterval(() => void poll(), 1000);
    return () => { alive = false; clearInterval(timer); };
  }, [available]);
  const active = !['idle', 'error', 'rotation-stopped', 'capture-stopped'].includes(status.state);
  const connectPair = useCallback((pair: PhonePairing) => {
    if (pair.origin === `http://${status.tailscaleIp}:8092`) { setScanning(false); setError(t('Scanne l’autre téléphone, pas celui-ci.', 'Scan the other phone, not this phone.', 'امسح رمز الهاتف الآخر وليس هذا الهاتف.')); return; }
    if (active || busy) { setScanning(false); setError(t('Arrête le partage avant de scanner.', 'Stop sharing before scanning another phone.', 'أوقف المشاركة قبل مسح هاتف آخر.')); return; }
    pairingStarted.current = true;
    setScanning(false); setError(''); setRole('view'); setAddress(pair.origin);
    setPairingCode(pair.code); setViewerOrigin(pair.origin);
    // The one-time pairing code stays in memory, never in saved preferences.
    void AsyncStorage.setItem('lecomax.phone.role', 'view').catch(() => {});
    void AsyncStorage.setItem('lecomax.phone.viewer-address', pair.origin).catch(() => {});
  }, [active, busy, status.tailscaleIp, t]);
  useEffect(() => {
    if (incomingPair === undefined) { consumedLink.current = undefined; return; }
    if (consumedLink.current === incomingPair) return;
    consumedLink.current = incomingPair;
    router.setParams({ pair: undefined });
    const pair = parsePhonePairingPayload(incomingPair);
    const request = ++pendingPair.current;
    void (pair && remote ? remote.status() : Promise.resolve(null)).then(current => {
      if (request !== pendingPair.current) return;
      if (!pair) { setError(t('QR code invalide. Scanne à nouveau dans ACADEMY.', 'Invalid pairing QR code. Scan again inside ACADEMY.', 'رمز الاقتران غير صالح. أعد المسح داخل ACADEMY.')); return; }
      if (busy || active || viewerOrigin || (current && !['idle', 'error', 'rotation-stopped', 'capture-stopped'].includes(current.state))) {
        setError(t('Termine la session actuelle avant de connecter un autre téléphone.', 'End the current session before connecting to another phone.', 'أنه الجلسة الحالية قبل الاتصال بهاتف آخر.')); return;
      }
      connectPair(pair);
    }).catch(() => { if (request === pendingPair.current) setError(t('Impossible de vérifier le partage. Réessaie.', 'Unable to check sharing status. Try again.', 'تعذر التحقق من حالة المشاركة. أعد المحاولة.')); });
  }, [incomingPair, active, busy, viewerOrigin, connectPair, t]);
  const qrValue = mode === 'direct' && status.state === 'waiting' && status.directUrl && quickCode
    ? phonePairingQr(status.directUrl, quickCode) : null;
  const inputStyle = { padding: 16, borderWidth: 1, borderRadius: 14, borderColor: colors.muted, color: colors.text, backgroundColor: colors.card, writingDirection: 'ltr' as const };
  const states: Record<string, string> = {
    paused: t('Affichage en pause. La session reste disponible jusqu’à ton arrêt du partage.', 'Viewer paused. Your approved session stays available until you stop sharing.', 'العرض متوقف مؤقتاً. تبقى الجلسة المعتمدة متاحة حتى توقف المشاركة.'),
    reconnecting: t('En attente de Tailscale. La session reprendra avec la même adresse.', 'Waiting for Tailscale. The session resumes when the same address is available.', 'بانتظار Tailscale. تستأنف الجلسة عند عودة العنوان نفسه.'),
    'capture-stopped': t('Android a arrêté la capture. Ton adresse est conservée. Relance le partage et accepte la demande Android.', 'Android ended screen capture. Your address is saved. Start sharing again and accept the Android prompt.', 'أوقف أندرويد التقاط الشاشة. عنوانك محفوظ. ابدأ المشاركة مجدداً ووافق على طلب أندرويد.'),
    idle: t('Aucun partage en cours.', 'Not sharing.', 'لا توجد مشاركة حالياً.'),
    connecting: t('Préparation de la connexion…', 'Preparing the connection…', 'جارٍ تجهيز الاتصال…'),
    waiting: t('Prêt. Ouvre cette adresse sur l’autre téléphone et saisis le code.', 'Ready. Open this address on your other phone and enter the code.', 'جاهز. افتح هذا العنوان على الهاتف الآخر وأدخل الرمز.'),
    approval: t('Une demande est en attente. Approuve uniquement ton autre téléphone.', 'A viewer is requesting access. Approve only your other phone.', 'يوجد طلب اتصال. وافق فقط إذا كان من هاتفك الآخر.'),
    approving: t('Confirmation en cours…', 'Confirming approval…', 'جارٍ تأكيد الموافقة…'),
    sharing: status.viewOnly ? t('Ton écran est partagé en lecture seule.', 'Your screen is shared for viewing only.', 'تتم مشاركة شاشتك للمشاهدة فقط.') : t('Ton écran est partagé et peut être contrôlé.', 'Your screen is being shared and can be controlled.', 'تتم مشاركة شاشتك ويمكن التحكم بها.'),
    error: t('Partage interrompu. Vérifie Tailscale et les autorisations Android puis réessaie.', 'Sharing stopped. Check Tailscale and Android permissions, then try again.', 'توقفت المشاركة. تحقق من Tailscale وأذونات أندرويد ثم حاول مجدداً.'),
    'rotation-stopped': t('Partage arrêté après rotation. Relance dans la position souhaitée.', 'Sharing stopped after rotation. Start again in the desired orientation.', 'توقفت المشاركة بعد تدوير الشاشة. ابدأ مجدداً بالاتجاه المطلوب.'),
  };
  if (viewerOrigin) return <PhoneViewer key={viewerOrigin} origin={viewerOrigin} pairingCode={pairingCode} onClose={closeViewer} />;
  if (scanning) return <PhonePairingScanner onPair={connectPair} onClose={closeScanner} />;
  return <ScrollView contentContainerStyle={{ padding: 16, gap: 14, backgroundColor: colors.bg }} keyboardShouldPersistTaps="handled">
    <Stack.Screen options={{ headerShown: true }} />
    <View style={{ alignItems: rtl ? 'flex-end' : 'flex-start', gap: 6 }}>
      <Label bold size={28}>{t('Mon téléphone à distance', 'My remote phone', 'هاتفي عن بُعد')}</Label>
      <Label muted>{t('Tes téléphones restent associés jusqu’à la déconnexion.', 'Your phones stay paired until you disconnect.', 'يبقى هاتفاك مقترنين حتى تقطع الاتصال.')}</Label>
    </View>
    <Button disabled={active || busy || invitationOpen} title={t('Partager via Internet · Sans Tailscale', 'Share over internet · No Tailscale', 'مشاركة عبر الإنترنت · بدون Tailscale')} onPress={() => router.push('/phone-internet')} />
    <PhoneInvitation incoming={incomingInvite} blocked={active || busy || !!viewerOrigin} onOpen={setInvitationOpen} onConnect={connectPair} />
    {!invitationOpen && <>
    <Card style={{ padding: 18, gap: 12 }}>
      <Label bold size={18}>{t("Tailscale · Sans PC", "Tailscale · No PC needed", "Tailscale · بدون كمبيوتر")}</Label>
      <Label>{t("Connecte les deux téléphones au même réseau Tailscale. Démarre le partage, ouvre son adresse sur l’autre téléphone, saisis le code puis approuve la connexion.", "Connect both phones to the same Tailscale network. Start sharing on this Android phone. On your other phone, open its address and enter the code. Then approve access on the sharing phone.", "اربط الهاتفين بنفس شبكة Tailscale. ابدأ المشاركة، ثم افتح عنوان الهاتف على الهاتف الآخر وأدخل الرمز. وافق على الاتصال من الهاتف الأول.")}</Label>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <Button quiet selected={role === 'share'} disabled={active || busy} title={t("Partager ce téléphone", "Share this phone", "مشاركة هذا الهاتف")} onPress={() => { if (!active && !busy) selectRole('share'); }} />
        <Button quiet selected={role === 'view'} disabled={active || busy} title={t("Voir un autre téléphone", "View another phone", "عرض هاتف آخر")} onPress={() => { if (!active && !busy) selectRole('view'); }} />
      </View>
      {!active && <Button disabled={busy} title={t('Scanner un téléphone', 'Scan a phone', 'مسح رمز هاتف')} onPress={() => { setError(''); setScanning(true); }} />}
      <Label muted>{t('Les deux téléphones peuvent scanner ou partager. Sur le téléphone à contrôler, démarre le partage et autorise le QR. Sur le téléphone principal, appuie sur Scanner un téléphone.', 'Either phone can scan or share. On the phone to control, start sharing and allow QR connection. On the main phone, tap Scan a phone.', 'يمكن لكلا الهاتفين المسح أو المشاركة. ابدأ المشاركة واسمح باتصال QR على الهاتف المراد التحكم به، ثم اضغط مسح رمز هاتف على الهاتف الرئيسي.')}</Label>
      <Label bold>{role === 'share' ? t("Mode : partager", "Mode: share this phone", "الوضع: مشاركة هذا الهاتف") : t("Mode : visionner", "Mode: view another phone", "الوضع: عرض هاتف آخر")}</Label>
    </Card>
    {role === 'view' ? <Card style={{ padding: 18, gap: 12 }}>
      <Label bold size={18}>{t('Option 2 · Scan rapide', 'Option 2 · Scan QR code', 'الخيار 2 · مسح رمز QR')}</Label>
      <Label muted>{t('Scanne le QR code du deuxième téléphone pour te connecter ici, sans saisir d’adresse ni de code.', 'Scan the second phone’s QR code to connect here without typing an address or pairing code.', 'امسح رمز الهاتف الثاني للاتصال هنا دون كتابة عنوان أو رمز اقتران.')}</Label>
      <Button title={t('Scanner le deuxième téléphone', 'Scan the second phone', 'مسح رمز الهاتف الثاني')} onPress={() => { setError(''); setScanning(true); }} />
      <Label bold>{t('Option 1 · Saisie manuelle', 'Option 1 · Manual pairing', 'الخيار 1 · الاقتران اليدوي')}</Label>
      <Label bold size={18}>{t("Se connecter à un téléphone", "Connect to a phone", "الاتصال بهاتف")}</Label>
      <Label muted>{t("Entre l’adresse affichée sur le téléphone partagé. Garde Tailscale connecté sur les deux appareils.", "Enter the address shown on the sharing phone. Keep Tailscale connected on both devices.", "أدخل العنوان الظاهر على الهاتف الذي يشارك شاشته. أبقِ Tailscale متصلاً على الهاتفين.")}</Label>
      <TextInput accessibilityLabel="Phone connection address" placeholder="http://100.x.x.x:8092" value={address} onChangeText={setAddress} autoCapitalize="none" autoCorrect={false} keyboardType="url" style={inputStyle} />
      <Button title={t("Ouvrir la connexion", "Open connection", "فتح الاتصال")} onPress={() => {
        const origin = phoneOrigin(address);
        if (!origin) { setError(t("Entre une adresse Tailscale http://100.x.x.x:8092 ou une passerelle HTTPS.", "Enter a Tailscale address http://100.x.x.x:8092 or an HTTPS relay.", "أدخل عنوان Tailscale بصيغة http://100.x.x.x:8092 أو عنوان مرحّل HTTPS.")); return; }
        setError(''); void AsyncStorage.setItem('lecomax.phone.viewer-address', origin).catch(() => {});
        setPairingCode(''); setViewerOrigin(origin);
      }} />
    </Card> : <>
    <Card style={{ padding: 18, gap: 12 }}>
      <Label bold size={18}>{mode === 'direct' ? t("Connexion directe Tailscale", "Direct Tailscale connection", "اتصال Tailscale مباشر") : t("Passerelle HTTPS", "HTTPS relay", "مرحّل HTTPS")}</Label>
      {mode === 'direct' ? <>
        <Label muted>{status.tailscaleIp ? t("Adresse VPN détectée : ", "VPN address detected: ", "تم اكتشاف عنوان الشبكة: ") + status.tailscaleIp : t("Connecte Tailscale sur ce téléphone avant de démarrer. Aucun PC ni serveur externe nécessaire.", "Connect Tailscale on this phone before starting. No PC or external server required.", "شغّل Tailscale على هذا الهاتف قبل البدء. لا تحتاج إلى كمبيوتر أو خادم خارجي.")}</Label>
        {available && !status.directSupported && <Label>{t("Installe la nouvelle version Android pour activer ce mode.", "Install the new Android build to enable this mode.", "ثبّت إصدار أندرويد الجديد لتفعيل هذا الوضع.")}</Label>}
      </> : <TextInput accessibilityLabel="Relay HTTPS address" placeholder="https://relay.example.com" value={address} onChangeText={setAddress} editable={!active && !busy} autoCapitalize="none" autoCorrect={false} keyboardType="url" style={inputStyle} />}
      {!active && !busy && <Button quiet title={mode === 'direct' ? t("Avancé : utiliser une passerelle", "Advanced: use a relay", "متقدم: استخدام مرحّل") : t("Utiliser Tailscale directement", "Use direct Tailscale", "استخدام Tailscale مباشرة")} onPress={() => { setMode(mode === 'direct' ? 'relay' : 'direct'); setError(''); }} />}
    </Card>
    <Card style={{ padding: 18, gap: 12 }}>
    {!available ? <Label>{t('Le partage nécessite une nouvelle version Android de l’application. Expo Go, le web et l’ancienne version installée ne peuvent pas partager l’écran.', 'Sharing requires a new Android build. Expo Go, web and the currently installed older build cannot share the screen.', 'تتطلب المشاركة إصدار أندرويد جديداً. لا يمكن لـ Expo Go أو الويب أو الإصدار القديم مشاركة الشاشة.')}</Label> : <>
      <Label bold size={18}>{t("Partager ce téléphone", "Share this phone", "مشاركة هذا الهاتف")}</Label>
      <Label>{t('Après approbation, tu peux appuyer sur Accueil et ouvrir tes applications. Le partage reste visible dans la notification Android. Pour arrêter, utilise Arrêter le partage.', 'After approval, you can press Home and open your apps. Sharing stays visible in the Android notification. To end it, use Stop sharing.', 'بعد الموافقة يمكنك الضغط على الرئيسية وفتح تطبيقاتك. تظل المشاركة ظاهرة في إشعار أندرويد. لإنهائها اضغط إيقاف المشاركة.')}</Label>
      {!(active && status.viewOnly) && <><Label>{t('Active « ACADEMY remote touch » dans Accessibilité, accepte les deux demandes Android et ACADEMY.', 'Enable “ACADEMY remote touch” in Accessibility, accept both Android and ACADEMY approval prompts.', 'فعّل «ACADEMY remote touch» في إمكانية الوصول، وافق على طلبي أندرويد وACADEMY.')}</Label>
      <Button quiet title={status.inputEnabled ? t('Remote touch activé · Réglages', 'Remote touch enabled · Settings', 'اللمس عن بُعد مفعّل · الإعدادات') : t('Activer le remote touch', 'Enable remote touch', 'تفعيل اللمس عن بُعد')} onPress={() => remote!.openInputSettings()} /></>}
      {!active && mode === 'relay' && <TextInput accessibilityLabel="Private relay access key" placeholder="64-character relay access key" placeholderTextColor={colors.muted} value={key} onChangeText={setKey} secureTextEntry autoCapitalize="none" autoCorrect={false} style={inputStyle} />}
      {!active && <Button loading={busy} disabled={mode === 'direct' && (!status.directSupported || !status.tailscaleIp)} title={busy ? t('Démarrage…', 'Starting…', 'جارٍ البدء…') : t('Démarrer le partage', 'Start screen sharing', 'بدء مشاركة الشاشة')} onPress={() => {
        if (busy) return;
        const origin = mode === 'direct' ? 'tailscale' : relayOrigin(address);
        if (mode === 'direct' && !status.directSupported) { setError('Install the new Android build for direct Tailscale sharing.'); return; }
        if (mode === 'direct' && !status.tailscaleIp) { setError(t("Connecte Tailscale puis réessaie.", "Connect Tailscale, then try again.", "شغّل Tailscale ثم حاول مجدداً.")); return; }
        if (!origin || (mode === 'relay' && !/^[a-f0-9]{64}$/i.test(key.trim()))) { setError('Enter the HTTPS relay address and its 64-character access key.'); return; }
        setError(''); setBusy(true);
        void remote!.start(mode === 'direct' ? 'tailscale' : origin.replace('https:', 'wss:') + '/phone', mode === 'direct' ? '' : key.trim()).then(() => setKey('')).catch((e: Error) => setError(e.message || 'Unable to start sharing.')).finally(() => setBusy(false));
      }} />}
      <Label>{states[status.state] || t('Vérification…', 'Checking sharing status…', 'جارٍ التحقق…')}</Label>
      {status.rememberedPhone && !active && <>
        <Label>{t('Téléphone associé mémorisé. Relance la capture pour reprendre sans scanner.', 'Paired phone saved. Start screen sharing to resume without scanning.', 'تم حفظ الهاتف المقترن. ابدأ مشاركة الشاشة للاستئناف دون مسح الرمز.')}</Label>
        <Button quiet title={t('Oublier le téléphone associé', 'Forget paired phone', 'نسيان الهاتف المقترن')} onPress={() => remote!.stop()} />
      </>}
      {!status.viewOnly && status.state === 'waiting' && mode === 'direct' && !!remote?.allowQrConnection && !quickCode && <>
        <Label>{t('Autorise un seul téléphone qui scanne ce QR à voir et contrôler ton écran. Le QR reste valable 2 minutes.', 'Allow one phone that scans this QR to view and control your screen. The QR is valid for 2 minutes.', 'اسمح لهاتف واحد يمسح هذا الرمز بعرض شاشتك والتحكم بها. الرمز صالح لمدة دقيقتين.')}</Label>
        <Button title={t('Autoriser la connexion QR', 'Allow QR connection', 'السماح باتصال QR')} onPress={() => {
          void remote!.allowQrConnection!().then(code => { setQuickCode(code); qrUntil.current = Date.now() + 120000; }).catch((e: Error) => setError(e.message));
        }} />
      </>}
      {!!qrValue && <View style={{ alignItems: 'center', gap: 12 }}>
        <Label bold size={18}>{t('Scanne pour te connecter', 'Scan to connect', 'امسح للاتصال')}</Label>
        <View accessibilityLabel="Phone pairing QR code" style={{ padding: 16, backgroundColor: '#ffffff', borderRadius: 16 }}>
          <QRCode value={qrValue} size={Math.max(120, Math.min(220, width - 128))} quietZone={12} color="#000000" backgroundColor="#ffffff" ecl="M" />
        </View>
        <Label>{t('Sur le téléphone principal, appuie sur Scanner un téléphone. La connexion sera autorisée automatiquement pour ce QR uniquement.', 'On the main phone, tap Scan a phone. This QR grants access directly to one phone, without another approval tap.', 'على الهاتف الرئيسي اضغط مسح رمز هاتف. يمنح هذا الرمز وصولاً مباشراً لهاتف واحد دون موافقة إضافية.')}</Label>
        <Button quiet title={t('Masquer et annuler le QR', 'Hide and cancel QR', 'إخفاء الرمز وإلغاؤه')} onPress={() => { remote?.cancelQrConnection?.(); setQuickCode(''); qrUntil.current = 0; }} />
      </View>}
      {!!status.directUrl && <><Label bold>{t("Adresse pour l’autre téléphone", "Address for your other phone", "العنوان للهاتف الآخر")}</Label><Label selectable>{status.directUrl}</Label><Button quiet title={t("Copier l’adresse", "Copy address", "نسخ العنوان")} onPress={() => { void Clipboard.setStringAsync(status.directUrl!).catch(() => setError('Unable to copy.')); }} /></>}
      {!!status.code && <><Label bold>{t('Code privé · expire dans 10 minutes', 'Private pairing code · expires after 10 minutes', 'رمز الاقتران الخاص · ينتهي بعد ١٠ دقائق')}</Label><Label selectable style={{ fontSize: 22, letterSpacing: 2, textAlign: 'center' }}>{status.code}</Label><Button quiet title={t("Copier le code", "Copy code", "نسخ الرمز")} onPress={() => { void Clipboard.setStringAsync(status.code).catch(() => setError('Unable to copy.')); }} /></>}
      {status.state === 'approval' && <Button title={status.viewOnly ? t('Approuver la lecture seule', 'Approve viewing only', 'الموافقة على المشاهدة فقط') : t('Approuver l’écran et le contrôle', 'Approve screen viewing and control', 'الموافقة على عرض الشاشة والتحكم')} onPress={() => remote!.approve()} />}
      {(active || busy) && <Button title={status.state === 'approval' ? t('Refuser et arrêter', 'Reject and stop sharing', 'رفض وإيقاف المشاركة') : t('Arrêter le partage', 'Stop sharing', 'إيقاف المشاركة')} onPress={() => remote!.stop()} />}
    </>}
    </Card></>}
    <Card style={{ padding: 18, gap: 8 }}><Label bold>{t("Besoin d’aide ?", "Connection help", "مساعدة الاتصال")}</Label><Label muted>{t("Les deux appareils doivent être autorisés sur le même réseau Tailscale. Garde le téléphone partagé déverrouillé. Les coupures temporaires se reconnectent automatiquement. Quitter le lecteur ne termine pas le partage : rouvre la connexion pour reprendre. Si Android arrête la capture, relance le partage.", "Both devices must be allowed on the same Tailscale network. Keep the sharing phone unlocked. Temporary interruptions reconnect automatically. Leaving the viewer keeps sharing available: reopen the connection to resume. If Android ends capture, start sharing again.", "يجب السماح للهاتفين بالاتصال داخل نفس شبكة Tailscale. أبقِ الهاتف المشارك مفتوحاً. تُستأنف الانقطاعات المؤقتة تلقائياً. مغادرة العارض لا تنهي المشاركة: افتح الاتصال مجدداً للاستئناف. إذا أوقف أندرويد الالتقاط، أعد بدء المشاركة.")}</Label></Card>
    </>}
    {!!error && <Card><Label>{error}</Label></Card>}
  </ScrollView>;
}
