import React, { useEffect, useRef, useState } from 'react';
import { AppState, BackHandler, Linking, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Button, Label } from './UI';
import { useSchool } from '../store/School';
import { parsePhonePairingQr, type PhonePairing } from '../utils/phone-pairing';

export function PhonePairingScanner({ onPair, onClose }: { onPair: (pair: PhonePairing) => void; onClose: () => void }) {
  const { t, colors } = useSchool();
  const [permission, requestPermission, getPermission] = useCameraPermissions();
  const [foreground, setForeground] = useState(AppState.currentState === 'active');
  const [error, setError] = useState('');
  const [torch, setTorch] = useState(false);
  const [cameraKey, setCameraKey] = useState(0);
  const consumed = useRef(false);
  useEffect(() => {
    const app = AppState.addEventListener('change', state => {
      setForeground(state === 'active');
      if (state === 'active') void getPermission().catch(() => {});
    });
    const back = BackHandler.addEventListener('hardwareBackPress', () => { onClose(); return true; });
    return () => { app.remove(); back.remove(); };
  }, [onClose, getPermission]);
  return <View style={{ flex: 1, padding: 18, gap: 16, backgroundColor: colors.bg }}>
    <Label bold size={24}>{t('Scanner un téléphone', 'Scan a phone', 'مسح رمز هاتف')}</Label>
    <Label>{t('Sur le deuxième téléphone, démarre le partage puis affiche son QR code. Place-le dans le cadre.', 'On the second phone, start sharing and display its QR code. Place it inside the camera frame.', 'ابدأ المشاركة على الهاتف الثاني وأظهر رمز QR، ثم ضعه داخل إطار الكاميرا.')}</Label>
    {!permission ? <Label>{t('Vérification de la caméra…', 'Checking camera permission…', 'جارٍ التحقق من إذن الكاميرا…')}</Label> : !permission.granted ? <>
      <Label>{t('Autorise la caméra pour scanner. La saisie manuelle reste disponible.', 'Allow camera access to scan. Manual pairing is still available.', 'اسمح باستخدام الكاميرا للمسح. يبقى الاقتران اليدوي متاحاً.')}</Label>
      <Button title={permission.canAskAgain ? t('Autoriser la caméra', 'Allow camera', 'السماح بالكاميرا') : t('Ouvrir les réglages', 'Open settings', 'فتح الإعدادات')} onPress={() => {
        void (permission.canAskAgain ? requestPermission() : Linking.openSettings()).catch(() => setError(t('Impossible d’ouvrir la caméra. Réessaie ou utilise la saisie manuelle.', 'Unable to open the camera. Retry or use manual pairing.', 'تعذر فتح الكاميرا. أعد المحاولة أو استخدم الاقتران اليدوي.')));
      }} />
    </> : foreground && <CameraView key={cameraKey} enableTorch={torch} style={{ flex: 1, minHeight: 260, borderRadius: 18 }} facing="back" barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      onCameraReady={() => setError('')}
      onMountError={() => setError(t('Caméra indisponible. Utilise la saisie manuelle ou réessaie.', 'Camera unavailable. Use manual pairing or try again.', 'الكاميرا غير متاحة. استخدم الاقتران اليدوي أو أعد المحاولة.'))}
      onBarcodeScanned={({ data }) => {
        if (consumed.current || AppState.currentState !== 'active') return;
        const pair = parsePhonePairingQr(data);
        if (!pair) { setError(t('Scanne le QR code affiché dans ACADEMY sur le deuxième téléphone.', 'Scan the QR code shown inside ACADEMY on the second phone.', 'امسح رمز QR المعروض داخل تطبيق ACADEMY على الهاتف الثاني.')); return; }
        consumed.current = true;
        onPair(pair);
      }} />}
    {!!error && <Label>{error}</Label>}
    {permission?.granted && foreground && <>
      <Button quiet title={torch ? t('Éteindre la lampe', 'Turn flashlight off', 'إطفاء المصباح') : t('Allumer la lampe', 'Turn flashlight on', 'تشغيل المصباح')} onPress={() => setTorch(value => !value)} />
      {!!error && <Button quiet title={t('Réessayer la caméra', 'Retry camera', 'إعادة محاولة الكاميرا')} onPress={() => { consumed.current = false; setError(''); setCameraKey(value => value + 1); }} />}
    </>}
    <Button quiet title={t('Annuler le scan', 'Cancel scan', 'إلغاء المسح')} onPress={onClose} />
  </View>;
}
