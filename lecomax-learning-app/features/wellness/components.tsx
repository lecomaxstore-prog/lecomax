import React, { useState } from 'react';
import { AccessibilityInfo, ActivityIndicator, Animated, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, usePathname } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Button, Card, IconButton, Label, Page, Row } from '../../components/UI';
import { useSchool } from '../../store/School';
import { c } from './data';
import { useJourney } from './useJourney';
import type { Copy, DailyTask } from './types';
export function useCopy() {
  const { state } = useSchool();
  return (copy: Copy) => copy[state.language];
}
export const achievementNames: Record<string, Copy> = {
  first: c('First day', 'Premier jour', 'اليوم الأول'),
  streak3: c('3-day streak', 'Série de 3 jours', '٣ أيام متتالية'),
  streak7: c('7-day streak', 'Série de 7 jours', '٧ أيام متتالية'),
  streak30: c('30-day streak', 'Série de 30 jours', '٣٠ يوماً متتالياً'),
  brain10: c('10 brain exercises', '10 défis mémoire', '١٠ تمارين عقل'),
  learn10: c('10 lessons learned', '10 leçons apprises', '١٠ دروس مكتملة'),
  active7: c('7 active days', '7 jours actifs', '٧ أيام نشطة'),
  healthy7: c('7 balanced food days', '7 jours de repas équilibrés', '٧ أيام غذاء متوازن'),
};
export function JourneyPage({ title, children }: { title: string; children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const { t, colors, rtl } = useSchool(),
    j = useJourney();
  const pathname = usePathname();
  const destinations = [
    { path: '/wellness', icon: 'sunny-outline', label: t('Aujourd’hui', 'Today', 'اليوم') },
    {
      path: '/wellness/progress',
      icon: 'stats-chart-outline',
      label: t('Progrès', 'Progress', 'التقدم'),
    },
    {
      path: '/wellness/preferences',
      icon: 'options-outline',
      label: t('Préférences', 'Preferences', 'التفضيلات'),
    },
    {
      path: '/wellness/notifications',
      icon: 'notifications-outline',
      label: t('Rappels', 'Reminders', 'التذكيرات'),
    },
  ] as const;
  return (
    <Page
      title={title}
      compactSpacing
      header={
        <View style={{ gap: 20 }}>
          <Row style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
            <IconButton
              icon={rtl ? 'arrow-forward' : 'arrow-back'}
              label={t('Retour aux outils', 'Back to learning tools', 'العودة إلى أدوات التعلم')}
              onPress={() => router.replace('/more')}
            />
            <Row style={{ gap: 8 }}>
              <Ionicons name="leaf-outline" size={17} color={colors.accent} />
              <Label size={11} bold muted>
                L’ECOMAX · {t('BIEN-ÊTRE', 'WELLNESS', 'العافية')}
              </Label>
            </Row>
          </Row>
          <View style={{ gap: 5 }}>
            <Label
              size={28}
              bold
              accessibilityRole="header"
              style={{ lineHeight: rtl ? 44 : 36, letterSpacing: rtl ? 0 : -0.6 }}
            >
              {title}
            </Label>
            <Label muted size={13}>
              {t(
                'De petites attentions pour vous, chaque jour.',
                'Small moments of care, every day.',
                'لحظات صغيرة للاهتمام بنفسك، كل يوم.',
              )}
            </Label>
          </View>
        </View>
      }
    >
      <View
        accessibilityRole="tablist"
        style={{
          flexDirection: rtl ? 'row-reverse' : 'row',
          padding: 5,
          gap: 3,
          borderRadius: 20,
          backgroundColor: colors.neutral,
        }}
      >
        {destinations.map((item) => {
          const selected = pathname === item.path;
          return (
            <Pressable
              key={item.path}
              accessibilityRole="tab"
              accessibilityLabel={item.label}
              accessibilityState={{ selected }}
              onPress={() => router.replace(item.path)}
              style={({ pressed }) => ({
                flex: 1,
                minWidth: 0,
                minHeight: 64,
                paddingVertical: 9,
                paddingHorizontal: 3,
                borderRadius: 15,
                gap: 4,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: selected ? colors.card : 'transparent',
                opacity: pressed ? 0.65 : 1,
                borderWidth: 1,
                borderColor: selected ? colors.line : 'transparent',
              })}
            >
              <Ionicons
                name={item.icon}
                size={20}
                color={selected ? colors.accent : colors.muted}
              />
              <Label
                size={11}
                bold={selected}
                style={{ color: selected ? colors.accent : colors.muted, textAlign: 'center' }}
              >
                {item.label}
              </Label>
            </Pressable>
          );
        })}
      </View>
      {!!j.error && (
        <Card>
          <Label>
            {t(
              'Impossible de lire ou enregistrer les données. Vos données précédentes sont conservées. Réessayez avant de continuer.',
              'Unable to read or save progress. Previous data is preserved. Please retry before continuing.',
              'تعذر قراءة التقدم أو حفظه. بياناتك السابقة محفوظة. أعد المحاولة قبل المتابعة.',
            )}
          </Label>
          <Button title={t('Réessayer', 'Retry', 'أعد المحاولة')} onPress={j.retry} />
        </Card>
      )}
      {j.state ? (
        children
      ) : !j.error ? (
        <ActivityIndicator accessibilityLabel={t('Chargement', 'Loading', 'جار التحميل')} />
      ) : null}
      <Button
        quiet
        icon="grid-outline"
        title={t('Retour aux outils', 'Back to learning tools', 'العودة إلى أدوات التعلم')}
        onPress={() => router.replace('/more')}
      />
      <View style={{ height: insets.bottom }} />
    </Page>
  );
}
export function Section({
  title,
  children,
  initial = false,
  icon = 'leaf-outline',
  subtitle,
  tone = 'green',
  active,
}: {
  title: string;
  children: React.ReactNode;
  initial?: boolean;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  subtitle?: string;
  tone?: 'green' | 'amber' | 'violet';
  active?: boolean;
}) {
  const [open, setOpen] = useState(initial);
  const { colors, rtl } = useSchool();
  const tint = tone === 'amber' ? colors.amber : tone === 'violet' ? colors.violet : colors.accent;
  const fill =
    tone === 'amber' ? colors.amberSoft : tone === 'violet' ? colors.violetSoft : colors.soft;
  if (active === false) return null;
  const expanded = active === true || open;
  return (
    <Card style={{ padding: 16, gap: 18 }}>
      <Pressable
        accessibilityRole={active === true ? 'header' : 'button'}
        accessibilityState={{ expanded }}
        aria-expanded={expanded}
        accessibilityLabel={title}
        onPress={active === true ? undefined : () => setOpen((v) => !v)}
        style={{
          minHeight: 44,
          flexDirection: rtl ? 'row-reverse' : 'row',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 15,
            backgroundColor: fill,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name={icon} size={21} color={tint} />
        </View>
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Label bold size={17}>
            {title}
          </Label>
          {!!subtitle && (
            <Label muted size={12}>
              {subtitle}
            </Label>
          )}
        </View>
        {active !== true && (
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={colors.accent}
          />
        )}
      </Pressable>
      {expanded && children}
    </Card>
  );
}
export function TaskCard({
  task,
  done,
  onToggle,
}: {
  task: DailyTask;
  done: boolean;
  onToggle: () => Promise<void>;
}) {
  const copy = useCopy(),
    { colors, rtl } = useSchool();
  const [scale] = useState(() => new Animated.Value(1));
  const [busy, setBusy] = useState(false);
  const toggle = async () => {
    setBusy(true);
    try {
      await onToggle();
      if (!(await AccessibilityInfo.isReduceMotionEnabled()))
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.025, duration: 100, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: 150, useNativeDriver: true }),
        ]).start();
    } catch {
      /* Provider displays storage errors. */
    } finally {
      setBusy(false);
    }
  };
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityLabel={copy(task.title)}
        accessibilityState={{ checked: done, disabled: busy }}
        aria-checked={done}
        aria-disabled={busy}
        disabled={busy}
        onPress={() => void toggle()}
        style={{
          backgroundColor: done ? colors.soft : colors.card,
          borderRadius: 16,
          padding: 16,
          borderWidth: 1,
          borderColor: done ? colors.accent : colors.line,
          flexDirection: rtl ? 'row-reverse' : 'row',
          gap: 12,
          alignItems: 'center',
          minHeight: 60,
        }}
      >
        <Ionicons name={done ? 'checkbox' : 'square-outline'} size={25} color={colors.accent} />
        <Label size={15} style={{ flex: 1 }}>
          {copy(task.title)}
        </Label>
        {busy && <ActivityIndicator />}
      </Pressable>
    </Animated.View>
  );
}
export function Celebration() {
  const { celebration, clearCelebration } = useJourney(),
    copy = useCopy(),
    { t, colors } = useSchool();
  const [scale] = useState(() => new Animated.Value(1));
  React.useEffect(() => {
    let active = true;
    if (celebration.length)
      void AccessibilityInfo.isReduceMotionEnabled()
        .then((reduce) => {
          if (!reduce && active)
            Animated.sequence([
              Animated.timing(scale, { toValue: 1.04, duration: 180, useNativeDriver: true }),
              Animated.timing(scale, { toValue: 1, duration: 220, useNativeDriver: true }),
            ]).start();
        })
        .catch(() => {});
    return () => {
      active = false;
    };
  }, [celebration, scale]);
  if (!celebration.length) return null;
  return (
    <Animated.View accessibilityLiveRegion="polite" style={{ transform: [{ scale }] }}>
      <Card style={{ backgroundColor: colors.soft }}>
        <Label bold>
          ✦ {t('Une étape franchie !', 'A milestone to celebrate!', 'إنجاز يستحق الاحتفال!')}
        </Label>
        {celebration.map((id) => (
          <Label key={id}>🏆 {copy(achievementNames[id]!)}</Label>
        ))}
        <Button quiet title={t('Continuer', 'Continue', 'متابعة')} onPress={clearCelebration} />
      </Card>
    </Animated.View>
  );
}
