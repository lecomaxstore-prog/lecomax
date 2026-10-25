import React, { useRef, useState } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useSchool } from '../store/School';
import { Button, Label } from './UI';
import { PHONE_INTERNET_ORIGIN } from '../utils/phone-internet';

export function InternetPhoneViewer({ id, token, onConnected, onEnded }: { id: string; token: string; onConnected: () => void; onEnded: () => void }) {
  const { t } = useSchool();
  const web = useRef<WebView>(null);
  const [failed, setFailed] = useState(false);
  const url = PHONE_INTERNET_ORIGIN + '/internet-viewer';
  return <View style={{ height: 540 }}>
    {failed && <><Label>{t('Connexion interrompue. Vérifie Internet.', 'Connection interrupted. Check your internet connection.', 'انقطع الاتصال. تحقق من اتصال الإنترنت.')}</Label><Button title={t('Réessayer', 'Retry', 'إعادة المحاولة')} onPress={() => { setFailed(false); web.current?.reload(); }} /></>}
    <WebView ref={web} source={{ uri: url }} originWhitelist={[PHONE_INTERNET_ORIGIN]}
      onShouldStartLoadWithRequest={request => request.url === url}
      onMessage={event => {
        if (event.nativeEvent.url !== url || event.nativeEvent.data.length > 100) return;
        try {
          const message = JSON.parse(event.nativeEvent.data);
          if (message.type === 'ready') web.current?.injectJavaScript(`window.lecomaxInternetStart(${JSON.stringify({ id, token,
            waiting: t('En attente de l’accord de ton autre téléphone.', 'Waiting for your other phone to approve.', 'بانتظار موافقة هاتفك الآخر.'),
            connected: t('Connecté · Lecture seule', 'Connected · View only', 'متصل · مشاهدة فقط'),
            ended: t('Partage terminé.', 'Sharing ended.', 'انتهت المشاركة.'),
            reconnecting: t('Reconnexion…', 'Reconnecting…', 'جارٍ إعادة الاتصال…'), stop: t('Arrêter', 'Stop watching', 'إيقاف المشاهدة'),
          })}); true;`);
          if (message.type === 'connected') onConnected();
          if (message.type === 'ended') onEnded();
        } catch { /* Ignore unrelated bridge messages. */ }
      }} onError={() => setFailed(true)} onHttpError={() => setFailed(true)}
      javaScriptEnabled incognito cacheEnabled={false} mixedContentMode="never" allowFileAccess={false}
      allowFileAccessFromFileURLs={false} allowUniversalAccessFromFileURLs={false} setSupportMultipleWindows={false} />
  </View>;
}
