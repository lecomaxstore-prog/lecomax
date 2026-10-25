import React, { useEffect, useState } from 'react';
import { AppState, ScrollView, TextInput, View } from 'react-native';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSchool } from '../store/School';
import { Button, Label } from './UI';
import { pcRemoteUrl } from '../utils/pc-remote';

export function PcDesktop() {
  const { t, colors } = useSchool();
  const [address, setAddress] = useState('');
  const [origin, setOrigin] = useState('');
  const [error, setError] = useState(false);
  useEffect(() => {
    void AsyncStorage.getItem('lecomax.pc-address').then(value => { if (value) setAddress(value); }).catch(() => {});
    const subscription = AppState.addEventListener('change', state => { if (state !== 'active') setOrigin(''); });
    return () => subscription.remove();
  }, []);
  if (origin) return <View style={{ flex: 1, gap: 8 }}>
    <Button quiet title={t('Déconnecter le PC', 'Disconnect PC', 'قطع الاتصال بالحاسوب')} onPress={() => setOrigin('')} />
    <WebView source={{ uri: origin + '/' }} originWhitelist={[origin]}
      onShouldStartLoadWithRequest={request => request.url === 'about:blank' || request.url.startsWith(origin + '/')}
      javaScriptEnabled domStorageEnabled incognito mixedContentMode="never"
      allowFileAccess={false} allowFileAccessFromFileURLs={false} allowUniversalAccessFromFileURLs={false}
      setSupportMultipleWindows={false} onError={() => setError(true)} onHttpError={() => setError(true)}
      style={{ flex: 1, backgroundColor: '#10211D' }} />
    {error && <Label>{t('Vérifie le Wi-Fi et démarre le partage sur le PC.', 'Check Wi-Fi and start sharing on the PC, then reconnect.', 'تحقق من الواي فاي وشغّل المشاركة على الحاسوب ثم أعد الاتصال.')}</Label>}
  </View>;
  return <ScrollView contentContainerStyle={{ padding: 12, gap: 18 }} keyboardShouldPersistTaps="handled">
    <Label bold size={26}>{t('Mon PC en direct', 'My live PC', 'حاسوبي مباشر')}</Label>
    <Label>{t('Vois et contrôle ton écran Windows ici. Pour un accès à distance, utilise une passerelle HTTPS authentifiée ; le mode local reste réservé au Wi-Fi de confiance.', 'View and control your Windows screen here. For access away from home, use an authenticated HTTPS PC gateway; local addresses remain trusted-Wi-Fi only.', 'شاهد شاشة ويندوز وتحكم بها هنا. للوصول من خارج المنزل استخدم بوابة HTTPS موثوقة؛ العنوان المحلي مخصص لشبكة واي فاي موثوقة.')}</Label>
    <Label>{t('Lance « Start My PC » sur le PC. Entre son adresse, puis le code affiché sur le PC.', 'Run “Start My PC” on the PC. Enter its address, then the pairing code shown on the PC.', 'شغّل «Start My PC» على الحاسوب. أدخل عنوانه ثم رمز الاقتران المعروض على الحاسوب.')}</Label>
    <TextInput accessibilityLabel="PC address or secure gateway" placeholder="https://pc.example.com or 192.168.1.11" value={address} onChangeText={setAddress}
      autoCorrect={false} autoCapitalize="none" keyboardType="url"
      style={{ padding: 16, borderWidth: 1, borderRadius: 12, borderColor: colors.muted, color: colors.text, writingDirection: 'ltr' }} />
    <Button title={t('Connecter mon PC', 'Connect my PC', 'الاتصال بحاسوبي')} onPress={() => {
      const url = pcRemoteUrl(address.trim()); setError(!url);
      if (url) { void AsyncStorage.setItem('lecomax.pc-address', url).catch(() => {}); setOrigin(url); }
    }} />
    {error && <Label>{t('Entre une IP locale sur le port 6081.', 'Enter a private IP address, using port 6081.', 'أدخل عنوان IP محليًا باستخدام المنفذ 6081.')}</Label>}
    <Label muted>{t('Le mode local utilise HTTP et doit rester sur un réseau de confiance. Une passerelle distante doit fournir HTTPS, authentification, signalisation et relais TURN ; « Stop My PC » arrête le partage local.', 'Local mode uses HTTP and must stay on a trusted network. A remote gateway must provide HTTPS, authentication, signaling and TURN relay; “Stop My PC” ends local sharing.', 'الوضع المحلي يستخدم HTTP ويجب أن يبقى على شبكة موثوقة. البوابة البعيدة تحتاج HTTPS والمصادقة والإشارة ومرحل TURN.')}</Label>
  </ScrollView>;
}
