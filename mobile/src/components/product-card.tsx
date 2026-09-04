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
import { discount, imageUrl } from "@/lib/format";
import { productCardWidth } from "@/lib/responsive";
import { useCartFeedbackStore } from "@/stores/cart-feedback";
import { useCommerceStore } from "@/stores/commerce";
import type { Product } from "@/types/commerce";

type Props = {
  product: Product;
  wide?: boolean;
  grid?: boolean;
  columns?: 2 | 3 | 4;
};

export const ProductCard = memo(function ProductCard({
  product,
  wide = false,
  grid = false,
  columns = 2,
}: Props) {
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
  const requiresOptions =
    (product.colors?.length ?? 0) > 0 ||
    (product.sizes ?? []).some(
      (size) => size.toLowerCase() !== "taille unique",
    );
  const displayName = wide ? product.name.split(/\s+[—–]\s+/)[0] : product.name;
  const productImage = imageUrl(product.images[0]);
  const [imageFailed, setImageFailed] = useState(false);
  const [added, setAdded] = useState(false);
  const [checkingStock, setCheckingStock] = useState(false);
  const addedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setImageFailed(false), [productImage]);
  useEffect(
    () => () => {
      if (addedTimer.current) clearTimeout(addedTimer.current);
    },
    [],
  );

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={product.name}
      onPress={() =>
        router.push({
          pathname: "/product/[slug]",
          params: routeParams,
        })
      }
      style={[
        styles.card,
        wide && styles.wide,
        grid && styles.grid,
        grid && { width: productCardWidth(columns) },
      ]}
    >
      <View
        style={[
          styles.imageWrap,
          wide && styles.wideImage,
          grid && styles.gridImage,
        ]}
      >
        {imageFailed ? (
          <View style={styles.imageFallback}>
            <Ionicons name="image-outline" size={27} color="#A8AEAA" />
            <Text style={styles.imageFallbackText}>IMAGE INDISPONIBLE</Text>
          </View>
        ) : (
          <Image
            source={productImage}
            contentFit="cover"
            transition={250}
            cachePolicy="memory-disk"
            recyclingKey={product.id}
            onError={() => setImageFailed(true)}
            style={StyleSheet.absoluteFill}
          />
        )}
        {saving ? (
          <View style={styles.discount}>
            <Ionicons name="flash" size={10} color={palette.white} />
            <Text style={styles.discountText}>-{saving}%</Text>
          </View>
        ) : product.newArrival ? (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>NOUVEAU</Text>
          </View>
        ) : null}
        {product.stock <= 0 ? (
          <View style={styles.outOfStock}>
            <Text style={styles.outOfStockText}>ÉPUISÉ</Text>
          </View>
        ) : null}
        {wishlistEnabled ? (
          <AnimatedPressable
            accessibilityLabel={
              favorite ? "Retirer des favoris" : "Ajouter aux favoris"
            }
            onPress={(event) => {
              event.stopPropagation();
              toggleWishlist(product.id);
            }}
            style={styles.wishlist}
          >
            <Ionicons
              name={favorite ? "heart" : "heart-outline"}
              size={18}
              color={favorite ? palette.red : palette.ink}
            />
          </AnimatedPressable>
        ) : null}
      </View>
      <View
        style={[styles.body, wide && styles.wideBody, grid && styles.gridBody]}
      >
        <View style={styles.metaRow}>
          <Text numberOfLines={1} style={styles.brand}>
            {(product.brand || product.category).toUpperCase()}
          </Text>
          {product.stock > 0 ? (
            <View style={styles.stock}>
              <View style={styles.stockDot} />
              <Text style={styles.stockLabel}>EN STOCK</Text>
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
          ]}
        >
          {displayName}
        </Text>
        <View style={styles.ratingRow}>
          <Rating
            value={product.rating}
            reviews={product.review_count ?? product.reviews ?? 0}
          />
        </View>
        <View style={styles.footer}>
          <Price
            price={product.price}
            oldPrice={product.original_price}
            compact
          />
          <AnimatedPressable
            accessibilityLabel={
              requiresOptions ? "Choisir les options" : "Ajouter au panier"
            }
            accessibilityHint={requiresOptions ? "Ouvre la fiche pour choisir la couleur et la taille" : undefined}
            disabled={product.stock <= 0 || checkingStock}
            onPress={async (event) => {
              event.stopPropagation();
              if (requiresOptions) {
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
                  "Vérification impossible",
                  "Vérifiez votre connexion puis réessayez.",
                );
                setCheckingStock(false);
                return;
              }
              if (!fresh?.active || fresh.stock <= 0) {
                Alert.alert(
                  "Produit épuisé",
                  "Cet article n’est plus disponible pour le moment.",
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
              grid && styles.gridAdd,
              added && styles.addConfirmed,
              (product.stock <= 0 || checkingStock) && styles.disabled,
            ]}
          >
            {checkingStock ? (
              <ActivityIndicator color={palette.white} size="small" />
            ) : added ? (
              <Animated.View entering={ZoomIn.duration(220).springify()}>
                <Ionicons name="checkmark" size={19} color={palette.white} />
              </Animated.View>
            ) : (
              <Ionicons name="add" size={22} color={palette.white} />
            )}
          </AnimatedPressable>
        </View>
      </View>
    </AnimatedPressable>
  );
});

const styles = StyleSheet.create({
  card: {
    width: "48.4%",
    overflow: "hidden",
    padding: 8,
    borderRadius: 22,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: "#E8ECE9",
    shadowColor: palette.ink,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 3,
  },
  wide: {
    width: 272,
    overflow: "visible",
    padding: 0,
    borderWidth: 0,
    borderRadius: 0,
    backgroundColor: "transparent",
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  grid: {
    width: "48.6%",
    overflow: "visible",
    padding: 7,
    borderWidth: 1,
    borderColor: "#E3E8E4",
    borderRadius: 20,
    backgroundColor: palette.white,
    shadowColor: palette.ink,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.055,
    shadowRadius: 12,
    elevation: 2,
  },
  imageWrap: {
    height: 180,
    overflow: "hidden",
    borderRadius: 22,
    backgroundColor: "#EFEFEF",
  },
  wideImage: {
    height: 272,
    borderRadius: 24,
    backgroundColor: "#F3F4F2",
  },
  gridImage: {
    height: 188,
    borderRadius: 15,
    backgroundColor: "#F1F3F1",
  },
  imageFallback: {
    position: "absolute",
    inset: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  imageFallbackText: {
    color: "#8A908C",
    fontFamily: typography.bold,
    fontSize: 8,
    letterSpacing: 1,
  },
  discount: {
    position: "absolute",
    left: 9,
    top: 9,
    minHeight: 27,
    paddingHorizontal: 11,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#E52D2D",
  },
  discountText: {
    color: palette.white,
    fontFamily: typography.black,
    fontSize: 8.5,
    letterSpacing: 0.25,
  },
  newBadge: {
    position: "absolute",
    left: 9,
    top: 9,
    minHeight: 25,
    paddingHorizontal: 9,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "#32CD57",
  },
  newBadgeText: {
    color: "#111111",
    fontFamily: typography.black,
    fontSize: 7,
    letterSpacing: 0.7,
  },
  outOfStock: {
    position: "absolute",
    left: 9,
    bottom: 9,
    minHeight: 25,
    paddingHorizontal: 9,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "rgba(17,17,17,0.88)",
  },
  outOfStockText: {
    color: palette.white,
    fontFamily: typography.black,
    fontSize: 7,
    letterSpacing: 0.7,
  },
  wishlist: {
    position: "absolute",
    right: 9,
    top: 9,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(17,17,17,0.08)",
    backgroundColor: "rgba(255,255,255,0.96)",
    shadowColor: palette.ink,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.11,
    shadowRadius: 9,
    elevation: 2,
  },
  body: { paddingHorizontal: 7, paddingBottom: 5, paddingTop: 13 },
  gridBody: {
    paddingHorizontal: 5,
    paddingTop: 12,
    paddingBottom: 4,
  },
  wideBody: {
    paddingHorizontal: 2,
    paddingBottom: 0,
    paddingTop: 15,
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
    color: palette.green,
    fontFamily: typography.bold,
    fontSize: 8,
    letterSpacing: 1.15,
  },
  stock: { flexDirection: "row", alignItems: "center", gap: 3 },
  stockDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: palette.green,
  },
  stockLabel: {
    color: palette.muted,
    fontFamily: typography.bold,
    fontSize: 6.25,
    letterSpacing: 0.55,
  },
  name: {
    minHeight: 43,
    marginTop: 6,
    color: palette.ink,
    fontFamily: typography.bold,
    fontSize: 14,
    lineHeight: 19,
    letterSpacing: -0.2,
  },
  wideName: {
    minHeight: 46,
    marginTop: 8,
    fontSize: 16,
    lineHeight: 21,
    letterSpacing: -0.35,
  },
  gridName: {
    minHeight: 41,
    marginTop: 7,
    fontSize: 14,
    lineHeight: 19,
    letterSpacing: -0.3,
  },
  ratingRow: { marginTop: 5 },
  footer: {
    minHeight: 49,
    marginTop: 9,
    paddingTop: 9,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E8ECE9",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 5,
  },
  add: {
    width: 42,
    height: 42,
    flexShrink: 0,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.ink,
    shadowColor: palette.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 7,
    elevation: 3,
  },
  gridAdd: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.ink,
    shadowColor: palette.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 7,
    elevation: 3,
  },
  addConfirmed: {
    borderColor: palette.green,
    backgroundColor: palette.green,
    shadowColor: palette.green,
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 3,
  },
  disabled: { opacity: 0.42 },
});
