import React from 'react';
import { Pressable, View, useWindowDimensions } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSchool } from '../store/School';
import { Label, ProgressBar, Row } from './UI';

export function LessonHeader({
  title,
  minutes,
  completed,
  stage,
  onStageChange,
  hasCode = true,
}: {
  hasCode?: boolean;
  title: string;
  minutes: number;
  completed: boolean;
  stage: number;
  onStageChange: (stage: number) => void;
}) {
  const { colors, t, rtl } = useSchool();
  const { width, fontScale } = useWindowDimensions();
  const wrapSteps = width < 360 || fontScale > 1.3;
  const steps = [
    { title: t('Comprendre', 'Understand', 'فهم'), icon: 'bulb-outline' },
    {
      title: hasCode ? t('Le code', 'Read code', 'الكود') : t('Exemple', 'Example', 'مثال'),
      icon: hasCode ? 'code-slash-outline' : 'reader-outline',
    },
    { title: t('Pratiquer', 'Practice', 'تدريب'), icon: 'create-outline' },
    { title: t('Quiz', 'Quiz', 'اختبار'), icon: 'checkmark-circle-outline' },
  ] as const;
  const guidance = [
    t(
      'Repérez l’idée principale et expliquez-la avec vos mots.',
      'Find the main idea and explain it in your own words.',
      'حدّد الفكرة الرئيسية وشرحها بكلماتك.',
    ),
    t(
      'Suivez l’exemple et prédisez le résultat avant de continuer.',
      'Follow the example and predict the result before continuing.',
      'تبع المثال وتوقّع النتيجة قبل ما تكمل.',
    ),
    t(
      'Essayez par vous-même, puis utilisez les indices si nécessaire.',
      'Try it yourself, then use the hints if you need them.',
      'جرّب بوحدك، واستعمل التلميحات إلا احتجتيها.',
    ),
    t(
      'Vérifiez votre compréhension et revenez sur les points difficiles.',
      'Check your understanding and revisit anything that needs another look.',
      'اختبر فهمك وراجع النقط اللي باقية صعيبة.',
    ),
  ];
  return (
    <View style={{ gap: 20 }}>
      <View
        style={{
          backgroundColor: colors.card,
          borderRadius: 20,
          padding: 24,
          gap: 10,
          borderWidth: 1,
          borderColor: colors.line,
          overflow: 'hidden',
        }}
      >
        <Row style={{ justifyContent: 'space-between' }}>
          <Row style={{ gap: 8, flexShrink: 1 }}>
            <Ionicons name="school-outline" size={17} color={colors.accent} />
            <Label size={12} bold style={{ color: colors.accent }}>
              {t('Votre espace de découverte', 'Your learning space', 'مساحتك للتعلّم')}
            </Label>
          </Row>
          {completed && (
            <Ionicons
              name="checkmark-circle"
              size={22}
              color={colors.accent}
              accessibilityLabel={t('Terminé', 'Completed', 'مكتمل')}
            />
          )}
        </Row>
        <Label
          accessibilityRole="header"
          bold
          size={26}
          style={{ color: colors.text, lineHeight: rtl ? 43 : 36, letterSpacing: rtl ? 0 : -0.6 }}
        >
          {title}
        </Label>
        <Row style={{ gap: 12, paddingTop: 4 }}>
          <Row style={{ gap: 6 }}>
            <Ionicons name="time-outline" size={16} color={colors.muted} />
            <Label size={13} style={{ color: colors.muted }}>
              {minutes} {t('min', 'min', 'دقيقة')}
            </Label>
          </Row>
          <View style={{ width: 1, height: 14, backgroundColor: colors.line }} />
          <Label size={13} style={{ color: colors.muted }}>
            {t('Apprendre en pratiquant', 'Learn by doing', 'تعلّم بالتطبيق')}
          </Label>
        </Row>
        <ProgressBar value={completed ? 1 : stage / 4} />
      </View>
      <View style={{ gap: 12 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Label bold size={13}>
            {t('Votre parcours', 'Your lesson journey', 'رحلتك في هذا الدرس')}
          </Label>
          <Label muted size={12}>
            {t(`Étape ${stage + 1} sur 4`, `Step ${stage + 1} of 4`, `الخطوة ${stage + 1} من 4`)}
          </Label>
        </Row>
        <View
          accessibilityRole="tablist"
          style={{
            flexDirection: rtl ? 'row-reverse' : 'row',
            flexWrap: 'wrap',
            alignItems: 'stretch',
            gap: 4,
            padding: 5,
            borderRadius: 16,
            backgroundColor: colors.neutral,
          }}
        >
          {steps.map((step, index) => {
            const active = stage === index;
            return (
              <Pressable
                key={index}
                accessibilityRole="tab"
                accessibilityLabel={`${index + 1}. ${step.title}`}
                accessibilityState={{ selected: active }}
                aria-selected={active}
                onPress={() => onStageChange(index)}
                style={({ pressed }) => ({
                  flexGrow: 1,
                  flexBasis: wrapSteps ? '46%' : 0,
                  minWidth: 0,
                  minHeight: wrapSteps ? 52 : 70,
                  flexDirection: wrapSteps ? (rtl ? 'row-reverse' : 'row') : 'column',
                  paddingHorizontal: 4,
                  paddingVertical: 10,
                  gap: 5,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: active ? colors.card : 'transparent',
                  borderWidth: 1,
                  borderColor: active ? colors.accent : 'transparent',
                  opacity: pressed ? 0.75 : 1,
                })}
              >
                <Ionicons
                  name={step.icon}
                  size={21}
                  color={active ? colors.accent : colors.muted}
                />
                <Label
                  bold
                  size={12}
                  style={{ textAlign: 'center', color: active ? colors.accent : colors.muted }}
                >
                  {step.title}
                </Label>
              </Pressable>
            );
          })}
        </View>
        <View
          accessibilityLiveRegion="polite"
          style={{ borderRadius: 14, padding: 16, backgroundColor: colors.soft, gap: 4 }}
        >
          <Label bold size={13} style={{ color: colors.accent }}>
            {steps[stage]?.title}
          </Label>
          <Label size={13} muted>
            {guidance[stage]}
          </Label>
        </View>
      </View>
    </View>
  );
}
