import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import { memo, useEffect } from "react";
import type { ComponentProps } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { AnimatedPressable } from "@/components/animated-pressable";
import { NotificationBadge } from "@/components/notification-badge";
import { palette, typography } from "@/constants/theme";
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
  search: { icon: "search-outline", activeIcon: "search" },
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
  useEffect(() => {
    if (!feedbackToken) return;
    pulse.set(
      withSequence(
        withTiming(1.2, { duration: 120 }),
        withSpring(1, { damping: 9, stiffness: 260 }),
      ),
    );
  }, [feedbackToken, pulse]);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <AnimatedPressable
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={label}
      onPress={onPress}
      onLongPress={onLongPress}
      style={[styles.item, tablet && styles.tabletItem]}
    >
      <Animated.View
        style={[
          styles.iconWrap,
          animatedStyle,
        ]}
      >
        <View style={styles.iconBadgeAnchor}>
          <Ionicons
            name={focused ? activeIcon : icon}
            size={22}
            color={focused ? palette.greenDark : "#6F7671"}
          />
          {badge ? <NotificationBadge count={badge} /> : null}
        </View>
      </Animated.View>
      <Text
        maxFontSizeMultiplier={1.25}
        numberOfLines={1}
        style={[styles.label, focused && styles.activeLabel]}
      >
        {label}
      </Text>
      <View
        style={[
          styles.activeIndicator,
          tablet ? styles.tabletActiveIndicator : styles.phoneActiveIndicator,
          focused && styles.activeIndicatorVisible,
        ]}
      />
    </AnimatedPressable>
  );
});

export function BottomNavigation({ state, navigation }: BottomTabBarProps) {
  const { t } = useT();
  const { isTablet } = useAppViewport();
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
    wishlist: t.wishlist,
    cart: t.cart,
    account: t.account,
  };

  if (activeRoute === "cart" && !isTablet) return null;

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
          : { paddingBottom: Math.max(insets.bottom, 8) },
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
    minHeight: 70,
    paddingTop: 8,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "stretch",
    borderTopWidth: 1,
    borderTopColor: "#EDF0ED",
    backgroundColor: palette.white,
    shadowColor: palette.ink,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.055,
    shadowRadius: 14,
    elevation: 8,
  },
  item: {
    maxWidth: "20%",
    flexBasis: 0,
    flexGrow: 1,
    flexShrink: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 54,
    paddingTop: 1,
    borderRadius: 14,
  },
  tabletShell: {
    width: 94,
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
    width: 38,
    height: 29,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBadgeAnchor: {
    position: "relative",
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    marginTop: 4,
    color: "#68706A",
    fontFamily: typography.medium,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: -0.1,
  },
  activeLabel: {
    color: palette.greenDark,
    fontFamily: typography.bold,
  },
  activeIndicator: {
    position: "absolute",
    backgroundColor: "transparent",
  },
  phoneActiveIndicator: {
    top: -9,
    width: 32,
    height: 3,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
  activeIndicatorVisible: { backgroundColor: palette.green },
  tabletActiveIndicator: {
    left: -9,
    top: 23,
    width: 3,
    height: 24,
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
  },
});
