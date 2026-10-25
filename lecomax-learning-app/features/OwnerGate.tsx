import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { ActivityIndicator, AppState, Keyboard, Platform, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Button, Label } from '../components/UI';
import { AuthLayout, AuthField } from './AuthLayout';
import { useSchool } from '../store/School';
import { auth, SessionError } from '../services/auth';
import { PhonePythonLab } from '../components/PhonePythonLab';
import { usePathname } from 'expo-router';
export function OwnerGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const status = useSyncExternalStore(auth.subscribe, auth.snapshot, auth.snapshot);
  const { t, colors, rtl, update } = useSchool();
  const [offlinePython, setOfflinePython] = useState(false);
  const [email, setEmail] = useState(''),
    [password, setPassword] = useState(''),
    [visible, setVisible] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  useEffect(() => {
    void auth.restore().catch(() => {});
    const sub = AppState.addEventListener('change', (value) => {
      if (value !== 'active') auth.background();
      else void auth.validate().catch(() => {});
    });
    const timer = setInterval(() => {
      if (AppState.currentState === 'active' && auth.snapshot() === 'authenticated')
        void auth.validate().catch(() => {});
    }, 60000);
    return () => {
      sub.remove();
      clearInterval(timer);
    };
  }, []);
  async function act(fn: () => Promise<unknown>) {
    setBusy(true);
    setError('');
    try {
      await fn();
    } catch (e) {
      setError(
        e instanceof SessionError && e.status === 401
          ? t(
              'Identifiants invalides. Réessaie.',
              'Invalid credentials. Please try again.',
              'بيانات الدخول غير صحيحة. حاول مجددًا.',
            )
          : e instanceof SessionError && e.status === 429
            ? t(
                'Trop de tentatives. Réessaie dans 5 minutes.',
                'Too many attempts. Try again in 5 minutes.',
                'محاولات كثيرة. حاول بعد خمس دقائق.',
              )
            : t(
                'Connexion impossible. Vérifie le réseau et réessaie.',
                'Unable to connect. Check your connection and retry.',
                'تعذر الاتصال. تحقق من الشبكة وحاول مجددًا.',
              ),
      );
    } finally {
      setBusy(false);
    }
  }
  function submit() {
    if (busy || !email.trim() || !password) return;
    Keyboard.dismiss();
    const value = password;
    setPassword('');
    void act(() => auth.login(email.trim(), value));
  }
  // Only the capture invitation is public; viewing and creation remain gated.
  if (pathname === '/phone-share' || status === 'authenticated') return <>{children}</>;
  return (
    <AuthLayout>
      {status === 'loading' || status === 'background' ? (
        <View style={{ gap: 18 }}>
          <ActivityIndicator color={colors.accent} />
          <Label>
            {t('Vérification sécurisée…', 'Securing your session…', 'جارٍ التحقق من جلستك…')}
          </Label>
        </View>
      ) : status === 'offline' ? (
        <View style={{ gap: 18 }}>
          {Platform.OS === 'android' && <>
            <Button title={t('Ouvrir Python hors ligne', 'Open offline Python', 'فتح بايثون دون إنترنت')} onPress={() => setOfflinePython(true)} />
            <PhonePythonLab visible={offlinePython} seed={null} onClose={() => setOfflinePython(false)} onExplain={(draft) => {
              update(p => ({ ...p, teacher: { ...p.teacher, draft } }));
              setOfflinePython(false);
              setError(t('Question enregistrée dans le professeur IA. Reconnecte-toi pour l’envoyer.', 'Question saved in AI Teacher. Reconnect to send it.', 'حُفظ السؤال في الأستاذ الذكي. اتصل بالإنترنت لإرساله.'));
            }} />
          </>}
          <Label bold>{t('Connexion requise', 'Connection required', 'الاتصال مطلوب')}</Label>
          <Label>
            {t(
              'Reconnecte-toi au réseau pour vérifier ta session.',
              'Reconnect to verify your session securely.',
              'اتصل بالشبكة للتحقق من جلستك بأمان.',
            )}
          </Label>
          <Button
            loading={busy}
            title={t('Réessayer', 'Retry', 'إعادة المحاولة')}
            onPress={() => void act(auth.retry)}
          />
          <Button
            quiet
            disabled={busy}
            title={t('Revenir à la connexion', 'Back to sign in', 'العودة إلى تسجيل الدخول')}
            onPress={() => void act(auth.invalidate)}
          />
        </View>
      ) : status === 'choice' ? (
        <View style={{ gap: 18 }}>
          <Label bold size={22}>
            {t(
              'Rester connecté sur cet appareil ?',
              'Stay signed in on this device?',
              'هل تريد البقاء مسجّلًا على هذا الجهاز؟',
            )}
          </Label>
          <Label>
            {t(
              'Mémoriser ta connexion en toute sécurité pour les prochaines ouvertures ?',
              'Would you like L’ECOMAX LEARN to remember your login securely so you don’t need to enter your password every time you open the app?',
              'هل تريد أن يتذكر L’ECOMAX LEARN تسجيل دخولك بأمان حتى لا تحتاج إلى إدخال كلمة المرور في كل مرة تفتح فيها التطبيق؟',
            )}
          </Label>
          <Button
            disabled={busy || Platform.OS === 'web'}
            title={t(
              'Oui, mémoriser cet appareil',
              'Yes, remember this device',
              'نعم، تذكّر هذا الجهاز',
            )}
            onPress={() => void act(() => auth.choose(true))}
          />
          <Button
            disabled={busy}
            quiet
            title={t(
              'Non, cette session seulement',
              'No, just this session',
              'لا، لهذه الجلسة فقط',
            )}
            onPress={() => void act(() => auth.choose(false))}
          />
          {Platform.OS === 'web' && (
            <Label muted>
              {t(
                'La mémorisation sécurisée est disponible dans l’application Android.',
                'Secure remembering is available in the Android app.',
                'الحفظ الآمن متاح في تطبيق أندرويد.',
              )}
            </Label>
          )}
          <Button
            disabled={busy}
            quiet
            title={t('Annuler', 'Cancel', 'إلغاء')}
            onPress={() => void act(auth.cancel)}
          />
          {busy && <ActivityIndicator color={colors.accent} />}
        </View>
      ) : (
        <View style={{ gap: 18 }}>
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              backgroundColor: colors.soft,
              alignItems: 'center',
              justifyContent: 'center',
              alignSelf: rtl ? 'flex-end' : 'flex-start',
            }}
          >
            <Ionicons name="log-in-outline" size={21} color={colors.accent} />
          </View>
          <Label bold size={23} accessibilityRole="header">
            {t('Bon retour', 'Welcome back', 'أهلًا بعودتك')}
          </Label>
          <Label muted size={14} style={{ marginTop: -8, marginBottom: 6 }}>
            {t(
              'Connectez-vous pour reprendre votre apprentissage.',
              'Sign in to pick up where you left off.',
              'سجّل دخولك لتكمل من حيث توقفت.',
            )}
          </Label>
          <AuthField
            label={t('Adresse e-mail', 'Email address', 'البريد الإلكتروني')}
            value={email}
            onChangeText={setEmail}
            placeholder={t('Votre e-mail', 'Your email', 'بريدك الإلكتروني')}
            disabled={busy}
          />
          <AuthField
            label={t('Mot de passe', 'Password', 'كلمة المرور')}
            value={password}
            onChangeText={setPassword}
            placeholder={t('Votre mot de passe', 'Your password', 'كلمة مرورك')}
            password
            visible={visible}
            onToggle={() => setVisible(!visible)}
            disabled={busy}
            onSubmit={submit}
          />
          <Button
            loading={busy}
            disabled={!email.trim() || !password}
            title={t('Se connecter', 'Sign in', 'تسجيل الدخول')}
            icon={rtl ? 'arrow-back-outline' : 'arrow-forward-outline'}
            style={{ minHeight: 54, borderRadius: 12, marginTop: 4, backgroundColor: '#173F35' }}
            onPress={submit}
          />
          <View
            style={{
              alignItems: 'center',
              gap: 7,
              paddingTop: 18,
              marginTop: 2,
              borderTopWidth: 1,
              borderTopColor: colors.line,
            }}
          >
            <View
              style={{ flexDirection: rtl ? 'row-reverse' : 'row', alignItems: 'center', gap: 6 }}
            >
              <Ionicons name="sparkles-outline" size={13} color={colors.gold} />
              <Label muted size={11} style={{ textAlign: 'center' }}>
                {t(
                  'Cette application a été créée pour',
                  'This app was built for',
                  'صُمّم هذا التطبيق خصيصًا لـ',
                )}
              </Label>
            </View>
            <Label
              bold
              size={15}
              style={{ textAlign: 'center', writingDirection: 'ltr', letterSpacing: 0.3 }}
            >
              Zakaria Zemzami
            </Label>
          </View>
        </View>
      )}
      {!!error && (
        <View
          style={{
            padding: 14,
            borderRadius: 12,
            backgroundColor: colors.bg,
            borderWidth: 1,
            borderColor: colors.danger,
          }}
        >
          <Label size={13} accessibilityRole="alert" style={{ color: colors.danger }}>
            {error}
          </Label>
        </View>
      )}
    </AuthLayout>
  );
}
