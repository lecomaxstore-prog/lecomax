import Ionicons from "@expo/vector-icons/Ionicons";
import * as Clipboard from "expo-clipboard";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AnimatedPressable } from "@/components/animated-pressable";
import { useAppViewport } from "@/components/app-viewport";
import { HorizontalRail } from "@/components/horizontal-rail";
import { ProductCard } from "@/components/product-card";
import { ProductGallery } from "@/components/product-gallery";
import { ProductReviews } from "@/components/product-reviews";
import { ShoeSizeGuide } from "@/components/shoe-size-guide";
import { palette, typography } from "@/constants/theme";
import {
  useProducts,
  useReviews,
  useSettings,
} from "@/hooks/use-catalog";
import { discount, imageUrl, money } from "@/lib/format";
import { safeParentPath } from "@/lib/navigation-policy";
import { realSimilarProducts } from "@/lib/product-similarity";
import { useCommerceStore } from "@/stores/commerce";
import { useCartFeedbackStore } from "@/stores/cart-feedback";
import { getFreshProduct } from "@/services/catalog";

const PRODUCT_BACKGROUND = "#FFFFFF";
const PRODUCT_BORDER = "#E8E5DF";
const PRODUCT_SHARE_ORIGIN = "https://lecomax.com";

const COLOR_IMAGE_TOKENS: Record<string, string[]> = {
  beige: ["beige", "nude", "camel"],
  blanc: ["blanc", "white", "cream", "creme"],
  bleu: ["bleu", "blue"],
  gris: ["gris", "gray", "grey"],
  jaune: ["jaune", "yellow"],
  kaki: ["kaki", "khaki"],
  noir: ["noir", "black"],
  rose: ["rose", "pink"],
  rouge: ["rouge", "red"],
  vert: ["vert", "green"],
};

function normalize(value: string) {
  return value
    .toLocaleLowerCase("fr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function findColorImageIndex(
  images: string[],
  colors: string[] | undefined,
  value: string,
) {
  const tokens = COLOR_IMAGE_TOKENS[normalize(value)] ?? [normalize(value)];
  const index = images.findIndex((uri) => {
    let filename = uri;
    try {
      filename = decodeURIComponent(uri);
    } catch {
      // Legacy media paths can contain malformed URL escapes.
    }
    const normalizedFilename = normalize(filename);
    return tokens.some((token) => normalizedFilename.includes(token));
  });
  return index >= 0 ? index : Math.max(0, colors?.indexOf(value) ?? 0);
}

function Accordion({
  title,
  children,
  initiallyOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  initiallyOpen?: boolean;
}) {
  const [open, setOpen] = useState(initiallyOpen);
  const icon = title === "Description"
    ? "document-text-outline"
    : title === "Livraison"
      ? "car-outline"
      : "information-circle-outline";
  return (
    <View style={[styles.accordion, open && styles.accordionOpen]}>
      <AnimatedPressable
        accessibilityLabel={`${open ? "Fermer" : "Ouvrir"} ${title}`}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((value) => !value)}
        style={styles.accordionHeader}
      >
        <View style={styles.accordionHeading}>
          <View style={[styles.accordionIcon, open && styles.accordionIconOpen]}>
            <Ionicons name={icon} size={18} color={open ? "#16883A" : "#5F6560"} />
          </View>
          <Text style={styles.accordionTitle}>{title}</Text>
        </View>
        <View style={[styles.accordionToggle, open && styles.accordionToggleOpen]}>
          <Ionicons
            name={open ? "chevron-up" : "chevron-down"}
            size={17}
            color={open ? "#16883A" : palette.ink}
          />
        </View>
      </AnimatedPressable>
      {open ? <View style={styles.accordionBody}>{children}</View> : null}
    </View>
  );
}

function LoadingState() {
  return (
    <View style={styles.stateScreen}>
      <View style={styles.loadingGallery}>
        <ActivityIndicator color="#16883A" />
      </View>
      <View style={styles.loadingLine} />
      <View style={[styles.loadingLine, { width: "64%" }]} />
      <Text style={styles.stateText}>Chargement du produit…</Text>
    </View>
  );
}

export default function ProductScreen() {
  const insets = useSafeAreaInsets();
  const { contentWidth, horizontalInset } = useAppViewport();
  const { slug, origin, parentCategory } = useLocalSearchParams<{
    slug: string;
    origin?: string;
    parentCategory?: string;
  }>();
  const productsQuery = useProducts();
  const all = productsQuery.data ?? [];
  const product = all.find((item) => item.slug === slug);
  const { isLoading, error, refetch } = productsQuery;
  const { data: settings = [] } = useSettings();
  const reviewsQuery = useReviews(slug);
  const reviews = reviewsQuery.data ?? [];
  const addToCart = useCommerceStore((state) => state.addToCart);
  const toggleWishlist = useCommerceStore((state) => state.toggleWishlist);
  const wishlist = useCommerceStore((state) => state.wishlist);
  const cart = useCommerceStore((state) => state.cart);
  const view = useCommerceStore((state) => state.view);
  const startCartFlight = useCartFeedbackStore((state) => state.startFlight);
  const pageRef = useRef<ScrollView>(null);
  const successTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const [color, setColor] = useState<string>();
  const [size, setSize] = useState<string>();
  const [galleryImageIndex, setGalleryImageIndex] = useState<number>();
  const [gallerySelectionVersion, setGallerySelectionVersion] = useState(0);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(
      safeParentPath(`/product/${slug}`, {
        origin,
        parentCategory: parentCategory || product?.category,
      }) as never,
    );
  }, [origin, parentCategory, product?.category, slug]);

  useEffect(() => {
    if (product) view(product);
  }, [product, view]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setColor(undefined);
      setSize(undefined);
      setQuantity(1);
      setGalleryImageIndex(undefined);
    });
    return () => cancelAnimationFrame(frame);
  }, [slug]);

  useEffect(
    () => () => {
      if (successTimer.current) clearTimeout(successTimer.current);
    },
    [],
  );

  if (isLoading) return <LoadingState />;

  if (error || !product) {
    return (
      <View style={styles.stateScreen}>
        <View style={styles.errorIcon}>
          <Ionicons name="cloud-offline-outline" size={29} color="#16883A" />
        </View>
        <Text style={styles.stateTitle}>
          {product ? "Connexion interrompue" : "Produit introuvable"}
        </Text>
        <Text style={styles.stateText}>
          Vérifiez votre connexion puis réessayez.
        </Text>
        <AnimatedPressable
          accessibilityLabel="Réessayer de charger le produit"
          onPress={() => void refetch()}
          style={styles.retryButton}
        >
          <Text style={styles.retryText}>RÉESSAYER</Text>
        </AnimatedPressable>
      </View>
    );
  }

  const settingsMap = Object.fromEntries(
    settings.map((setting) => [setting.key, String(setting.value ?? "")]),
  );
  const wishlistEnabled = settingsMap.enable_wishlist === "true";
  const reviewsEnabled = settingsMap.enable_reviews !== "false";
  const outOfStockColors = product.out_of_stock_colors ?? [];
  const outOfStockSizes = product.out_of_stock_sizes ?? [];
  const defaultColor =
    product.colors?.find((item) => !outOfStockColors.includes(item)) ??
    product.colors?.[0];
  const selectedColor =
    color && product.colors?.includes(color) ? color : defaultColor;
  const selectedColorOutOfStock = Boolean(
    selectedColor && outOfStockColors.includes(selectedColor),
  );
  const colorSizes = product.color_sizes;
  const sizesForColor = (value?: string) =>
    (value && outOfStockColors.includes(value)
      ? []
      : (value && colorSizes?.[value]) || product.sizes || []
    ).filter((item) => !outOfStockSizes.includes(item));
  const availableSizes = sizesForColor(selectedColor);
  const selectedSize =
    size && availableSizes.includes(size) ? size : availableSizes[0];
  const requiresSize = Boolean(
    product.sizes?.length &&
    !(product.sizes.length === 1 && product.sizes[0] === "Taille unique"),
  );
  const selectedColorStock = selectedColor
    ? Number(product.color_stock?.[selectedColor])
    : Number.NaN;
  const availableStock = Math.max(
    0,
    Number.isFinite(selectedColorStock)
      ? Math.min(product.stock, selectedColorStock)
      : product.stock,
  );
  const maximumQuantity = Math.max(1, Math.min(availableStock, 20));
  const selectionUnavailable =
    !product.active ||
    availableStock <= 0 ||
    selectedColorOutOfStock ||
    (requiresSize && !selectedSize);
  const images = product.images?.length ? product.images : [undefined];
  const selectedPricing = selectedColor ? product.color_prices?.[selectedColor] : undefined;
  const selectedPrice = selectedPricing?.price ?? product.price;
  const selectedOriginalPrice = selectedPricing?.originalPrice ?? product.original_price;
  const saving = discount(selectedPrice, selectedOriginalPrice);
  const isFavorite = wishlist.includes(product.id);
  const reviewCount = product.review_count ?? reviews.length;
  const description = product.description?.trim() || "";
  const related = realSimilarProducts(product, all, 8);
  const currency = settingsMap.currency?.trim().toUpperCase() || "MAD";
  const deliveryLabel =
    settingsMap.checkout_trust_delivery?.trim() ||
    `Livraison ${settingsMap.shipping_estimated_days?.trim() || "2–5 jours ouvrables"}`;
  const shareProduct = async () => {
    const productUrl = `${PRODUCT_SHARE_ORIGIN}/produit/${encodeURIComponent(product.slug)}/`;
    const currentPrice = money(selectedPrice, currency);
    const originalPrice =
      selectedOriginalPrice && selectedOriginalPrice > selectedPrice
        ? money(selectedOriginalPrice, currency)
        : undefined;
    const title = `${product.name} — ${currentPrice} | L'ecomax`;
    const priceLine = originalPrice
      ? `Prix : ${currentPrice} au lieu de ${originalPrice} · Économisez ${saving}%`
      : `Prix : ${currentPrice}`;
    const message = [
      `Découvrez ${product.name} chez L'ecomax.`,
      priceLine,
      "Livraison partout au Maroc · Paiement à la livraison.",
    ].join("\n");
    const completeMessage = `${message}\n\nVoir le produit : ${productUrl}`;

    try {
      if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title, text: message, url: productUrl });
        return;
      }

      await Share.share({
        title,
        message: Platform.OS === "ios" ? message : completeMessage,
        url: productUrl,
      });
    } catch (reason) {
      if (reason instanceof Error && reason.name === "AbortError") return;
      try {
        await Clipboard.setStringAsync(completeMessage);
        Alert.alert("Lien copié", "Le produit, son prix et son lien sont prêts à être partagés.");
      } catch {
        Alert.alert("Partage indisponible", "Impossible de partager ce produit pour le moment.");
      }
    }
  };
  const selectColor = (value: string) => {
    if (outOfStockColors.includes(value)) return;
    const imageIndex = findColorImageIndex(product.images, product.colors, value);
    setColor(value);
    setSize(sizesForColor(value)[0]);
    setQuantity(1);
    setGalleryImageIndex(imageIndex);
    setGallerySelectionVersion((version) => version + 1);
    requestAnimationFrame(() => {
      pageRef.current?.scrollTo({ y: 0, animated: true });
    });
  };

  const addSelectedQuantity = async (origin?: { originX: number; originY: number }) => {
    if (isAdding) return;
    if (selectionUnavailable) {
      Alert.alert(
        "Sélection indisponible",
        requiresSize && !selectedSize
          ? "Choisissez une taille disponible."
          : "Cette variante est actuellement épuisée.",
      );
      return;
    }
    setIsAdding(true);
    try {
      const fresh = await getFreshProduct(slug);
      if (!fresh?.active) throw new Error("Ce produit n’est plus disponible.");
      const freshColorStock = selectedColor
        ? Number(fresh.color_stock?.[selectedColor])
        : Number.NaN;
      const freshStock = Number.isFinite(freshColorStock)
        ? Math.min(fresh.stock, freshColorStock)
        : fresh.stock;
      if (
        freshStock < quantity ||
        fresh.out_of_stock_colors?.includes(selectedColor ?? "")
      ) {
        throw new Error(
          "Le stock vient de changer. Choisissez une quantité disponible.",
        );
      }
      if (
        requiresSize &&
        (!selectedSize || fresh.out_of_stock_sizes?.includes(selectedSize))
      ) {
        throw new Error("La taille choisie n’est plus disponible.");
      }
      const freshPricing = selectedColor ? fresh.color_prices?.[selectedColor] : undefined;
      addToCart({
        ...fresh,
        price: freshPricing?.price ?? fresh.price,
        original_price: freshPricing?.originalPrice ?? fresh.original_price,
      }, { color: selectedColor, size: selectedSize, quantity });
      if (origin) {
        const selectedImageIndex = selectedColor
          ? findColorImageIndex(fresh.images, fresh.colors, selectedColor)
          : 0;
        startCartFlight({
          image:
            fresh.images[selectedImageIndex] ||
            fresh.thumbnail ||
            fresh.images[0],
          originX: origin.originX,
          originY: origin.originY,
          targetX:
            horizontalInset +
            contentWidth -
            (wishlistEnabled ? 88 : 36),
          targetY: Math.max(insets.top + 6, 12) + 22,
        });
      }
      setAdded(true);
      if (successTimer.current) clearTimeout(successTimer.current);
      successTimer.current = setTimeout(() => setAdded(false), 1800);
    } catch (reason) {
      Alert.alert(
        "Ajout impossible",
        reason instanceof Error
          ? reason.message
          : "Vérifiez votre connexion puis réessayez.",
      );
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        ref={pageRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 112 + insets.bottom }}
      >
        <ProductGallery
          images={images}
          video={product.video}
          selectedImageIndex={
            galleryImageIndex ??
            (selectedColor
              ? findColorImageIndex(
                  product.images,
                  product.colors,
                  selectedColor,
                )
              : undefined)
          }
          selectionVersion={gallerySelectionVersion}
          productName={product.name}
          favorite={isFavorite}
          wishlistEnabled={wishlistEnabled}
          cartCount={cart.reduce((total, line) => total + line.quantity, 0)}
          onBack={goBack}
          onOpenCart={() => router.push("/cart")}
          onToggleFavorite={() =>
            toggleWishlist(product.id, {
              color: selectedColor,
              size: selectedSize,
            })
          }
        />

        <View style={[styles.content, { width: contentWidth }]}>
          <View style={styles.categoryRow}>
            <View style={styles.collectionLabel}>
              <Text style={styles.category}>{product.brand || product.category}</Text>
            </View>
            <View style={[styles.stockBadge, selectionUnavailable && styles.stockBadgeUnavailable]}>
              <View style={[styles.stockDot, selectionUnavailable && styles.stockDotUnavailable]} />
              <Text style={[styles.stockText, selectionUnavailable && styles.stockTextUnavailable]}>
                {selectionUnavailable ? "Indisponible" : "En stock"}
              </Text>
            </View>
          </View>
          <Text
            maxFontSizeMultiplier={1.15}
            selectable
            style={[
              styles.productName,
              contentWidth <= 360 && styles.productNameCompact,
            ]}
          >
            {product.name}
          </Text>
          <View style={styles.priceCard}>
            <View style={styles.priceRow}>
              <Text style={[styles.price, saving > 0 && styles.promotionalPrice]}>
                {money(selectedPrice, currency)}
              </Text>
              {selectedOriginalPrice &&
              selectedOriginalPrice > selectedPrice ? (
                <View style={styles.originalPriceGroup}>
                  <Text style={styles.originalPrice}>
                    {money(selectedOriginalPrice, currency)}
                  </Text>
                </View>
              ) : null}
              {saving > 0 ? (
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>−{saving} %</Text>
                </View>
              ) : null}
            </View>
            {saving > 0 && selectedOriginalPrice ? (
              <View style={styles.savingsRow}>
                <Text style={styles.savingsText}>
                  Vous économisez {money(selectedOriginalPrice - selectedPrice, currency)}
                </Text>
              </View>
            ) : null}
          </View>

          {product.colors?.length ? (
            <View style={styles.variantSection}>
              <View style={styles.variantHeading}>
                <Text style={styles.sectionTitle}>Couleur</Text>
                <Text style={styles.selectedVariant}>{selectedColor}</Text>
              </View>
              <View style={styles.colors}>
                {product.colors.map((item) => {
                  const selected = item === selectedColor;
                  const unavailable = outOfStockColors.includes(item);
                  const variantImage =
                    product.images[
                      findColorImageIndex(product.images, product.colors, item)
                    ];
                  return (
                    <AnimatedPressable
                      key={item}
                      accessibilityLabel={`${item}${selected ? ", sélectionnée" : ""}${unavailable ? ", épuisée" : ""}`}
                      accessibilityState={{ selected, disabled: unavailable }}
                      disabled={unavailable}
                      onPress={() => selectColor(item)}
                      style={styles.colorOption}
                    >
                      <View
                        style={[
                          styles.colorImageShell,
                          selected && styles.colorImageSelected,
                          unavailable && styles.unavailable,
                        ]}
                      >
                        {variantImage ? (
                          <Image
                            source={imageUrl(variantImage)}
                            contentFit="contain"
                            cachePolicy="memory-disk"
                            style={styles.colorImage}
                          />
                        ) : (
                          <Ionicons
                            name="image-outline"
                            size={22}
                            color="#999B98"
                          />
                        )}
                        {selected ? (
                          <View style={styles.selectedCheck}>
                            <Ionicons
                              name="checkmark"
                              size={13}
                              color={palette.white}
                            />
                          </View>
                        ) : null}
                        {unavailable ? (
                          <View style={styles.unavailableLine} />
                        ) : null}
                      </View>
                      <Text
                        style={[
                          styles.colorLabel,
                          selected && styles.colorLabelSelected,
                        ]}
                      >
                        {item}
                      </Text>
                    </AnimatedPressable>
                  );
                })}
              </View>
            </View>
          ) : null}

          {requiresSize ? (
            <View style={styles.variantSection}>
              <View style={styles.sizeHeading}>
                <View style={styles.variantHeading}>
                  <Text style={styles.sectionTitle}>Taille</Text>
                  <Text style={styles.selectedVariant}>{selectedSize ? `· ${selectedSize}` : "· À choisir"}</Text>
                </View>
                <AnimatedPressable
                  accessibilityLabel="Ouvrir le guide des tailles"
                  onPress={() => setSizeGuideOpen(true)}
                  style={styles.guideButton}
                >
                  <Ionicons name="resize-outline" size={14} color="#626D5F" />
                  <Text style={styles.guideText}>Guide des tailles</Text>
                </AnimatedPressable>
              </View>
              <View style={styles.sizes}>
                {product.sizes?.map((item) => {
                  const selected = item === selectedSize;
                  const unavailable = !availableSizes.includes(item);
                  return (
                    <AnimatedPressable
                      key={item}
                      accessibilityLabel={`Taille ${item}${selected ? ", sélectionnée" : ""}${unavailable ? ", épuisée" : ""}`}
                      accessibilityState={{ selected, disabled: unavailable }}
                      disabled={unavailable}
                      onPress={() => {
                        setSize(item);
                        setQuantity(1);
                      }}
                      style={[
                        styles.sizeOption,
                        selected && styles.sizeSelected,
                        unavailable && styles.sizeUnavailable,
                      ]}
                    >
                      <Text
                        style={[
                          styles.sizeText,
                          selected && styles.sizeTextSelected,
                          unavailable && styles.sizeTextUnavailable,
                        ]}
                      >
                        {item}
                      </Text>
                      {unavailable ? <Text style={styles.sizeStatus}>Épuisé</Text> : selected ? (
                        <View style={styles.sizeCheck}>
                          <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                        </View>
                      ) : null}
                    </AnimatedPressable>
                  );
                })}
              </View>
            </View>
          ) : null}

          <View style={styles.quantitySection}>
            <Text style={styles.sectionTitle}>Quantité</Text>
            <View style={styles.quantity}>
              <Pressable
                accessibilityLabel="Réduire la quantité"
                disabled={quantity <= 1 || isAdding}
                onPress={() => setQuantity((value) => Math.max(1, value - 1))}
                style={({ pressed }) => [
                  styles.quantityButton,
                  pressed && styles.quantityButtonPressed,
                ]}
              >
                <Ionicons
                  name="remove"
                  size={21}
                  color={quantity <= 1 ? "#B8BAB8" : palette.ink}
                />
              </Pressable>
              <Text accessibilityLabel={`Quantité ${quantity}`} style={styles.quantityValue}>
                {quantity}
              </Text>
              <Pressable
                accessibilityLabel="Augmenter la quantité"
                disabled={quantity >= maximumQuantity || selectionUnavailable || isAdding}
                onPress={() => setQuantity((value) => Math.min(maximumQuantity, value + 1))}
                style={({ pressed }) => [
                  styles.quantityButton,
                  pressed && styles.quantityButtonPressed,
                ]}
              >
                <Ionicons
                  name="add"
                  size={21}
                  color={quantity >= maximumQuantity || selectionUnavailable ? "#B8BAB8" : palette.ink}
                />
              </Pressable>
            </View>
          </View>

          <View style={styles.ratingShareRow}>
            <View style={styles.ratingGroup}>
              <Ionicons
                name={reviewCount > 0 ? "star" : "star-outline"}
                size={15}
                color={reviewCount > 0 ? "#C49A00" : "#8B8E8A"}
              />
              {reviewCount > 0 ? (
                <>
                  <Text style={styles.ratingValue}>
                    {Number(product.rating ?? 0).toFixed(1)}
                  </Text>
                  <View style={styles.ratingDivider} />
                  <Text style={styles.reviewCount}>
                    {reviewCount} avis vérifié{reviewCount === 1 ? "" : "s"}
                  </Text>
                </>
              ) : (
                <Text style={styles.noReviews}>Aucun avis</Text>
              )}
            </View>
            <AnimatedPressable
              accessibilityLabel="Partager ce produit"
              accessibilityRole="button"
              onPress={() => void shareProduct()}
              pressedScale={0.96}
              style={styles.shareButton}
            >
              <Ionicons name="share-social-outline" size={16} color="#397A4D" />
              <Text style={styles.shareText}>Partager</Text>
            </AnimatedPressable>
          </View>

          <View style={styles.trustRow}>
            <View style={styles.trustItem}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#16883A" />
              <Text numberOfLines={2} style={styles.trustText}>
                Produit authentique
              </Text>
            </View>
            <View style={styles.trustDivider} />
            <View style={styles.trustItem}>
              <Ionicons name="location-outline" size={20} color="#16883A" />
              <Text numberOfLines={2} style={styles.trustText}>
                Livraison partout au Maroc
              </Text>
            </View>
          </View>

          <View style={styles.accordions}>
            {description ? (
              <Accordion title="Description" initiallyOpen>
                <Text style={styles.accordionText}>{description}</Text>
              </Accordion>
            ) : null}
            <Accordion title="Détails du produit">
              <View style={styles.detailLine}>
                <Text style={styles.detailLabel}>Catégorie</Text>
                <Text style={styles.detailValue}>{product.category}</Text>
              </View>
              {product.brand ? (
                <View style={styles.detailLine}>
                  <Text style={styles.detailLabel}>Marque</Text>
                  <Text style={styles.detailValue}>{product.brand}</Text>
                </View>
              ) : null}
              <View style={styles.detailLine}>
                <Text style={styles.detailLabel}>Référence</Text>
                <Text selectable style={styles.detailValue}>
                  {product.sku || product.id.slice(0, 12).toUpperCase()}
                </Text>
              </View>
              <View style={styles.detailLine}>
                <Text style={styles.detailLabel}>Disponibilité</Text>
                <Text style={styles.detailValue}>
                  {availableStock > 0 ? `${availableStock} en stock` : "Épuisé"}
                </Text>
              </View>
            </Accordion>
            <Accordion title="Livraison">
              <Text style={styles.accordionText}>{deliveryLabel}</Text>
              <Text style={[styles.accordionText, { marginTop: 8 }]}>
                Retrouvez les frais et le délai de livraison pour votre ville
                avant de confirmer votre commande.
              </Text>
            </Accordion>
          </View>
        </View>

        <ShoeSizeGuide
          open={sizeGuideOpen}
          onClose={() => setSizeGuideOpen(false)}
          availableSizes={availableSizes}
          selectedSize={selectedSize}
          onSelectSize={setSize}
        />

        {reviewsEnabled ? (
          <View
            style={{ width: contentWidth, alignSelf: "center" }}
          >
            {reviewsQuery.isError ? (
              <View style={styles.reviewError}>
                <Text style={styles.reviewErrorText}>
                  Impossible de charger les avis.
                </Text>
                <AnimatedPressable
                  accessibilityLabel="Réessayer de charger les avis"
                  onPress={() => void reviewsQuery.refetch()}
                  style={styles.reviewRetry}
                >
                  <Text style={styles.reviewRetryText}>RÉESSAYER</Text>
                </AnimatedPressable>
              </View>
            ) : (
              <ProductReviews
                slug={product.slug}
                reviews={reviews}
                productRating={Number(product.rating ?? 0)}
                productReviewCount={reviewCount}
                selectedColor={selectedColor}
                onSubmitted={reviewsQuery.refetch}
              />
            )}
          </View>
        ) : null}

        {related.length ? (
          <View style={[styles.related, { width: contentWidth }]}>
            <Text style={styles.relatedTitle}>Vous aimerez aussi</Text>
            <Text style={styles.relatedSubtitle}>À découvrir dans le même esprit.</Text>
            <HorizontalRail
              snapToInterval={254}
              snapToAlignment="start"
              disableIntervalMomentum
              style={{ marginTop: 18 }}
              contentContainerStyle={{
                gap: 14,
                paddingRight: 30,
                alignItems: "stretch",
              }}
            >
              {related.map((item) => (
                <ProductCard key={item.id} product={item} wide related />
              ))}
            </HorizontalRail>
          </View>
        ) : null}
      </ScrollView>

      <View
        style={[
          styles.purchaseBar,
          { paddingBottom: Math.max(insets.bottom, 9) },
        ]}
      >
        <View
          style={[
            styles.purchasePrice,
            contentWidth <= 340 && styles.purchasePriceCompact,
          ]}
        >
          <Text style={styles.purchasePriceLabel}>PRIX</Text>
          <Text
            numberOfLines={1}
            style={[styles.purchasePriceValue, saving > 0 && styles.promotionalPrice]}
          >
            {money(selectedPrice, currency)}
          </Text>
        </View>
        <AnimatedPressable
          accessibilityLabel={
            selectionUnavailable ? "Produit indisponible" : "Ajouter au panier"
          }
          accessibilityState={{ disabled: selectionUnavailable || isAdding }}
          disabled={selectionUnavailable || isAdding}
          onPress={(event) =>
            void addSelectedQuantity({
              originX: event.nativeEvent.pageX,
              originY: event.nativeEvent.pageY,
            })
          }
          pressedScale={0.985}
          style={[
            styles.addButton,
            contentWidth <= 340 && styles.addButtonCompact,
            (selectionUnavailable || isAdding) && styles.addButtonDisabled,
          ]}
        >
          {isAdding ? (
            <ActivityIndicator color={palette.white} />
          ) : (
            <>
              <View
                style={[
                  styles.addButtonIcon,
                  contentWidth <= 340 && styles.addButtonIconCompact,
                ]}
              >
                <Ionicons
                  name={added ? "checkmark" : "bag-handle-outline"}
                  size={18}
                  color={palette.white}
                />
              </View>
              <Text
                numberOfLines={1}
                style={[
                  styles.addButtonText,
                  contentWidth <= 340 && styles.addButtonTextCompact,
                ]}
              >
                {added
                  ? "Ajouté au panier"
                  : selectionUnavailable
                    ? "Indisponible"
                    : "Ajouter au panier"}
              </Text>
            </>
          )}
        </AnimatedPressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: PRODUCT_BACKGROUND },
  stateScreen: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PRODUCT_BACKGROUND,
  },
  loadingGallery: {
    width: "100%",
    maxWidth: 520,
    aspectRatio: 0.98,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    backgroundColor: "#F0ECE6",
  },
  loadingLine: {
    width: "82%",
    height: 18,
    marginTop: 20,
    borderRadius: 9,
    backgroundColor: "#E9E5DF",
  },
  errorIcon: {
    width: 68,
    height: 68,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: "#EAF5ED",
  },
  stateTitle: {
    marginTop: 18,
    color: palette.ink,
    fontFamily: typography.black,
    fontSize: 21,
  },
  stateText: {
    marginTop: 9,
    color: "#686B68",
    fontFamily: typography.regular,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
  retryButton: {
    minHeight: 48,
    marginTop: 20,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    backgroundColor: palette.ink,
  },
  retryText: {
    color: palette.white,
    fontFamily: typography.black,
    fontSize: 9,
    letterSpacing: 1,
  },
  content: {
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    backgroundColor: PRODUCT_BACKGROUND,
  },
  categoryRow: {
    minHeight: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  collectionLabel: {
    minWidth: 0,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  collectionDivider: {
    width: 22,
    height: 1.5,
    backgroundColor: "#16883A",
  },
  category: {
    color: "#697267",
    fontFamily: typography.bold,
    fontSize: 10,
    letterSpacing: 1.25,
    textTransform: "uppercase",
  },
  stockBadge: {
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#F0F5ED",
  },
  stockBadgeUnavailable: { opacity: 0.8 },
  stockDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#16883A" },
  stockDotUnavailable: { backgroundColor: "#A83A3F" },
  stockText: {
    color: "#16883A",
    fontFamily: typography.bold,
    fontSize: 10,
  },
  stockTextUnavailable: { color: "#A83A3F" },
  shareButton: {
    minHeight: 44,
    paddingHorizontal: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 7,
    borderRadius: 22,
    backgroundColor: "#F4F6F0",
  },
  shareText: {
    color: "#505652",
    fontFamily: typography.semibold,
    fontSize: 10.5,
    letterSpacing: 0.1,
  },
  productName: {
    maxWidth: 680,
    marginTop: 13,
    color: "#171A18",
    fontFamily: typography.semibold,
    fontSize: 26,
    lineHeight: 33,
    letterSpacing: -0.8,
  },
  productNameCompact: { fontSize: 24, lineHeight: 30, letterSpacing: -0.6 },
  ratingShareRow: {
    minHeight: 50,
    marginTop: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.07)",
  },
  ratingGroup: { minWidth: 0, flex: 1, flexDirection: "row", alignItems: "center", gap: 7 },
  ratingValue: {
    color: palette.ink,
    fontFamily: typography.black,
    fontSize: 12,
  },
  ratingDivider: { width: 1, height: 17, marginHorizontal: 2, backgroundColor: "#CFCAC2" },
  reviewCount: {
    color: "#81837F",
    fontFamily: typography.regular,
    fontSize: 10,
  },
  noReviews: {
    color: "#696D69",
    fontFamily: typography.semibold,
    fontSize: 10.5,
  },
  descriptionBlock: {
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#DCD9D3",
  },
  shortDescription: {
    maxWidth: 650,
    color: "#606560",
    fontFamily: typography.regular,
    fontSize: 13,
    lineHeight: 19.5,
  },
  descriptionToggle: {
    minHeight: 40,
    marginTop: 7,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  descriptionToggleText: {
    color: "#303530",
    fontFamily: typography.semibold,
    fontSize: 11,
  },
  descriptionToggleIcon: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#EAF6ED",
  },
  priceCard: {
    marginTop: 12,
    marginBottom: 2,
    paddingBottom: 22,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.07)",
    backgroundColor: "transparent",
  },
  priceHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  priceEyebrow: {
    color: "#747773",
    fontFamily: typography.black,
    fontSize: 8.5,
    letterSpacing: 1.2,
  },
  deliveryTag: { flexDirection: "row", alignItems: "center", gap: 5 },
  deliveryTagText: {
    color: "#397A4D",
    fontFamily: typography.bold,
    fontSize: 7.5,
    letterSpacing: 0.7,
  },
  priceRow: {
    minHeight: 45,
    marginTop: 0,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 11,
  },
  price: {
    color: "#171A18",
    fontFamily: typography.bold,
    fontSize: 27,
    letterSpacing: -0.7,
  },
  promotionalPrice: {
    color: "#183D29",
  },
  originalPriceGroup: {
    alignItems: "flex-start",
    justifyContent: "center",
    gap: 1,
  },
  originalPriceLabel: {
    color: "#979A97",
    fontFamily: typography.medium,
    fontSize: 8,
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  originalPrice: {
    color: "#93988F",
    fontFamily: typography.regular,
    fontSize: 14,
    textDecorationLine: "line-through",
  },
  discountBadge: {
    minHeight: 26,
    paddingHorizontal: 9,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 7,
    backgroundColor: "#EEF4E8",
  },
  discountText: {
    color: "#3C6540",
    fontFamily: typography.semibold,
    fontSize: 11,
  },
  savingsRow: {
    minHeight: 20,
    marginTop: 3,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  savingsText: {
    color: "#778171",
    fontFamily: typography.regular,
    fontSize: 11,
  },
  variantSection: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: PRODUCT_BORDER,
  },
  sectionTitle: {
    color: palette.ink,
    fontFamily: typography.semibold,
    fontSize: 14,
  },
  variantHeading: { flexDirection: "row", alignItems: "center", gap: 10 },
  selectedVariant: { color: "#7A8276", fontFamily: typography.regular, fontSize: 12 },
  colors: { marginTop: 14, flexDirection: "row", flexWrap: "wrap", gap: 12 },
  colorOption: { width: 72, alignItems: "center" },
  colorImageShell: {
    width: 68,
    height: 76,
    padding: 6,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E3E7DF",
    borderRadius: 14,
    backgroundColor: "#F7F8F4",
  },
  colorImageSelected: { borderWidth: 1.5, borderColor: "#315D3C" },
  colorImage: { width: "100%", height: "100%", borderRadius: 8 },
  selectedCheck: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 21,
    height: 21,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: PRODUCT_BACKGROUND,
    borderRadius: 11,
    backgroundColor: "#315D3C",
  },
  unavailable: { opacity: 0.45 },
  unavailableLine: {
    position: "absolute",
    width: 78,
    height: 1,
    backgroundColor: "#8C8D8B",
    transform: [{ rotate: "-45deg" }],
  },
  colorLabel: {
    marginTop: 8,
    color: "#686B68",
    fontFamily: typography.medium,
    fontSize: 11,
    textAlign: "center",
  },
  colorLabelSelected: { color: palette.ink, fontFamily: typography.bold },
  sizeHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  guideButton: {
    minHeight: 44,
    paddingHorizontal: 6,
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  guideText: {
    color: "#626D5F",
    fontFamily: typography.medium,
    fontSize: 11,
  },
  sizes: { marginTop: 10, flexDirection: "row", flexWrap: "wrap", gap: 10 },
  sizeOption: {
    minWidth: 76,
    minHeight: 58,
    paddingHorizontal: 18,
    paddingVertical: 12,
    gap: 3,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E0E5DA",
    borderRadius: 14,
    backgroundColor: palette.white,
  },
  sizeSelected: { borderColor: "#426A45", backgroundColor: "#EFF5E9" },
  sizeUnavailable: { backgroundColor: "#F7F8F5", borderColor: "#ECEFE7" },
  sizeText: { color: palette.ink, fontFamily: typography.semibold, fontSize: 14 },
  sizeTextSelected: { color: "#23482D" },
  sizeTextUnavailable: { color: "#939B8B" },
  sizeStatus: { color: "#969E8F", fontFamily: typography.regular, fontSize: 9 },
  sizeCheck: { position: "absolute", top: 5, right: 5, width: 14, height: 14, borderRadius: 7, alignItems: "center", justifyContent: "center", backgroundColor: "#426A45" },
  trustRow: {
    minHeight: 64,
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: "#F5F7F1",
    flexDirection: "row",
    alignItems: "center",
  },
  trustItem: {
    minWidth: 0,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  trustDivider: {
    width: 1,
    height: 24,
    marginHorizontal: 12,
    backgroundColor: "#E1E7DA",
  },
  trustText: {
    minWidth: 0,
    flex: 1,
    color: "#3E423F",
    fontFamily: typography.medium,
    fontSize: 11,
    lineHeight: 16,
  },
  quantitySection: {
    paddingVertical: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: PRODUCT_BORDER,
  },
  accordions: {
    marginTop: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E3E7DE",
  },
  accordion: {
    overflow: "hidden",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E3E7DE",
    backgroundColor: "#FFFFFF",
  },
  accordionOpen: {
    backgroundColor: "#FFFFFF",
  },
  accordionHeader: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  accordionHeading: { minWidth: 0, flex: 1, flexDirection: "row", alignItems: "center" },
  accordionIcon: {
    width: 24,
    height: 28,
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  accordionIconOpen: { backgroundColor: "transparent" },
  accordionTitle: {
    flexShrink: 1,
    color: palette.ink,
    fontFamily: typography.semibold,
    fontSize: 14,
  },
  accordionToggle: {
    width: 32,
    height: 32,
    marginLeft: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: "transparent",
  },
  accordionToggleOpen: { backgroundColor: "#F2F5ED" },
  accordionBody: {
    paddingTop: 0,
    paddingBottom: 22,
  },
  accordionText: {
    color: "#687164",
    fontFamily: typography.regular,
    fontSize: 13,
    lineHeight: 23,
  },
  detailLine: {
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 18,
  },
  detailLabel: {
    color: "#777A77",
    fontFamily: typography.regular,
    fontSize: 12,
  },
  detailValue: {
    maxWidth: "64%",
    color: palette.ink,
    fontFamily: typography.semibold,
    fontSize: 12,
    textAlign: "right",
  },
  reviewError: {
    margin: 20,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#E9CACA",
    borderRadius: 16,
    backgroundColor: "#FFF5F5",
  },
  reviewErrorText: {
    color: "#9D3030",
    fontFamily: typography.semibold,
    fontSize: 11,
  },
  reviewRetry: {
    minHeight: 44,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  reviewRetryText: {
    color: "#9D3030",
    fontFamily: typography.black,
    fontSize: 8,
  },
  related: {
    alignSelf: "center",
    paddingBottom: 30,
    paddingLeft: 20,
    paddingTop: 30,
    overflow: "hidden",
  },
  relatedSubtitle: { marginTop: 6, color: "#7B8375", fontFamily: typography.regular, fontSize: 12 },
  relatedTitle: {
    color: palette.ink,
    fontFamily: typography.semibold,
    fontSize: 22,
    letterSpacing: -0.6,
  },
  purchaseBar: {
    minHeight: 72,
    paddingHorizontal: 14,
    paddingTop: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.07)",
    backgroundColor: "rgba(255,254,252,0.98)",
    shadowColor: "#171A18",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.045,
    shadowRadius: 10,
    elevation: 6,
  },
  quantity: {
    height: 58,
    paddingHorizontal: 5,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#DDDAD4",
    borderRadius: 19,
    backgroundColor: "#F7F6F3",
  },
  quantityButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: palette.white,
  },
  quantityButtonPressed: { backgroundColor: "#E9ECE8", transform: [{ scale: 0.94 }] },
  quantityValue: {
    width: 34,
    color: palette.ink,
    fontFamily: typography.black,
    fontSize: 15,
    textAlign: "center",
  },
  purchasePrice: {
    width: 104,
    minWidth: 0,
    justifyContent: "center",
  },
  purchasePriceCompact: { width: 90 },
  purchasePriceLabel: {
    color: "#7B7E7A",
    fontFamily: typography.bold,
    fontSize: 8,
    letterSpacing: 0.9,
    textTransform: "uppercase",
  },
  purchasePriceValue: {
    marginTop: 2,
    color: palette.ink,
    fontFamily: typography.bold,
    fontSize: 20,
    letterSpacing: -0.4,
  },
  addButton: {
    minWidth: 0,
    maxWidth: 580,
    height: 52,
    paddingHorizontal: 16,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    backgroundColor: "#183D29",
    shadowColor: "#0C6329",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0,
    shadowRadius: 8,
    elevation: 0,
  },
  addButtonCompact: { paddingHorizontal: 10, gap: 7 },
  addButtonDisabled: {
    backgroundColor: "#A9ADA9",
    shadowOpacity: 0,
    elevation: 0,
  },
  addButtonIcon: {
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 0,
    backgroundColor: "transparent",
  },
  addButtonIconCompact: { width: 20, height: 20, borderRadius: 0 },
  addButtonText: {
    color: palette.white,
    fontFamily: typography.bold,
    fontSize: 12.5,
    letterSpacing: 0.1,
  },
  addButtonTextCompact: { fontSize: 11.5 },
});
