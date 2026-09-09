import { localizedContent } from "@/i18n/content";
import { msg, useLocale } from "@/i18n";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { router, usePathname } from "expo-router";
import { memo, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Platform, StyleSheet, Text, View } from "react-native";
import Animated, { ZoomIn } from "react-native-reanimated";
import { AnimatedPressable } from "@/components/animated-pressable";
import { Price } from "@/components/price";
import { Rating } from "@/components/rating";
import { palette, typography } from "@/constants/theme";
import { useSettings } from "@/hooks/use-catalog";
import { triggerSuccessHaptic } from "@/services/haptics";
import { getFreshProduct } from "@/services/catalog";
import { discount, money } from "@/lib/format";
import { useProductImage } from "@/hooks/use-product-image";
import { productCardWidth } from "@/lib/responsive";
import { useCartFeedbackStore } from "@/stores/cart-feedback";
import { useCommerceStore } from "@/stores/commerce";
import type { Product } from "@/types/commerce";

type Props = {
  product: Product;
  wide?: boolean;
  related?: boolean;
  grid?: boolean;
  columns?: 2 | 3 | 4;
  /** Exact pixel width measured from the row; preferred over the percentage fallback. */
  width?: number;
};

export const ProductCard = memo(function ProductCard({
  product,
  wide = false,
  related = false,
  grid = false,
  columns = 2,
  width,
}: Props) {
  useLocale();
  const pathname = usePathname();
  const origin =
    pathname === "/search"
      ? "search"
      : pathname === "/wishlist"
        ? "wishlist"
        : pathname === "/"
          ? "home"
          : pathname === "/catalog"
            ? "catalog"
            : undefined;
  const routeParams = {
    slug: product.slug,
    parentCategory: product.category,
    ...(origin ? { origin } : {}),
  };
  const wishlist = useCommerceStore((state) => state.wishlist);
  const toggleWishlist = useCommerceStore((state) => state.toggleWishlist);
  const addToCart = useCommerceStore((state) => state.addToCart);
  const startCartFlight = useCartFeedbackStore((state) => state.startFlight);
  const settingsQuery = useSettings();
  const wishlistEnabled =
    settingsQuery.data?.some(
      (setting) =>
        setting.key === "enable_wishlist" && String(setting.value) === "true",
    ) ?? false;
  const favorite = wishlist.includes(product.id);
  const saving = discount(product.price, product.original_price);
  const requiresOptions = product.preorder_enabled ||
    (product.colors?.length ?? 0) > 0 ||
    (product.sizes ?? []).some(
      (size) => size.toLowerCase() !== "taille unique",
    );
  const displayName =
    wide || grid ? product.name.split(/\s+[—–]\s+/)[0] : product.name;
  // Below ~152px the brand and the "EN STOCK" pill cannot both fit without
  // truncating the brand, so the pill keeps only its dot (320pt phones).
  const tightCard = grid && typeof width === "number" && width < 152;
  const { source: productImage, imageFailed, onError: onImageError } = useProductImage(product);
  const [added, setAdded] = useState(false);
  const [checkingStock, setCheckingStock] = useState(false);
  const addedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (addedTimer.current) clearTimeout(addedTimer.current);
    },
    [],
  );

  const openProduct = () =>
    router.push({ pathname: "/product/[slug]", params: routeParams });

  return (
    <View
      style={[
        styles.card,
        wide && styles.wide,
        grid && styles.grid,
        grid && (width ? { width } : { width: productCardWidth(columns) }),
        related && styles.relatedCard,
      ]}
    >
      <View
        style={[
          styles.imageWrap,
          wide && styles.wideImage,
          grid && styles.gridImage,
          related && styles.relatedImage,
        ]}
      >
        <AnimatedPressable
          accessibilityRole="button"
          accessibilityLabel={product.name}
          onPress={openProduct}
          style={StyleSheet.absoluteFill}
        >
        {imageFailed ? (
          <View style={styles.imageFallback}>
            <Ionicons name="image-outline" size={27} color="#A8AEAA" />
            <Text style={styles.imageFallbackText}>{msg("productCard.imageUnavailableUppercase")}</Text>
          </View>
        ) : (
          <Image
            source={productImage}
            contentFit="contain"
            transition={250}
            cachePolicy="memory-disk"
            recyclingKey={product.id}
            onError={onImageError}
            style={[StyleSheet.absoluteFill, !related && styles.productImage]}
          />
        )}
        {saving ? (
          <View style={[styles.discount, related && styles.relatedDiscount]}>
            {!related && <Ionicons name="flash" size={10} color={palette.white} />}
            <Text style={[styles.discountText, related && styles.relatedDiscountText]}>-{saving}%</Text>
          </View>
        ) : product.newArrival ? (
          <View style={styles.newBadge}>
            <Text numberOfLines={1} style={styles.newBadgeText}>{msg("productCard.newUppercase")}</Text>
          </View>
        ) : null}
        {(product.stock <= 0 && !product.preorder_enabled) ? (
          <View style={styles.outOfStock}>
            <Text style={styles.outOfStockText}>{msg("homePromotionSection.soldOutUppercase")}</Text>
          </View>
        ) : null}
        </AnimatedPressable>
        {wishlistEnabled ? (
          <AnimatedPressable
            accessibilityRole="button"
            accessibilityState={{ selected: favorite }}
            hitSlop={6}
            accessibilityLabel={
              favorite ? msg("productCard.removeFromFavorites") : msg("productCard.addToFavorites")
            }
            onPress={(event) => {
              event.stopPropagation();
              toggleWishlist(product.id);
            }}
            style={[styles.wishlist, related && styles.relatedWishlist]}
          >
            <Ionicons
              name={favorite ? "heart" : "heart-outline"}
              size={16}
              color={favorite ? palette.red : palette.ink}
            />
          </AnimatedPressable>
        ) : null}
      </View>
      <View
        style={[styles.body, wide && styles.wideBody, grid && styles.gridBody, related && styles.relatedBody]}
      >
        <AnimatedPressable
          accessibilityRole="button"
          accessibilityLabel={msg("product.viewNamed", { name: product.name })}
          onPress={openProduct}
          style={styles.details}
        >
        <View style={styles.metaRow}>
          <Text numberOfLines={1} style={[styles.brand, related && styles.relatedBrand]}>
            {(product.brand || localizedContent(product.category)).toUpperCase()}
          </Text>
          {(product.stock > 0 || product.preorder_enabled) && !related ? (
            <View accessibilityLabel={product.stock<=0 && product.preorder_enabled ? msg("preorder.badge") : msg("productCard.inStock")} style={styles.stock}>
              <View style={styles.stockDot} />
              {tightCard ? null : (
                <Text style={styles.stockLabel}>{product.stock <= 0 && product.preorder_enabled ? msg("preorder.badge") : msg("productCard.inStock")}</Text>
              )}
            </View>
          ) : null}
        </View>
        <Text
          numberOfLines={2}
          ellipsizeMode="tail"
          style={[
            styles.name,
            wide && styles.wideName,
            grid && styles.gridName,
            related && styles.relatedName,
          ]}
        >
          {displayName}
        </Text>
        {(product.review_count ?? product.reviews ?? 0) > 0 ? (
          <View style={styles.ratingRow}>
            <Rating
            value={product.rating}
            reviews={product.review_count ?? product.reviews ?? 0}
            />
          </View>
        ) : null}
        </AnimatedPressable>
        <View style={[styles.footer, tightCard && styles.tightFooter, related && styles.relatedFooter]}>
          {related ? <View style={styles.relatedPrices}>
            <Text style={styles.relatedPrice}>{money(product.price)}</Text>
            {saving > 0 ? <Text style={styles.relatedOldPrice}>{money(product.original_price!)}</Text> : null}
          </View> : <Price
            price={product.price}
            oldPrice={product.original_price}
            compact
            emphasized
            tight={tightCard}
          />}
          <AnimatedPressable
            accessibilityRole="button"
            accessibilityLabel={
              requiresOptions ? msg("productCard.chooseOptions") : msg("common.add")
            }
            accessibilityHint={requiresOptions ? msg("productCard.opensProductDetailsToChooseAColorAndSize") : undefined}
            hitSlop={6}
            disabled={(product.stock <= 0 && !product.preorder_enabled) || checkingStock}
            onPress={async (event) => {
              event.stopPropagation();
              if (requiresOptions || Boolean(product.colors?.length || product.sizes?.length)) {
                router.push({
                  pathname: "/product/[slug]",
                  params: routeParams,
                });
                return;
              }
              if (checkingStock) return;
              setCheckingStock(true);
              let fresh: Product | null = null;
              try {
                fresh = await getFreshProduct(product.slug);
              } catch {
                Alert.alert(
                  msg("productCard.unableToVerify"),
                  msg("auth.checkYourConnectionAndTryAgain"),
                );
                setCheckingStock(false);
                return;
              }
              if (!fresh?.active || (fresh.stock <= 0 && !fresh.preorder_enabled)) {
                Alert.alert(
                  msg("productCard.productSoldOut"),
                  msg("productCard.thisItemIsNoLongerAvailable"),
                );
                setCheckingStock(false);
                return;
              }
              addToCart(fresh);
              const { pageX, pageY } = event.nativeEvent;
              startCartFlight({
                image: product.thumbnail || product.images[0],
                originX: pageX,
                originY: pageY,
              });
              setAdded(true);
              if (addedTimer.current) clearTimeout(addedTimer.current);
              addedTimer.current = setTimeout(() => setAdded(false), 1050);
              if (Platform.OS !== "web") {
                void triggerSuccessHaptic();
              }
              setCheckingStock(false);
            }}
            style={[
              styles.add,
              related && styles.relatedAdd,
              added && styles.addConfirmed,
              ((product.stock <= 0 && !product.preorder_enabled) || checkingStock) && styles.disabled,
            ]}
          >
            {checkingStock ? (
              <ActivityIndicator color={palette.white} size="small" />
            ) : added ? (
              <Animated.View entering={ZoomIn.duration(220).springify()}>
                <Ionicons name="checkmark" size={16} color={palette.white} />
              </Animated.View>
            ) : (
              <Ionicons name={requiresOptions ? "arrow-forward" : "add"} size={16} color={palette.white} />
            )}
          </AnimatedPressable>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  relatedCard: { width: 240, padding: 8, borderRadius: 20, borderWidth: 1, borderColor: "#E6EAE1", backgroundColor: "#FFFFFF", overflow: "hidden", shadowOpacity: 0, elevation: 0 },
  relatedImage: { height: 224, borderRadius: 14, backgroundColor: "#F7F8F4" },
  relatedBody: { paddingHorizontal: 6, paddingTop: 14, paddingBottom: 5 },
  relatedBrand: { color: "#77816F", fontSize: 9, letterSpacing: 1 },
  relatedName: { minHeight: 40, marginTop: 7, fontFamily: typography.semibold, fontSize: 14, lineHeight: 20, letterSpacing: -0.3 },
  relatedDiscount: { minHeight: 25, paddingHorizontal: 8, borderRadius: 7, backgroundColor: "#EAF2E2" },
  relatedDiscountText: { color: "#3B603D", fontFamily: typography.semibold, fontSize: 10 },
  relatedWishlist: { width: 32, height: 32, shadowOpacity: 0, elevation: 0, borderColor: "#E7EBE3" },
  relatedFooter: { marginTop: 12, paddingTop: 10, borderTopColor: "#EDF0E8", gap: 8 },
  relatedPrices: { flex: 1, flexDirection: "row", flexWrap: "wrap", alignItems: "baseline", gap: 5 },
  relatedPrice: { color: "#183D29", fontFamily: typography.bold, fontSize: 16 },
  relatedOldPrice: { color: palette.muted, fontFamily: typography.regular, fontSize: 11, textDecorationLine: "line-through" },
  relatedAdd: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#183D29", shadowOpacity: 0, elevation: 0 },
  card: {
    width: "48.4%",
    overflow: "hidden",
    padding: 8,
    borderRadius: 22,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: "#E7E9E3",
    shadowColor: palette.ink,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.035,
    shadowRadius: 14,
    elevation: 1,
  },
  wide: {
    width: 272,
    padding: 8,
  },
  grid: {
    width: "48.6%",
    overflow: "hidden",
    padding: 7,
    borderWidth: 1,
    borderColor: "#E7E9E3",
    borderRadius: 20,
    backgroundColor: palette.white,
    shadowColor: palette.ink,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.035,
    shadowRadius: 14,
    elevation: 1,
  },
  imageWrap: {
    aspectRatio: 1,
    overflow: "hidden",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
  },
  productImage: { top: 8, right: 4, bottom: 8, left: 4 },
  wideImage: {
    aspectRatio: 1,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
  },
  gridImage: {
    borderRadius: 15,
    backgroundColor: "#FFFFFF",
  },
  imageFallback: {
    position: "absolute",
    inset: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  imageFallbackText: {
    color: palette.muted,
    fontFamily: typography.medium,
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 0.6,
  },
  discount: {
    position: "absolute",
    left: 9,
    top: 9,
    minHeight: 26,
    paddingHorizontal: 10,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: palette.red,
  },
  discountText: {
    color: palette.white,
    fontFamily: typography.bold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.25,
  },
  newBadge: {
    position: "absolute",
    left: 9,
    top: 9,
    maxWidth: "58%",
    minHeight: 22,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 7,
    backgroundColor: "#EAF0E5",
  },
  newBadgeText: {
    color: "#36553D",
    fontFamily: typography.semibold,
    fontSize: 8,
    lineHeight: 13,
    letterSpacing: 0.8,
  },
  outOfStock: {
    position: "absolute",
    left: 9,
    bottom: 9,
    minHeight: 26,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "rgba(17,17,17,0.88)",
  },
  outOfStockText: {
    color: palette.white,
    fontFamily: typography.bold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.5,
  },
  wishlist: {
    position: "absolute",
    right: 9,
    top: 9,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E7EBE3",
    backgroundColor: "#F7F9F5",
    shadowColor: palette.ink,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  body: { flexGrow: 1, paddingHorizontal: 5, paddingBottom: 5, paddingTop: 12 },
  details: { flexGrow: 1 },
  gridBody: {
    paddingHorizontal: 5,
    paddingTop: 12,
    paddingBottom: 5,
  },
  wideBody: {
    paddingHorizontal: 6,
    paddingBottom: 5,
    paddingTop: 12,
  },
  metaRow: {
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 5,
  },
  brand: {
    minWidth: 0,
    flex: 1,
    color: "#63715E",
    fontFamily: typography.semibold,
    fontSize: 9,
    lineHeight: 14,
    letterSpacing: 1.1,
  },
  stock: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 0,
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: "#EFF4EC",
  },
  stockDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#6E916C",
  },
  stockLabel: {
    color: "#42603D",
    fontFamily: typography.medium,
    fontSize: 9,
    lineHeight: 15,
    letterSpacing: 0,
  },
  name: {
    minHeight: 40,
    marginTop: 6,
    color: palette.ink,
    fontFamily: typography.semibold,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  wideName: {
    minHeight: 42,
    marginTop: 8,
    fontSize: 16,
    lineHeight: 21,
    letterSpacing: -0.35,
  },
  gridName: {
    minHeight: 40,
    marginTop: 7,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: -0.3,
  },
  ratingRow: { marginTop: 7 },
  footer: {
    minHeight: 48,
    marginTop: 10,
    padding: 8,
    paddingLeft: 10,
    borderRadius: 16,
    backgroundColor: "#F3F5F0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  add: {
    width: 32,
    height: 32,
    flexShrink: 0,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#203D2C",
    shadowColor: palette.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tightFooter: { padding: 4, paddingLeft: 6, gap: 4, borderRadius: 14 },
  addConfirmed: {
    borderColor: palette.greenDark,
    backgroundColor: palette.greenDark,
  },
  disabled: { opacity: 0.42 },
});
