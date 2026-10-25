import React, { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSchool } from '../store/School';
import { Button, Label, Row } from './UI';
import { IconTile } from './AcademySignature';

export function TeacherIcon({
  icon,
  label,
  onPress,
  disabled = false,
  primary = false,
  surface = false,
  inverted = false,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  disabled?: boolean;
  primary?: boolean;
  surface?: boolean;
  inverted?: boolean;
}) {
  const { colors } = useSchool();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: inverted
          ? '#FFFFFF14'
          : primary
            ? colors.primary
            : pressed
              ? colors.soft
              : surface
                ? colors.card
                : 'transparent',
        borderWidth: surface ? 1 : 0,
        borderColor: inverted ? '#FFFFFF24' : colors.line,
        opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
      })}
    >
      <Ionicons
        name={icon}
        size={20}
        color={inverted || primary ? colors.onPrimary : colors.accent}
      />
    </Pressable>
  );
}

export function AIHeader({
  hasConversation,
  busy,
  onNewChat,
  onSettings,
}: {
  hasConversation: boolean;
  busy: boolean;
  onNewChat: () => void;
  onSettings: () => void;
}) {
  const { colors, t } = useSchool();
  const { width } = useWindowDimensions();
  return (
    <Row
      style={{
        flexWrap: 'nowrap',
        gap: 8,
        padding: 16,
        marginTop: 12,
        marginBottom: 12,
        borderRadius: 20,
        backgroundColor: colors.hero,
      }}
    >
      <Row style={{ flex: 1, minWidth: 0, flexWrap: 'nowrap', gap: 10 }}>
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={{
            width: width < 360 ? 36 : 42,
            height: width < 360 ? 36 : 42,
            borderRadius: 14,
            backgroundColor: '#FFFFFF14',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="sparkles" size={21} color="#D8EEC9" />
        </View>
        <View style={{ flex: 1, minWidth: 0, gap: 1 }}>
          <Label
            accessibilityRole="header"
            bold
            size={width < 360 ? 15 : 18}
            numberOfLines={1}
            style={{ lineHeight: 28, color: '#FFFFFF' }}
          >
            {t('Mon professeur IA', 'My AI teacher', 'أستاذي الذكي')}
          </Label>
          <Label size={11} numberOfLines={1} style={{ lineHeight: 19, color: colors.heroText }}>
            {t('À ton rythme, pas à pas.', 'At your pace, step by step.', 'معك، خطوة بخطوة.')}
          </Label>
        </View>
      </Row>
      <Row style={{ flexWrap: 'nowrap', gap: 6 }}>
        {hasConversation && (
          <TeacherIcon
            surface
            inverted
            icon="add-outline"
            label={t('Nouvelle discussion', 'New chat', 'محادثة جديدة')}
            disabled={busy}
            onPress={onNewChat}
          />
        )}
        <TeacherIcon
          surface
          inverted
          icon="options-outline"
          label={t('Personnaliser', 'Personalize', 'تخصيص')}
          onPress={onSettings}
        />
      </Row>
    </Row>
  );
}

export function TeacherShell({ children }: { children: React.ReactNode }) {
  const { colors, ready, error, retry, t } = useSchool();
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View
          style={{
            flex: 1,
            minHeight: 0,
            width: '100%',
            maxWidth: 860,
            alignSelf: 'center',
            paddingHorizontal: 14,
            paddingBottom: 8,
          }}
        >
          {!!error && (
            <View>
              <Label accessibilityRole="alert">{error}</Label>
              <Button title={t('Réessayer', 'Retry', 'أعد المحاولة')} onPress={retry} />
            </View>
          )}
          {ready ? children : <ThinkingIndicator />}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function TeacherSheet({
  visible,
  title,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const { colors, t } = useSchool();
  const [reduceMotion, setReduceMotion] = useState(true);
  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (active) setReduceMotion(value);
      })
      .catch(() => {});
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);
  return (
    <Modal
      visible={visible}
      transparent
      animationType={reduceMotion ? 'none' : 'fade'}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: '#091E1970', justifyContent: 'flex-end' }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable
          style={{ flex: 1 }}
          accessibilityRole="button"
          accessibilityLabel={t('Fermer', 'Close', 'إغلاق')}
          onPress={onClose}
        />
        <SafeAreaView
          edges={['bottom', 'left', 'right']}
          style={{
            maxHeight: '88%',
            width: '100%',
            maxWidth: 640,
            alignSelf: 'center',
            backgroundColor: colors.card,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
          }}
        >
          <View accessibilityViewIsModal style={{ padding: 20, minHeight: 0, flexShrink: 1 }}>
            <View
              style={{
                width: 32,
                height: 4,
                borderRadius: 2,
                backgroundColor: colors.line,
                alignSelf: 'center',
                marginBottom: 12,
              }}
            />
            <Row style={{ justifyContent: 'space-between', flexWrap: 'nowrap', marginBottom: 12 }}>
              <Label accessibilityRole="header" bold size={20} style={{ flex: 1 }}>
                {title}
              </Label>
              <TeacherIcon
                icon="close-outline"
                label={t('Fermer', 'Close', 'إغلاق')}
                onPress={onClose}
              />
            </Row>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ gap: 12, paddingBottom: 12 }}
            >
              {children}
            </ScrollView>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function AIEmptyState({ onPrompt }: { onPrompt: (text: string) => void }) {
  const { t, colors, rtl } = useSchool();
  const { height, width } = useWindowDimensions();
  const compact = height < 650;
  const prompts = [
    [
      'planet-outline',
      t('Pourquoi le ciel est-il bleu ?', 'Why is the sky blue?', 'لماذا السماء زرقاء؟'),
    ],
    [
      'language-outline',
      t(
        'Aide-moi à pratiquer mon anglais',
        'Help me practice English',
        'ساعدني أتدرّب على الإنجليزية',
      ),
    ],
    ['code-slash-outline', t('Explique ce code', 'Explain this code', 'اشرح هذا الكود')],
    [
      'calculator-outline',
      t('Explique les pourcentages', 'Explain percentages', 'اشرح لي النسب المئوية'),
    ],
  ] as const;
  return (
    <View
      style={{
        flexGrow: 1,
        flexShrink: 0,
        justifyContent: 'flex-start',
        gap: 18,
        paddingTop: compact ? 8 : 16,
        paddingBottom: 12,
        maxWidth: 480,
        width: '100%',
        alignSelf: 'center',
      }}
    >
      <View
        style={{
          alignItems: 'center',
          gap: 12,
          paddingHorizontal: 8,
          paddingTop: compact ? 0 : 10,
        }}
      >
        <View
          style={{
            width: compact || width < 360 ? 60 : 72,
            height: compact || width < 360 ? 60 : 72,
            borderRadius: 22,
            backgroundColor: colors.hero,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="sparkles-outline" size={32} color={colors.heroGold} />
        </View>
        <Label
          accessibilityRole="header"
          size={width < 360 ? 25 : 30}
          bold
          style={{ textAlign: 'center', maxWidth: 320, lineHeight: rtl ? 40 : 34 }}
        >
          {t(
            'Que veux-tu apprendre aujourd’hui ?',
            'What would you like to learn today?',
            'ماذا تريد أن تتعلّم اليوم؟',
          )}
        </Label>
        <Label muted size={13} style={{ textAlign: 'center', maxWidth: 320, lineHeight: 23 }}>
          {t(
            'Langues, sciences, code ou vie quotidienne. Choisis un sujet, on apprend ensemble.',
            'Languages, science, code or everyday life. Pick any topic and let’s learn together.',
            'لغات، علوم، برمجة أو مهارات يومية. اسأل عن أي موضوع ونتعلّمه معًا.',
          )}
        </Label>
      </View>
      <View style={{ gap: 10, flexDirection: rtl ? 'row-reverse' : 'row', flexWrap: 'wrap' }}>
        {prompts.map(([icon, title]) => (
          <Pressable
            key={icon}
            accessibilityRole="button"
            accessibilityLabel={title}
            onPress={() => onPrompt(title)}
            style={({ pressed }) => ({
              flexBasis: width < 340 ? '100%' : '46%',
              flexGrow: 1,
              minHeight: width < 340 ? 64 : compact ? 88 : 96,
              padding: 14,
              gap: 12,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: pressed ? colors.accent : colors.line,
              backgroundColor: pressed ? colors.soft : colors.card,
              flexDirection: width < 340 ? (rtl ? 'row-reverse' : 'row') : 'column',
              alignItems: width < 340 ? 'center' : rtl ? 'flex-end' : 'flex-start',
            })}
          >
            <IconTile icon={icon} />
            <Label bold size={13} style={{ lineHeight: 22, flexShrink: 1, flex: width < 340 ? 1 : undefined }}>
              {title}
            </Label>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export function ThinkingIndicator() {
  const { colors, t } = useSchool();
  const [opacity] = useState(() => new Animated.Value(1));
  useEffect(() => {
    let disposed = false;
    const animate = (reduce: boolean) => {
      opacity.stopAnimation();
      opacity.setValue(1);
      if (!reduce && !disposed)
        Animated.loop(
          Animated.sequence([
            Animated.timing(opacity, {
              toValue: 0.35,
              duration: 650,
              useNativeDriver: Platform.OS !== 'web',
            }),
            Animated.timing(opacity, {
              toValue: 1,
              duration: 650,
              useNativeDriver: Platform.OS !== 'web',
            }),
          ]),
        ).start();
    };
    void AccessibilityInfo.isReduceMotionEnabled()
      .then(animate)
      .catch(() => {});
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', animate);
    return () => {
      disposed = true;
      opacity.stopAnimation();
      subscription.remove();
    };
  }, [opacity]);
  return (
    <Row style={{ paddingVertical: 12 }}>
      <Animated.View style={{ opacity }}>
        <Ionicons name="sparkles" size={18} color={colors.accent} />
      </Animated.View>
      <Label muted size={14} accessibilityLiveRegion="polite">
        {t('Je prépare ton explication…', 'Preparing your explanation…', 'يشرح لك الآن…')}
      </Label>
    </Row>
  );
}
