import React from 'react';
import { Pressable, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSchool } from '../store/School';
import { icons, radius, space, type, fonts } from '../constants/design';
import { Button, Card, Label, ProgressBar, Row } from './UI';

type Icon = React.ComponentProps<typeof Ionicons>['name'];
export function SectionHeader({
  title,
  action,
  onPress,
}: {
  title: string;
  action?: string;
  onPress?: () => void;
}) {
  return (
    <Row style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
      <Label bold size={type.title} accessibilityRole="header" style={{ flex: 1 }}>
        {title}
      </Label>
      {action && onPress && <Button variant="ghost" title={action} onPress={onPress} />}
    </Row>
  );
}
export function Badge({
  icon,
  label,
  tone = 'green',
}: {
  icon?: Icon;
  label: string;
  tone?: 'green' | 'amber' | 'violet';
}) {
  const { colors, rtl } = useSchool();
  const color = tone === 'amber' ? colors.amber : tone === 'violet' ? colors.violet : colors.accent;
  return (
    <Row
      style={{
        alignSelf: rtl ? 'flex-end' : 'flex-start',
        paddingHorizontal: space.sm,
        paddingVertical: space.xs,
        borderRadius: radius.sm,
        backgroundColor:
          tone === 'amber' ? colors.amberSoft : tone === 'violet' ? colors.violetSoft : colors.soft,
      }}
    >
      {icon && <Ionicons name={icon} size={14} color={color} />}
      <Label size={type.caption} style={{ color }}>
        {label}
      </Label>
    </Row>
  );
}
export function SearchBar({
  placeholder,
  value,
  onChangeText,
  onPress,
}: {
  placeholder: string;
  value?: string;
  onChangeText?: (value: string) => void;
  onPress?: () => void;
}) {
  const { colors, rtl, t } = useSchool();
  const content = (
    <>
      <Ionicons name="search-outline" size={icons.control} color={colors.muted} />
      {onChangeText ? (
        <TextInput
          accessibilityLabel={placeholder}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          value={value}
          onChangeText={onChangeText}
          autoCapitalize="none"
          returnKeyType="search"
          style={{
            flex: 1,
            minWidth: 0,
            color: colors.text,
            fontSize: type.small,
            fontFamily: rtl ? fonts.arabic : fonts.body,
            textAlign: rtl ? 'right' : 'left',
            writingDirection: rtl ? 'rtl' : 'ltr',
            paddingVertical: space.md,
          }}
        />
      ) : (
        <Label muted size={type.small} style={{ flex: 1 }}>
          {placeholder}
        </Label>
      )}
      {!!value && onChangeText && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('Effacer la recherche', 'Clear search', 'مسح البحث')}
          onPress={() => onChangeText('')}
          style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="close-circle" color={colors.muted} size={icons.small} />
        </Pressable>
      )}
    </>
  );
  const style = {
    flexDirection: rtl ? ('row-reverse' as const) : ('row' as const),
    alignItems: 'center' as const,
    gap: space.md,
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.control,
    paddingHorizontal: space.lg,
    minHeight: 52,
    flexShrink: 1,
  };
  return onPress ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={placeholder}
      onPress={onPress}
      style={({ pressed }) => [style, { opacity: pressed ? 0.7 : 1, flex: 1 }]}
    >
      {content}
    </Pressable>
  ) : (
    <View style={style}>{content}</View>
  );
}
export function LearningPathCard({
  title,
  description,
  meta,
  progress,
  icon = 'layers-outline',
  action,
  onPress,
  tone = 'green',
  compact = false,
  showProgress = true,
}: {
  title: string;
  description?: string;
  meta: string;
  progress: number;
  icon?: Icon;
  action: string;
  onPress: () => void;
  tone?: 'green' | 'violet' | 'amber';
  compact?: boolean;
  showProgress?: boolean;
}) {
  const { colors, rtl, t } = useSchool();
  const tint = tone === 'violet' ? colors.violet : tone === 'amber' ? colors.amber : colors.accent;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title} · ${meta} · ${action}`}
      onPress={onPress}
      style={({ pressed }) => ({
        opacity: pressed ? 0.78 : 1,
        flexGrow: compact ? 0 : 1,
      })}
    >
      <Card
        style={{
          gap: compact ? 12 : 18,
          flexGrow: compact ? 0 : 1,
          borderTopWidth: compact ? 1 : 3,
          borderTopColor: compact ? colors.line : tint,
          ...(compact ? { padding: 18, shadowOpacity: 0, elevation: 0, borderRadius: 18 } : {}),
        }}
      >
        <Row style={{ flexWrap: 'nowrap', alignItems: 'flex-start' }}>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: radius.control,
              backgroundColor:
                tone === 'violet'
                  ? colors.violetSoft
                  : tone === 'amber'
                    ? colors.amberSoft
                    : colors.soft,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name={icon} size={icons.control} color={tint} />
          </View>
          <View style={{ flex: 1, gap: space.xs }}>
            <Label bold size={compact ? 15 : 17}>
              {title}
            </Label>
            <Label muted size={type.caption}>
              {meta}
            </Label>
          </View>
          <Ionicons
            name={rtl ? 'chevron-back' : 'chevron-forward'}
            size={icons.small}
            color={colors.muted}
          />
        </Row>
        {!!description && (
          <Label
            muted
            size={compact ? type.caption : type.small}
            numberOfLines={compact ? 2 : undefined}
            style={{ flexGrow: compact ? 0 : 1 }}
          >
            {description}
          </Label>
        )}
        {showProgress && (
          <View style={{ gap: 8, marginTop: 4 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Label size={11} muted>
                {t('Progression', 'Your progress', 'تقدّمك')}
              </Label>
              <Label size={11} bold style={{ color: tint }}>
                {Math.round(
                  Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0)) * 100,
                )}
                %
              </Label>
            </Row>
            <ProgressBar value={progress} />
          </View>
        )}
      </Card>
    </Pressable>
  );
}
export function ContinueLearningCard({
  title,
  description,
  minutes,
  progress,
  onPress,
}: {
  title: string;
  description: string;
  minutes: number;
  progress: number;
  onPress: () => void;
}) {
  const { colors, t } = useSchool();
  return (
    <Card style={{ padding: 0, overflow: 'hidden' }}>
      <View style={{ backgroundColor: colors.hero, padding: space.xl, gap: space.md }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Label size={type.caption} bold style={{ color: colors.heroText }}>
            {t('LA PROCHAINE ÉTAPE', 'YOUR NEXT STEP', 'خطوتك التالية')}
          </Label>
          <Ionicons name="play-circle-outline" size={32} color={colors.heroText} />
        </Row>
        <Label size={24} bold style={{ color: colors.onPrimary }}>
          {title}
        </Label>
        <Label size={type.small} style={{ color: colors.heroText }}>
          {description}
        </Label>
      </View>
      <View style={{ paddingHorizontal: space.xl, paddingBottom: space.xl, gap: space.md }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Row>
            <Ionicons name="time-outline" color={colors.muted} size={16} />
            <Label muted size={type.caption}>
              {minutes} {t('min', 'min', 'دقائق')}
            </Label>
          </Row>
          <Label muted size={type.caption}>
            {Math.round(progress * 100)}% {t('du module', 'of module', 'من الوحدة')}
          </Label>
        </Row>
        <ProgressBar value={progress} />
        <Button
          title={t('Continuer mon cours →', 'Continue learning →', 'تابع التعلّم ←')}
          onPress={onPress}
        />
      </View>
    </Card>
  );
}
