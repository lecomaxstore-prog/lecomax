import { PropsWithChildren, useEffect, useMemo, useState } from "react";
import {
  AccessibilityInfo,
  Platform,
  StyleSheet,
  Text,
} from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { StatusBar } from "expo-status-bar";
import { BrandLogo } from "@/components/brand-logo";
import { typography } from "@/constants/theme";
import { useSettings } from "@/hooks/use-catalog";
import { appLaunchConfigFromSettings } from "@/lib/app-launch-config";

export function LaunchIntro({ children }: PropsWithChildren) {
  const settingsQuery = useSettings();
  const config = useMemo(
    () => appLaunchConfigFromSettings(settingsQuery.data),
    [settingsQuery.data],
  );
  const [complete, setComplete] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const logoProgress = useSharedValue(0);
  const lineProgress = useSharedValue(0);

  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (active) setReduceMotion(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduceMotion,
    );
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!config.introEnabled) return;
    const duration = reduceMotion ? 320 : config.introDurationMs;
    logoProgress.set(
      withTiming(1, {
        duration: reduceMotion ? 1 : 420,
        easing: Easing.out(Easing.cubic),
        reduceMotion: ReduceMotion.System,
      }),
    );
    lineProgress.set(
      withDelay(
        reduceMotion ? 1 : 330,
        withTiming(1, {
          duration: reduceMotion ? 1 : 460,
          easing: Easing.out(Easing.cubic),
          reduceMotion: ReduceMotion.System,
        }),
      ),
    );
    const timer = setTimeout(() => setComplete(true), duration);
    return () => clearTimeout(timer);
  }, [
    config.introDurationMs,
    config.introEnabled,
    lineProgress,
    logoProgress,
    reduceMotion,
  ]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoProgress.value,
    transform: [{ scale: 0.92 + logoProgress.value * 0.08 }],
  }));
  const lineStyle = useAnimatedStyle(() => ({
    opacity: lineProgress.value,
    transform: [{ scaleX: lineProgress.value }],
  }));

  if (!config.introEnabled || complete || Platform.OS === "web") {
    return children;
  }

  return (
    <Animated.View
      accessibilityLabel="Introduction L’ECOMAX"
      entering={FadeIn.duration(120)}
      exiting={FadeOut.duration(reduceMotion ? 1 : 180)}
      style={[styles.screen, { backgroundColor: config.introBackground }]}
    >
      <StatusBar style="light" />
      <Animated.View style={[styles.brand, logoStyle]}>
        <BrandLogo inverse />
        <Animated.View style={[styles.line, lineStyle]} />
        <Text style={styles.message}>{config.introMessage}</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  brand: { alignItems: "center" },
  line: {
    width: 146,
    height: 2,
    marginTop: 16,
    backgroundColor: "#12B83F",
  },
  message: {
    marginTop: 18,
    color: "#FFFFFF",
    fontFamily: typography.black,
    fontSize: 10,
    letterSpacing: 1.9,
    textAlign: "center",
  },
});
