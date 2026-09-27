import { BRAND_COPY, marketplaceHeadline } from "@/lib/brand-copy";
import { msg, useLocale } from "@/i18n";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, type Href } from "expo-router";
import { memo, useEffect, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { AnimatedPressable } from "@/components/animated-pressable";
import { useAppViewport } from "@/components/app-viewport";
import { typography } from "@/constants/theme";
import type { Banner } from "@/types/commerce";

const campaignImage = require("../../assets/images/home-campaign-lecomax.webp");

export const CampaignHero = memo(function CampaignHero({ banner }: { banner?: Banner }) {
  const language = useLocale();
  const brand = BRAND_COPY[language];
  const { contentWidth } = useAppViewport();
  const reducedMotion = useReducedMotion();
  const [failedImage, setFailedImage] = useState<Banner["image"] | null>(null);
  const source = banner?.image ?? campaignImage;
  const title = marketplaceHeadline(banner?.title || brand.tagline, language);
  const cta = banner?.ctaLabel || msg("campaignHero.discover");
  const motion = useSharedValue(0);
  const hover = useSharedValue(0);
  const buttonWidth = useSharedValue(164);

  useEffect(() => {
    motion.value = 0;
    if (!reducedMotion) {
      motion.value = withRepeat(withSequence(
        withDelay(2600, withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.cubic) })),
        withTiming(0, { duration: 0 }),
      ), 3);
    }
    return () => { cancelAnimation(motion); cancelAnimation(hover); };
  }, [banner?.id, reducedMotion, motion, hover]);

  const shineStyle = useAnimatedStyle(() => ({
    opacity: Math.sin(motion.value * Math.PI) * 0.7,
    transform: [{ translateX: -60 + motion.value * (buttonWidth.value + 120) }, { skewX: "-20deg" }],
  }));
  const arrowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: Math.sin(motion.value * Math.PI) * 3 + hover.value }],
  }));
  const highlight = (active: boolean) => {
    hover.value = withTiming(active && !reducedMotion ? 3 : 0, { duration: reducedMotion ? 0 : 180 });
  };
  return (
    <View style={styles.card}>
      <View style={styles.photograph}>
        <Image accessibilityLabel={banner?.title || msg("campaignHero.lEcomaxCampaign")}
          source={failedImage === source ? campaignImage : source}
          contentFit="cover" contentPosition="right center" cachePolicy="memory-disk"
          transition={reducedMotion ? 0 : 200} onError={() => setFailedImage(source)}
          style={StyleSheet.absoluteFill} />
      </View>
      <LinearGradient pointerEvents="none"
        colors={["rgba(12,17,13,0.28)", "rgba(12,17,13,0)", "rgba(12,17,13,0.65)", "rgba(12,17,13,0.94)"]}
        locations={[0, 0.28, 0.65, 1]} style={StyleSheet.absoluteFill} />
      <View style={styles.masthead}>
        <Text style={styles.wordmark}>L&#8217;ECOMAX</Text>
        <Text style={styles.edition}>{language === "fr" ? "MAROC" : "MOROCCO"}</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.eyebrowRow}>
          <View style={styles.rule} />
          <Text style={styles.eyebrow}>{banner?.eyebrow || (language === "fr" ? "L’art du quotidien" : "The everyday, elevated")}</Text>
        </View>
        <Text accessibilityRole="header" maxFontSizeMultiplier={1.3}
          style={[styles.title, contentWidth < 360 && styles.titleCompact]}>{title}</Text>
        <Text maxFontSizeMultiplier={1.3} style={styles.description}>
          {banner?.description || (language === "fr" ? "Des pi\u00e8ces choisies. Un style \u00e0 vous." : "Considered pieces. Effortlessly yours.")}
        </Text>
        <AnimatedPressable accessibilityRole="button" accessibilityLabel={`${cta}: ${title}`}
          onPress={() => router.push((banner?.href || "/catalog?sort=new") as Href)}
          onLayout={(event) => { buttonWidth.value = event.nativeEvent.layout.width; }}
          onHoverIn={() => highlight(true)} onHoverOut={() => highlight(false)}
          onFocus={() => highlight(true)} onBlur={() => highlight(false)}
          pressedScale={reducedMotion ? 1 : 0.98} style={styles.cta}>
          <Animated.View pointerEvents="none" style={[styles.ctaShine, shineStyle]}>
            <LinearGradient colors={["rgba(255,255,255,0)", "rgba(255,255,255,0.95)", "rgba(255,255,255,0)"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
          </Animated.View>
          <Text style={styles.ctaText}>
            {cta.toLocaleLowerCase(language).replace(/^./, (letter) => letter.toLocaleUpperCase(language))}
          </Text>
          <View style={styles.ctaArrow}>
            <Animated.View style={arrowStyle}>
            <Ionicons name="arrow-forward" size={18} color="#F8F5EF" />
            </Animated.View>
          </View>
        </AnimatedPressable>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: { marginHorizontal: 16, minHeight: 450, overflow: "hidden", borderRadius: 12, backgroundColor: "#182019" },
  photograph: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 },
  masthead: { padding: 22, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  wordmark: { color: "#F5F1E8", fontFamily: typography.medium, fontSize: 12, letterSpacing: 3.4 },
  edition: { color: "#E2DFD5", fontFamily: typography.medium, fontSize: 8, letterSpacing: 1.8 },
  content: { flex: 1, justifyContent: "flex-end", padding: 24, paddingTop: 150, paddingBottom: 25 },
  eyebrowRow: { flexDirection: "row", alignItems: "center", gap: 9, marginBottom: 13 },
  rule: { width: 20, height: 1, backgroundColor: "#C5B99C" },
  eyebrow: { flex: 1, color: "#E0D8C8", fontFamily: typography.medium, fontSize: 8, lineHeight: 13, letterSpacing: 1.5, textTransform: "uppercase" },
  title: { color: "#FFFDF6", fontFamily: Platform.select({ ios: "Baskerville", android: "serif", default: "Georgia" }), fontSize: 43, lineHeight: 44, letterSpacing: -1.4, maxWidth: 320 },
  titleCompact: { fontSize: 37, lineHeight: 39 },
  description: { marginTop: 13, maxWidth: 290, color: "#DDDCD3", fontFamily: typography.regular, fontSize: 11, lineHeight: 18 },
  cta: { overflow: "hidden", alignSelf: "flex-start", marginTop: 21, minHeight: 50, minWidth: 164, paddingLeft: 20, paddingRight: 7, paddingVertical: 7, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 24, borderRadius: 25, backgroundColor: "#F5F2E9", borderWidth: 1, borderColor: "rgba(255,255,255,0.65)" },
  ctaShine: { position: "absolute", left: 0, top: -10, bottom: -10, width: 60 },
  ctaText: { color: "#20372A", fontFamily: typography.semibold, fontSize: 12, letterSpacing: 0.2 },
  ctaArrow: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: "#243D2E" },
});
