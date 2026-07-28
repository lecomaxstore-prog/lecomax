import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { memo, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { AnimatedPressable } from "@/components/animated-pressable";
import { Price } from "@/components/price";
import { Rating } from "@/components/rating";
import { palette, typography, ui } from "@/constants/theme";
import { discount, imageUrl } from "@/lib/format";
import type { WishlistVariant } from "@/lib/wishlist-utils";
import type { Product } from "@/types/commerce";

type Props = {
  product: Product;
  selection?: WishlistVariant;
  adding: boolean;
  promotionalLabel?: string;
  onOpen: () => void;
  onRemove: () => void;
  onAdd: () => void;
};

export const WishlistProductCard = memo(function WishlistProductCard({
  product,
  selection,
  adding,
  promotionalLabel,
  onOpen,
  onRemove,
  onAdd,
}: Props) {
  const [imageFailed, setImageFailed] = useState(false);
  const source = imageUrl(product.thumbnail || product.images[0]);
  const saving = discount(product.price, product.original_price);
  const available = product.active !== false && product.stock > 0;
  const variantLabel = [
    selection?.color ? `Couleur : ${selection.color}` : null,
    selection?.size ? `Taille : ${selection.size}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  useEffect(() => setImageFailed(false), [source]);

  return (
    <View style={styles.card}>
      <View style={styles.imageFrame}>
        <AnimatedPressable
          accessibilityLabel={`Voir ${product.name}`}
          accessibilityRole="button"
          haptic={false}
          onPress={onOpen}
          style={styles.imageAction}
        >
        {imageFailed ? (
          <View style={styles.imageFallback}>
            <Ionicons color="#8A8E8B" name="image-outline" size={34} />
            <Text style={styles.imageFallbackText}>IMAGE INDISPONIBLE</Text>
          </View>
        ) : (
          <Image
            accessibilityLabel={product.name}
            cachePolicy="memory-disk"
            contentFit="cover"
            onError={() => setImageFailed(true)}
            recyclingKey={`wishlist-${product.id}`}
            source={source}
            style={StyleSheet.absoluteFill}
            transition={120}
          />
        )}

        {saving > 0 ? (
          <View style={[styles.badge, styles.promotionBadge]}>
            <Text style={styles.promotionText}>-{saving}%</Text>
          </View>
        ) : product.newArrival || product.featured ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {promotionalLabel || "NOUVEAU"}
            </Text>
          </View>
        ) : null}

        {!available ? (
          <View style={styles.stockBadge}>
            <Text style={styles.stockBadgeText}>ÉPUISÉ</Text>
          </View>
        ) : null}

        </AnimatedPressable>

        <AnimatedPressable
          accessibilityLabel={`Retirer ${product.name} des favoris`}
          accessibilityRole="button"
          onPress={(event) => {
            event.stopPropagation();
            onRemove();
          }}
          style={styles.heart}
        >
          <Ionicons color={palette.red} name="heart" size={21} />
        </AnimatedPressable>
      </View>

      <View style={styles.body}>
        <View style={styles.meta}>
          <Text numberOfLines={1} style={styles.category}>
            {product.category.toUpperCase()}
          </Text>
          <View style={styles.stock}>
            <View
              style={[
                styles.stockDot,
                !available && styles.stockDotUnavailable,
              ]}
            />
            <Text style={[styles.stockText, !available && styles.unavailable]}>
              {available ? "EN STOCK" : "INDISPONIBLE"}
            </Text>
          </View>
        </View>

        <AnimatedPressable
          accessibilityLabel={`Ouvrir ${product.name}`}
          accessibilityRole="link"
          haptic={false}
          onPress={onOpen}
          style={styles.nameAction}
        >
          <Text style={styles.name}>{product.name}</Text>
        </AnimatedPressable>

        <View style={styles.rating}>
          <Rating
            reviews={product.review_count ?? product.reviews ?? 0}
            value={product.rating}
          />
          {(product.review_count ?? 0) > 0 ? (
            <Text style={styles.verified}>AVIS VÉRIFIÉS</Text>
          ) : null}
        </View>

        <View style={styles.variantRow}>
          <Ionicons color="#6D736F" name="options-outline" size={15} />
          <Text style={styles.variantText}>
            {variantLabel || "Choisissez votre couleur et votre taille"}
          </Text>
        </View>

        <View style={styles.priceRow}>
          <Price price={product.price} oldPrice={product.original_price} />
        </View>

        <AnimatedPressable
          accessibilityLabel={
            available
              ? `Ajouter ${product.name} au panier`
              : `${product.name} est indisponible`
          }
          accessibilityRole="button"
          disabled={!available || adding}
          onPress={onAdd}
          style={[
            styles.addButton,
            (!available || adding) && styles.addButtonDisabled,
          ]}
        >
          {adding ? (
            <Ionicons
              color={palette.white}
              name="hourglass-outline"
              size={18}
            />
          ) : (
            <Ionicons color={palette.white} name="bag-add-outline" size={19} />
          )}
          <Text style={styles.addButtonText}>
            {adding
              ? "AJOUT EN COURS…"
              : available
                ? "AJOUTER AU PANIER"
                : "ARTICLE INDISPONIBLE"}
          </Text>
        </AnimatedPressable>

        <AnimatedPressable
          accessibilityLabel={`Voir le produit ${product.name}`}
          accessibilityRole="link"
          haptic={false}
          onPress={onOpen}
          style={styles.viewProduct}
        >
          <Text style={styles.viewProductText}>Voir le produit</Text>
          <Ionicons color={palette.ink} name="arrow-forward" size={16} />
        </AnimatedPressable>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#DDDFDC",
    backgroundColor: palette.white,
  },
  imageFrame: {
    height: 316,
    overflow: "hidden",
    backgroundColor: "#ECEDEB",
  },
  imageAction: { flex: 1 },
  imageFallback: {
    position: "absolute",
    inset: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  imageFallbackText: {
    color: "#777C78",
    fontFamily: typography.black,
    fontSize: 8,
    letterSpacing: 1,
  },
  badge: {
    position: "absolute",
    left: 12,
    top: 12,
    minHeight: 27,
    maxWidth: "65%",
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#12B83F",
  },
  badgeText: {
    color: palette.white,
    fontFamily: typography.black,
    fontSize: 8,
    letterSpacing: 0.9,
  },
  promotionBadge: { backgroundColor: palette.red },
  promotionText: {
    color: palette.white,
    fontFamily: typography.black,
    fontSize: 10,
  },
  stockBadge: {
    position: "absolute",
    bottom: 12,
    left: 12,
    minHeight: 27,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(8,8,8,0.88)",
  },
  stockBadgeText: {
    color: palette.white,
    fontFamily: typography.black,
    fontSize: 8,
    letterSpacing: 0.8,
  },
  heart: {
    position: "absolute",
    right: 12,
    top: 12,
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E3E1",
    borderRadius: 23,
    backgroundColor: palette.white,
  },
  body: { padding: 16 },
  meta: {
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  category: {
    minWidth: 0,
    flex: 1,
    color: "#109336",
    fontFamily: typography.black,
    fontSize: 8,
    letterSpacing: 1.1,
  },
  stock: { flexDirection: "row", alignItems: "center", gap: 5 },
  stockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#12B83F",
  },
  stockDotUnavailable: { backgroundColor: palette.red },
  stockText: {
    color: "#3E443F",
    fontFamily: typography.bold,
    fontSize: 7,
    letterSpacing: 0.55,
  },
  unavailable: { color: palette.red },
  nameAction: { minHeight: 44, justifyContent: "center", marginTop: 3 },
  name: {
    color: palette.ink,
    fontFamily: typography.black,
    fontSize: 19,
    lineHeight: 24,
    letterSpacing: -0.45,
  },
  rating: {
    minHeight: 30,
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  verified: {
    color: "#747A76",
    fontFamily: typography.bold,
    fontSize: 6.5,
    letterSpacing: 0.55,
  },
  variantRow: {
    minHeight: 42,
    marginTop: 7,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#E5E6E3",
    backgroundColor: "#F6F6F4",
  },
  variantText: {
    minWidth: 0,
    flex: 1,
    color: "#555B57",
    fontFamily: typography.medium,
    fontSize: 10,
    lineHeight: 15,
  },
  priceRow: { minHeight: 47, justifyContent: "center", marginTop: 6 },
  addButton: {
    minHeight: ui.control.large,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    backgroundColor: palette.ink,
  },
  addButtonDisabled: { opacity: 0.46 },
  addButtonText: {
    color: palette.white,
    fontFamily: typography.black,
    fontSize: 10,
    letterSpacing: 0.75,
  },
  viewProduct: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  viewProductText: {
    color: palette.ink,
    fontFamily: typography.bold,
    fontSize: 10,
    textDecorationLine: "underline",
  },
});
