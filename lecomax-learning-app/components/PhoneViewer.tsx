import React, { useEffect, useRef, useState } from 'react';
import { AppState, BackHandler, View, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Button, Label } from './UI';
import { useSchool } from '../store/School';
import { readPhoneSession, savePhoneSession } from '../utils/phone-session';

export function PhoneViewer({ origin, pairingCode = '', onClose }: { origin: string; pairingCode?: string; onClose: () => void }) {
  const { t, colors } = useSchool();
  const insets = useSafeAreaInsets();
  const [help, setHelp] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [disconnectFailed, setDisconnectFailed] = useState(false);
  const web = useRef<WebView>(null);
  const pendingCode = useRef(/^[a-f0-9]{32}$/.test(pairingCode) ? pairingCode : '');
  const sessionToken = useRef('');
  const codeSent = useRef(false);
  const leaving = useRef(false);
  const [storageFailed, setStorageFailed] = useState(false);
  const remember = (token: string) => { void savePhoneSession(origin, token).catch(() => setStorageFailed(true)); };
  const [webKey, setWebKey] = useState(0);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!failed) return;
    const timer = setInterval(() => {
      if (AppState.currentState !== 'active' || leaving.current) return;
      codeSent.current = false; setFailed(false); setWebKey(value => value + 1);
    }, 5000);
    return () => clearInterval(timer);
  }, [failed]);
  useEffect(() => {
    leaving.current = false;
    const leave = () => {
      leaving.current = true;
      web.current?.injectJavaScript('window.lecomaxPause?.(); true;');
      onClose();
    };
    const app = AppState.addEventListener('change', state => {
      web.current?.injectJavaScript(state === 'active' ? 'window.lecomaxResume?.(); true;' : 'window.lecomaxPause?.(); true;');
    });
    const back = BackHandler.addEventListener('hardwareBackPress', () => { leave(); return true; });
    return () => { leaving.current = true; app.remove(); back.remove(); };
  }, [onClose]);
  return <View style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom, paddingLeft: insets.left, paddingRight: insets.right, backgroundColor: colors.bg }}>
    <Stack.Screen options={{ headerShown: false }} />
    <View style={{ paddingHorizontal: 12, paddingVertical: 6, gap: 6 }}>
    <Label bold>{t('Écran de ton autre téléphone', 'Your other phone’s screen', 'شاشة هاتفك الآخر')}</Label>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
    <Button quiet title={t('Retour', 'Back', 'رجوع')} onPress={() => { leaving.current = true; web.current?.injectJavaScript('window.lecomaxPause?.(); true;'); onClose(); }} />
    <Button quiet title={t('Aide', 'Help', 'مساعدة')} onPress={() => setHelp(value => !value)} />
    <Button quiet disabled={disconnecting} title={t('Déconnecter le téléphone', 'Disconnect phone', 'قطع اتصال الهاتف')} onPress={async () => {
      if (disconnecting) return;
      setDisconnecting(true); setDisconnectFailed(false);
      // Finish revocation before destroying the WebView that initiated it.
      if (origin.startsWith('http:')) {
        const abort = new AbortController();
        const timeout = setTimeout(() => abort.abort(), 8000);
        try {
          const token = sessionToken.current || (!pendingCode.current ? await readPhoneSession(origin) : '');
          if (token) {
            const response = await fetch(origin + '/stop', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, signal: abort.signal });
            if (!response.ok && response.status !== 401 && response.status !== 403) throw new Error('Disconnect failed');
          }
        } catch {
          setDisconnectFailed(true); setDisconnecting(false); return;
        } finally { clearTimeout(timeout); }
      }
      leaving.current = true;
      web.current?.injectJavaScript("document.getElementById('stop')?.click(); true;"); sessionToken.current = ''; pendingCode.current = ''; remember(''); onClose();
    }} />
    </View>
    {disconnectFailed && <Label>{t('Déconnexion non confirmée. Vérifie Tailscale et réessaie, ou arrête le partage sur l’autre téléphone.', 'Disconnect was not confirmed. Check Tailscale and retry, or stop sharing on the other phone.', 'لم يتم تأكيد قطع الاتصال. تحقق من Tailscale وأعد المحاولة، أو أوقف المشاركة من الهاتف الآخر.')}</Label>}
    </View>
    {help && <ScrollView style={{ maxHeight: 180 }} contentContainerStyle={{ padding: 12, gap: 8 }}>
    <Label>{t('Approuve sur ton AUTRE téléphone, puis utilise ses applications normalement. La session Tailscale approuvée reste disponible jusqu’à ton arrêt du partage. Android peut arrêter la capture si le téléphone est verrouillé ou l’application arrêtée de force.', 'Approve on your OTHER phone, then use its apps normally. Your approved Tailscale session stays available until you stop sharing. Android may end capture when the phone locks or the app is force-stopped.', 'وافق على هاتفك الآخر ثم استخدم تطبيقاته بشكل عادي. تبقى جلسة Tailscale المعتمدة متاحة حتى توقف المشاركة. قد يوقف أندرويد الالتقاط عند قفل الهاتف أو إيقاف التطبيق بالقوة.')}</Label>
    <Label>{t('Tu peux quitter cette page ou fermer le lecteur. Rouvre la connexion pour reprendre sans scanner. Le téléphone partagé peut arrêter le partage à tout moment.', 'You can leave this page or close the viewer app. Reopen the connection to resume without scanning. The shared phone can stop sharing at any time.', 'يمكنك مغادرة هذه الصفحة أو إغلاق تطبيق العرض. افتح الاتصال مجدداً للاستئناف دون مسح الرمز. يمكن للهاتف المشارك إيقاف المشاركة في أي وقت.')}</Label>
    </ScrollView>}
    {storageFailed && <Label>{t('Impossible de mémoriser la connexion. Garde le lecteur ouvert ou associe à nouveau après fermeture.', 'Could not remember the connection. Keep the viewer open or pair again after closing.', 'تعذر حفظ الاتصال. أبقِ العارض مفتوحاً أو أعد الاقتران بعد الإغلاق.')}</Label>}
    {failed && <>
      <Label>{t('Connexion impossible. Vérifie Tailscale sur les deux téléphones puis réessaie.', 'Unable to connect. Check Tailscale on both phones, then retry.', 'تعذر الاتصال. تحقق من Tailscale على الهاتفين ثم أعد المحاولة.')}</Label>
      <Button title={t('Réessayer la connexion', 'Retry connection', 'إعادة محاولة الاتصال')} onPress={() => { setFailed(false); codeSent.current = false; setWebKey(value => value + 1); }} />
    </>}
      <WebView key={webKey} ref={web} source={{ uri: origin + '/' }} originWhitelist={['*']}
        onShouldStartLoadWithRequest={request => request.url === origin + '/'}
        onMessage={async event => {
          if (leaving.current || event.nativeEvent.url !== origin + '/') return;
          const data = event.nativeEvent.data;
          if (data === 'lecomax-phone-ready') {
            web.current?.injectJavaScript(`window.lecomaxConfigure?.(${JSON.stringify({
              language: t('fr', 'en', 'ar'),
              navigation: { back: t('Retour', 'Back', 'رجوع'), home: t('Accueil', 'Home', 'الرئيسية'), recents: t('Récentes', 'Recents', 'التطبيقات الأخيرة') },
              messages: {
                'Connected · View only': t('Connecté · Lecture seule', 'Connected · View only', 'متصل · مشاهدة فقط'),
                'Ready to pair.': t('Prêt à connecter.', 'Ready to pair.', 'جاهز للاتصال.'),
                'Connected · Tap or swipe to control': t('Connecté · Touche ou glisse pour contrôler', 'Connected · Tap or swipe to control', 'متصل · المس أو اسحب للتحكم'),
                'Stay here. On your OTHER phone, open ACADEMY and approve this connection.': t('Approuve la connexion sur ton autre téléphone.', 'Approve the connection on your other phone.', 'وافق على الاتصال من هاتفك الآخر.'),
                'Connection interrupted · Reconnecting automatically. Keep Tailscale connected.': t('Reconnexion automatique… Garde Tailscale connecté.', 'Reconnecting automatically… Keep Tailscale connected.', 'جارٍ إعادة الاتصال تلقائياً… أبقِ Tailscale متصلاً.'),
                'Paused · Your approved session stays available until you disconnect.': t('En pause · Connexion conservée.', 'Paused · Connection saved.', 'متوقف مؤقتاً · الاتصال محفوظ.'),
              },
            })}); true;`);
            if (!sessionToken.current && !pendingCode.current) {
              try { sessionToken.current = await readPhoneSession(origin); }
              catch { setStorageFailed(true); }
              if (leaving.current) return;
            }
            if (sessionToken.current) web.current?.injectJavaScript(`window.lecomaxRestoreSession?.(${JSON.stringify(sessionToken.current)}); true;`);
            else if (pendingCode.current && !codeSent.current) {
              codeSent.current = true;
              web.current?.injectJavaScript(`window.lecomaxPairCode?.(${JSON.stringify(pendingCode.current)}); true;`);
            }
            return;
          }
          if (data.length > 150) return;
          try {
            const message = JSON.parse(data);
            if (message.type === 'phone-session' && typeof message.token === 'string' && (message.token === '' || /^[a-f0-9]{32}$/.test(message.token))) {
              sessionToken.current = message.token; pendingCode.current = ''; remember(message.token);
            }
          } catch { /* Ignore unrelated bridge messages. */ }
        }}
        javaScriptEnabled domStorageEnabled incognito cacheEnabled={false} mixedContentMode="never"
        allowFileAccess={false} allowFileAccessFromFileURLs={false} allowUniversalAccessFromFileURLs={false}
        setSupportMultipleWindows={false} onError={() => setFailed(true)} onHttpError={() => setFailed(true)} onRenderProcessGone={() => setFailed(true)}
        style={{ flex: failed ? 0 : 1, opacity: failed ? 0 : 1 }} />
  </View>;
}
