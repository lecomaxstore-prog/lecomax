import { BRAND_COPY, marketplaceHeadline } from "@/lib/brand-copy";
import { msg, useLocale } from "@/i18n";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, type Href } from "expo-router";
import { memo, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { cancelAnimation, Easing, FadeInDown, ReduceMotion, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { AnimatedPressable } from "@/components/animated-pressable";
import { useAppViewport } from "@/components/app-viewport";
import { typography } from "@/constants/theme";
import type { Banner } from "@/types/commerce";

const colors = {
  surfaceStrong: "#EEF0ED",
  text: "#111111",
  primary: "#32CD57",
};

const fallbackBanner: Banner = {
  id: "lecomax-local-campaign",
  get eyebrow() { return msg("campaignHero.newCollectionUppercase"); },
  title: "",
  description: "",
  image: require("../../assets/images/home-campaign-lecomax.webp"),
  href: "/catalog?sort=new",
  get ctaLabel() { return msg("campaignHero.discoverUppercase"); },
  accent: colors.primary,
};

export const CampaignHero = memo(function CampaignHero({
  banner,
}: {
  banner?: Banner;
}) {
  const language = useLocale();
  const brand = BRAND_COPY[language];
  const { contentWidth } = useAppViewport();
  const [imageFailed, setImageFailed] = useState(false);
  const compact = contentWidth < 360;
  const campaign = banner ?? { ...fallbackBanner, title: brand.tagline, eyebrow: brand.eyebrow, description: brand.description };
  const displayTitle = marketplaceHeadline(campaign.title, language);
  const reducedMotion = useReducedMotion();
  const imageScale = useSharedValue(1.08);
  const arrowOffset = useSharedValue(0);
  const buttonMotion = useSharedValue(0);
  const [buttonWidth, setButtonWidth] = useState(158);
  const entrance = (delay: number) => FadeInDown.duration(850).delay(delay)
    .easing(Easing.out(Easing.cubic)).reduceMotion(ReduceMotion.System);

  useEffect(() => {
    imageScale.value = reducedMotion ? 1 : 1.08;
    if (!reducedMotion) {
      imageScale.value = withTiming(1, { duration: 9000, easing: Easing.out(Easing.cubic) });
    }
    return () => { cancelAnimation(imageScale); cancelAnimation(arrowOffset); };
  }, [campaign.id, reducedMotion, imageScale, arrowOffset]);

  useEffect(() => {
    buttonMotion.value = 0;
    if (!reducedMotion) {
      buttonMotion.value = withDelay(1500, withRepeat(withSequence(
        withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.cubic) }),
        withTiming(0, { duration: 0 }),
        withDelay(2800, withTiming(0, { duration: 0 })),
      ), 3));
    }
    return () => cancelAnimation(buttonMotion);
  }, [campaign.id, reducedMotion, buttonMotion]);

  const imageMotion = useAnimatedStyle(() => ({ transform: [{ scale: imageScale.value }] }));
  const arrowMotion = useAnimatedStyle(() => ({
    transform: [{ translateX: arrowOffset.value + Math.sin(buttonMotion.value * Math.PI * 2) * 3 }],
  }));
  const circleMotion = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + Math.sin(buttonMotion.value * Math.PI) * 0.07 }],
  }));
  const shineMotion = useAnimatedStyle(() => ({
    opacity: Math.sin(buttonMotion.value * Math.PI) * 0.7,
    transform: [{ translateX: -70 + buttonMotion.value * (buttonWidth + 140) }, { skewX: "-20deg" }],
  }));
  const animateArrow = (active: boolean) => {
    arrowOffset.value = withTiming(active && !reducedMotion ? 4 : 0, { duration: 240 });
  };

  return (
    <View style={[styles.card, { minHeight: compact ? 420 : 460 }]}>
      {imageFailed ? (
        <View style={styles.imageFallback}>
          <Ionicons name="image-outline" size={35} color="#8B918C" />
          <Text style={styles.imageFallbackText}>
            {msg("campaignHero.imageTemporarilyUnavailableUppercase")}</Text>
        </View>
      ) : (
        <Animated.View style={[StyleSheet.absoluteFill, imageMotion]}>
        <Image
          accessibilityLabel={campaign.title || msg("campaignHero.lEcomaxCampaign")}
          source={campaign.image}
          contentFit="cover"
          contentPosition="right center"
          cachePolicy="memory-disk"
          recyclingKey={campaign.id}
          transition={220}
          onError={() => setImageFailed(true)}
          style={StyleSheet.absoluteFill}
        />
        </Animated.View>
      )}
      <LinearGradient
        colors={["rgba(10,15,11,0.06)", "rgba(10,15,11,0)", "rgba(10,15,11,0.72)", "rgba(10,15,11,0.96)"]}
        locations={[0, 0.38, 0.72, 1]}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View entering={entrance(100)} style={styles.topline}>
        <View style={styles.collectionBadge}>
          <View style={styles.collectionDot} />
          <Text style={styles.eyebrow}>
            {campaign.eyebrow || msg("campaignHero.newCollectionUppercase")}
          </Text>
        </View>
        <Ionicons name="arrow-forward" size={18} color="#F8F6EF" style={{ transform: [{ rotate: "-45deg" }] }} />
      </Animated.View>
      <View style={styles.content}>
        <Animated.Text
          entering={entrance(220)}
          maxFontSizeMultiplier={1.18}
          numberOfLines={3}
          style={[styles.title, compact && styles.titleCompact]}
        >
          {displayTitle}
        </Animated.Text>
        <Animated.Text
          entering={entrance(380)}
          maxFontSizeMultiplier={1.25}
          numberOfLines={3}
          style={styles.description}
        >
          {campaign.description ||
            brand.description}
        </Animated.Text>
        <Animated.View entering={entrance(540)}>
        <AnimatedPressable
          accessibilityRole="button"
          accessibilityLabel={`${campaign.ctaLabel || msg("campaignHero.discover")} : ${campaign.title}`}
          onPress={() =>
            router.push((campaign.href || "/catalog?sort=new") as Href)
          }
          pressedScale={reducedMotion ? 1 : 0.95}
          onLayout={(event) => setButtonWidth(event.nativeEvent.layout.width)}
          onHoverIn={() => animateArrow(true)}
          onHoverOut={() => animateArrow(false)}
          onPressIn={() => animateArrow(true)}
          onPressOut={() => animateArrow(false)}
          onFocus={() => animateArrow(true)}
          onBlur={() => animateArrow(false)}
          style={styles.cta}
        >
          <Animated.View pointerEvents="none" style={[styles.ctaShine, shineMotion]}>
            <LinearGradient colors={["rgba(157,216,172,0)", "rgba(157,216,172,0.65)", "rgba(157,216,172,0)"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
          </Animated.View>
          <Text style={styles.ctaText}>{(campaign.ctaLabel || msg("campaignHero.discover")).toLocaleLowerCase("fr").replace(/^./, (letter) => letter.toLocaleUpperCase("fr"))}</Text>
          <Animated.View style={[styles.ctaArrow, circleMotion]}>
            <Animated.View style={arrowMotion}>
            <Ionicons name="arrow-forward" size={17} color="#F8F6EF" />
            </Animated.View>
          </Animated.View>
        </AnimatedPressable>
        </Animated.View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    overflow: "hidden",
    borderRadius: 24,
    backgroundColor: colors.surfaceStrong,
  },
  imageFallback: {
    position: "absolute",
    inset: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    backgroundColor: colors.surfaceStrong,
  },
  imageFallbackText: {
    color: "#737973",
    fontFamily: typography.bold,
    fontSize: 8,
    letterSpacing: 0.8,
  },
  content: {
    flex: 1,
    padding: 26,
    paddingTop: 145,
    alignItems: "flex-start",
    justifyContent: "flex-end",
  },
  eyebrow: {
    color: "#F8F6EF",
    fontFamily: typography.medium,
    fontSize: 8,
    letterSpacing: 1.5,
  },
  topline: {
    padding: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  collectionBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    backgroundColor: "rgba(12,20,14,0.24)",
  },
  collectionDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: "#9DD8AC" },
  title: {
    maxWidth: 450,
    color: "#F8F6EF",
    fontFamily: typography.medium,
    fontSize: 38,
    lineHeight: 41,
    letterSpacing: -1.6,
  },
  titleCompact: { fontSize: 32, lineHeight: 36 },
  description: {
    maxWidth: 295,
    marginTop: 12,
    color: "rgba(248,246,239,0.76)",
    fontFamily: typography.regular,
    fontSize: 12,
    lineHeight: 19,
  },
  cta: {
    overflow: "hidden",
    minWidth: 158,
    minHeight: 50,
    marginTop: 22,
    paddingLeft: 20,
    paddingRight: 7,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 24,
    borderRadius: 30,
    backgroundColor: "#F8F6EF",
  },
  ctaText: {
    color: colors.text,
    fontFamily: typography.semibold,
    fontSize: 12,
    letterSpacing: 0.2,
  },
  ctaShine: {
    position: "absolute",
    top: -10,
    bottom: -10,
    left: 0,
    width: 64,
  },
  ctaArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#182A20",
  },
});
