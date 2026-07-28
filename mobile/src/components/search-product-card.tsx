import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { memo, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { AnimatedPressable } from "@/components/animated-pressable";
import { typography } from "@/constants/theme";
import { discount, imageUrl, money } from "@/lib/format";
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
  const wishlist = useCommerceStore((state) => state.wishlist);
  const toggleWishlist = useCommerceStore((state) => state.toggleWishlist);
  const favorite = wishlist.includes(product.id);
  const productImage = imageUrl(product.thumbnail || product.images[0]);
  const saving = discount(product.price, product.original_price);
  const reviews = product.review_count ?? product.reviews ?? 0;
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => setImageFailed(false), [productImage]);

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
            <Text style={styles.imageFallbackText}>IMAGE INDISPONIBLE</Text>
          </View>
        ) : (
          <Image
            accessibilityLabel={product.name}
            cachePolicy="memory-disk"
            contentFit="cover"
            onError={() => setImageFailed(true)}
            recyclingKey={product.id}
            source={productImage}
            style={StyleSheet.absoluteFill}
            transition={180}
          />
        )}

        {product.newArrival ? (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>NOUVEAU</Text>
          </View>
        ) : saving ? (
          <View style={styles.discountBadge}>
            <Text style={styles.discountBadgeText}>-{saving}%</Text>
          </View>
        ) : null}

          {product.stock <= 0 ? (
            <View style={styles.outOfStock}>
              <Text style={styles.outOfStockText}>ÉPUISÉ</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.body}>
          <Text numberOfLines={1} style={styles.category}>
            {(product.brand || product.category).toUpperCase()}
          </Text>
          <Text numberOfLines={2} style={styles.name}>{product.name}</Text>

          <View style={styles.ratingRow}>
            <Ionicons
              name={reviews > 0 && (product.rating ?? 0) > 0 ? "star" : "star-outline"}
              size={13}
              color={colors.gold}
            />
            <Text style={styles.ratingText}>
              {reviews > 0 && (product.rating ?? 0) > 0
                ? `${(product.rating ?? 0).toFixed(1)} (${reviews})`
                : "Nouveau"}
            </Text>
            {product.stock > 0 ? (
              <View style={styles.stock}>
                <View style={styles.stockDot} />
                <Text style={styles.stockText}>EN STOCK</Text>
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
        accessibilityLabel={favorite ? "Retirer des favoris" : "Ajouter aux favoris"}
        accessibilityRole="button"
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
    borderColor: colors.border,
    borderRadius: 5,
    backgroundColor: colors.background,
  },
  productLink: { flex: 1 },
  imageSurface: {
    height: 182,
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
  },
  newBadgeText: {
    color: colors.text,
    fontFamily: typography.black,
    fontSize: 7,
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
  },
  discountBadgeText: {
    color: colors.background,
    fontFamily: typography.black,
    fontSize: 8,
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
    borderColor: colors.border,
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
  },
  outOfStockText: {
    color: colors.background,
    fontFamily: typography.black,
    fontSize: 7,
    letterSpacing: 0.7,
  },
  body: {
    minHeight: 137,
    padding: 10,
  },
  category: {
    color: colors.primaryDark,
    fontFamily: typography.black,
    fontSize: 7,
    letterSpacing: 0.8,
  },
  name: {
    minHeight: 38,
    marginTop: 6,
    color: colors.text,
    fontFamily: typography.bold,
    fontSize: 12,
    lineHeight: 17,
  },
  ratingRow: {
    minHeight: 24,
    marginTop: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    color: colors.secondaryText,
    fontFamily: typography.medium,
    fontSize: 9,
  },
  stock: {
    marginLeft: "auto",
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  stockDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  stockText: {
    color: colors.secondaryText,
    fontFamily: typography.black,
    fontSize: 6,
    letterSpacing: 0.45,
  },
  priceRow: {
    minHeight: 31,
    marginTop: 7,
    paddingTop: 8,
    flexDirection: "row",
    alignItems: "baseline",
    gap: 5,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  price: {
    color: colors.text,
    fontFamily: typography.black,
    fontSize: 14,
  },
  salePrice: { color: colors.notification },
  oldPrice: {
    minWidth: 0,
    flexShrink: 1,
    color: "#8D928E",
    fontFamily: typography.medium,
    fontSize: 8,
    textDecorationLine: "line-through",
  },
});
