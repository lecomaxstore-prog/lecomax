import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { runtimeConfig } from "@/lib/runtime-config";
import { safeParentPath } from "@/lib/navigation-policy";
import { realSimilarProducts } from "@/lib/product-similarity";
import { useCommerceStore } from "@/stores/commerce";

const PRODUCT_BACKGROUND = "#FAF8F4";
const PRODUCT_BORDER = "#E8E5DF";

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
  const { contentWidth } = useAppViewport();
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
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);

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
      setDescriptionExpanded(false);
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
  const shortDescription = description.split(/\n+/)[0]?.trim();
  const related = realSimilarProducts(product, all, 8);
  const currency = settingsMap.currency?.trim().toUpperCase() || "MAD";
  const deliveryLabel =
    settingsMap.checkout_trust_delivery?.trim() ||
    `Livraison ${settingsMap.shipping_estimated_days?.trim() || "2–5 jours ouvrables"}`;
  const paymentLabel =
    settingsMap.checkout_trust_payment?.trim() || "Paiement 100% sécurisé";

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

  const addSelectedQuantity = async () => {
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
      const result = await refetch();
      const fresh = result.data?.find((item) => item.slug === slug);
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
          onOpenHome={() => router.replace("/")}
          onOpenSearch={() => router.push("/search")}
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
              <Text style={styles.collectionEyebrow}>Collection</Text>
              <View style={styles.collectionDivider} />
              <Text style={styles.category}>{product.category}</Text>
            </View>
            <AnimatedPressable
              accessibilityLabel="Partager ce produit"
              accessibilityRole="button"
              onPress={() =>
                void Share.share({
                  message: `${product.name} — ${runtimeConfig.apiUrl}/produit/${product.slug}`,
                })
              }
              style={styles.shareButton}
            >
              <Ionicons name="share-outline" size={21} color={palette.ink} />
            </AnimatedPressable>
          </View>
          <Text maxFontSizeMultiplier={1.15} selectable style={styles.productName}>
            {product.name}
          </Text>
          {shortDescription ? (
            <View style={styles.descriptionBlock}>
              <Text
                maxFontSizeMultiplier={1.2}
                numberOfLines={descriptionExpanded ? undefined : 3}
                style={styles.shortDescription}
              >
                {shortDescription}
              </Text>
              {shortDescription.length > 135 ? (
                <AnimatedPressable
                  accessibilityLabel={descriptionExpanded ? "Réduire la description" : "Lire toute la description"}
                  accessibilityRole="button"
                  onPress={() => setDescriptionExpanded((value) => !value)}
                  pressedScale={0.97}
                  style={styles.descriptionToggle}
                >
                  <Text style={styles.descriptionToggleText}>
                    {descriptionExpanded ? "Masquer les détails" : "Voir la description complète"}
                  </Text>
                  <View style={styles.descriptionToggleIcon}>
                    <Ionicons
                      name={descriptionExpanded ? "chevron-up" : "chevron-down"}
                      size={14}
                      color="#16883A"
                    />
                  </View>
                </AnimatedPressable>
              ) : null}
            </View>
          ) : null}

          <View style={styles.priceCard}>
            <View style={styles.priceRow}>
              <Text style={[styles.price, saving > 0 && styles.promotionalPrice]}>
                {money(selectedPrice, currency)}
              </Text>
              {selectedOriginalPrice &&
              selectedOriginalPrice > selectedPrice ? (
                <View style={styles.originalPriceGroup}>
                  <Text style={styles.originalPriceLabel}>Prix initial</Text>
                  <Text style={styles.originalPrice}>
                    {money(selectedOriginalPrice, currency)}
                  </Text>
                </View>
              ) : null}
              {saving > 0 ? (
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>ÉCONOMISEZ {saving}%</Text>
                </View>
              ) : null}
            </View>
            {saving > 0 && selectedOriginalPrice ? (
              <View style={styles.savingsRow}>
                <Ionicons name="pricetag-outline" size={14} color="#16883A" />
                <Text style={styles.savingsText}>
                  Votre avantage : {money(selectedOriginalPrice - selectedPrice, currency)}
                </Text>
              </View>
            ) : null}
          </View>

          {product.colors?.length ? (
            <View style={styles.variantSection}>
              <Text style={styles.sectionTitle}>Couleur</Text>
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
                <Text style={styles.sectionTitle}>Taille</Text>
                <AnimatedPressable
                  accessibilityLabel="Ouvrir le guide des tailles"
                  onPress={() => setSizeGuideOpen(true)}
                  style={styles.guideButton}
                >
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
                      {unavailable ? <View style={styles.sizeStrike} /> : null}
                    </AnimatedPressable>
                  );
                })}
              </View>
            </View>
          ) : null}

          <View style={styles.trustRow}>
            <View style={styles.trustItem}>
              <Ionicons name="car-outline" size={25} color="#16883A" />
              <Text numberOfLines={2} style={styles.trustText}>
                {deliveryLabel}
              </Text>
            </View>
            <View style={styles.trustDivider} />
            <View style={styles.trustItem}>
              <Ionicons name="lock-closed-outline" size={23} color="#16883A" />
              <Text numberOfLines={2} style={styles.trustText}>
                {paymentLabel}
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
                Frais et délai définitifs calculés par le serveur selon votre
                ville.
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
            <Text style={styles.relatedEyebrow}>À DÉCOUVRIR AUSSI</Text>
            <Text style={styles.relatedTitle}>Produits similaires</Text>
            <HorizontalRail
              snapToInterval={290}
              snapToAlignment="start"
              disableIntervalMomentum
              style={{ height: 438, marginTop: 18 }}
              contentContainerStyle={{
                gap: 16,
                paddingRight: 30,
                alignItems: "flex-start",
              }}
            >
              {related.map((item) => (
                <ProductCard key={item.id} product={item} wide />
              ))}
            </HorizontalRail>
          </View>
        ) : null}
      </ScrollView>

      <View
        style={[
          styles.purchaseBar,
          { paddingBottom: Math.max(insets.bottom, 12) },
        ]}
      >
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
          <Text
            accessibilityLabel={`Quantité ${quantity}`}
            style={styles.quantityValue}
          >
            {quantity}
          </Text>
          <Pressable
            accessibilityLabel="Augmenter la quantité"
            disabled={
              quantity >= maximumQuantity || selectionUnavailable || isAdding
            }
            onPress={() =>
              setQuantity((value) => Math.min(maximumQuantity, value + 1))
            }
            style={({ pressed }) => [
              styles.quantityButton,
              pressed && styles.quantityButtonPressed,
            ]}
          >
            <Ionicons
              name="add"
              size={21}
              color={
                quantity >= maximumQuantity || selectionUnavailable
                  ? "#B8BAB8"
                  : palette.ink
              }
            />
          </Pressable>
        </View>
        <AnimatedPressable
          accessibilityLabel={
            selectionUnavailable ? "Produit indisponible" : "Ajouter au panier"
          }
          accessibilityState={{ disabled: selectionUnavailable || isAdding }}
          disabled={selectionUnavailable || isAdding}
          onPress={() => void addSelectedQuantity()}
          style={[
            styles.addButton,
            (selectionUnavailable || isAdding) && styles.addButtonDisabled,
          ]}
        >
          {isAdding ? (
            <ActivityIndicator color={palette.white} />
          ) : (
            <>
              <View style={styles.addButtonIcon}>
                <Ionicons
                  name={added ? "checkmark" : "bag-handle-outline"}
                  size={19}
                  color={palette.white}
                />
              </View>
              <Text style={styles.addButtonText}>
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
  content: { alignSelf: "center", paddingHorizontal: 20, paddingBottom: 30 },
  categoryRow: {
    minHeight: 52,
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  collectionLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  collectionEyebrow: {
    color: "#656A65",
    fontFamily: typography.semibold,
    fontSize: 9.5,
    letterSpacing: 0.65,
    textTransform: "uppercase",
  },
  collectionDivider: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#16883A",
  },
  category: {
    color: "#16883A",
    fontFamily: typography.black,
    fontSize: 10.5,
    letterSpacing: 0.75,
    textTransform: "uppercase",
  },
  shareButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#DEDBD5",
    borderRadius: 20,
    backgroundColor: "transparent",
  },
  productName: {
    maxWidth: 660,
    marginTop: 4,
    color: "#171A18",
    fontFamily: typography.black,
    fontSize: 27,
    lineHeight: 32,
    letterSpacing: -0.65,
  },
  descriptionBlock: {
    marginTop: 13,
    paddingBottom: 13,
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
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: "#E8E4DE",
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
  },
  priceRow: {
    minHeight: 45,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 11,
  },
  price: {
    color: "#171A18",
    fontFamily: typography.black,
    fontSize: 30,
    letterSpacing: -0.8,
  },
  promotionalPrice: {
    color: "#D62F35",
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
    color: "#777B77",
    fontFamily: typography.semibold,
    fontSize: 15,
    textDecorationLine: "line-through",
  },
  discountBadge: {
    minHeight: 30,
    paddingHorizontal: 11,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: "#FBE9EA",
  },
  discountText: {
    color: "#C8232C",
    fontFamily: typography.black,
    fontSize: 9,
    letterSpacing: 0.45,
  },
  savingsRow: {
    minHeight: 28,
    marginTop: 9,
    paddingTop: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E8EDE9",
  },
  savingsText: {
    color: "#16883A",
    fontFamily: typography.semibold,
    fontSize: 11,
  },
  variantSection: {
    paddingVertical: 22,
    borderBottomWidth: 1,
    borderBottomColor: PRODUCT_BORDER,
  },
  sectionTitle: {
    color: palette.ink,
    fontFamily: typography.black,
    fontSize: 15,
  },
  colors: { marginTop: 16, flexDirection: "row", flexWrap: "wrap", gap: 16 },
  colorOption: { width: 72, alignItems: "center" },
  colorImageShell: {
    width: 64,
    height: 64,
    padding: 4,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#DDD9D2",
    borderRadius: 32,
    backgroundColor: "#F4F0EA",
  },
  colorImageSelected: { borderWidth: 2, borderColor: "#16883A" },
  colorImage: { width: "100%", height: "100%", borderRadius: 28 },
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
    backgroundColor: "#16883A",
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
    alignItems: "center",
    justifyContent: "center",
  },
  guideText: {
    color: "#16883A",
    fontFamily: typography.bold,
    fontSize: 10,
    textDecorationLine: "underline",
  },
  sizes: { marginTop: 13, flexDirection: "row", flexWrap: "wrap", gap: 9 },
  sizeOption: {
    minWidth: 54,
    height: 48,
    paddingHorizontal: 13,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#D9D6D0",
    borderRadius: 13,
    backgroundColor: palette.white,
  },
  sizeSelected: { borderColor: "#16883A", backgroundColor: "#16883A" },
  sizeUnavailable: { backgroundColor: "#F1EFEB" },
  sizeText: { color: palette.ink, fontFamily: typography.bold, fontSize: 12 },
  sizeTextSelected: { color: palette.white },
  sizeTextUnavailable: { color: "#A4A5A3" },
  sizeStrike: {
    position: "absolute",
    width: 68,
    height: 1,
    backgroundColor: "#B6B6B3",
    transform: [{ rotate: "-34deg" }],
  },
  trustRow: {
    minHeight: 76,
    marginTop: 22,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: PRODUCT_BORDER,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.66)",
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
    height: 34,
    marginHorizontal: 12,
    backgroundColor: PRODUCT_BORDER,
  },
  trustText: {
    minWidth: 0,
    flex: 1,
    color: "#3E423F",
    fontFamily: typography.semibold,
    fontSize: 10,
    lineHeight: 14,
  },
  accordions: {
    marginTop: 24,
    gap: 10,
  },
  accordion: {
    overflow: "hidden",
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: PRODUCT_BORDER,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.72)",
  },
  accordionOpen: {
    borderColor: "#C9E5D0",
    backgroundColor: "#FFFFFF",
    shadowColor: "#172319",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  accordionHeader: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  accordionHeading: { minWidth: 0, flex: 1, flexDirection: "row", alignItems: "center" },
  accordionIcon: {
    width: 36,
    height: 36,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    backgroundColor: "#F0F1EE",
  },
  accordionIconOpen: { backgroundColor: "#E8F7EC" },
  accordionTitle: {
    flexShrink: 1,
    color: palette.ink,
    fontFamily: typography.black,
    fontSize: 13.5,
  },
  accordionToggle: {
    width: 32,
    height: 32,
    marginLeft: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: "#F0F1EE",
  },
  accordionToggleOpen: { backgroundColor: "#E8F7EC" },
  accordionBody: {
    paddingTop: 16,
    paddingBottom: 18,
    borderTopWidth: 1,
    borderTopColor: PRODUCT_BORDER,
  },
  accordionText: {
    color: "#686B68",
    fontFamily: typography.regular,
    fontSize: 12,
    lineHeight: 20,
  },
  detailLine: {
    minHeight: 32,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 18,
  },
  detailLabel: {
    color: "#777A77",
    fontFamily: typography.regular,
    fontSize: 11,
  },
  detailValue: {
    maxWidth: "64%",
    color: palette.ink,
    fontFamily: typography.semibold,
    fontSize: 11,
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
  relatedEyebrow: {
    color: "#16883A",
    fontFamily: typography.black,
    fontSize: 8,
    letterSpacing: 1.5,
  },
  relatedTitle: {
    marginTop: 7,
    color: palette.ink,
    fontFamily: typography.black,
    fontSize: 24,
    letterSpacing: -0.6,
  },
  purchaseBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: PRODUCT_BORDER,
    backgroundColor: "rgba(255,255,255,0.98)",
    shadowColor: "#171A18",
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 12,
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
  addButton: {
    minWidth: 0,
    height: 58,
    paddingHorizontal: 12,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    borderRadius: 19,
    backgroundColor: "#117A33",
    shadowColor: "#0C6329",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.18,
    shadowRadius: 11,
    elevation: 4,
  },
  addButtonDisabled: {
    backgroundColor: "#A9ADA9",
    shadowOpacity: 0,
    elevation: 0,
  },
  addButtonIcon: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  addButtonText: {
    color: palette.white,
    fontFamily: typography.black,
    fontSize: 12.5,
    letterSpacing: 0.1,
  },
});
