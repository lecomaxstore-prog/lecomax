import { msg, useLocale } from "@/i18n";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { memo } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  type SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";
import { BrandLogo } from "@/components/brand-logo";
import { AnimatedPressable } from "@/components/animated-pressable";
import { NotificationBadge } from "@/components/notification-badge";
import { palette } from "@/constants/theme";
import { useNotificationStore } from "@/stores/notifications";

export const AppHeader = memo(function AppHeader({ scrollY }: { scrollY: SharedValue<number> }) {
  useLocale();
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const animatedStyle = useAnimatedStyle(() => ({
    shadowOpacity: interpolate(scrollY.value, [0, 28], [0, 0.1], Extrapolation.CLAMP),
    elevation: interpolate(scrollY.value, [0, 28], [0, 8], Extrapolation.CLAMP),
    borderBottomColor: `rgba(0,0,0,${interpolate(scrollY.value, [0, 28], [0, 0.06], Extrapolation.CLAMP)})`,
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <BrandLogo compact />
      <View style={styles.actions}>
        <AnimatedPressable
          accessibilityLabel={msg("common.notifications")}
          onPress={() => router.push("/notifications")}
          style={styles.iconButton}
        >
          <Ionicons name="notifications-outline" size={24} color={palette.ink} />
          <NotificationBadge count={unreadCount} />
        </AnimatedPressable>
        <AnimatedPressable
          accessibilityLabel={msg("appHeader.search")}
          onPress={() => router.push("/search")}
          style={styles.iconButton}
        >
          <Ionicons name="search-outline" size={22} color={palette.ink} />
        </AnimatedPressable>
        <AnimatedPressable
          accessibilityLabel={msg("auth.signInText")}
          onPress={() => router.push("/auth")}
          style={[styles.iconButton, styles.loginButton]}
        >
          <Ionicons name="person-outline" size={21} color={palette.white} />
        </AnimatedPressable>
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    zIndex: 50,
    width: "100%",
    maxWidth: "100%",
    height: 64,
    paddingHorizontal: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: palette.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    shadowColor: palette.ink,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 12,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderColor: "#E8EBE9",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8F9F8",
  },
  loginButton: {
    borderColor: palette.ink,
    backgroundColor: palette.ink,
    shadowColor: palette.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 3,
  },
});
