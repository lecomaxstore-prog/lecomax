import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, type Href } from "expo-router";
import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  type SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";
import { AnimatedPressable } from "@/components/animated-pressable";
import { palette, typography } from "@/constants/theme";
import type { Banner } from "@/types/commerce";

type Props = {
  banner: Banner;
  index: number;
  cardWidth: number;
  scrollX: SharedValue<number>;
  interval: number;
};

export const HeroCard = memo(function HeroCard({
  banner,
  index,
  cardWidth,
  scrollX,
  interval,
}: Props) {
  const imageStyle = useAnimatedStyle(() => {
    const center = index * interval;
    return {
      transform: [
        {
          translateX: interpolate(
            scrollX.value,
            [center - interval, center, center + interval],
            [-24, 0, 24],
            Extrapolation.CLAMP,
          ),
        },
        {
          scale: interpolate(
            scrollX.value,
            [center - interval, center, center + interval],
            [1.08, 1, 1.08],
            Extrapolation.CLAMP,
          ),
        },
      ],
    };
  });

  return (
    <View style={[styles.card, { width: cardWidth }]}>
      <Animated.View style={[StyleSheet.absoluteFill, imageStyle]}>
        <Image
          source={banner.image}
          contentFit="cover"
          transition={350}
          cachePolicy="memory-disk"
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <LinearGradient
        colors={["rgba(0,0,0,0.02)", "rgba(0,0,0,0.12)", "rgba(0,0,0,0.88)"]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.content}>
        <View style={[styles.badge, { backgroundColor: banner.accent }]}>
          <Text style={styles.badgeLabel}>{banner.eyebrow}</Text>
        </View>
        <Text style={styles.title}>{banner.title}</Text>
        <Text style={styles.description}>{banner.description}</Text>
        <AnimatedPressable
          accessibilityLabel={banner.ctaLabel}
          onPress={() => router.push(banner.href as Href)}
          style={styles.cta}
        >
          <Text style={styles.ctaLabel}>{banner.ctaLabel}</Text>
          <View style={styles.ctaIcon}>
            <Ionicons name="arrow-forward" size={16} color={palette.white} />
          </View>
        </AnimatedPressable>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    height: 480,
    overflow: "hidden",
    borderRadius: 30,
    backgroundColor: "#DDDDDD",
    shadowColor: palette.ink,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 8,
  },
  content: { flex: 1, justifyContent: "flex-end", padding: 22 },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 5,
  },
  badgeLabel: {
    color: palette.ink,
    fontFamily: typography.black,
    fontSize: 9,
    letterSpacing: 1.7,
  },
  title: {
    maxWidth: 310,
    marginTop: 12,
    color: palette.white,
    fontFamily: typography.black,
    fontSize: 31,
    lineHeight: 32,
    letterSpacing: -1.1,
  },
  description: {
    maxWidth: 270,
    marginTop: 9,
    color: "rgba(255,255,255,0.78)",
    fontFamily: typography.medium,
    fontSize: 13,
    lineHeight: 19,
  },
  cta: {
    alignSelf: "flex-start",
    height: 48,
    marginTop: 18,
    paddingLeft: 18,
    paddingRight: 6,
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: palette.white,
  },
  ctaLabel: {
    color: palette.ink,
    fontFamily: typography.black,
    fontSize: 10,
    letterSpacing: 1.3,
  },
  ctaIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.ink,
  },
});
