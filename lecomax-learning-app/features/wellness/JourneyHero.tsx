import { View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Label, Row } from '../../components/UI';
import { useSchool } from '../../store/School';

export function JourneyHero({
  date,
  greeting,
  day,
  streak,
  progress,
  done,
  total,
}: {
  date: string;
  greeting: string;
  day: number;
  streak: number;
  progress: number;
  done: number;
  total: number;
}) {
  const { t, colors, rtl, state } = useSchool();
  const evening = new Date().getHours() >= 18;
  return (
    <View
      style={{
        backgroundColor: colors.hero,
        borderRadius: 24,
        padding: 20,
        gap: 14,
        overflow: 'hidden',
      }}
    >
      <Row style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
        <Label size={12} style={{ color: colors.heroText, flex: 1 }}>
          {new Date(`${date}T12:00:00`).toLocaleDateString(state.language, {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </Label>
        <Ionicons name={evening ? 'moon-outline' : 'sunny-outline'} size={25} color="#F4D899" />
      </Row>
      <View style={{ gap: 4 }}>
        <Label bold size={27} style={{ color: '#FFFFFF', lineHeight: rtl ? 42 : 35 }}>
          {greeting}
        </Label>
        <Label size={14} style={{ color: colors.heroText }}>
          {t(
            'Prenez soin de vous. Avancez sur ce qui compte.',
            'Care for yourself. Make progress on what matters.',
            'اعتنِ بنفسك وتقدّم فيما يهمك.',
          )}
        </Label>
      </View>
      <Row style={{ gap: 8 }}>
        {[
          t(`Jour ${day}`, `Day ${day}`, `اليوم ${day}`),
          t(`${streak} jours de régularité`, `${streak} day streak`, `${streak} أيام متتالية`),
        ].map((label) => (
          <View
            key={label}
            style={{
              backgroundColor: '#FFFFFF14',
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 20,
            }}
          >
            <Label size={11} style={{ color: colors.heroText }}>
              {label}
            </Label>
          </View>
        ))}
      </Row>
      <View style={{ gap: 8, paddingTop: 12, borderTopWidth: 1, borderColor: '#FFFFFF24' }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Label size={12} style={{ color: colors.heroText }}>
            {t(
              `${done}/${total} habitudes de bien-être`,
              `${done}/${total} wellbeing habits`,
              `${done}/${total} عادات للعافية`,
            )}
          </Label>
          <Label size={12} bold style={{ color: '#E1EFC5' }}>
            {progress}%
          </Label>
        </Row>
        <View
          accessibilityRole="progressbar"
          accessibilityLabel={t('Progrès du jour', 'Daily progress', 'تقدم اليوم')}
          accessibilityValue={{ min: 0, max: 100, now: progress }}
          style={{
            height: 6,
            borderRadius: 8,
            backgroundColor: '#FFFFFF20',
            overflow: 'hidden',
            alignItems: rtl ? 'flex-end' : 'flex-start',
          }}
        >
          <View
            style={{
              height: 6,
              width: `${progress}%`,
              borderRadius: 8,
              backgroundColor: '#CCE4AD',
            }}
          />
        </View>
        <Label size={11} style={{ color: colors.heroText }}>
          {t(
            '7 habitudes valident une journée de régularité. Chaque pas compte.',
            '7 habits count toward your streak. Every step counts.',
            '٧ عادات تحتسب يوماً للاستمرارية. كل خطوة مهمة.',
          )}
        </Label>
      </View>
    </View>
  );
}
