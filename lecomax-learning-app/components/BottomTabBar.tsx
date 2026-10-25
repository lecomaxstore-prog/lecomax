import { useEffect, useState } from 'react';
import { Keyboard, Pressable, View, useWindowDimensions } from 'react-native';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSchool } from '../store/School';
import { radius, space } from '../constants/design';
import { Label } from './UI';
type BottomTabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const tabIcons = {
  index: 'home-outline',
  discover: 'book-outline',
  learning: 'book-outline',
  path: 'trail-sign-outline',
  project: 'code-slash-outline',
  teacher: 'sparkles-outline',
  more: 'grid-outline',
  practice: 'code-slash-outline',
  account: 'person-outline',
} as const;
export function BottomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors, rtl } = useSchool();
  const insets = useSafeAreaInsets();
  const { width, fontScale } = useWindowDimensions();
  const wide = width >= 900 && fontScale < 1.5;
  const [keyboard, setKeyboard] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboard(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboard(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  if (keyboard) return null;
  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderTopWidth: 1,
        borderTopColor: colors.line,
        paddingHorizontal: space.md,
        paddingBottom: Math.max(insets.bottom, space.sm),
        paddingTop: 4,
      }}
    >
      <View
        accessibilityRole="tablist"
        style={{
          backgroundColor: colors.card,
          flexDirection: rtl ? 'row-reverse' : 'row',
          padding: 4,
          borderRadius: 0,
          borderWidth: 0,
          borderColor: colors.line,
          maxWidth: 900,
          width: '100%',
          alignSelf: 'center',
        }}
      >
        {state.routes.map((route, i) => {
          if (['path', 'project', 'learning', 'more'].includes(route.name)) return null;
          const selected = state.index === i;
          const title = descriptors[route.key]?.options.title || route.name;
          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityLabel={title}
              accessibilityState={{ selected }}
              aria-selected={selected}
              onPress={() => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!selected && !event.defaultPrevented)
                  navigation.navigate(route.name, route.params);
              }}
              onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
              style={({ pressed }) => ({
                flex: 1,
                minWidth: 0,
                minHeight: 58,
                alignItems: 'center',
                justifyContent: 'center',
                gap: wide ? 8 : 1,
                paddingHorizontal: 3,
                borderRadius: 14,
                flexDirection: wide ? (rtl ? 'row-reverse' : 'row') : 'column',
                backgroundColor: 'transparent',
                opacity: pressed ? 0.65 : 1,
              })}
            >
              <View
                style={{
                  width: 44,
                  height: 26,
                  borderRadius: radius.pill,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: selected ? colors.soft : 'transparent',
                }}
              >
                <Ionicons
                  name={
                    selected
                      ? (
                          {
                            index: 'home',
                            discover: 'compass',
                            learning: 'book',
                            path: 'trail-sign',
                            project: 'code-slash',
                            teacher: 'sparkles',
                            more: 'grid',
                            practice: 'code-slash',
                            account: 'person',
                          } as const
                        )[route.name as keyof typeof tabIcons] || 'ellipse'
                      : tabIcons[route.name as keyof typeof tabIcons] || 'ellipse-outline'
                  }
                  size={21}
                  color={selected ? colors.accent : colors.muted}
                />
              </View>
              <Label
                size={rtl ? 12 : 11}
                bold={selected}
                style={{ textAlign: 'center', maxWidth: '100%', flexShrink: 1, color: selected ? colors.accent : colors.muted }}
              >
                {title}
              </Label>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
