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
  const title = campaign.title || fallbackBanner.title;
  const displayTitle = title === fallbackBanner.title ? "Bougez plus.\nVivez mieux." : title;

  return (
    <View style={[styles.card, { minHeight: compact ? 420 : 460 }]}>
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
          contentPosition="right center"
          cachePolicy="memory-disk"
          recyclingKey={campaign.id}
          transition={220}
          onError={() => setImageFailed(true)}
          style={StyleSheet.absoluteFill}
        />
      )}
      <LinearGradient
        colors={["rgba(10,15,11,0.06)", "rgba(10,15,11,0)", "rgba(10,15,11,0.72)", "rgba(10,15,11,0.96)"]}
        locations={[0, 0.38, 0.72, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.topline}>
        <View style={styles.collectionBadge}>
          <View style={styles.collectionDot} />
          <Text style={styles.eyebrow}>
            {campaign.eyebrow || "NOUVELLE COLLECTION"}
          </Text>
        </View>
        <Ionicons name="arrow-forward" size={18} color="#F8F6EF" style={{ transform: [{ rotate: "-45deg" }] }} />
      </View>
      <View style={styles.content}>
        <Text
          maxFontSizeMultiplier={1.18}
          numberOfLines={3}
          style={[styles.title, compact && styles.titleCompact]}
        >
          {displayTitle}
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
          accessibilityRole="button"
          accessibilityLabel={`${campaign.ctaLabel || "Découvrir"} : ${campaign.title}`}
          onPress={() =>
            router.push((campaign.href || "/catalog?sort=new") as Href)
          }
          pressedScale={0.96}
          style={styles.cta}
        >
          <Text style={styles.ctaText}>{(campaign.ctaLabel || "Découvrir").toLocaleLowerCase("fr").replace(/^./, (letter) => letter.toLocaleUpperCase("fr"))}</Text>
          <View style={styles.ctaArrow}>
            <Ionicons name="arrow-forward" size={17} color="#F8F6EF" />
          </View>
        </AnimatedPressable>
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
  ctaArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#182A20",
  },
});
