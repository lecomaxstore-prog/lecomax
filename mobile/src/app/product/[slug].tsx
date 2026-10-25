import { productDetailsFromTags } from "@/lib/product-details";
import { sortProductSizes } from "@/lib/product-sizes";
import { useQueryClient } from "@tanstack/react-query";
import { ProductBrandMark } from "@/components/product-brand-mark";
import { productTranslationOptions } from "@/lib/product-translation-query";
import { selectedInventory, preorderSnapshot, availableSizesForColor } from "@/lib/purchasability";
import { PreorderNotice } from "@/components/preorder-notice";
import { localizedContent } from "@/i18n/content";
import { localizedError } from "@/i18n/errors";
import { msg, useLocale } from "@/i18n";
import { ProductDescription } from "@/components/product-description";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Clipboard from "expo-clipboard";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import Animated, { FadeInDown, FadeOutDown, ReduceMotion } from "react-native-reanimated";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AnimatedPressable } from "@/components/animated-pressable";
import { CartThankYou } from "@/components/cart-thank-you";
import { useAppViewport } from "@/components/app-viewport";
import { ProductCard } from "@/components/product-card";
import { ProductGallery } from "@/components/product-gallery";
import { ProductLoadingScreen } from "@/components/product-loading";
import { ProductReviews } from "@/components/product-reviews";
import { useProductImage } from "@/hooks/use-product-image";
import { ShoeSizeGuide } from "@/components/shoe-size-guide";
import { productSizeGuideFromTags } from "@/lib/product-size-guide";
import { palette, typography } from "@/constants/theme";
import {
  useProducts,
  useReviews,
  useSettings,
} from "@/hooks/use-catalog";
import { discount, money, moneyParts } from "@/lib/format";
import { safeParentPath } from "@/lib/navigation-policy";
import { realSimilarProducts } from "@/lib/product-similarity";
import { useCommerceStore } from "@/stores/commerce";
import { useCartFeedbackStore } from "@/stores/cart-feedback";
import { useScrollReturn } from "@/hooks/use-scroll-return";
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

function ColorVariantImage({ uri }: { uri?: string }) {
  const { source, imageFailed, onError } = useProductImage({
    id: uri ?? "",
    images: uri ? [uri] : [],
  });

  if (imageFailed) {
    return <Ionicons name="image-outline" size={22} color="#999B98" />;
  }

  return (
    <Image
      source={source}
      onError={onError}
      contentFit="cover"
      cachePolicy="memory-disk"
      recyclingKey={uri}
      style={styles.colorImage}
    />
  );
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
  useLocale();
  const [open, setOpen] = useState(initiallyOpen);
  const icon = title === "Description"
    ? "document-text-outline"
    : title === "Livraison"
      ? "car-outline"
      : "information-circle-outline";
  return (
    <View style={[styles.accordion, open && styles.accordionOpen]}>
      <AnimatedPressable
        accessibilityLabel={`${open ? msg("scanner.close") : msg("search.open")} ${title}`}
        accessibilityRole="button"
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

export default function ProductScreen() {
  const language = useLocale();
  const queryClient = useQueryClient();
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
  useEffect(() => {
    if (product?.description?.trim()) {
      void queryClient.prefetchQuery(productTranslationOptions({ ...product, description: product.description }, language));
    }
  }, [product, language, queryClient]);
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
  const scrollReturn = useScrollReturn(pageRef, slug);
  const successTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const [color, setColor] = useState<string>();
  const [size, setSize] = useState<string>();
  const [galleryImageIndex, setGalleryImageIndex] = useState<number>();
  const [gallerySelectionVersion, setGallerySelectionVersion] = useState(0);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [sizeOptionsOpen, setSizeOptionsOpen] = useState(false);
  const sizeTriggerRef = useRef<View>(null);
  const sizePanelRef = useRef<View>(null);
  const productScrollOffset = useRef(0);
  const productViewportRef = useRef<View>(null);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [purchaseBarState, setPurchaseBarState] = useState({ slug, visible: false, colorSelected: false });
  const showPurchaseBar = purchaseBarState.slug === slug && purchaseBarState.visible;

  const handleProductScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollReturn.onScroll(event);
    const offset = event.nativeEvent.contentOffset.y;
    productScrollOffset.current = offset;
    setPurchaseBarState((previous) => {
      // Keep the purchase action available while previewing a chosen color.
      if (previous.slug === slug && previous.colorSelected) return previous;
      const wasVisible = previous.slug === slug && previous.visible;
      // Separate reveal/hide thresholds prevent flicker near the top.
      const visible = wasVisible ? offset > 40 : offset > 120;
      return previous.slug === slug && previous.visible === visible
        ? previous
        : { slug, visible, colorSelected: false };
    });
  }, [slug, scrollReturn]);


  const revealSizeOptions = useCallback(() => {
    requestAnimationFrame(() => {
      productViewportRef.current?.measureInWindow((_x, viewportY, _width, viewportHeight) => {
        sizePanelRef.current?.measureInWindow((_panelX, panelY, _panelWidth, panelHeight) => {
          const hiddenHeight = panelY + panelHeight + 16 - (viewportY + viewportHeight - 112 - insets.bottom);
          const scrollBy = Math.min(Math.max(0, hiddenHeight), Math.max(0, panelY - viewportY - 90));
          if (scrollBy > 1) pageRef.current?.scrollTo({ y: productScrollOffset.current + scrollBy, animated: true });
        });
      });
    });
  }, [insets.bottom]);

  useEffect(() => {
    if (!sizeOptionsOpen) return;
    const dismiss = () => { setSizeOptionsOpen(false); return true; };
    if (Platform.OS === "web") {
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          event.preventDefault(); dismiss();
          (sizeTriggerRef.current as unknown as HTMLElement)?.focus();
        }
      };
      document.addEventListener("keydown", onKeyDown);
      return () => document.removeEventListener("keydown", onKeyDown);
    }
    const subscription = BackHandler.addEventListener("hardwareBackPress", dismiss);
    return () => subscription.remove();
  }, [sizeOptionsOpen]);

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
      pageRef.current?.scrollTo({ y: 0, animated: false });
      productScrollOffset.current = 0;
      setPurchaseBarState({ slug, visible: false, colorSelected: false });
      setColor(undefined);
      setSize(undefined);
      setSizeOptionsOpen(false);
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

  if (isLoading) return <ProductLoadingScreen onBack={goBack} />;

  if (error || !product) {
    return (
      <View style={styles.stateScreen}>
        <View style={styles.errorIcon}>
          <Ionicons name="cloud-offline-outline" size={29} color="#16883A" />
        </View>
        <Text style={styles.stateTitle}>
          {product ? msg("notifications.connectionInterrupted") : msg("product.productNotFound")}
        </Text>
        <Text style={styles.stateText}>
          {msg("auth.checkYourConnectionAndTryAgain")}</Text>
        <AnimatedPressable
          accessibilityLabel={msg("product.tryLoadingTheProductAgain")}
          onPress={() => void refetch()}
          style={styles.retryButton}
        >
          <Text style={styles.retryText}>{msg("notifications.tryAgainUppercase")}</Text>
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
  const defaultColor =
    product.colors?.find((item) => !outOfStockColors.includes(item)) ??
    product.colors?.[0];
  const selectedColor =
    color && product.colors?.includes(color) ? color : defaultColor;
  const sizesForColor = (value?: string) => availableSizesForColor(product, value);
  const availableSizes = sizesForColor(selectedColor);
  const selectedSize =
    size && availableSizes.includes(size) ? size : availableSizes[0];
  const requiresSize = Boolean(
    product.sizes?.length &&
    !(product.sizes.length === 1 && product.sizes[0] === "Taille unique"),
  );
  const physicalStock = selectedInventory(product,selectedColor,selectedSize);
  const availableStock = Math.max(0,physicalStock);
  const preorder = preorderSnapshot(product,physicalStock,quantity);
  const maximumQuantity = product.preorder_enabled ? 20 : Math.max(1,Math.min(availableStock,20));
  const selectionUnavailable = !product.active || physicalStock < 0 || (!product.preorder_enabled && availableStock<=0) || (requiresSize && !selectedSize);
  const images = product.images?.length ? product.images : [undefined];
  const selectedPricing = selectedColor ? product.color_prices?.[selectedColor] : undefined;
  const selectedPrice = selectedPricing?.price ?? product.price;
  const selectedOriginalPrice = selectedPricing?.originalPrice ?? product.original_price;
  const saving = discount(selectedPrice, selectedOriginalPrice);
  const isFavorite = wishlist.includes(product.id);
  const reviewCount = product.review_count ?? reviews.length;
  const description = product.description?.trim() || "";
  const productDetails = productDetailsFromTags(product.tags);
  const related = realSimilarProducts(product, all, 8);
  // Leave a glimpse of the next card so the horizontal gesture is discoverable.
  const relatedCardWidth = Math.min(260, Math.floor((contentWidth - 52) / 2));
  const currency = settingsMap.currency?.trim().toUpperCase() || "MAD";
  const displayPriceParts = moneyParts(selectedPrice, currency);
  const displayAmount = displayPriceParts.filter((part) => part.type !== "currency").map((part) => part.value).join("").trim();
  const displayCurrency = displayPriceParts.find((part) => part.type === "currency")?.value ?? currency;
  const deliveryLabel =
    settingsMap.checkout_trust_delivery?.trim() ||
    msg("delivery.namedEstimate", { estimate: localizedContent(settingsMap.shipping_estimated_days?.trim()) || msg("orderConfirmation.25BusinessDays") });
  const shareProduct = async () => {
    const productUrl = `${PRODUCT_SHARE_ORIGIN}/produit/${encodeURIComponent(product.slug)}/`;
    const currentPrice = money(selectedPrice, currency);
    const originalPrice =
      selectedOriginalPrice && selectedOriginalPrice > selectedPrice
        ? money(selectedOriginalPrice, currency)
        : undefined;
    const title = `${product.name} — ${currentPrice} | L'ecomax`;
    const priceLine = originalPrice
      ? msg("product.shareDiscount", { price: currentPrice, original: originalPrice, percent: saving })
      : msg("product.sharePrice", { price: currentPrice });
    const message = [
      msg("product.shareIntroduction", { name: product.name }),
      priceLine,
      msg("product.deliveryThroughoutMoroccoCashOnDelivery"),
    ].join("\n");
    const completeMessage = msg("product.shareLink", { message, url: productUrl });

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
        Alert.alert(msg("product.linkCopied"), msg("product.theProductItsPriceAndItsLinkAreReadyToShare"));
      } catch {
        Alert.alert(msg("product.sharingUnavailable"), msg("product.unableToShareThisProductRightNow"));
      }
    }
  };
  const selectColor = (value: string) => {
    if (!product.preorder_enabled && outOfStockColors.includes(value)) return;
    setPurchaseBarState({ slug, visible: true, colorSelected: true });
    const imageIndex = findColorImageIndex(product.images, product.colors, value);
    setColor(value);
    setSizeOptionsOpen(false);
    setSize(sizesForColor(value)[0]);
    setSizeOptionsOpen(false);
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
        msg("product.selectionUnavailable"),
        requiresSize && !selectedSize
          ? msg("product.chooseAnAvailableSize")
          : msg("product.thisVariantIsCurrentlySoldOut"),
      );
      return;
    }
    setIsAdding(true);
    setAdded(false);
    if (successTimer.current) clearTimeout(successTimer.current);
    try {
      const fresh = await getFreshProduct(slug);
      if (!fresh?.active) throw new Error(msg("wishlist.thisProductIsNoLongerAvailable"));
      const freshStock = selectedInventory(fresh,selectedColor,selectedSize);
      if (freshStock<0 || (!fresh.preorder_enabled && freshStock<quantity)) throw new Error(msg("product.stockHasJustChangedChooseAnAvailableQuantity"));
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
      successTimer.current = setTimeout(() => setAdded(false), 2400);
    } catch (reason) {
      Alert.alert(
        msg("product.unableToAddItem"),
        reason instanceof Error
          ? localizedError(reason)
          : msg("auth.checkYourConnectionAndTryAgain"),
      );
    } finally {
      setIsAdding(false);
    }
  };

  const [productTitle, ...productTitleDetails] = product.name
    .replace(/\b(t|tee)[- ](?=shirts?\b)/gi, "$1\u2011")
    .split(/\s+[–—]\s+/);

  return (
    <View ref={productViewportRef} collapsable={false} style={styles.screen}>
      <ScrollView
        {...scrollReturn}
        ref={pageRef}
        showsVerticalScrollIndicator={false}
        onScroll={handleProductScroll}
        scrollEventThrottle={16}
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
              {product.brand ? <ProductBrandMark name={product.brand} /> : <Text numberOfLines={1} style={styles.category}>{localizedContent(product.category)}</Text>}
            </View>
            <View style={[styles.stockBadge, selectionUnavailable ? styles.stockBadgeUnavailable : preorder.fulfillment_type === "PREORDER" && styles.stockBadgePreorder]}>
              {selectionUnavailable ? (
                <Ionicons name="remove-circle-outline" size={14} color="#8B5555" accessible={false} />
              ) : (
                <Ionicons name={preorder.fulfillment_type === "PREORDER" ? "time-outline" : "checkmark-circle-outline"} size={16} color={preorder.fulfillment_type === "PREORDER" ? "#866022" : "#54745D"} accessible={false} />
              )}
              <Text style={[styles.stockText, selectionUnavailable ? styles.stockTextUnavailable : preorder.fulfillment_type === "PREORDER" && styles.stockTextPreorder]}>
                {selectionUnavailable ? msg("wishlistProductCard.unavailable") : preorder.fulfillment_type === "PREORDER" ? msg("preorder.badge") : msg("productCard.inStock")}
              </Text>
            </View>
          </View>
          <PreorderNotice item={preorder} />
          {product.preorder_enabled && <Text>{msg("preorder.quantity")}</Text>}
          <Text
            accessibilityRole="header"
            maxFontSizeMultiplier={1.15}
            selectable
            style={[
              styles.productName,
              contentWidth <= 360 && styles.productNameCompact,
            ]}
          >
            {productTitle}
          </Text>
          {productTitleDetails.length > 0 && (
            <Text selectable style={styles.productTitleDetails}>
              {productTitleDetails.join(" · ")}
            </Text>
          )}
          <View style={styles.priceCard}>
            <View accessible accessibilityLabel={money(selectedPrice, currency)} style={styles.priceRow}>
              <Text style={[styles.price, saving > 0 && styles.promotionalPrice]}>
                {displayAmount}
                <Text style={styles.priceCurrency}>{"\u00A0\u00A0"}{displayCurrency}</Text>
              </Text>
            </View>
            {saving > 0 ? <View style={styles.priceComparisonRow}>
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
            </View> : null}
            {saving > 0 && selectedOriginalPrice ? (
              <View style={styles.savingsRow}>
                <Text style={styles.savingsText}>
                  {msg("homePromotionSection.youSave")}{" "}
                  <Text style={styles.savingsAmount}>{money(selectedOriginalPrice - selectedPrice, currency)}</Text>
                </Text>
              </View>
            ) : null}
          </View>

          {product.colors?.length ? (
            <View style={styles.variantSection}>
              <View style={styles.variantHeading}>
                <Text style={styles.sectionTitle}>{msg("wishlist.color")}</Text>
                <Text style={styles.selectedVariant}>{localizedContent(selectedColor)}</Text>
              </View>
              <View style={styles.colors}>
                {product.colors.map((item, colorIdx) => {
                  const selected = item === selectedColor;
                  const unavailable = !product.preorder_enabled && outOfStockColors.includes(item);
                  const variantImage =
                    (product as any).color_images?.[item] ||
                    (product as any).color_image_galleries?.[item]?.[0] ||
                    (product.images?.length
                      ? product.images[findColorImageIndex(product.images, product.colors, item)]
                      : undefined) ||
                    product.images?.[colorIdx] ||
                    product.thumbnail ||
                    product.images?.[0];
                  return (
                    <AnimatedPressable
                      key={item}
                      accessibilityLabel={`${localizedContent(item)}${selected ? msg("shoeSizeGuide.selectedText") : ""}${unavailable ? msg("product.soldOut") : ""}`}
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
                        <ColorVariantImage uri={variantImage} />
                        {selected ? (
                          <View style={styles.selectedCheck}>
                            <Ionicons
                              name="checkmark"
                              size={12}
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
                        {localizedContent(item)}
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
                  <Text style={styles.sectionTitle}>{msg("shoeSizeGuide.size")}</Text>
                </View>
                <AnimatedPressable
                  accessibilityLabel={msg("product.openSizeGuide")}
                  accessibilityRole="button"
                  onPress={() => { setSizeOptionsOpen(false); setSizeGuideOpen(true); }}
                  style={styles.guideButton}
                >
                  <Text style={styles.guideText}>{msg("shoeSizeGuide.sizeGuide")}</Text>
                </AnimatedPressable>
              </View>
              <Pressable ref={sizeTriggerRef} accessibilityRole="button"
                accessibilityLabel={msg("shoeSizeGuide.size") + " " + (selectedSize ?? msg("product.chooseOne"))}
                accessibilityState={{ expanded: sizeOptionsOpen }}
                onPress={() => setSizeOptionsOpen(open => !open)}
                style={({ pressed }) => [styles.sizeTrigger, (sizeOptionsOpen || pressed) && styles.sizeTriggerOpen]}>
                <Text style={styles.sizeTriggerText}>{selectedSize ?? msg("product.chooseOne")}</Text>
                <Ionicons name={sizeOptionsOpen ? "chevron-up" : "chevron-down"} size={16} color="#58705E" accessible={false} />
              </Pressable>
              {sizeOptionsOpen ? <View ref={sizePanelRef} collapsable={false} onLayout={revealSizeOptions} style={styles.sizePanel}>
                <ScrollView nestedScrollEnabled style={styles.sizeList} contentContainerStyle={styles.sizeListContent}>
                {sortProductSizes(product.sizes ?? []).map((item) => {
                  const selected = item === selectedSize;
                  const unavailable = !availableSizes.includes(item);
                  return <Pressable key={item} accessibilityRole="button"
                    accessibilityLabel={msg("variants.sizeDescription", { size: item, status: unavailable ? msg("product.soldOutText") : selected ? msg("shoeSizeGuide.selectedText") : "" })}
                    accessibilityState={{ selected, disabled: unavailable }} disabled={unavailable}
                    onPress={() => {
                      setSize(item); setQuantity(1); setSizeOptionsOpen(false);
                      if (Platform.OS === "web") (sizeTriggerRef.current as unknown as HTMLElement)?.focus();
                    }}
                    style={({ pressed }) => [styles.sizeOption, selected && styles.sizeOptionSelected, pressed && !unavailable && styles.sizeOptionPressed]}>
                    <Text style={[styles.sizeOptionText, selected && styles.sizeOptionTextSelected, unavailable && styles.sizeOptionTextUnavailable]}>{item}</Text>
                    {unavailable ? <Text style={styles.sizeUnavailableText}>{msg("product.soldOutText")}</Text> : selected ? <Ionicons name="checkmark" size={18} color="#345C40" accessible={false} /> : null}
                  </Pressable>;
                })}
                </ScrollView>
              </View> : null}
            </View>
          ) : null}

          <View style={styles.quantitySection}>
            <Text style={styles.sectionTitle}>{msg("product.quantity")}</Text>
            <View style={styles.quantity}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={msg("cart.decreaseQuantity")}
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
              <Text accessibilityLabel={msg("cart.quantityValue", { count: quantity })} style={styles.quantityValue}>
                {quantity}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={msg("cart.increaseQuantity")}
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
                    {reviewCount} {msg("productReviews.verifiedReview")}{reviewCount === 1 ? "" : "s"}
                  </Text>
                </>
              ) : (
                <Text style={styles.noReviews}>{msg("productReviews.noReviews")}</Text>
              )}
            </View>
            <AnimatedPressable
              accessibilityLabel={msg("product.shareThisProduct")}
              accessibilityRole="button"
              onPress={() => void shareProduct()}
              pressedScale={0.96}
              style={styles.shareButton}
            >
              <Ionicons name="share-social-outline" size={16} color="#397A4D" />
              <Text style={styles.shareText}>{msg("product.share")}</Text>
            </AnimatedPressable>
          </View>

          <View style={styles.trustRow}>
            <View style={styles.trustItem}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#16883A" />
              <Text numberOfLines={2} style={styles.trustText}>
                {msg("product.authenticProduct")}</Text>
            </View>
            <View style={styles.trustDivider} />
            <View style={styles.trustItem}>
              <Ionicons name="location-outline" size={20} color="#16883A" />
              <Text numberOfLines={2} style={styles.trustText}>
                {msg("topic.deliveryThroughoutMorocco")}</Text>
            </View>
          </View>

          <View style={styles.accordions}>
            {description ? (
              <Accordion title={msg("product.description")} initiallyOpen>
                <ProductDescription key={product.slug} slug={product.slug} name={product.name} brand={product.brand} description={description} />
              </Accordion>
            ) : null}
            {productDetails.length > 0 ? <Accordion title={msg("product.productDetails")}>
              <View style={styles.detailsTable}>
              {productDetails.map((detail, index) => (
                <View key={index} style={[styles.detailLine, index % 2 === 0 && styles.detailLineAlternate]}>
                  <Text selectable style={styles.detailLabel}>{detail.key}</Text>
                  <Text selectable style={styles.detailValue}>{detail.value}</Text>
                </View>
              ))}
              </View>
            </Accordion> : null}
            <Accordion title={msg("support.delivery")}>
              <Text style={styles.accordionText}>{deliveryLabel}</Text>
              <Text style={[styles.accordionText, { marginTop: 8 }]}>
                {msg("product.checkDeliveryFeesAndTimesForYourCityBeforeConfirmingYourOrder")}</Text>
            </Accordion>
            {reviewsEnabled ? (
              <Accordion title={msg("productReviews.customerReviews")}>
                {reviewsQuery.isError ? (
                  <View style={styles.reviewError}>
                    <Text style={styles.reviewErrorText}>
                      {msg("product.unableToLoadReviews")}</Text>
                    <AnimatedPressable
                      accessibilityLabel={msg("product.tryLoadingReviewsAgain")}
                      onPress={() => void reviewsQuery.refetch()}
                      style={styles.reviewRetry}
                    >
                      <Text style={styles.reviewRetryText}>{msg("notifications.tryAgainUppercase")}</Text>
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
              </Accordion>
            ) : null}


          </View>
        </View>

        <ShoeSizeGuide
          customGuide={productSizeGuideFromTags(product.tags)}
          open={sizeGuideOpen}
          onClose={() => setSizeGuideOpen(false)}
          productSizes={product.sizes ?? []}
          availableSizes={availableSizes}
          selectedSize={selectedSize}
          onSelectSize={(value) => { setSize(value); setQuantity(1); }}
        />

        {related.length ? (
          <View style={[styles.related, { width: contentWidth }]}>
            <Text accessibilityRole="header" style={styles.relatedTitle}>{msg("product.youMayAlsoLike")}</Text>
            <Text style={styles.relatedSubtitle}>{msg("product.discoverMoreInTheSameStyle")}</Text>
            <ScrollView
              key={product.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={relatedCardWidth + 12}
              decelerationRate="fast"
              disableIntervalMomentum
              contentContainerStyle={styles.relatedTrack}
              style={styles.relatedScroll}
            >
              {related.map((item) => (
                <ProductCard key={item.id} product={item} width={relatedCardWidth} related />
              ))}
            </ScrollView>
          </View>
        ) : null}
      </ScrollView>

      {showPurchaseBar ? <Animated.View
        key={slug}
        entering={FadeInDown.duration(220).reduceMotion(ReduceMotion.System)}
        exiting={FadeOutDown.duration(160).reduceMotion(ReduceMotion.System)}
        style={[
          styles.purchaseBar,
          { paddingBottom: Math.max(insets.bottom, 12) },
        ]}
      >
        <View style={styles.purchasePrice}>
          <Text style={styles.purchasePriceLabel}>{msg("product.unitPrice")}</Text>
          <Text
            numberOfLines={1}
            ellipsizeMode="clip"
            accessibilityLabel={money(selectedPrice, currency)}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
            style={[styles.purchasePriceValue, saving > 0 && styles.promotionalPrice]}
          >
            {displayPriceParts.filter((part) => part.type !== "currency").map((part, index) => (
              <Text key={index} style={part.type === "decimal" || part.type === "fraction" ? styles.purchasePriceFraction : undefined}>{part.value}</Text>
            ))}{" "}<Text style={styles.purchasePriceCurrency}>{displayCurrency}</Text>
          </Text>
        </View>
        <AnimatedPressable
          accessibilityRole="button"
          accessibilityLabel={
            selectionUnavailable ? msg("product.productUnavailable") : added ? msg("product.thankYouProductAddedToCartAddAgain") : preorder.fulfillment_type === "PREORDER" ? msg("preorder.action") : msg("common.add")
          }
          accessibilityLiveRegion="polite"
          accessibilityState={{ disabled: selectionUnavailable || isAdding, busy: isAdding }}
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
          ) : added ? (
            <CartThankYou />
          ) : (
            <>
              <View
                style={[
                  styles.addButtonIcon,
                  contentWidth <= 340 && styles.addButtonIconCompact,
                ]}
              >
                <Ionicons
                  name="bag-handle-outline"
                  size={18}
                  color={palette.white}
                />
              </View>
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.85}
                style={[
                  styles.addButtonText,
                  contentWidth <= 340 && styles.addButtonTextCompact,
                ]}
              >
                {selectionUnavailable
                    ? msg("wishlistProductCard.unavailable")
                    : preorder.fulfillment_type === "PREORDER" ? msg("preorder.action") : msg("common.add")}
              </Text>
            </>
          )}
        </AnimatedPressable>
      </Animated.View> : null}
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
    paddingTop: 14,
    paddingBottom: 30,
    backgroundColor: PRODUCT_BACKGROUND,
  },
  categoryRow: {
    minHeight: 38,
    gap: 12,
    paddingBottom: 12,
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
  category: {
    flexShrink: 1,
    color: "#26342B",
    fontFamily: typography.semibold,
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: 1.8,
    textTransform: "uppercase",
  },
  stockBadge: {
    flexShrink: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingVertical: 6,
  },
  stockBadgeUnavailable: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "#F8F0EF",
    gap: 6,
  },
  stockBadgePreorder: { paddingHorizontal: 10, borderRadius: 6, backgroundColor: "#FAF3E5" },
  stockText: {
    flexShrink: 1,
    color: "#3F5145",
    fontFamily: typography.medium,
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: 0.15,
  },
  stockTextUnavailable: {
    color: "#8B5555",
    fontFamily: typography.semibold,
    fontSize: 11,
    lineHeight: 16,
  },
  stockTextPreorder: { color: "#866022" },
  shareButton: {
    minHeight: 44,
    paddingHorizontal: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 7,
    borderRadius: 8,
  },
  shareText: {
    color: "#505652",
    fontFamily: typography.semibold,
    fontSize: 12,
    letterSpacing: 0.1,
  },
  productName: {
    maxWidth: 680,
    marginTop: 10,
    color: "#202723",
    fontFamily: typography.semibold,
    fontSize: 23,
    lineHeight: 30,
    letterSpacing: -0.45,
  },
  productNameCompact: { fontSize: 21, lineHeight: 28, letterSpacing: -0.35 },
  productTitleDetails: {
    maxWidth: 680,
    marginTop: 7,
    color: "#697069",
    fontFamily: typography.regular,
    fontSize: 13,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  ratingShareRow: {
    minHeight: 50,
    marginTop: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
    fontFamily: typography.regular,
    fontSize: 12,
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
    marginTop: 10,
    marginBottom: 2,
    paddingBottom: 20,
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
    minHeight: 36,
    marginTop: 0,
    flexDirection: "row",
    alignItems: "baseline",
    flexWrap: "wrap",
    gap: 7,
  },
  priceComparisonRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 8,
    marginBottom: 0,
  },
  price: {
    color: "#254B36",
    fontFamily: typography.semibold,
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: -0.6,
    includeFontPadding: false,
    fontVariant: ["tabular-nums"],
  },
  priceCurrency: {
    fontFamily: typography.medium,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.3,
    color: "#66746A",
    includeFontPadding: false,
  },
  promotionalPrice: {
    color: "#203F2F",
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
    color: "#8B8B83",
    fontFamily: typography.regular,
    fontSize: 12,
    textDecorationLine: "line-through",
  },
  discountBadge: {
    minHeight: 26,
    paddingHorizontal: 9,
    paddingVertical: 4,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "#EAF3E7",
  },
  discountText: {
    color: "#245A35",
    fontFamily: typography.bold,
    fontSize: 11,
    letterSpacing: 0.2,
  },
  savingsRow: {
    minHeight: 20,
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  savingsText: {
    color: "#68756B",
    fontFamily: typography.regular,
    fontSize: 11,
  },
  savingsAmount: { color: "#245A35", fontFamily: typography.semibold },
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
    padding: 2,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
  },
  colorImageSelected: { borderWidth: 2, borderColor: "#315D3C" },
  colorImage: { width: "100%", height: "100%", borderRadius: 13 },
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
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
    justifyContent: "space-between",
  },
  guideButton: {
    minHeight: 44,
    paddingHorizontal: 2,
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  guideText: {
    color: "#646960",
    fontFamily: typography.medium,
    fontSize: 11,
    textDecorationLine: "underline",
    textDecorationColor: "#B9BDB3",
  },
  sizeTrigger: { marginTop: 4, minHeight: 52, paddingHorizontal: 16, paddingVertical: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, borderWidth: 1, borderColor: "#D9E1DA", borderRadius: 10, backgroundColor: "#FFFFFF" },
  sizeTriggerOpen: { borderColor: "#6C8A74" },
  sizeTriggerText: { flexShrink: 1, color: "#2F4535", fontFamily: typography.semibold, fontSize: 14, lineHeight: 22 },
  sizePanel: { marginTop: 6, padding: 5, borderWidth: 1, borderColor: "#E2E7E1", borderRadius: 10, backgroundColor: "#FFFFFF", overflow: "hidden", boxShadow: "0px 4px 14px rgba(30,52,36,0.05)" },
  sizeList: { maxHeight: 240 },
  sizeListContent: { gap: 3 },
  sizeOption: { minHeight: 48, paddingHorizontal: 12, paddingVertical: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, borderRadius: 6 },
  sizeOptionSelected: { backgroundColor: "#F0F5EF" },
  sizeOptionPressed: { backgroundColor: "#F5F7F3" },
  sizeOptionText: { color: "#47584B", fontFamily: typography.medium, fontSize: 14, lineHeight: 20 },
  sizeOptionTextSelected: { color: "#2D5036", fontFamily: typography.semibold },
  sizeOptionTextUnavailable: { color: "#989E96", textDecorationLine: "line-through" },
  sizeUnavailableText: { color: "#858D82", fontFamily: typography.regular, fontSize: 11, flexShrink: 1 },
  trustRow: {
    minHeight: 56,
    marginTop: 8,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5E9E5",
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
    width: 0,
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
    paddingTop: 20,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
    minHeight: 60,
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
    fontSize: 15,
    lineHeight: 22,
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
  accordionToggleOpen: { backgroundColor: "transparent" },
  accordionBody: {
    paddingTop: 2,
    paddingBottom: 22,
  },
  accordionText: {
    color: "#687164",
    fontFamily: typography.regular,
    fontSize: 13,
    lineHeight: 23,
  },
  detailsTable: { borderWidth: 1, borderColor: "#E9EDE7", borderRadius: 10, overflow: "hidden" },
  detailLineAlternate: { backgroundColor: "#F6F8F4" },
  detailLine: {
    minHeight: 42,
    paddingVertical: 11,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 14,
  },
  detailLabel: {
    flex: 0.85,
    minWidth: 0,
    lineHeight: 20,
    color: "#69746B",
    fontFamily: typography.regular,
    fontSize: 13,
  },
  detailValue: {
    flex: 1.4,
    minWidth: 0,
    lineHeight: 20,
    color: "#293C2F",
    fontFamily: typography.medium,
    fontSize: 13,
    textAlign: "auto",
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
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 36,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#EAEDE7",
  },
  relatedScroll: {
    marginTop: 18,
    marginHorizontal: -20,
  },
  relatedTrack: {
    paddingHorizontal: 20,
    paddingBottom: 4,
    flexDirection: "row",
    gap: 12,
    alignItems: "stretch",
  },
  relatedSubtitle: { marginTop: 6, paddingRight: 20, color: "#6B776D", fontFamily: typography.regular, fontSize: 13, lineHeight: 20 },
  relatedTitle: {
    color: "#18261E",
    fontFamily: typography.semibold,
    fontSize: 22,
    lineHeight: 29,
    letterSpacing: -0.6,
  },
  purchaseBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    minHeight: 84,
    paddingHorizontal: 20,
    paddingTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: "#E2E9DF",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: "#FFFFFF",
    shadowColor: "#171A18",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.035,
    shadowRadius: 12,
    elevation: 4,
  },
  quantity: {
    height: 46,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#D9E0DA",
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
  },
  quantityButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  quantityButtonPressed: { backgroundColor: "#E9ECE8", transform: [{ scale: 0.94 }] },
  quantityValue: {
    width: 34,
    color: palette.ink,
    fontFamily: typography.semibold,
    fontSize: 15,
    textAlign: "center",
  },
  purchasePrice: {
    width: "36%",
    maxWidth: 180,
    minWidth: 0,
    flexShrink: 0,
    justifyContent: "center",
  },
  purchasePriceLabel: {
    color: "#7B847D",
    fontFamily: typography.medium,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.1,
  },
  purchasePriceValue: {
    marginTop: 2,
    color: "#203F2F",
    fontFamily: typography.semibold,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.6,
    includeFontPadding: false,
    fontVariant: ["tabular-nums"],
  },
  purchasePriceFraction: { fontFamily: typography.medium, fontSize: 15, letterSpacing: -0.2 },
  purchasePriceCurrency: {
    color: "#68756B",
    fontFamily: typography.medium,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0,
  },
  addButton: {
    minWidth: 0,
    maxWidth: 580,
    minHeight: 52,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#31533F",
    backgroundColor: "#203F2F",
    shadowColor: "#173424",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  addButtonCompact: { paddingHorizontal: 10, gap: 7 },
  addButtonDisabled: {
    backgroundColor: "#A9ADA9",
    borderColor: "#A9ADA9",
    shadowOpacity: 0,
    elevation: 0,
  },
  addButtonIcon: {
    width: 22,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  addButtonIconCompact: { width: 24, height: 28, borderRadius: 8 },
  addButtonText: {
    color: "#FFFEF8",
    fontFamily: typography.semibold,
    fontSize: 14,
    flexShrink: 1,
    letterSpacing: -0.1,
  },
  addButtonTextCompact: { fontSize: 11.5 },
});
