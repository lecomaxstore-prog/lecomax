import { localizedContent } from "@/i18n/content";
import { msg, useLocale } from "@/i18n";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { AnimatedPressable } from "@/components/animated-pressable";
import { HorizontalRail } from "@/components/horizontal-rail";
import { useAppViewport } from "@/components/app-viewport";
import { palette, typography } from "@/constants/theme";
import { discount, imageUrl, money } from "@/lib/format";
import type { Product } from "@/types/commerce";

const colors = {
  background: "#FFFFFF",
  text: "#111411",
  primary: "#32CD57",
  primaryDark: "#11843A",
  red: "#D92D36",
};

export const HomePromotionSection = memo(function HomePromotionSection({
  products,
}: {
  products: Product[];
}) {
  useLocale();
  const { contentWidth } = useAppViewport();
  const cardWidth = Math.min(280, contentWidth - 64);
  if (!products.length) return null;

  return (
    <View style={styles.section}>
      <View style={styles.heading}>
        <View style={styles.headingCopy}>
          <View style={styles.eyebrowBadge}>
            <View style={styles.eyebrowDot} />
            <Text style={styles.eyebrow}>{msg("homePromotionSection.lEcomaxPricesUppercase")}</Text>
          </View>
          <Text accessibilityRole="header" style={styles.title}>
            {msg("homePromotionSection.promotions")}</Text>
        </View>
        <AnimatedPressable
          accessibilityRole="button"
          accessibilityLabel={msg("homePromotionSection.viewAllPromotions")}
          onPress={() =>
            router.push({
              pathname: "/catalog",
              params: { promotion: "true", sort: "low" },
            })
          }
          style={styles.viewAll}
        >
          <Text style={styles.viewAllText}>{msg("common.viewAll")}</Text>
          <Ionicons name="arrow-forward" size={15} color={colors.primaryDark} />
        </AnimatedPressable>
      </View>
      <Text style={styles.subtitle}>
        {msg("homePromotionSection.selectedOffersAvailableForALimitedTime")}
      </Text>

      <HorizontalRail
        decelerationRate="fast"
        disableIntervalMomentum
        snapToAlignment="start"
        snapToInterval={cardWidth + 16}
        contentContainerStyle={styles.rail}
      >
        {products.map((product) => (
          <PromotionFeatureCard
            key={product.id}
            product={product}
            width={cardWidth}
          />
        ))}
      </HorizontalRail>
    </View>
  );
});

const PromotionFeatureCard = memo(function PromotionFeatureCard({
  product,
  width,
}: {
  product: Product;
  width: number;
}) {
  useLocale();
  const saving = discount(product.price, product.original_price);
  const savedAmount = Math.max(
    0,
    Number(product.original_price ?? 0) - Number(product.price),
  );

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={`${product.name}, ${saving ? msg("promotions.discountPercent", { percent: saving }) : msg("homePromotionSection.specialOffer")}`}
      onPress={() =>
        router.push({
          pathname: "/product/[slug]",
          params: {
            slug: product.slug,
            origin: "promotion",
            parentCategory: product.category,
          },
        })
      }
      pressedScale={0.985}
      style={[styles.card, { width }]}
    >
      <View style={styles.imageWrap}>
        <View style={styles.offerBadge}>
          <Text style={styles.offerBadgeText}>
            {saving ? `-${saving}%` : msg("homePromotionSection.offerUppercase")}
          </Text>
        </View>
        <Image
          accessibilityLabel={product.name}
          cachePolicy="memory-disk"
          contentFit="contain"
          source={imageUrl(product.thumbnail || product.images[0])}
          style={styles.productImage}
          transition={180}
        />
        <View style={styles.imageFooter}>
          <View
            style={[
              styles.stockDot,
              product.stock <= 0 && styles.stockDotUnavailable,
            ]}
          />
          <Text style={styles.imageFooterText}>
            {product.stock > 0 ? msg("homePromotionSection.inStockUppercase") : msg("homePromotionSection.soldOutUppercase")}
          </Text>
        </View>
      </View>
      <View style={styles.cardCopy}>
        <Text numberOfLines={1} style={styles.category}>
          {(product.brand || localizedContent(product.category)).toUpperCase()}
        </Text>
        <Text numberOfLines={2} style={styles.productName}>
          {product.name}
        </Text>

        <View style={styles.priceRow}>
          <Text style={styles.price}>{money(product.price)}</Text>
          {saving ? (
            <Text numberOfLines={1} style={styles.oldPrice}>
              {money(product.original_price ?? 0)}
            </Text>
          ) : null}
        </View>
        {savedAmount > 0 ? (
          <Text style={styles.savedAmount}>
            {msg("homePromotionSection.youSave")}{" "}{money(savedAmount)}
          </Text>
        ) : null}

        <View style={styles.discover}>
          <Text style={styles.discoverText}>{msg("campaignHero.discover")}</Text>
          <Ionicons name="arrow-forward" size={17} color={colors.text} />
        </View>
      </View>
    </AnimatedPressable>
  );
});

const styles = StyleSheet.create({
  section: {
    marginTop: 28,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  heading: {
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },
  headingCopy: { flexGrow: 1, flexShrink: 1, flexBasis: 190, minWidth: 0 },
  eyebrowBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#EEF6EB",
    maxWidth: "100%",
  },
  eyebrowDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: "#168526" },
  eyebrow: {
    color: "#276334",
    fontFamily: typography.semibold,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1.2,
    flexShrink: 1,
  },
  title: {
    marginTop: 10,
    color: palette.ink,
    fontFamily: typography.bold,
    fontSize: 30,
    lineHeight: 37,
    letterSpacing: -1,
  },
  subtitle: {
    marginTop: 8,
    paddingHorizontal: 16,
    color: "#626B60",
    fontFamily: typography.regular,
    fontSize: 13,
    lineHeight: 20,
  },
  viewAll: {
    minWidth: 72,
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#DEE8DA",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  viewAllText: {
    color: palette.greenDark,
    fontFamily: typography.semibold,
    fontSize: 11,
  },
  rail: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8, gap: 16 },
  card: { backgroundColor: palette.white },
  imageWrap: {
    aspectRatio: 1,
    overflow: "hidden",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E8EDE7",
    backgroundColor: "#FFFFFF",
  },
  productImage: {
    position: "absolute",
    top: 20,
    right: 10,
    bottom: 20,
    left: 10,
  },
  offerBadge: {
    position: "absolute",
    zIndex: 1,
    top: 12,
    left: 12,
    minHeight: 30,
    paddingHorizontal: 11,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: "#174F3D",
  },
  offerBadgeText: {
    color: "#FFFFFF",
    fontFamily: typography.bold,
    fontSize: 12,
  },
  imageFooter: {
    position: "absolute",
    right: 12,
    bottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 26,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 13,
    backgroundColor: "#F1F6F0",
  },
  stockDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: palette.greenDark,
  },
  stockDotUnavailable: { backgroundColor: palette.red },
  imageFooterText: {
    color: "#365342",
    fontFamily: typography.semibold,
    fontSize: 9,
    letterSpacing: 0.5,
  },
  cardCopy: { paddingTop: 14, paddingHorizontal: 2, alignItems: "flex-start" },
  category: {
    color: palette.muted,
    fontFamily: typography.medium,
    fontSize: 9,
    letterSpacing: 1,
  },
  productName: {
    minHeight: 40,
    marginTop: 5,
    color: palette.ink,
    fontFamily: typography.semibold,
    fontSize: 14,
    lineHeight: 20,
  },
  priceRow: {
    marginTop: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "baseline",
    gap: 8,
  },
  price: {
    color: palette.ink,
    fontFamily: typography.bold,
    fontSize: 21,
    lineHeight: 26,
    letterSpacing: -0.5,
  },
  oldPrice: {
    color: "#858B86",
    fontFamily: typography.regular,
    fontSize: 12,
    textDecorationLine: "line-through",
  },
  savedAmount: {
    marginTop: 3,
    color: palette.greenDark,
    fontFamily: typography.medium,
    fontSize: 10,
    lineHeight: 15,
  },
  discover: {
    minHeight: 44,
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  discoverText: {
    color: palette.ink,
    fontFamily: typography.semibold,
    fontSize: 12,
  },
});
