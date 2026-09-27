import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import { memo, useEffect } from "react";
import type { ComponentProps } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  useReducedMotion,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { AnimatedPressable } from "@/components/animated-pressable";
import { typography } from "@/constants/theme";
import { useT } from "@/lib/i18n";
import { useCartFeedbackStore } from "@/stores/cart-feedback";
import { useCommerceStore } from "@/stores/commerce";
import { useAppViewport } from "@/components/app-viewport";

type BottomTabBarProps = Parameters<
  NonNullable<ComponentProps<typeof Tabs>["tabBar"]>
>[0];

const tabConfig: Record<
  string,
  {
    icon: keyof typeof Ionicons.glyphMap;
    activeIcon: keyof typeof Ionicons.glyphMap;
  }
> = {
  index: { icon: "home-outline", activeIcon: "home" },
  search: { icon: "search-outline", activeIcon: "search-outline" },
  "smart-assistant": { icon: "sparkles-outline", activeIcon: "sparkles" },
  wishlist: { icon: "heart-outline", activeIcon: "heart" },
  cart: { icon: "bag-handle-outline", activeIcon: "bag-handle" },
  account: { icon: "person-outline", activeIcon: "person" },
};

type ItemProps = {
  focused: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
  label: string;
  badge?: number;
  feedbackToken?: number;
  onPress: () => void;
  onLongPress: () => void;
  tablet?: boolean;
};

const TabItem = memo(function TabItem({
  focused,
  icon,
  activeIcon,
  label,
  badge,
  feedbackToken,
  onPress,
  onLongPress,
  tablet = false,
}: ItemProps) {
  const pulse = useSharedValue(1);
  const reduceMotion = useReducedMotion();
  const activeOpacity = useSharedValue(focused ? 1 : 0);
  useEffect(() => {
    activeOpacity.set(
      withTiming(focused ? 1 : 0, { duration: reduceMotion ? 0 : 180 }),
    );
  }, [focused, activeOpacity, reduceMotion]);
  const activeStyle = useAnimatedStyle(() => ({
    opacity: activeOpacity.value,
    transform: [{ scale: 0.92 + activeOpacity.value * 0.08 }],
  }));
  useEffect(() => {
    if (!feedbackToken || reduceMotion) return;
    pulse.set(
      withSequence(
        withTiming(1.04, { duration: 120 }),
        withTiming(1, { duration: 150 }),
      ),
    );
  }, [feedbackToken, pulse, reduceMotion]);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <AnimatedPressable
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      aria-selected={focused}
      accessibilityLabel={badge && badge > 0 ? `${label}, ${badge}` : label}
      onPress={onPress}
      onLongPress={onLongPress}
      pressedScale={reduceMotion ? 1 : 0.98}
      style={[styles.item, tablet && styles.tabletItem]}
    >
      <Animated.View
        pointerEvents="none"
        style={[styles.activeIconWrap, activeStyle]}
      />
      <Animated.View
        pointerEvents="none"
        style={[styles.activeIndicator, activeStyle]}
      />
      <Animated.View style={[styles.iconWrap, animatedStyle]}>
        <View style={styles.iconBadgeAnchor}>
          <Ionicons
            name={focused ? activeIcon : icon}
            size={22}
            color={focused ? "#204E39" : "#88908C"}
            style={styles.icon}
          />
          {badge && badge > 0 ? (
            <View pointerEvents="none" style={styles.badge}>
              <Text maxFontSizeMultiplier={1} style={styles.badgeText}>
                {badge > 99 ? "99+" : badge}
              </Text>
            </View>
          ) : null}
        </View>
      </Animated.View>
      <Text
        maxFontSizeMultiplier={1.25}
        numberOfLines={1}
        style={[styles.label, focused && styles.activeLabel]}
      >
        {label}
      </Text>
    </AnimatedPressable>
  );
});

export function BottomNavigation({ state, navigation }: BottomTabBarProps) {
  const { t } = useT();
  const { isTablet, keyboardVisible } = useAppViewport();
  const insets = useSafeAreaInsets();
  const cartCount = useCommerceStore((store) =>
    store.cart.reduce((sum, line) => sum + line.quantity, 0),
  );
  const wishlistCount = useCommerceStore((store) => store.wishlist.length);
  const cartFeedbackToken = useCartFeedbackStore(
    (store) => store.flight?.id ?? 0,
  );
  const visibleRoutes = state.routes.filter((route) =>
    Boolean(tabConfig[route.name]),
  );
  const activeRoute = state.routes[state.index]?.name;
  const labels: Record<string, string> = {
    index: t.home,
    search: t.search,
    "smart-assistant": "Assistant",
    wishlist: t.wishlist,
    cart: t.cart,
    account: t.account,
  };

  if (keyboardVisible || (activeRoute === "cart" && !isTablet)) return null;

  return (
    <View
      style={[
        styles.shell,
        isTablet
          ? [
              styles.tabletShell,
              {
                paddingTop: Math.max(insets.top, 18),
                paddingBottom: Math.max(insets.bottom, 18),
              },
            ]
          : {
              marginBottom: Math.max(insets.bottom, 10),
              marginLeft: 12 + insets.left,
              marginRight: 12 + insets.right,
            },
      ]}
    >
      {visibleRoutes.map((route) => {
        const originalIndex = state.routes.findIndex(
          (item) => item.key === route.key,
        );
        const routeFocused = state.index === originalIndex;
        const focused =
          routeFocused || (activeRoute === "catalog" && route.name === "index");
        const config = tabConfig[route.name];
        const badge =
          route.name === "cart"
            ? cartCount
            : route.name === "wishlist"
              ? wishlistCount
              : 0;
        return (
          <TabItem
            key={route.key}
            focused={focused}
            icon={config.icon}
            activeIcon={config.activeIcon}
            label={labels[route.name]}
            badge={badge}
            feedbackToken={
              route.name === "cart" ? cartFeedbackToken : undefined
            }
            onPress={() => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });
              if (!routeFocused && !event.defaultPrevented)
                navigation.navigate(route.name, route.params);
            }}
            onLongPress={() =>
              navigation.emit({ type: "tabLongPress", target: route.key })
            }
            tablet={isTablet}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flexShrink: 0,
    marginTop: 6,
    paddingVertical: 5,
    paddingHorizontal: 5,
    flexDirection: "row",
    alignItems: "stretch",
    borderWidth: 1,
    borderColor: "#EBEEEC",
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    shadowColor: "#192B22",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 4,
  },
  item: {
    flexBasis: 0,
    flexGrow: 1,
    flexShrink: 1,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 0,
    minHeight: 62,
    paddingTop: 7,
    paddingBottom: 4,
    borderRadius: 18,
  },
  tabletShell: {
    width: 94,
    marginTop: 0,
    borderRadius: 0,
    borderWidth: 0,
    height: "100%",
    paddingHorizontal: 8,
    flexDirection: "column",
    alignItems: "stretch",
    justifyContent: "center",
    gap: 8,
    borderTopWidth: 0,
    borderRightWidth: 1,
    borderRightColor: "#DDE1DE",
    shadowOpacity: 0,
    elevation: 0,
  },
  tabletItem: {
    width: "100%",
    maxWidth: "100%",
    minHeight: 70,
    flexBasis: "auto",
    flexGrow: 0,
    borderRadius: 16,
  },
  iconWrap: {
    width: 44,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  activeIconWrap: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 2,
    right: 2,
    borderRadius: 16,
    backgroundColor: "#F0F5F1",
  },
  activeIndicator: {
    position: "absolute",
    top: 0,
    width: 18,
    height: 3,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    backgroundColor: "#28563E",
  },
  icon: {
    width: 26,
    height: 26,
    lineHeight: 26,
    textAlign: "center",
    includeFontPadding: false,
  },
  iconBadgeAnchor: {
    position: "relative",
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    marginTop: 2,
    maxWidth: "100%",
    color: "#747D77",
    fontFamily: typography.medium,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: -0.15,
    textAlign: "center",
    includeFontPadding: false,
  },
  activeLabel: {
    color: "#204E39",
    fontFamily: typography.semibold,
  },
  badge: {
    position: "absolute",
    top: -2,
    left: 20,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
    backgroundColor: "#28563E",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "#FFFFFF",
    fontFamily: typography.semibold,
    fontSize: 8,
    lineHeight: 11,
    includeFontPadding: false,
  },
});
