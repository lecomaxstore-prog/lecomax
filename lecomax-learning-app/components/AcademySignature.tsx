import React from 'react';
import { Pressable, View, type ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSchool } from '../store/School';
import { Label, Row } from './UI';

type Icon = React.ComponentProps<typeof Ionicons>['name'];

export function IconTile({
  icon,
  tone = 'green',
  large = false,
}: {
  icon: Icon;
  tone?: 'green' | 'gold' | 'violet';
  large?: boolean;
}) {
  const { colors } = useSchool();
  return (
    <View
      style={{
        width: large ? 54 : 40,
        height: large ? 54 : 40,
        borderRadius: large ? 18 : 13,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor:
          tone === 'gold' ? colors.amberSoft : tone === 'violet' ? colors.violetSoft : colors.soft,
      }}
    >
      <Ionicons
        name={icon}
        size={large ? 25 : 20}
        color={tone === 'gold' ? colors.amber : tone === 'violet' ? colors.violet : colors.accent}
      />
    </View>
  );
}

/** Decorative orbital book, drawn with native views. No external image or runtime. */
export function AcademyEmblem({ small = false }: { small?: boolean }) {
  const { colors } = useSchool();
  const size = small ? 76 : 174;
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
    >
      {[1, 0.77].map((scale) => (
        <View
          key={scale}
          style={{
            position: 'absolute',
            width: size * scale,
            height: size * scale,
            borderRadius: size,
            borderWidth: 1,
            borderColor: colors.heroLine,
            transform: [{ rotate: '-18deg' }],
          }}
        />
      ))}
      <View
        style={{
          width: size * 0.53,
          height: size * 0.61,
          borderRadius: small ? 15 : 24,
          borderWidth: 1,
          borderColor: colors.heroLine,
          backgroundColor: colors.heroAccent,
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ rotate: '-12deg' }],
        }}
      >
        <Ionicons name="book-outline" size={size * 0.28} color={colors.onPrimary} />
      </View>
      <View
        style={{
          position: 'absolute',
          top: size * 0.14,
          right: size * 0.14,
          width: small ? 7 : 11,
          height: small ? 7 : 11,
          borderRadius: 8,
          backgroundColor: colors.heroGold,
        }}
      />
    </View>
  );
}

export function MetricCard({
  value,
  label,
  icon,
  tone = 'green',
}: {
  value: number | string;
  label: string;
  icon: Icon;
  tone?: 'green' | 'gold' | 'violet';
}) {
  const { colors } = useSchool();
  return (
    <View
      style={{
        flexGrow: 1,
        flexBasis: 130,
        minWidth: 0,
        padding: 16,
        gap: 12,
        backgroundColor: colors.card,
        borderColor: colors.line,
        borderWidth: 1,
        borderRadius: 20,
      }}
    >
      <Row style={{ justifyContent: 'space-between' }}>
        <IconTile icon={icon} tone={tone} />
        <Label bold size={27}>
          {value}
        </Label>
      </Row>
      <Label muted size={12}>
        {label}
      </Label>
    </View>
  );
}

export function ToolCard({
  title,
  description,
  icon,
  onPress,
  style,
  eyebrow,
}: {
  title: string;
  description: string;
  icon: Icon;
  onPress: () => void;
  style?: ViewStyle;
  eyebrow?: string;
}) {
  const { colors, rtl } = useSchool();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => ({
        padding: 20,
        gap: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: pressed ? colors.accent : colors.line,
        backgroundColor: pressed ? colors.soft : colors.card,
        ...style,
      })}
    >
      <Row style={{ justifyContent: 'space-between' }}>
        <IconTile icon={icon} />
        <Ionicons name={rtl ? 'arrow-back' : 'arrow-forward'} size={18} color={colors.muted} />
      </Row>
      <View style={{ gap: 5 }}>
        {!!eyebrow && (
          <Label size={10} bold style={{ color: colors.accent }}>
            {eyebrow}
          </Label>
        )}
        <Label bold size={17}>
          {title}
        </Label>
        <Label muted size={13}>
          {description}
        </Label>
      </View>
    </Pressable>
  );
}
