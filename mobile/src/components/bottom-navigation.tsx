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
      style={[
        styles.item,
        tablet && styles.tabletItem,
        tablet && focused && styles.tabletActiveItem,
      ]}
    >
      <Animated.View
        style={[
          styles.iconWrap,
          focused && styles.activeIconWrap,
          tablet && styles.tabletIconWrap,
          animatedStyle,
        ]}
      >
        <View style={styles.iconBadgeAnchor}>
          <Ionicons
            name={focused ? activeIcon : icon}
            size={focused ? 23 : 22}
            color={focused ? "#137A25" : "#717A74"}
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
      {tablet ? (
        <View
          style={[
            styles.activeIndicator,
            styles.tabletActiveIndicator,
            focused && styles.activeIndicatorVisible,
          ]}
        />
      ) : null}
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
    minHeight: 78,
    paddingTop: 9,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "stretch",
    borderTopWidth: 1,
    borderTopColor: "#E6EAE7",
    backgroundColor: palette.white,
    shadowColor: palette.ink,
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 9,
  },
  item: {
    maxWidth: "20%",
    flexBasis: 0,
    flexGrow: 1,
    flexShrink: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 58,
    paddingTop: 0,
    borderRadius: 18,
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
  tabletActiveItem: {
    backgroundColor: "#F0FAF2",
  },
  iconWrap: {
    width: 44,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
  },
  activeIconWrap: {
    backgroundColor: "#EAF7ED",
  },
  tabletIconWrap: {
    backgroundColor: "transparent",
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
    color: "#6B736E",
    fontFamily: typography.medium,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0,
  },
  activeLabel: {
    color: "#137A25",
    fontFamily: typography.semibold,
  },
  activeIndicator: {
    position: "absolute",
    backgroundColor: "transparent",
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
