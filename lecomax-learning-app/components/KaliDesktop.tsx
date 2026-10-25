import React, { useEffect, useState } from 'react';
import { TextInput, View } from 'react-native';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSchool } from '../store/School';
import { Button, Label } from './UI';
import { wifiLabUrl } from '../utils/wifi-lab';

export function KaliDesktop() {
  const { t, colors } = useSchool();
  const [address, setAddress] = useState('');
  const [origin, setOrigin] = useState('');
  const [error, setError] = useState(false);
  const phoneOrigin = 'http://127.0.0.1:6080';
  useEffect(() => { void AsyncStorage.getItem('lecomax.wifi-lab-address').then(value => { if (value) setAddress(value); }).catch(() => {}); }, []);
  if (origin) return <View style={{ flex: 1, minHeight: 500, gap: 8 }}>
    <Button quiet title={t('Déconnecter', 'Disconnect', 'قطع الاتصال')} onPress={() => setOrigin('')} />
    <WebView
      source={{ uri: origin === phoneOrigin ? origin + '/vnc.html?autoconnect=1&resize=remote' : origin + '/kali' }}
      originWhitelist={[origin]}
      onShouldStartLoadWithRequest={request => request.url === 'about:blank' || request.url.startsWith(origin + '/')}
      javaScriptEnabled domStorageEnabled
      mixedContentMode="never"
      allowFileAccess={false}
      allowFileAccessFromFileURLs={false}
      allowUniversalAccessFromFileURLs={false}
      setSupportMultipleWindows={false}
      onError={() => setError(true)}
      style={{ flex: 1, minHeight: 440 }}
    />
    {error && <Label>{origin === phoneOrigin
      ? t('Ouvre Termux et lance lecomax-kali, puis reconnecte-toi.', 'Open Termux and run lecomax-kali, then reconnect.', 'افتح Termux وشغّل lecomax-kali ثم أعد الاتصال.')
      : t('Vérifie le Wi-Fi et le serveur sur le PC.', 'Check Wi-Fi and the server on your PC.', 'تحقق من شبكة Wi-Fi والخادم على الحاسوب.')}</Label>}
  </View>;
  return <View style={{ gap: 12 }}>
    <Label bold>{t('Kali sur ce téléphone', 'Kali on this phone', 'كالي على هذا الهاتف')}</Label>
    <Label>{t('Après installation de Kali dans Termux, lance lecomax-kali. Garde Termux ouvert, puis ouvre le bureau ici.', 'After installing Kali in Termux, run lecomax-kali. Keep Termux running, then open the desktop here.', 'بعد تثبيت كالي في Termux شغّل lecomax-kali. أبقِ Termux قيد التشغيل ثم افتح سطح المكتب هنا.')}</Label>
    <Button title={t('Ouvrir Kali sur le téléphone', 'Open phone Kali', 'افتح كالي على الهاتف')} onPress={() => { setError(false); setOrigin(phoneOrigin); }} />
    <Label bold>{t('Kali en direct · Wi-Fi', 'Live Kali · Wi-Fi', 'كالي مباشر · Wi-Fi')}</Label>
    <Label>{t(
      'Connecte le téléphone au même Wi-Fi de confiance que ton PC. Entre l’adresse affichée par le serveur Wi-Fi, puis connecte-toi avec ton compte propriétaire. Le PC doit rester allumé.',
      'Connect your phone to the same trusted Wi-Fi as your PC. Enter the address shown by the Wi-Fi server, then sign in with your owner account. Keep the PC running.',
      'صل هاتفك بنفس شبكة Wi-Fi الموثوقة الخاصة بالحاسوب. أدخل العنوان الذي يعرضه الخادم، ثم سجّل الدخول بحساب المالك. أبقِ الحاسوب قيد التشغيل.',
    )}</Label>
    <TextInput accessibilityLabel="PC Wi-Fi address" placeholder="http://192.168.1.11:8081" value={address} onChangeText={setAddress} autoCorrect={false} autoCapitalize="none" keyboardType="url" style={{ padding: 12, borderWidth: 1, borderColor: colors.muted, borderRadius: 10, color: colors.text }} />
    <Label muted size={12}>{t('Connexion locale HTTP : uniquement sur ton Wi-Fi de confiance.', 'Local HTTP connection: use only your trusted Wi-Fi.', 'اتصال HTTP محلي: استخدم شبكة Wi-Fi موثوقة فقط.')}</Label>
    <Button title={t('Ouvrir Kali', 'Open Kali', 'افتح كالي')} onPress={() => {
      const url = wifiLabUrl(address.trim());
      setError(!url);
      if (url) { void AsyncStorage.setItem('lecomax.wifi-lab-address', url).catch(() => {}); setOrigin(url); }
    }} />
    {error && <Label>{t('Entre une adresse IP locale et le port 8081.', 'Enter a private IP address and port 8081.', 'أدخل عنوان IP محليًا والمنفذ 8081.')}</Label>}
  </View>;
}
