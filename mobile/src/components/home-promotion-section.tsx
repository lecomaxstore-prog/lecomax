import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { AnimatedPressable } from "@/components/animated-pressable";
import { HorizontalRail } from "@/components/horizontal-rail";
import { typography } from "@/constants/theme";
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
  if (!products.length) return null;

  return (
    <View style={styles.section}>
      <View style={styles.heading}>
        <View style={styles.headingCopy}>
          <Text style={styles.eyebrow}>PRIX L’ECOMAX</Text>
          <Text accessibilityRole="header" style={styles.title}>
            PROMOTIONS
          </Text>
          <Text style={styles.subtitle}>
            Des offres sélectionnées, pour une durée limitée.
          </Text>
        </View>
        <AnimatedPressable
          accessibilityLabel="Voir toutes les promotions"
          onPress={() =>
            router.push({ pathname: "/catalog", params: { sort: "low" } })
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
        snapToInterval={352}
        contentContainerStyle={styles.rail}
      >
        {products.map((product, index) => (
          <PromotionFeatureCard
            key={product.id}
            product={product}
            featured={index === 0}
          />
        ))}
      </HorizontalRail>
    </View>
  );
});

const PromotionFeatureCard = memo(function PromotionFeatureCard({
  product,
  featured,
}: {
  product: Product;
  featured: boolean;
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
      style={[styles.card, featured && styles.cardFeatured]}
    >
      {featured ? <View style={styles.featuredAccent} /> : null}
      <LinearGradient
        colors={featured ? ["#173A22", "#101612"] : ["#191C1A", "#0D0F0E"]}
        end={{ x: 1, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={styles.cardCopy}
      >
        <View style={styles.offerBadge}>
          <Ionicons name="flash" size={11} color={colors.text} />
          <Text style={styles.offerBadgeText}>
            {saving ? `-${saving}%` : "OFFRE"}
          </Text>
        </View>

        <Text numberOfLines={1} style={styles.category}>
          {(product.brand || product.category).toUpperCase()}
        </Text>
        <Text numberOfLines={3} style={styles.productName}>
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
          <Text style={styles.discoverText}>DÉCOUVRIR</Text>
          <Ionicons name="arrow-forward-circle" size={17} color={colors.text} />
        </View>
      </LinearGradient>

      <View style={styles.imageWrap}>
        <View style={styles.imageGlow} />
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
    </AnimatedPressable>
  );
});

const styles = StyleSheet.create({
  section: {
    marginTop: 30,
    paddingTop: 27,
    borderTopWidth: 1,
    borderTopColor: "#E5E8E5",
  },
  heading: {
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 12,
  },
  headingCopy: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    color: colors.primaryDark,
    fontFamily: typography.black,
    fontSize: 7.5,
    letterSpacing: 1.35,
  },
  title: {
    marginTop: 4,
    color: colors.text,
    fontFamily: typography.black,
    fontSize: 24,
    lineHeight: 27,
    letterSpacing: -0.7,
  },
  subtitle: {
    maxWidth: 260,
    marginTop: 4,
    color: "#676C68",
    fontFamily: typography.regular,
    fontSize: 9,
    lineHeight: 13,
  },
  viewAll: {
    minWidth: 82,
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 5,
  },
  viewAllText: {
    color: colors.primaryDark,
    fontFamily: typography.bold,
    fontSize: 9.5,
  },
  rail: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 12,
    gap: 12,
  },
  card: {
    width: 340,
    height: 218,
    overflow: "hidden",
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#DDE3DD",
    borderRadius: 20,
    backgroundColor: colors.background,
    boxShadow: "0 12px 28px rgba(17, 32, 20, 0.12)",
  },
  cardFeatured: {
    borderColor: "#BBDDC3",
  },
  featuredAccent: {
    position: "absolute",
    zIndex: 2,
    top: 0,
    left: 20,
    width: 52,
    height: 3,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    backgroundColor: colors.primary,
  },
  cardCopy: {
    width: 190,
    minWidth: 0,
    paddingHorizontal: 16,
    paddingBottom: 15,
    paddingTop: 17,
    alignItems: "flex-start",
  },
  offerBadge: {
    minHeight: 28,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  offerBadgeText: {
    color: colors.text,
    fontFamily: typography.black,
    fontSize: 8.5,
    letterSpacing: 0.2,
  },
  category: {
    marginTop: 12,
    color: colors.primary,
    fontFamily: typography.black,
    fontSize: 7.5,
    letterSpacing: 1,
  },
  productName: {
    minHeight: 51,
    marginTop: 4,
    color: colors.background,
    fontFamily: typography.black,
    fontSize: 12.5,
    lineHeight: 16.5,
    letterSpacing: -0.2,
  },
  priceRow: {
    marginTop: 5,
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  price: {
    color: colors.primary,
    fontFamily: typography.black,
    fontSize: 16,
    letterSpacing: -0.3,
  },
  oldPrice: {
    maxWidth: 64,
    color: "rgba(255,255,255,0.48)",
    fontFamily: typography.medium,
    fontSize: 8,
    textDecorationLine: "line-through",
  },
  savedAmount: {
    marginTop: 2,
    color: "rgba(255,255,255,0.55)",
    fontFamily: typography.medium,
    fontSize: 7.5,
  },
  discover: {
    minHeight: 34,
    marginTop: "auto",
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderRadius: 10,
    backgroundColor: colors.primary,
  },
  discoverText: {
    color: colors.text,
    fontFamily: typography.black,
    fontSize: 7.5,
    letterSpacing: 0.75,
  },
  imageWrap: {
    flex: 1,
    height: "100%",
    overflow: "hidden",
    backgroundColor: "#F7F8F5",
  },
  imageGlow: {
    position: "absolute",
    top: 28,
    right: -18,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "rgba(50,205,87,0.10)",
  },
  productImage: {
    position: "absolute",
    top: 18,
    right: 7,
    bottom: 32,
    left: 7,
  },
  imageFooter: {
    position: "absolute",
    right: 10,
    bottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  stockDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.primaryDark,
  },
  stockDotUnavailable: {
    backgroundColor: colors.red,
  },
  imageFooterText: {
    color: "#303530",
    fontFamily: typography.black,
    fontSize: 6,
    letterSpacing: 0.55,
  },
});
