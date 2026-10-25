import { useRef, useState } from 'react';
import { View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Button, Card, Field, Label, Row } from '../../components/UI';
import { useSchool } from '../../store/School';
import { useJourney } from './useJourney';
import { useCopy } from './components';
import { dailyTheme } from './daily-plan';

export function DailyCompass() {
  const { today, state, update } = useJourney();
  const { t, colors } = useSchool();
  const copy = useCopy();
  const saved = state?.days[today]?.compass;
  const [priority, setPriority] = useState(saved?.priority || '');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const saving = useRef(false);
  const theme = dailyTheme(today);
  const completed =
    Number(!!saved?.priority.trim()) + Number(!!saved?.focused) + Number(!!saved?.connected);
  const save = async (toggle?: 'focused' | 'connected') => {
    if (saving.current) return;
    saving.current = true;
    setBusy(true);
    setMessage('');
    try {
      await update((s) => {
        const day = s.days[today]!;
        const previous = day.compass || { priority: '', focused: false, connected: false };
        return {
          ...s,
          days: {
            ...s.days,
            [today]: {
              ...day,
              compass: {
                ...previous,
                priority: toggle ? previous.priority : priority.trim(),
                ...(toggle ? { [toggle]: !previous[toggle] } : {}),
              },
            },
          },
        };
      });
      setMessage(t('Enregistré pour aujourd’hui.', 'Saved for today.', 'تم الحفظ لليوم.'));
    } catch {
      setMessage(
        t(
          'Échec du stockage. Votre texte est conservé ici, réessayez.',
          'Could not save. Your draft is still here; try again.',
          'تعذر الحفظ. نصك ما زال هنا، حاول مجدداً.',
        ),
      );
    } finally {
      saving.current = false;
      setBusy(false);
    }
  };
  return (
    <Card style={{ gap: 16, borderColor: colors.line, padding: 18 }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Row>
          <Ionicons name="compass-outline" size={21} color={colors.accent} />
          <Label bold size={11} style={{ color: colors.accent }}>
            {t('LE CAP DU JOUR', 'TODAY’S DIRECTION', 'بوصلتك اليوم')}
          </Label>
        </Row>
        <Label size={11} muted>
          {t('Un jour à la fois', 'One day at a time', 'يوماً بعد يوم')}
        </Label>
      </Row>
      <View style={{ gap: 5, borderRadius: 18, backgroundColor: colors.soft, padding: 16 }}>
        <Label bold size={22} accessibilityRole="header">
          {copy(theme.title)}
        </Label>
        <Label muted size={14}>
          {copy(theme.action)}
        </Label>
      </View>
      <View style={{ gap: 8, backgroundColor: colors.soft, padding: 14, borderRadius: 16 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Label bold size={12}>
            {t('Votre élan du jour', 'Your daily progress', 'تقدّمك اليوم')}
          </Label>
          <Label muted size={12}>
            {completed} / 3
          </Label>
        </Row>
        <Row style={{ gap: 6 }}>
          {[1, 2, 3].map((step) => (
            <View
              key={step}
              style={{
                flex: 1,
                height: 5,
                borderRadius: 3,
                backgroundColor: completed >= step ? colors.accent : colors.line,
              }}
            />
          ))}
        </Row>
      </View>
      <View style={{ padding: 0, gap: 10 }}>
        <Label bold size={16}>
          {t('01 · Ma priorité', '01 · My one priority', '٠١ · أولويتي اليوم')}
        </Label>
        <Label size={13} muted>
          {copy(theme.prompt)}
        </Label>
        <Field
          accessibilityLabel={t('Ma priorité du jour', 'My priority today', 'أولويتي اليوم')}
          placeholder={t(
            'Une action précise et réalisable…',
            'One specific, achievable action…',
            'خطوة واضحة يمكنني إنجازها…',
          )}
          value={priority}
          onChangeText={(value) => {
            setPriority(value);
            setMessage('');
          }}
          maxLength={240}
          multiline
          minHeight={88}
          editable={!busy}
        />
        <Button
          icon="checkmark-outline"
          loading={busy}
          disabled={!priority.trim()}
          title={t('Enregistrer ma priorité', 'Save my priority', 'احفظ أولويتي')}
          onPress={() => void save()}
        />
      </View>
      <View style={{ gap: 8, backgroundColor: colors.soft, padding: 14, borderRadius: 16 }}>
        <Label bold size={16}>
          {t('02 · Un temps de concentration', '02 · Make time to focus', '٠٢ · وقت للتركيز')}
        </Label>
        <Label muted size={13}>
          {t(
            'Réservez 25 minutes à votre priorité, notifications coupées, puis faites une pause. Dix minutes suffisent pour commencer.',
            'One task, 25 quiet minutes, then a break. Start with 10 minutes if that feels easier.',
            'خصص ٢٥ دقيقة لأولويتك مع إيقاف الإشعارات ثم خذ استراحة. عشر دقائق بداية جيدة أيضاً.',
          )}
        </Label>
        <Button
          quiet
          disabled={busy}
          selected={!!saved?.focused}
          icon={saved?.focused ? 'checkmark-circle' : 'ellipse-outline'}
          title={
            saved?.focused
              ? t(
                  'Séance accomplie · Annuler',
                  'Focus session done · Undo',
                  'أنجزت جلسة التركيز · تراجع',
                )
              : t('J’ai fait ma séance', 'I completed my focus session', 'أنجزت جلسة التركيز')
          }
          onPress={() => void save('focused')}
        />
      </View>
      <View
        style={{ gap: 8, borderWidth: 1, borderColor: colors.line, padding: 14, borderRadius: 16 }}
      >
        <Label bold size={16}>
          {t('03 · Un lien humain', '03 · Make a connection', '٠٣ · تواصل مع من تحب')}
        </Label>
        <Label muted size={13}>
          {t(
            'Prenez des nouvelles, remerciez quelqu’un ou offrez votre aide.',
            'Check in with someone, express appreciation or offer a little help.',
            'اسأل عن شخص يهمك، عبّر عن امتنانك أو قدم مساعدة بسيطة.',
          )}
        </Label>
        <Button
          quiet
          disabled={busy}
          selected={!!saved?.connected}
          icon={saved?.connected ? 'checkmark-circle' : 'ellipse-outline'}
          title={
            saved?.connected
              ? t('Lien nourri · Annuler', 'Connection made · Undo', 'تواصلت اليوم · تراجع')
              : t('J’ai pris ce moment', 'I made time for someone', 'خصصت وقتاً لشخص')
          }
          onPress={() => void save('connected')}
        />
      </View>
      {!!message && (
        <Label size={12} accessibilityLiveRegion="polite">
          {message}
        </Label>
      )}
      <Label muted size={12}>
        {t(
          'La régularité compte plus qu’une journée parfaite. Votre priorité est enregistrée sur cet appareil.',
          'Consistency matters more than a perfect day. Your priority is saved on this device.',
          'الاستمرارية أهم من يوم مثالي. تُحفظ أولويتك على هذا الجهاز.',
        )}
      </Label>
    </Card>
  );
}
