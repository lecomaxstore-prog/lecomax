import { useState } from 'react';
import { View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Button, Card, Field, Label, Row } from '../../components/UI';
import { useSchool } from '../../store/School';
import { dailyMoment } from './daily-content';
import { useCopy } from './components';
import { useJourney } from './useJourney';

export function DailyMoment() {
  const { today, state, update } = useJourney();
  const { t, colors } = useSchool();
  const copy = useCopy();
  const moment = dailyMoment(today);
  const saved = state?.days[today]?.dailyMoment;
  const [note, setNote] = useState(saved?.gratitude || '');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const save = async (completed: boolean) => {
    setBusy(true);
    setMessage('');
    try {
      await update((s) => ({
        ...s,
        days: {
          ...s.days,
          [today]: {
            ...s.days[today]!,
            dailyMoment: { completed, gratitude: note.trim() },
          },
        },
      }));
      setMessage(
        t('Votre moment est enregistré.', 'Your moment is saved.', 'تم حفظ لحظتك الجميلة.'),
      );
    } catch {
      setMessage(
        t(
          'Enregistrement impossible. Votre texte reste ici : réessayez.',
          'Could not save. Your text is still here; please retry.',
          'تعذر الحفظ. نصك ما زال هنا، أعد المحاولة.',
        ),
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <Card style={{ gap: 16 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Row>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                backgroundColor: colors.amberSoft,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="sparkles-outline" size={19} color={colors.amber} />
            </View>
            <Label bold size={11} style={{ color: colors.amber }}>
              {t('VOTRE MOMENT DU JOUR', 'YOUR DAILY MOMENT', 'لحظتك الجميلة اليوم')}
            </Label>
          </Row>
          <Label muted size={12}>
            {t('2 min · facultatif', '2 min · optional', 'دقيقتان · اختياري')}
          </Label>
        </Row>
        <Label bold size={23} accessibilityRole="header">
          {copy(moment.title)}
        </Label>
        <Label size={16} muted>
          {copy(moment.encouragement)}
        </Label>
        <View style={{ backgroundColor: colors.soft, padding: 16, borderRadius: 14, gap: 6 }}>
          <Label bold size={14}>
            {t('Un petit geste pour aujourd’hui', 'One small thing for today', 'خطوة صغيرة لليوم')}
          </Label>
          <Label size={14}>{copy(moment.action)}</Label>
        </View>
        <Button
          quiet
          selected={!!saved?.completed}
          icon={saved?.completed ? 'checkmark-circle' : 'ellipse-outline'}
          disabled={busy}
          title={
            saved?.completed
              ? t('Petit pas accompli', 'Small step completed', 'أنجزت خطوتي الصغيرة')
              : t('J’ai fait ce petit pas', 'I took this small step', 'أنجزت هذه الخطوة الصغيرة')
          }
          onPress={() => void save(!saved?.completed)}
        />
      </Card>
      <Card style={{ gap: 14, backgroundColor: colors.amberSoft, borderColor: 'transparent' }}>
        <Row style={{ flexWrap: 'nowrap' }}>
          <Ionicons name="journal-outline" size={23} color={colors.amber} />
          <Label bold size={19} style={{ flex: 1 }} accessibilityRole="header">
            {t('Une ligne de gratitude', 'A line of gratitude', 'سطر من الامتنان')}
          </Label>
        </Row>
        <Label muted size={14}>
          {copy(moment.reflection)}
        </Label>
        <Field
          multiline
          editable={!busy}
          value={note}
          onChangeText={(value) => {
            setNote(value.slice(0, 2000));
            setMessage('');
          }}
          placeholder={t(
            'Un moment, une personne, une petite joie…',
            'A moment, a person, a small joy…',
            'لحظة، شخص، فرحة صغيرة…',
          )}
        />
        <Row style={{ justifyContent: 'space-between' }}>
          <Label muted size={12}>
            {note.length} / 2000
          </Label>
          <Label muted size={12}>
            {t('Sur cet appareil uniquement', 'On this device only', 'على هذا الجهاز فقط')}
          </Label>
        </Row>
        <Button
          loading={busy}
          disabled={note.trim() === (saved?.gratitude || '')}
          title={t('Garder ce souvenir', 'Save this moment', 'احفظ هذه الذكرى')}
          onPress={() => void save(!!saved?.completed)}
        />
        {!!message && (
          <Label size={13} accessibilityLiveRegion="polite">
            {message}
          </Label>
        )}
        <Label muted size={12}>
          {t(
            'Pas besoin de vous forcer à être positif. Une journée difficile a aussi sa place ici.',
            'No need to force positivity. Difficult days belong here too.',
            'لا حاجة لإجبار نفسك على الإيجابية. حتى الأيام الصعبة لها مكان هنا.',
          )}
        </Label>
      </Card>
    </>
  );
}
