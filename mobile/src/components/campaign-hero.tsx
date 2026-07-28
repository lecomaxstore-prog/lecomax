import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, type Href } from "expo-router";
import { memo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
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
  eyebrow: "NOUVELLE COLLECTION",
  title: "BOUGEZ PLUS. VIVEZ MIEUX.",
  description: "Performance, style et innovation pour chaque journée.",
  image: require("../../assets/images/home-campaign-lecomax.webp"),
  href: "/catalog?sort=new",
  ctaLabel: "DÉCOUVRIR",
  accent: colors.primary,
};

export const CampaignHero = memo(function CampaignHero({
  banner,
}: {
  banner?: Banner;
}) {
  const { contentWidth } = useAppViewport();
  const [imageFailed, setImageFailed] = useState(false);
  const compact = contentWidth < 360;
  const campaign = banner ?? fallbackBanner;

  return (
    <View style={[styles.card, { height: compact ? 330 : 370 }]}>
      {imageFailed ? (
        <View style={styles.imageFallback}>
          <Ionicons name="image-outline" size={35} color="#8B918C" />
          <Text style={styles.imageFallbackText}>
            VISUEL TEMPORAIREMENT INDISPONIBLE
          </Text>
        </View>
      ) : (
        <Image
          accessibilityLabel={campaign.title || "Campagne L’ECOMAX"}
          source={campaign.image}
          contentFit="cover"
          contentPosition="center"
          cachePolicy="memory-disk"
          recyclingKey={campaign.id}
          transition={220}
          onError={() => setImageFailed(true)}
          style={StyleSheet.absoluteFill}
        />
      )}
      <LinearGradient
        colors={["rgba(0,0,0,0.02)", "rgba(0,0,0,0.18)", "rgba(0,0,0,0.88)"]}
        locations={[0, 0.38, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.content}>
        <Text style={styles.eyebrow}>
          {campaign.eyebrow || "NOUVELLE COLLECTION"}
        </Text>
        <Text
          maxFontSizeMultiplier={1.18}
          numberOfLines={3}
          style={[styles.title, compact && styles.titleCompact]}
        >
          {campaign.title || "BOUGEZ PLUS. VIVEZ MIEUX."}
        </Text>
        <Text
          maxFontSizeMultiplier={1.25}
          numberOfLines={3}
          style={styles.description}
        >
          {campaign.description ||
            "Performance, style et innovation pour chaque journée."}
        </Text>
        <AnimatedPressable
          accessibilityLabel={`${campaign.ctaLabel || "Découvrir"} : ${campaign.title}`}
          onPress={() =>
            router.push((campaign.href || "/catalog?sort=new") as Href)
          }
          pressedScale={0.96}
          style={styles.cta}
        >
          <Text style={styles.ctaText}>{campaign.ctaLabel || "DÉCOUVRIR"}</Text>
          <Ionicons name="arrow-forward" size={16} color={colors.text} />
        </AnimatedPressable>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    overflow: "hidden",
    borderRadius: 14,
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
    padding: 20,
    alignItems: "flex-start",
    justifyContent: "flex-end",
  },
  eyebrow: {
    color: colors.primary,
    fontFamily: typography.black,
    fontSize: 9,
    letterSpacing: 1.7,
  },
  title: {
    maxWidth: 330,
    marginTop: 7,
    color: "#FFFFFF",
    fontFamily: typography.black,
    fontSize: 30,
    lineHeight: 30,
    letterSpacing: -1,
  },
  titleCompact: { fontSize: 26, lineHeight: 27 },
  description: {
    maxWidth: 295,
    marginTop: 9,
    color: "rgba(255,255,255,0.84)",
    fontFamily: typography.medium,
    fontSize: 11.5,
    lineHeight: 17,
  },
  cta: {
    minWidth: 132,
    minHeight: 46,
    marginTop: 17,
    paddingHorizontal: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 10,
    backgroundColor: colors.primary,
  },
  ctaText: {
    color: colors.text,
    fontFamily: typography.black,
    fontSize: 9,
    letterSpacing: 1.1,
  },
});
