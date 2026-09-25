import { localizedContent } from "@/i18n/content";
import { msg, useLocale } from "@/i18n";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { AnimatedPressable } from "@/components/animated-pressable";
import { typography } from "@/constants/theme";
import { discount, money, formatNumber } from "@/lib/format";
import { useProductImage } from "@/hooks/use-product-image";
import { useCommerceStore } from "@/stores/commerce";
import type { Product } from "@/types/commerce";

const colors = {
  background: "#FFFFFF",
  text: "#0B0B0B",
  secondaryText: "#555955",
  primary: "#29C954",
  primaryDark: "#10843A",
  surface: "#F2F3F1",
  border: "#D9DCD8",
  notification: "#E53935",
  gold: "#F5A300",
};

export const SearchProductCard = memo(function SearchProductCard({
  product,
  onOpen,
}: {
  product: Product;
  onOpen?: () => void;
}) {
  useLocale();
  const wishlist = useCommerceStore((state) => state.wishlist);
  const toggleWishlist = useCommerceStore((state) => state.toggleWishlist);
  const favorite = wishlist.includes(product.id);
  const { source: productImage, imageFailed, onError: onImageError } = useProductImage(product);
  const saving = discount(product.price, product.original_price);
  const reviews = product.review_count ?? product.reviews ?? 0;

  return (
    <View style={styles.card}>
      <AnimatedPressable
        accessibilityLabel={`${product.name}, ${money(product.price)}`}
        accessibilityRole="button"
        onPress={() => {
          onOpen?.();
          router.push({
            pathname: "/product/[slug]",
            params: {
              slug: product.slug,
              origin: "search",
              parentCategory: product.category,
            },
          });
        }}
        pressedScale={0.985}
        style={styles.productLink}
      >
        <View style={styles.imageSurface}>
        {imageFailed ? (
          <View style={styles.imageFallback}>
            <Ionicons name="image-outline" size={27} color="#929793" />
            <Text style={styles.imageFallbackText}>{msg("productCard.imageUnavailableUppercase")}</Text>
          </View>
        ) : (
          <Image
            accessibilityLabel={product.name}
            cachePolicy="memory-disk"
            contentFit="cover"
            onError={onImageError}
            recyclingKey={product.id}
            source={productImage}
            style={StyleSheet.absoluteFill}
            transition={180}
          />
        )}

        {product.newArrival ? (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>{msg("productCard.newUppercase")}</Text>
          </View>
        ) : saving ? (
          <View style={styles.discountBadge}>
            <Text style={styles.discountBadgeText}>-{saving}%</Text>
          </View>
        ) : null}

          {(product.stock <= 0 && !product.preorder_enabled) ? (
            <View style={styles.outOfStock}>
              <Text style={styles.outOfStockText}>{msg("homePromotionSection.soldOutUppercase")}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.body}>
          <Text numberOfLines={1} style={styles.category}>
            {(product.brand || localizedContent(product.category)).toUpperCase()}
          </Text>
          <Text numberOfLines={2} style={styles.name}>{product.name}</Text>

          <View style={styles.ratingRow}>
            {reviews > 0 && (product.rating ?? 0) > 0 && <View style={styles.rating}>
            <Ionicons
              name="star"
              size={13}
              color={colors.gold}
            />
            <Text style={styles.ratingText}>
              {`${formatNumber(product.rating ?? 0, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} (${reviews})`}
            </Text>
            </View>}
            {(product.stock > 0 || product.preorder_enabled) ? (
              <View style={styles.stock}>
                <View style={styles.stockDot} />
                <Text style={styles.stockText}>{product.stock <= 0 && product.preorder_enabled ? msg("preorder.badge") : msg("productCard.inStock")}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.priceRow}>
            <Text style={[styles.price, saving > 0 && styles.salePrice]}>{money(product.price)}</Text>
            {saving ? (
              <Text numberOfLines={1} style={styles.oldPrice}>{money(product.original_price ?? 0)}</Text>
            ) : null}
          </View>
        </View>
      </AnimatedPressable>

      <AnimatedPressable
        accessibilityLabel={favorite ? msg("productCard.removeFromFavorites") : msg("productCard.addToFavorites")}
        accessibilityRole="button"
        accessibilityState={{ selected: favorite }}
        onPress={() => toggleWishlist(product.id)}
        style={styles.favorite}
      >
        <Ionicons
          name={favorite ? "heart" : "heart-outline"}
          size={20}
          color={favorite ? colors.notification : colors.text}
        />
      </AnimatedPressable>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    width: "48.8%",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E9E2",
    borderRadius: 16,
    backgroundColor: colors.background,
  },
  productLink: { flex: 1 },
  imageSurface: {
    aspectRatio: 1,
    overflow: "hidden",
    backgroundColor: colors.surface,
  },
  imageFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  imageFallbackText: {
    color: colors.secondaryText,
    fontFamily: typography.bold,
    fontSize: 7,
    letterSpacing: 0.7,
  },
  newBadge: {
    position: "absolute",
    left: 8,
    top: 8,
    minHeight: 24,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    borderRadius: 7,
  },
  newBadgeText: {
    color: colors.text,
    fontFamily: typography.black,
    fontSize: 9,
    letterSpacing: 0.7,
  },
  discountBadge: {
    position: "absolute",
    left: 8,
    top: 8,
    minHeight: 24,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.notification,
    borderRadius: 7,
  },
  discountBadgeText: {
    color: colors.background,
    fontFamily: typography.semibold,
    fontSize: 10,
  },
  favorite: {
    position: "absolute",
    right: 8,
    top: 8,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(35,61,44,0.08)",
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.96)",
  },
  outOfStock: {
    position: "absolute",
    left: 8,
    bottom: 8,
    minHeight: 24,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.text,
    borderRadius: 7,
  },
  outOfStockText: {
    color: colors.background,
    fontFamily: typography.black,
    fontSize: 7,
    letterSpacing: 0.7,
  },
  body: {
    flex: 1,
    padding: 12,
  },
  category: {
    color: "#75816F",
    fontFamily: typography.semibold,
    fontSize: 8,
    lineHeight: 12,
    letterSpacing: 1,
  },
  name: {
    minHeight: 36,
    marginTop: 6,
    color: "#27382B",
    fontFamily: typography.semibold,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: -0.2,
  },
  ratingRow: {
    minHeight: 24,
    marginTop: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
  },
  rating: { flexDirection: "row", alignItems: "center", gap: 4 },
  ratingText: {
    color: colors.secondaryText,
    fontFamily: typography.medium,
    fontSize: 9,
  },
  stock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  stockDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#648567",
  },
  stockText: {
    flexShrink: 1,
    color: "#62725E",
    fontFamily: typography.medium,
    fontSize: 9,
    lineHeight: 14,
  },
  priceRow: {
    minHeight: 31,
    marginTop: 10,
    paddingTop: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "baseline",
    columnGap: 7,
    rowGap: 3,
    borderTopWidth: 1,
    borderTopColor: "#EDF0EA",
  },
  price: {
    color: "#234735",
    fontFamily: typography.semibold,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.4,
  },
  salePrice: { color: "#B3443D" },
  oldPrice: {
    minWidth: 0,
    flexShrink: 1,
    color: "#8D928E",
    fontFamily: typography.medium,
    fontSize: 10,
    textDecorationLine: "line-through",
  },
});
