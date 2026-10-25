import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  AccessibilityInfo,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  useWindowDimensions,
  type TextProps,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSchool } from '../store/School';
import Ionicons from '@expo/vector-icons/Ionicons';
import { fonts, icons, motion, radius, space, type } from '../constants/design';
import { searchSegments } from '../utils/search-highlight';
export function Label({
  children,
  muted = false,
  size = type.body,
  bold = false,
  ...props
}: TextProps & { muted?: boolean; size?: number; bold?: boolean }) {
  const { colors, rtl } = useSchool();
  return (
    <Text
      {...props}
      style={[
        {
          color: muted ? colors.muted : colors.text,
          fontSize: size,
          lineHeight: Math.round(size * (rtl ? 1.7 : 1.5)),
          fontFamily: rtl ? (bold ? fonts.arabicBold : fonts.arabic) : fonts.body,
          fontWeight: rtl ? '400' : bold ? '600' : '400',
          letterSpacing: rtl ? 0 : bold && size >= 20 ? -0.5 : 0,
          textAlign: rtl ? 'right' : 'left',
          writingDirection: rtl ? 'rtl' : 'ltr',
        },
        props.style,
      ]}
    >
      {children}
    </Text>
  );
}
export function Row({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const { rtl } = useSchool();
  return (
    <View
      style={[
        {
          flexDirection: rtl ? 'row-reverse' : 'row',
          alignItems: 'center',
          gap: space.sm,
          flexWrap: 'wrap',
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const { colors } = useSchool();
  return (
    <View
      style={[
        {
          backgroundColor: colors.card,
          borderRadius: radius.card,
          padding: space.xl,
          borderWidth: 1,
          borderColor: colors.line,
          gap: space.md,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
export function Button({
  title,
  onPress,
  quiet = false,
  disabled = false,
  selected = false,
  expanded,
  variant,
  loading = false,
  icon,
  style,
}: {
  title: string;
  onPress: () => void;
  quiet?: boolean;
  disabled?: boolean;
  selected?: boolean;
  expanded?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  loading?: boolean;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  style?: ViewStyle;
}) {
  const { colors, rtl } = useSchool();
  const [focused, setFocused] = useState(false);
  const secondary = variant === 'secondary';
  const outline = variant === 'outline' || (!variant && quiet);
  const ghost = variant === 'ghost';
  const foreground = selected || secondary || outline || ghost ? colors.accent : colors.onPrimary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: disabled || loading, selected, busy: loading, expanded }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 48,
        maxWidth: '100%',
        flexShrink: 1,
        paddingHorizontal: space.lg,
        paddingVertical: space.sm,
        borderRadius: radius.control,
        backgroundColor: selected || secondary
          ? colors.soft
          : ghost
            ? 'transparent'
            : outline
              ? colors.card
              : colors.primary,
        opacity: disabled && !loading ? 0.5 : pressed ? 0.82 : 1,
        borderWidth: 1,
        borderColor: focused || selected ? colors.accent : outline ? colors.line : 'transparent',
        flexDirection: rtl ? 'row-reverse' : 'row',
        alignItems: 'center',
        gap: space.sm,
        justifyContent: 'center',
        ...style,
      })}
    >
      {loading ? (
        <ActivityIndicator color={foreground} size="small" />
      ) : icon ? (
        <Ionicons name={icon} color={foreground} size={icons.small} />
      ) : null}
      <Label
        size={rtl ? 15 : type.small}
        bold
        style={{ color: foreground, textAlign: 'center', flexShrink: 1 }}
      >
        {title}
      </Label>
    </Pressable>
  );
}
export function Field({
  value,
  onChangeText,
  placeholder,
  multiline = false,
  secure = false,
  code = false,
  keyboardType,
  autoComplete,
  editable = true,
  accessibilityLabel,
  maxLength,
  minHeight,
}: {
  value: string;
  onChangeText: (s: string) => void;
  placeholder: string;
  multiline?: boolean;
  secure?: boolean;
  code?: boolean;
  keyboardType?: TextInputProps['keyboardType'];
  autoComplete?: TextInputProps['autoComplete'];
  editable?: boolean;
  accessibilityLabel?: string;
  maxLength?: number;
  minHeight?: number;
}) {
  const { colors, rtl } = useSchool();
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      accessibilityLabel={accessibilityLabel || placeholder}
      maxLength={maxLength}
      placeholder={placeholder}
      placeholderTextColor={colors.muted}
      value={value}
      onChangeText={onChangeText}
      multiline={multiline}
      secureTextEntry={secure}
      keyboardType={keyboardType}
      autoComplete={autoComplete}
      editable={editable}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      autoCapitalize="none"
      autoCorrect={!code && !secure}
      style={{
        minHeight: minHeight ?? (multiline ? 120 : 48),
        borderWidth: 1,
        borderColor: focused ? colors.accent : colors.line,
        borderRadius: radius.control,
        padding: space.md,
        color: colors.text,
        backgroundColor: colors.card,
        textAlign: code ? 'left' : rtl ? 'right' : 'left',
        writingDirection: code ? 'ltr' : rtl ? 'rtl' : 'ltr',
        fontFamily: code ? fonts.code : rtl ? fonts.arabic : fonts.body,
        lineHeight: 26,
        textAlignVertical: 'top',
        fontSize: 16,
      }}
    />
  );
}
export function Page({
  title,
  subtitle,
  children,
  scroll = true,
  header,
  compactSpacing = false,
  wide = false,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  scroll?: boolean;
  header?: React.ReactNode;
  compactSpacing?: boolean;
  wide?: boolean;
}) {
  const { colors, ready, error, retry, t, saveStatus } = useSchool();
  const { width } = useWindowDimensions();
  const compact = width < 480;
  const content = (
    <View
      style={{
        padding: compact ? space.lg : compactSpacing ? space.xxl : space.section,
        gap: compactSpacing ? space.xxl : 28,
        width: '100%',
        maxWidth: wide ? 1160 : 780,
        alignSelf: 'center',
        flex: scroll ? undefined : 1,
      }}
    >
      {header ?? (
        <View
          style={{
            gap: space.sm,
            paddingBottom: space.sm,
          }}
        >
          <Label size={11} bold style={{ color: colors.accent, letterSpacing: 1.6 }}>
            ACADEMY
          </Label>
          <Label
            size={compact ? 26 : 32}
            bold
            accessibilityRole="header"
            style={{ lineHeight: compact ? 38 : 46 }}
          >
            {title}
          </Label>
          {!!subtitle && (
            <Label muted size={compact ? 14 : 16}>
              {subtitle}
            </Label>
          )}
        </View>
      )}
      {!!error && (
        <Card>
          <Label accessibilityRole="alert" accessibilityLiveRegion="assertive">
            {error}
          </Label>
          <Button title={t('Réessayer', 'Retry', 'أعد المحاولة')} onPress={retry} />
        </Card>
      )}
      {ready ? (
        children
      ) : (
        <View
          accessible
          accessibilityLabel={t('Chargement', 'Loading', 'جارٍ التحميل')}
          style={{ gap: 16 }}
        >
          {[90, 180, 110].map((height, i) => (
            <View
              key={i}
              style={{ height, backgroundColor: colors.neutral, borderRadius: radius.card }}
            />
          ))}
        </View>
      )}
      {ready && !error && saveStatus && (
        <Label muted size={12} accessibilityLiveRegion="polite">
          {saveStatus === 'saved'
            ? t('Enregistré sur cet appareil', 'Saved on this device', 'محفوظ على هذا الجهاز')
            : t(
                'Enregistrement sur cet appareil…',
                'Saving on this device…',
                'جارٍ الحفظ على هذا الجهاز…',
              )}
        </Label>
      )}
    </View>
  );
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {scroll ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 24 }}
          >
            {content}
          </ScrollView>
        ) : (
          <View style={{ flex: 1 }}>{content}</View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
export function ProgressBar({ value }: { value: number }) {
  const { colors, rtl } = useSchool();
  const safeValue = Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
  const [animated] = useState(() => new Animated.Value(safeValue));
  useEffect(() => {
    let active = true;
    const animate = (reduce: boolean) => {
      if (!active) return;
      animated.stopAnimation();
      Animated.timing(animated, {
        toValue: safeValue,
        duration: reduce ? 0 : motion.quick,
        useNativeDriver: false,
      }).start();
    };
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', animate);
    AccessibilityInfo.isReduceMotionEnabled()
      .then(animate)
      .catch(() => animated.setValue(safeValue));
    return () => {
      active = false;
      subscription.remove();
      animated.stopAnimation();
    };
  }, [animated, safeValue]);
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(safeValue * 100) }}
      style={{
        height: 6,
        borderRadius: 4,
        backgroundColor: colors.line,
        overflow: 'hidden',
        alignItems: rtl ? 'flex-end' : 'flex-start',
      }}
    >
      <Animated.View
        style={{
          width: animated.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
          height: 6,
          borderRadius: radius.pill,
          backgroundColor: colors.accent,
        }}
      />
    </View>
  );
}

export function IconButton({
  icon,
  label,
  onPress,
  selected = false,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  selected?: boolean;
}) {
  const { colors } = useSchool();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => ({
        width: 48,
        height: 48,
        borderRadius: radius.control,
        backgroundColor: pressed || selected ? colors.soft : colors.card,
        borderWidth: 1,
        borderColor: selected ? colors.accent : colors.line,
        alignItems: 'center',
        justifyContent: 'center',
      })}
    >
      <Ionicons name={icon} size={icons.control} color={colors.text} />
    </Pressable>
  );
}

export function ListItem({
  title,
  subtitle,
  icon = 'book-outline',
  onPress,
  actionLabel,
  highlightQuery = '',
  grouped = false,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
  actionLabel?: string;
  highlightQuery?: string;
  grouped?: boolean;
}) {
  const { colors, rtl } = useSchool();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={actionLabel || title}
      onPress={onPress}
      style={({ pressed }) => ({
        padding: space.lg,
        borderRadius: grouped ? 10 : radius.card,
        backgroundColor: pressed ? colors.soft : colors.card,
        borderWidth: grouped ? 0 : 1,
        borderColor: colors.line,
        flexDirection: rtl ? 'row-reverse' : 'row',
        alignItems: 'center',
        gap: space.md,
        minHeight: 76,
      })}
    >
      <View
        style={{
          width: 40,
          height: 40,
          backgroundColor: colors.neutral,
          borderRadius: radius.control,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon} size={icons.control} color={colors.accent} />
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: space.xs }}>
        <Label size={type.small} bold>
          {highlightQuery
            ? searchSegments(title, highlightQuery).map((part, i) => (
                <Text
                  key={i}
                  style={
                    part.match
                      ? { backgroundColor: colors.amberSoft, color: colors.amber }
                      : undefined
                  }
                >
                  {part.text}
                </Text>
              ))
            : title}
        </Label>
        {!!subtitle && (
          <Label muted size={type.caption}>
            {subtitle}
          </Label>
        )}
      </View>
      <Ionicons
        name={rtl ? 'chevron-back' : 'chevron-forward'}
        size={icons.small}
        color={colors.muted}
      />
    </Pressable>
  );
}

export function EmptyState({
  title,
  description,
  icon = 'search-outline',
  action,
  onAction,
}: {
  title: string;
  description?: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  action?: string;
  onAction?: () => void;
}) {
  const { colors } = useSchool();
  return (
    <View
      style={{
        alignItems: 'center',
        paddingVertical: space.section,
        paddingHorizontal: space.lg,
        gap: space.md,
      }}
    >
      <View style={{ padding: space.lg, borderRadius: radius.card, backgroundColor: colors.soft }}>
        <Ionicons name={icon} size={icons.feature} color={colors.accent} />
      </View>
      <Label bold style={{ textAlign: 'center' }}>
        {title}
      </Label>
      {!!description && (
        <Label muted size={type.small} style={{ textAlign: 'center', maxWidth: 380 }}>
          {description}
        </Label>
      )}
      {!!action && onAction && <Button title={action} onPress={onAction} />}
    </View>
  );
}
