import { localizedContent } from "@/i18n/content";
import { msg, useLocale } from "@/i18n";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { AnimatedPressable } from "@/components/animated-pressable";
import { Rating } from "@/components/rating";
import { palette, typography } from "@/constants/theme";
import { discount, money } from "@/lib/format";
import { useProductImage } from "@/hooks/use-product-image";
import { requiresWishlistVariant, type WishlistVariant } from "@/lib/wishlist-utils";
import type { Product } from "@/types/commerce";

type Props = {
  product: Product;
  selection?: WishlistVariant;
  adding: boolean;
  promotionalLabel?: string;
  onOpen: () => void;
  onRemove: () => void;
  onAdd: () => void;
  onChoose: () => void;
};

export const WishlistProductCard = memo(function WishlistProductCard({
  product,
  selection,
  adding,
  promotionalLabel,
  onOpen,
  onRemove,
  onAdd,
  onChoose,
}: Props) {
  useLocale();
  const { source, imageFailed, onError: onImageError } = useProductImage(product);
  const saving = discount(product.price, product.original_price);
  const available = product.active !== false && (product.stock > 0 || product.preorder_enabled);
  const variantLabel = [
    selection?.color ? msg("variants.colorValue", { color: selection.color }) : null,
    selection?.size ? msg("variants.sizeValue", { size: selection.size }) : null,
  ]
    .filter(Boolean)
    .join(" · ");


  return (
    <View style={styles.card}>
      <View style={styles.imageFrame}>
        <AnimatedPressable
          accessibilityLabel={msg("product.viewNamed", { name: product.name })}
          accessibilityRole="button"
          haptic={false}
          onPress={onOpen}
          style={styles.imageAction}
        >
        {imageFailed ? (
          <View style={styles.imageFallback}>
            <Ionicons color="#8A8E8B" name="image-outline" size={34} />
            <Text style={styles.imageFallbackText}>{msg("productCard.imageUnavailableUppercase")}</Text>
          </View>
        ) : (
          <Image
            accessibilityLabel={product.name}
            cachePolicy="memory-disk"
            contentFit="cover"
            onError={onImageError}
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
              {promotionalLabel || msg("productCard.newUppercase")}
            </Text>
          </View>
        ) : null}

        {!available ? (
          <View style={styles.stockBadge}>
            <Text style={styles.stockBadgeText}>{msg("homePromotionSection.soldOutUppercase")}</Text>
          </View>
        ) : null}

        </AnimatedPressable>

        <AnimatedPressable
          accessibilityLabel={msg("favorites.removeNamed", { name: product.name })}
          accessibilityRole="button"
          onPress={(event) => {
            event.stopPropagation();
            onRemove();
          }}
          style={styles.heart}
        >
          <Ionicons color="#A55657" name="heart" size={19} />
        </AnimatedPressable>
      </View>

      <View style={styles.body}>
        <View style={styles.meta}>
          <Text numberOfLines={1} style={styles.category}>
            {localizedContent(product.category).toUpperCase()}
          </Text>
          <View style={styles.stock}>
            <View
              style={[
                styles.stockDot,
                !available && styles.stockDotUnavailable,
              ]}
            />
            <Text style={[styles.stockText, !available && styles.unavailable]}>
              {available ? product.stock <= 0 && product.preorder_enabled ? msg("preorder.badge") : msg("homePromotionSection.inStockUppercase") : msg("wishlistProductCard.unavailableUppercase")}
            </Text>
          </View>
        </View>

        <AnimatedPressable
          accessibilityLabel={msg("product.openNamed", { name: product.name })}
          accessibilityRole="link"
          haptic={false}
          onPress={onOpen}
          style={styles.nameAction}
        >
          <Text numberOfLines={2} style={styles.name}>{product.name}</Text>
        </AnimatedPressable>

        {(product.review_count ?? product.reviews ?? 0) > 0 ? <View style={styles.rating}>
          <Rating
            reviews={product.review_count ?? product.reviews ?? 0}
            value={product.rating}
          />
          {(product.review_count ?? 0) > 0 ? (
            <Text style={styles.verified}>{msg("wishlistProductCard.verifiedReviewsUppercase")}</Text>
          ) : null}
        </View> : null}

        {requiresWishlistVariant(product) ? <AnimatedPressable accessibilityRole="button" accessibilityLabel={msg("product.chooseNamedOptions", { name: product.name })} disabled={!available || adding} onPress={onChoose} style={styles.variantRow}>
          <Ionicons color="#6D736F" name="options-outline" size={15} />
          <Text style={styles.variantText}>
            {variantLabel || msg("wishlistProductCard.chooseYourColorAndSize")}
          </Text>
          <Ionicons color="#698066" name="chevron-forward" size={14} />
        </AnimatedPressable> : null}

        <View style={styles.purchaseRow}>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{money(product.price)}</Text>
          {saving > 0 ? <Text style={styles.oldPrice}>{money(product.original_price!)}</Text> : null}
        </View>

        <AnimatedPressable
          accessibilityLabel={
            available
              ? msg("cart.addNamed", { name: product.name })
              : msg("product.namedUnavailable", { name: product.name })
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
              ? msg("wishlistProductCard.addingUppercase")
              : available
                ? msg("common.add")
                : msg("wishlistProductCard.unavailable")}
          </Text>
        </AnimatedPressable>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  oldPrice: {fontFamily:typography.regular,fontSize:10,color:'#A4AA9E',textDecorationLine:'line-through',marginTop:3},
  price: {fontFamily:typography.semibold,fontSize:21,letterSpacing:-.6,color:'#244A34'},
  purchaseRow: {flexDirection:'row',flexWrap:'wrap',alignItems:'center',justifyContent:'space-between',gap:12,marginTop:16,paddingTop:14,borderTopWidth:1,borderTopColor:'#EDF0E8'},
  card: { overflow:'hidden', padding:7, borderWidth:1, borderColor:'#E5E9DF', borderRadius:25, backgroundColor:'#FFFFFF' },
  imageFrame: { aspectRatio:1.45, overflow:'hidden', borderRadius:19, backgroundColor:'#ECEEE7' },
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
  badge: { position:'absolute',left:12,top:12,minHeight:26,maxWidth:'65%',paddingHorizontal:10,alignItems:'center',justifyContent:'center',borderRadius:9,backgroundColor:'#F2F5E9' },
  badgeText: {color:'#4D6649',fontFamily:typography.semibold,fontSize:8,letterSpacing:.8},
  promotionBadge: { backgroundColor:'#F8E9E4' },
  promotionText: {color:'#A34F3C',fontFamily:typography.semibold,fontSize:10},
  stockBadge: {position:'absolute',bottom:12,left:12,minHeight:27,paddingHorizontal:10,alignItems:'center',justifyContent:'center',borderRadius:9,backgroundColor:'rgba(35,48,34,.85)'},
  stockBadgeText: {
    color: palette.white,
    fontFamily: typography.black,
    fontSize: 8,
    letterSpacing: 0.8,
  },
  heart: {position:'absolute',right:11,top:11,width:42,height:42,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:'rgba(255,255,255,.8)',borderRadius:21,backgroundColor:'rgba(255,255,255,.96)'},
  body: { paddingHorizontal:11, paddingTop:16, paddingBottom:11 },
  meta: {
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  category: {minWidth:0,flex:1,color:'#8B9584',fontFamily:typography.semibold,fontSize:8,letterSpacing:1.5},
  stock: {flexDirection:'row',alignItems:'center',gap:4,paddingHorizontal:7,paddingVertical:4,borderRadius:8,backgroundColor:'#F0F5EA'},
  stockDot: {width:4,height:4,borderRadius:2,backgroundColor:'#729A68'},
  stockDotUnavailable: { backgroundColor: palette.red },
  stockText: {color:'#62805A',fontFamily:typography.medium,fontSize:7,letterSpacing:.5},
  unavailable: { color: palette.red },
  nameAction: {minHeight:44,justifyContent:'center',marginTop:7},
  name: {color:'#23382A',fontFamily:typography.medium,fontSize:16,lineHeight:23,letterSpacing:-.35},
  rating: {marginTop:8,flexDirection:'row',alignItems:'center',gap:9},
  verified: {
    color: "#747A76",
    fontFamily: typography.bold,
    fontSize: 6.5,
    letterSpacing: 0.55,
  },
  variantRow: {minHeight:43,marginTop:13,paddingHorizontal:11,flexDirection:'row',alignItems:'center',gap:8,borderWidth:1,borderColor:'#EBEEE5',borderRadius:12,backgroundColor:'#F7F8F3'},
  variantText: {minWidth:0,flex:1,color:'#78836F',fontFamily:typography.regular,fontSize:10,lineHeight:15},
  priceRow: {minHeight:46,justifyContent:'center',flexShrink:0},
  addButton: {minHeight:46,paddingHorizontal:17,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,borderRadius:14,backgroundColor:'#244A34'},
  addButtonDisabled: { opacity: 0.46 },
  addButtonText: {color:palette.white,fontFamily:typography.semibold,fontSize:11,letterSpacing:0},
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
