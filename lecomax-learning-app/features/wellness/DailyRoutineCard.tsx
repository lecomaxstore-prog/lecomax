import { View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Button, Card, Label, ProgressBar, Row } from '../../components/UI';
import { useSchool } from '../../store/School';
import { useJourney } from './useJourney';
import { tasks } from './data';
import { suggestedSection } from './routine';

export function DailyRoutineCard({ compact = false }: { compact?: boolean }) {
  const { state, today, now, error, retry } = useJourney();
  const { t, colors, state: school } = useSchool();
  const day = state?.days[today];
  if (!day)
    return error ? (
      <Card>
        <Label>
          {t(
            'Votre routine ne peut pas être chargée.',
            'Your routine could not be loaded.',
            'تعذّر تحميل روتينك اليومي.',
          )}
        </Label>
        <Button title={t('Réessayer', 'Retry', 'أعد المحاولة')} onPress={retry} />
      </Card>
    ) : null;
  const done = tasks.filter((task) => day.tasks[task.id]).length;
  const next = suggestedSection(day, now.getHours() + now.getMinutes() / 60, state?.preferences);
  const suggestion =
    next === 'morning'
      ? t(
          'Commencez par un moment calme et votre petit déjeuner.',
          'Start with a calm moment and breakfast.',
          'ابدأ بلحظة هدوء ووجبة إفطار.',
        )
      : next === 'body'
        ? t(
            'Une pause pour bouger, à votre rythme.',
            'Take a movement break at your own pace.',
            'خذ استراحة للحركة حسب قدرتك.',
          )
        : next === 'food'
          ? t(
              'Découvrez vos idées de repas pour aujourd’hui.',
              'See your meal ideas for today.',
              'اكتشف اقتراحات وجباتك لهذا اليوم.',
            )
          : next === 'mind'
            ? t(
                'Un défi de mémoire et une découverte vous attendent.',
                'A memory challenge and a new discovery await.',
                'ينتظرك تمرين للذاكرة ومعلومة جديدة.',
              )
            : next === 'evening'
              ? t(
                  'Ralentissez et préparez une soirée tranquille.',
                  'Slow down and prepare for a restful evening.',
                  'خفّف إيقاعك واستعد لمساء هادئ.',
                )
              : t(
                  'Votre routine est terminée. Profitez de votre journée.',
                  'Your routine is complete. Enjoy the rest of your day.',
                  'أكملت روتينك. استمتع ببقية يومك.',
                );
  if (compact)
    return (
      <Card style={{ padding: 17, borderRadius: 17, gap: 10 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Row>
            <Ionicons name="sunny-outline" size={19} color={colors.amber} />
            <Label bold size={14}>
              {t('Votre équilibre quotidien', 'Your daily balance', 'توازنك اليومي')}
            </Label>
          </Row>
          <Label muted size={11} style={{ writingDirection: 'ltr' }}>
            {done}/{tasks.length}
          </Label>
        </Row>
        <Label muted size={12}>
          {suggestion}
        </Label>
        <Row>
          <Button
            variant="ghost"
            title={t('Ouvrir ma routine', 'Open my routine', 'روتيني اليومي')}
            onPress={() => router.push('/wellness')}
            style={{ paddingHorizontal: 0 }}
          />
          <Button
            variant="ghost"
            icon="notifications-outline"
            title={t('Rappels', 'Reminders', 'التذكيرات')}
            onPress={() => router.push('/wellness/notifications')}
          />
        </Row>
      </Card>
    );
  return (
    <Card style={{ padding: 0, overflow: 'hidden', borderColor: colors.accent }}>
      <View style={{ backgroundColor: colors.hero, padding: 22, gap: 10 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Row>
            <Ionicons name="sunny-outline" size={20} color="#D4F5C8" />
            <Label size={12} bold style={{ color: '#D4F5C8' }}>
              {t('VOTRE RENDEZ-VOUS QUOTIDIEN', 'YOUR DAILY ROUTINE', 'روتينك اليومي')}
            </Label>
          </Row>
          <Label size={12} style={{ color: colors.heroText }}>
            {new Date(today + 'T12:00:00').toLocaleDateString(school.language, {
              weekday: 'long',
              day: 'numeric',
              month: 'short',
            })}
          </Label>
        </Row>
        <Label size={25} bold style={{ color: '#FFFFFF' }}>
          {t('Que faire aujourd’hui ?', 'What should I do today?', 'ماذا أفعل اليوم؟')}
        </Label>
        <Label size={14} style={{ color: colors.heroText }}>
          {t(
            'Bouger · Bien manger · Apprendre · Se détendre',
            'Move · Eat well · Learn · Unwind',
            'حركة · غذاء متوازن · تعلّم · راحة',
          )}
        </Label>
      </View>
      <View style={{ padding: 20, gap: 14 }}>
        <Label size={15}>{suggestion}</Label>
        <Row style={{ justifyContent: 'space-between' }}>
          <Label muted size={12}>
            {t('Vos petits pas du jour', 'Your small steps today', 'خطواتك الصغيرة اليوم')}
          </Label>
          <Label bold size={13} style={{ writingDirection: 'ltr' }}>
            {done} / {tasks.length}
          </Label>
        </Row>
        <ProgressBar value={done / tasks.length} />
        <Button
          icon="arrow-forward-circle-outline"
          title={t('Ouvrir ma routine du jour', 'Open today’s routine', 'افتح روتيني اليومي')}
          onPress={() => router.push('/wellness')}
        />
        <Button
          variant="ghost"
          icon="notifications-outline"
          title={t('Recevoir mes rappels', 'Set up my reminders', 'إعداد تذكيراتي اليومية')}
          onPress={() => router.push('/wellness/notifications')}
        />
      </View>
    </Card>
  );
}
