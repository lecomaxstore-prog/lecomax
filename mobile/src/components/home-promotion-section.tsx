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
  const { contentWidth } = useAppViewport();
  const cardWidth = Math.min(280, contentWidth - 64);
  if (!products.length) return null;

  return (
    <View style={styles.section}>
      <View style={styles.heading}>
        <View style={styles.headingCopy}>
          <Text style={styles.eyebrow}>PRIX L’ECOMAX</Text>
          <Text accessibilityRole="header" style={styles.title}>
            Promotions
          </Text>
          <Text style={styles.subtitle}>
            Des offres sélectionnées, pour une durée limitée.
          </Text>
        </View>
        <AnimatedPressable
          accessibilityLabel="Voir toutes les promotions"
          onPress={() =>
            router.push({
              pathname: "/catalog",
              params: { promotion: "true", sort: "low" },
            })
          }
          style={styles.viewAll}
        >
          <Text style={styles.viewAllText}>Voir tout</Text>
          <Ionicons name="arrow-forward" size={15} color={colors.primaryDark} />
        </AnimatedPressable>
      </View>

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
  const saving = discount(product.price, product.original_price);
  const savedAmount = Math.max(
    0,
    Number(product.original_price ?? 0) - Number(product.price),
  );

  return (
    <AnimatedPressable
      accessibilityLabel={`${product.name}, ${saving ? `${saving}% de réduction` : "offre spéciale"}`}
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
            {saving ? `-${saving}%` : "OFFRE"}
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
            {product.stock > 0 ? "EN STOCK" : "ÉPUISÉ"}
          </Text>
        </View>
      </View>
      <View style={styles.cardCopy}>
        <Text numberOfLines={1} style={styles.category}>
          {(product.brand || product.category).toUpperCase()}
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
            Vous économisez {money(savedAmount)}
          </Text>
        ) : null}

        <View style={styles.discover}>
          <Text style={styles.discoverText}>Découvrir</Text>
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
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  headingCopy: { flex: 1, minWidth: 0 },
  eyebrow: {
    color: palette.greenDark,
    fontFamily: typography.semibold,
    fontSize: 9,
    letterSpacing: 1.4,
  },
  title: {
    marginTop: 6,
    color: palette.ink,
    fontFamily: typography.bold,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.7,
  },
  subtitle: {
    marginTop: 5,
    color: palette.muted,
    fontFamily: typography.regular,
    fontSize: 11,
    lineHeight: 17,
  },
  viewAll: {
    minWidth: 72,
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
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
    height: 212,
    overflow: "hidden",
    borderRadius: 14,
    backgroundColor: "#F5F6F3",
  },
  productImage: {
    position: "absolute",
    top: 32,
    right: 18,
    bottom: 24,
    left: 18,
  },
  offerBadge: {
    position: "absolute",
    zIndex: 1,
    top: 12,
    left: 12,
    minHeight: 26,
    paddingHorizontal: 9,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
    backgroundColor: "#E7F4E8",
  },
  offerBadgeText: {
    color: palette.greenDark,
    fontFamily: typography.semibold,
    fontSize: 11,
  },
  imageFooter: {
    position: "absolute",
    right: 12,
    bottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  stockDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: palette.greenDark,
  },
  stockDotUnavailable: { backgroundColor: palette.red },
  imageFooterText: {
    color: palette.muted,
    fontFamily: typography.medium,
    fontSize: 8,
    letterSpacing: 0.4,
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
