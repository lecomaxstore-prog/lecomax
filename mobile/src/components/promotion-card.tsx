import { ProductBrandMark } from "@/components/product-brand-mark";
import { localizedContent } from "@/i18n/content";
import { msg, useLocale } from "@/i18n";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { AnimatedPressable } from "@/components/animated-pressable";
import { Price } from "@/components/price";
import { Rating } from "@/components/rating";
import { palette, typography } from "@/constants/theme";
import { discount, imageUrl } from "@/lib/format";
import { useCommerceStore } from "@/stores/commerce";
import type { Product } from "@/types/commerce";

export const PromotionCard = memo(function PromotionCard({
  product,
}: {
  product: Product;
}) {
  useLocale();
  const wishlist = useCommerceStore((state) => state.wishlist);
  const toggleWishlist = useCommerceStore((state) => state.toggleWishlist);
  const addToCart = useCommerceStore((state) => state.addToCart);
  const favorite = wishlist.includes(product.id);
  const saving = discount(product.price, product.original_price);
  const requiresOptions =
    (product.colors?.length ?? 0) > 0 ||
    (product.sizes ?? []).some(
      (size) => size.toLowerCase() !== "taille unique",
    );

  return (
    <AnimatedPressable
      accessibilityLabel={product.name}
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
      style={styles.card}
    >
      <View style={styles.imageWrap}>
        <Image
          source={imageUrl(product.images[0])}
          contentFit="cover"
          transition={250}
          cachePolicy="memory-disk"
          style={StyleSheet.absoluteFill}
        />
        {saving ? (
          <View style={styles.discount}>
            <Ionicons name="flash" size={10} color={palette.white} />
            <Text style={styles.discountText}>-{saving}%</Text>
          </View>
        ) : null}
        <AnimatedPressable
          accessibilityLabel={
            favorite ? msg("productCard.removeFromFavorites") : msg("productCard.addToFavorites")
          }
          onPress={(event) => {
            event.stopPropagation();
            toggleWishlist(product.id);
          }}
          style={styles.wishlist}
        >
          <Ionicons
            name={favorite ? "heart" : "heart-outline"}
            size={19}
            color={favorite ? palette.red : palette.ink}
          />
        </AnimatedPressable>
      </View>
      <View style={styles.body}>
        <View style={{ minHeight: 20, justifyContent: "center" }}>{product.brand ? <ProductBrandMark name={product.brand} compact /> : <Text numberOfLines={1} style={styles.category}>{localizedContent(product.category).toUpperCase()}</Text>}</View>
        <Text numberOfLines={2} style={styles.name}>
          {product.name}
        </Text>
        <Rating
          value={product.rating}
          reviews={product.review_count ?? product.reviews ?? 0}
        />
        <View style={styles.footer}>
          <Price price={product.price} oldPrice={product.original_price} />
          <AnimatedPressable
            accessibilityLabel={
              requiresOptions ? msg("productCard.chooseOptions") : msg("common.add")
            }
            disabled={product.stock <= 0}
            onPress={(event) => {
              event.stopPropagation();
              if (requiresOptions) {
                router.push({
                  pathname: "/product/[slug]",
                  params: {
                    slug: product.slug,
                    origin: "promotion",
                    parentCategory: product.category,
                  },
                });
                return;
              }
              addToCart(product);
            }}
            style={[styles.addButton, product.stock <= 0 && styles.disabled]}
          >
            <Ionicons name="add" size={21} color="#555D58" />
          </AnimatedPressable>
        </View>
      </View>
    </AnimatedPressable>
  );
});

const styles = StyleSheet.create({
  card: {
    width: 246,
    padding: 6,
    borderRadius: 18,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: "#E7EBE8",
    shadowColor: palette.ink,
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.055,
    shadowRadius: 16,
    elevation: 2,
  },
  imageWrap: {
    height: 214,
    overflow: "hidden",
    borderRadius: 15,
    backgroundColor: palette.canvas,
  },
  discount: {
    position: "absolute",
    left: 10,
    top: 10,
    paddingHorizontal: 10,
    minHeight: 26,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: palette.red,
  },
  discountText: {
    color: palette.white,
    fontFamily: typography.black,
    fontSize: 10,
  },
  wishlist: {
    position: "absolute",
    right: 10,
    top: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.95)",
    shadowColor: palette.ink,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 7,
    elevation: 2,
  },
  body: { paddingHorizontal: 10, paddingBottom: 10, paddingTop: 12 },
  category: {
    marginBottom: 6,
    color: palette.greenDark,
    fontFamily: typography.black,
    fontSize: 7.5,
    letterSpacing: 0.9,
  },
  name: {
    minHeight: 39,
    color: palette.ink,
    fontFamily: typography.bold,
    fontSize: 13.5,
    lineHeight: 18,
  },
  footer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#ECECEC",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#D9DEDA",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.white,
  },
  disabled: { opacity: 0.35 },
});
