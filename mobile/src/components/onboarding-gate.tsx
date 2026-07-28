import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { PropsWithChildren, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInRight,
  FadeInUp,
  FadeOutLeft,
  LinearTransition,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { AnimatedPressable } from "@/components/animated-pressable";
import { useAppViewport } from "@/components/app-viewport";
import { BrandLogo } from "@/components/brand-logo";
import { palette, typography, ui } from "@/constants/theme";
import { useSettings } from "@/hooks/use-catalog";
import {
  appLaunchConfigFromSettings,
} from "@/lib/app-launch-config";
import { registerForPushNotifications } from "@/services/notifications";

const slidePresentation = [
  {
    eyebrow: "TOUT L’ECOMAX",
    icon: "sparkles-outline" as const,
  },
  {
    eyebrow: "ACHAT SÉCURISÉ",
    icon: "shield-checkmark-outline" as const,
  },
  {
    eyebrow: "RESTEZ INFORMÉ",
    icon: "notifications-outline" as const,
  },
];

const welcomeImage = require("../../assets/images/onboarding/lecomax-welcome-v1.webp");
const AnimatedImage = Animated.createAnimatedComponent(Image);
const COMPLETION_KEY = "lecomax:onboarding:complete";

export function OnboardingGate({ children }: PropsWithChildren) {
  const { contentWidth } = useAppViewport();
  const backgroundReveal = useSharedValue(0);
  const arrowNudge = useSharedValue(0);
  const settingsQuery = useSettings();
  const launchConfig = useMemo(
    () => appLaunchConfigFromSettings(settingsQuery.data),
    [settingsQuery.data],
  );
  const enabled = launchConfig.onboardingEnabled;
  const version = launchConfig.onboardingVersion;
  const storageKey = COMPLETION_KEY;
  const [checkedKey, setCheckedKey] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [index, setIndex] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    backgroundReveal.set(0);
    backgroundReveal.set(
      withTiming(1, {
        duration: 1_100,
        easing: Easing.out(Easing.cubic),
        reduceMotion: ReduceMotion.System,
      }),
    );
  }, [backgroundReveal, checkedKey]);

  useEffect(() => {
    arrowNudge.set(0);
    arrowNudge.set(
      withSequence(
        withTiming(1, {
          duration: 180,
          easing: Easing.out(Easing.cubic),
          reduceMotion: ReduceMotion.System,
        }),
        withSpring(0, {
          damping: 13,
          stiffness: 210,
          reduceMotion: ReduceMotion.System,
        }),
      ),
    );
  }, [arrowNudge, checkedKey, index]);

  useEffect(() => {
    if (!isTransitioning) return;
    const timer = setTimeout(() => setIsTransitioning(false), 460);
    return () => clearTimeout(timer);
  }, [index, isTransitioning]);

  const backgroundStyle = useAnimatedStyle(() => ({
    opacity: 0.84 + backgroundReveal.value * 0.16,
    transform: [
      { scale: 1.045 - backgroundReveal.value * 0.045 },
      { translateY: 12 - backgroundReveal.value * 12 },
    ],
  }));

  const arrowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: arrowNudge.value * 5 }],
  }));

  useEffect(() => {
    let active = true;
    void Promise.all([
      AsyncStorage.getItem(storageKey),
      AsyncStorage.getItem(`lecomax:onboarding:${version}`),
    ]).then(async ([currentValue, legacyValue]) => {
      if (!active) return;
      const wasCompleted =
        currentValue === "complete" || legacyValue === "complete";
      if (wasCompleted && currentValue !== "complete") {
        await AsyncStorage.setItem(storageKey, "complete");
      }
      if (!active) return;
      setCompleted(wasCompleted);
      setCheckedKey(storageKey);
    });
    return () => {
      active = false;
    };
  }, [storageKey, version]);

  if (!enabled) return children;
  if (checkedKey !== storageKey) {
    return (
      <View
        accessibilityLabel="Préparation de l’application"
        style={styles.loading}
      >
        <ActivityIndicator color={palette.greenDark} />
      </View>
    );
  }
  if (completed) return children;

  const slides = launchConfig.slides.map((slide, slideIndex) => ({
    ...slide,
    ...(slidePresentation[slideIndex] ?? slidePresentation.at(-1)!),
    message: slide.description,
  }));
  const last = index === slides.length - 1;
  const slide = slides[index];
  const frameWidth = Math.max(contentWidth - 80, 280);

  const complete = async (requestNotifications = false) => {
    if (isCompleting) return;
    setIsCompleting(true);
    try {
      await AsyncStorage.setItem(storageKey, "complete");
      if (requestNotifications) {
        await registerForPushNotifications().catch(() => null);
      }
      setCompleted(true);
    } catch {
      Alert.alert(
        "Impossible de continuer",
        "Veuillez réessayer. Votre progression n’a pas été enregistrée.",
      );
    } finally {
      setIsCompleting(false);
    }
  };

  const advance = () => {
    if (isTransitioning || isCompleting) return;
    if (last) {
      void complete(true);
      return;
    }
    setIsTransitioning(true);
    setIndex((value) => value + 1);
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.screen}>
      <AnimatedImage
        accessibilityLabel="Collection mode L’ECOMAX"
        cachePolicy="memory-disk"
        contentFit="cover"
        contentPosition="center"
        placeholder={welcomeImage}
        source={slide?.image ? { uri: slide.image } : welcomeImage}
        style={[StyleSheet.absoluteFill, backgroundStyle]}
      />
      <LinearGradient
        colors={[
          "rgba(255,255,255,0.48)",
          "rgba(255,255,255,0.02)",
          "rgba(7,10,8,0.22)",
          "rgba(7,10,8,0.96)",
        ]}
        locations={[0, 0.27, 0.54, 0.76]}
        pointerEvents="none"
        style={StyleSheet.absoluteFill}
      />

      <Animated.View
        entering={FadeInDown.duration(560)
          .easing(Easing.out(Easing.cubic))
          .reduceMotion(ReduceMotion.System)}
        style={[styles.header, { width: frameWidth }]}
      >
        <BrandLogo header />
        <AnimatedPressable
          accessibilityLabel="Ignorer l’introduction"
          disabled={isCompleting}
          onPress={() => void complete(false)}
          style={styles.skip}
        >
          <Text style={styles.skipText}>PASSER</Text>
        </AnimatedPressable>
      </Animated.View>

      <View style={styles.spacer} />

      <Animated.View
        key={index}
        entering={FadeInRight.duration(480)
          .easing(Easing.out(Easing.cubic))
          .reduceMotion(ReduceMotion.System)}
        exiting={FadeOutLeft.duration(180).reduceMotion(ReduceMotion.System)}
        style={[styles.copy, { width: frameWidth }]}
      >
        <Animated.View
          entering={FadeIn.delay(70)
            .duration(360)
            .reduceMotion(ReduceMotion.System)}
          style={styles.eyebrowRow}
        >
          <View style={styles.eyebrowIcon}>
            <Ionicons name={slide.icon} size={14} color={palette.ink} />
          </View>
          <Text style={styles.eyebrow}>{slide.eyebrow}</Text>
        </Animated.View>
        <Animated.Text
          accessibilityRole="header"
          entering={FadeInUp.delay(110)
            .duration(460)
            .easing(Easing.out(Easing.cubic))
            .reduceMotion(ReduceMotion.System)}
          style={styles.title}
        >
          {slide.title}
        </Animated.Text>
        <Animated.Text
          entering={FadeInUp.delay(180)
            .duration(460)
            .easing(Easing.out(Easing.cubic))
            .reduceMotion(ReduceMotion.System)}
          style={styles.message}
        >
          {slide.message}
        </Animated.Text>
      </Animated.View>

      <Animated.View
        entering={FadeInUp.delay(260)
          .duration(520)
          .easing(Easing.out(Easing.cubic))
          .reduceMotion(ReduceMotion.System)}
        style={[styles.footer, { width: frameWidth }]}
      >
        <View
          accessibilityLabel={`Étape ${index + 1} sur ${slides.length}`}
          style={styles.dots}
        >
          {slides.map((item, dotIndex) => (
            <Animated.View
              key={item.eyebrow}
              layout={LinearTransition.springify()
                .damping(18)
                .stiffness(210)
                .reduceMotion(ReduceMotion.System)}
              style={[styles.dot, dotIndex === index && styles.dotActive]}
            />
          ))}
        </View>
        <AnimatedPressable
          accessibilityLabel={last ? "Commencer" : "Continuer"}
          accessibilityState={{
            busy: isCompleting,
            disabled: isCompleting || isTransitioning,
          }}
          disabled={isCompleting || isTransitioning}
          onPress={advance}
          pressedScale={0.985}
          style={styles.primary}
        >
          <Text style={styles.primaryText}>
            {isCompleting ? "PRÉPARATION…" : last ? "COMMENCER" : "SUIVANT"}
          </Text>
          <View style={styles.primaryIcon}>
            {isCompleting ? (
              <ActivityIndicator color={palette.ink} size="small" />
            ) : (
              <Animated.View style={arrowStyle}>
                <Ionicons name="arrow-forward" size={18} color={palette.ink} />
              </Animated.View>
            )}
          </View>
        </AnimatedPressable>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.white,
  },
  screen: {
    flex: 1,
    backgroundColor: palette.ink,
  },
  header: {
    minHeight: 64,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  skip: {
    minHeight: 42,
    justifyContent: "center",
    paddingHorizontal: ui.spacing.md,
    borderWidth: 1,
    borderColor: "rgba(11,11,11,0.18)",
    borderRadius: ui.radius.sm,
    backgroundColor: "rgba(255,255,255,0.66)",
  },
  skipText: {
    color: palette.ink,
    fontFamily: typography.black,
    fontSize: 8,
    letterSpacing: 1.3,
  },
  spacer: { flex: 1 },
  copy: {
    maxWidth: 390,
    alignSelf: "center",
    paddingBottom: ui.spacing.xl,
  },
  eyebrowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: ui.spacing.sm,
  },
  eyebrowIcon: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.green,
  },
  eyebrow: {
    color: palette.green,
    fontFamily: typography.black,
    fontSize: 9,
    letterSpacing: 1.7,
  },
  title: {
    marginTop: ui.spacing.md,
    color: palette.white,
    fontFamily: typography.black,
    fontSize: 38,
    lineHeight: 41,
    letterSpacing: -1.4,
  },
  message: {
    maxWidth: 360,
    marginTop: ui.spacing.md,
    color: "rgba(255,255,255,0.78)",
    fontFamily: typography.regular,
    fontSize: 14,
    lineHeight: 22,
  },
  footer: {
    alignSelf: "center",
    paddingBottom: ui.spacing.sm,
  },
  dots: {
    height: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: ui.spacing.sm,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.34)",
  },
  dotActive: {
    width: 28,
    backgroundColor: palette.green,
  },
  primary: {
    height: 58,
    marginTop: ui.spacing.md,
    paddingLeft: ui.spacing.xl,
    paddingRight: ui.spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: palette.green,
  },
  primaryText: {
    color: palette.ink,
    fontFamily: typography.black,
    fontSize: 11,
    letterSpacing: 1.2,
  },
  primaryIcon: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.white,
  },
});
