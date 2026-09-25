import { localizedContent } from "@/i18n/content";
import { localizedError } from "@/i18n/errors";
import { msg, useLocale } from "@/i18n";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import type { Session } from "@supabase/supabase-js";
import { useEffect, useMemo, useRef, useState } from "react";
import { useScrollReturn } from "@/hooks/use-scroll-return";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AnimatedPressable } from "@/components/animated-pressable";
import { AppViewportOverlay } from "@/components/app-viewport";
import { BrandLogo } from "@/components/brand-logo";
import { ProductCard } from "@/components/product-card";
import { Screen } from "@/components/screen";
import { WishlistProductCard } from "@/components/wishlist-product-card";
import { palette, typography } from "@/constants/theme";
import { triggerSuccessHaptic } from "@/services/haptics";
import {
  useProducts,
  useRecommendationSlugs,
  useSettings,
} from "@/hooks/use-catalog";
import { supabase } from "@/lib/supabase";
import {
  availableColors,
  availableSizes,
  defaultWishlistVariant,
  filterWishlistProducts,
  isWishlistVariantAvailable,
  requiresWishlistVariant,
  sortWishlistProducts,
  splitWishlistEntries,
  type WishlistSort,
  type WishlistVariant,
} from "@/lib/wishlist-utils";
import { useCartFeedbackStore } from "@/stores/cart-feedback";
import { useCommerceStore } from "@/stores/commerce";
import type { Product } from "@/types/commerce";

const sortOptions: {
  value: WishlistSort;
  label: string;
}[] = [
  { value: "recommended", get label() { return msg("wishlist.recommended"); } },
  { value: "price-asc", get label() { return msg("common.priceLow"); } },
  { value: "price-desc", get label() { return msg("common.priceHigh"); } },
  { value: "newest", get label() { return msg("common.arrivals"); } },
  { value: "rating", get label() { return msg("wishlist.topRated"); } },
];

type Feedback = {
  type: "success" | "error" | "removed";
  message: string;
  removed?: { product: Product; selection?: WishlistVariant };
};

export default function WishlistScreen() {
  useLocale();
  const insets = useSafeAreaInsets();
  const productsQuery = useProducts();
  const settingsQuery = useSettings();
  const wishlist = useCommerceStore((state) => state.wishlist);
  const selections = useCommerceStore((state) => state.wishlistSelections);
  const toggleWishlist = useCommerceStore((state) => state.toggleWishlist);
  const setWishlistSelection = useCommerceStore(
    (state) => state.setWishlistSelection,
  );
  const addToCart = useCommerceStore((state) => state.addToCart);
  const cartCount = useCommerceStore((state) =>
    state.cart.reduce((sum, line) => sum + line.quantity, 0),
  );
  const startCartFlight = useCartFeedbackStore((state) => state.startFlight);
  const [session, setSession] = useState<Session | null>();
  const [inStockOnly, setInStockOnly] = useState(false);
  const [selectedSort, setSelectedSort] = useState<WishlistSort>();
  const listRef = useRef<FlatList<Product>>(null);
  const scrollReturn = useScrollReturn(listRef, JSON.stringify([inStockOnly, selectedSort]));
  const [sortOpen, setSortOpen] = useState(false);
  const [variantProduct, setVariantProduct] = useState<Product>();
  const [variant, setVariant] = useState<WishlistVariant>({});
  const [addingId, setAddingId] = useState<string>();
  const [feedback, setFeedback] = useState<Feedback>();

  const settings = useMemo(
    () =>
      Object.fromEntries(
        (settingsQuery.data ?? []).map((setting) => [
          setting.key,
          String(setting.value ?? ""),
        ]),
      ),
    [settingsQuery.data],
  );
  const recommendationsEnabled =
    settings.app_wishlist_recommendations_enabled !== "false";
  const recommendationQuery = useRecommendationSlugs(recommendationsEnabled);
  const adminRecommendationSlugs = useMemo(
    () =>
      (settings.app_wishlist_recommendation_slugs ?? "")
        .split(/[\n,]+/)
        .map((slug) => slug.trim())
        .filter(Boolean),
    [settings.app_wishlist_recommendation_slugs],
  );
  const recommendationSlugs = useMemo(
    () =>
      adminRecommendationSlugs.length > 0
        ? adminRecommendationSlugs
        : (recommendationQuery.data ?? []),
    [adminRecommendationSlugs, recommendationQuery.data],
  );
  const configuredSort = settings.app_wishlist_default_sort as WishlistSort;
  const sort =
    selectedSort ??
    (sortOptions.some((option) => option.value === configuredSort)
      ? configuredSort
      : "recommended");

  const split = useMemo(
    () => splitWishlistEntries(wishlist, productsQuery.data ?? []),
    [productsQuery.data, wishlist],
  );
  const sortedProducts = useMemo(() => {
    const candidates = filterWishlistProducts(split.available, inStockOnly);
    return sortWishlistProducts(candidates, sort, recommendationSlugs);
  }, [inStockOnly, recommendationSlugs, sort, split.available]);
  const recommendationProducts = useMemo(() => {
    if (!recommendationsEnabled) return [];
    const saved = new Set(wishlist);
    const bySlug = new Map(
      (productsQuery.data ?? []).map((product) => [product.slug, product]),
    );
    return recommendationSlugs
      .map((slug) => bySlug.get(slug))
      .filter((product): product is Product =>
        Boolean(product?.active && product.stock > 0 && !saved.has(product.id)),
      )
      .slice(0, 10);
  }, [
    productsQuery.data,
    recommendationSlugs,
    recommendationsEnabled,
    wishlist,
  ]);

  const savedCount = wishlist.length;
  const subtitle = msg("favorites.savedCount", { count: savedCount });
  const isOffline =
    productsQuery.isError && (productsQuery.data?.length ?? 0) > 0;
  const fatalError =
    productsQuery.isError && (productsQuery.data?.length ?? 0) === 0;

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (active) setSession(data.session);
    });
    const auth = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });
    return () => {
      active = false;
      auth.data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(
      () => setFeedback(undefined),
      feedback.type === "removed" ? 5_000 : 2_600,
    );
    return () => clearTimeout(timer);
  }, [feedback]);

  const openProduct = (product: Product) => {
    router.push({
      pathname: "/product/[slug]",
      params: {
        slug: product.slug,
        origin: "wishlist",
        parentCategory: product.category,
      },
    });
  };

  const removeFavorite = (product: Product) => {
    const selection = selections[product.id];
    toggleWishlist(product.id);
    setFeedback({
      type: "removed",
      message: msg("wishlist.itemRemovedFromYourFavorites"),
      removed: { product, selection },
    });
  };

  const restoreFavorite = () => {
    if (!feedback?.removed) return;
    toggleWishlist(feedback.removed.product.id, feedback.removed.selection);
    setFeedback({ type: "success", message: msg("wishlist.itemRestored") });
  };

  const confirmAdd = async (product: Product, selected: WishlistVariant) => {
    if (addingId) return;
    setAddingId(product.id);
    try {
      const result = await productsQuery.refetch();
      const fresh = result.data?.find((item) => item.id === product.id);
      if (!fresh?.active) throw new Error(msg("wishlist.thisProductIsNoLongerAvailable"));
      if (!isWishlistVariantAvailable(fresh, selected)) {
        throw new Error(
          msg("wishlist.theSelectedVariantHasJustSoldOutChooseAnotherOption"),
        );
      }
      addToCart(fresh, {
        color: selected.color,
        size: selected.size,
        quantity: 1,
      });
      if (selected.color || selected.size) {
        setWishlistSelection(product.id, selected);
      }
      startCartFlight({
        image: fresh.thumbnail || fresh.images[0],
        originX: 240,
        originY: 520,
      });
      if (Platform.OS !== "web") {
        void triggerSuccessHaptic();
      }
      setVariantProduct(undefined);
      setFeedback({
        type: "success",
        message: msg("cart.namedAdded", { name: fresh.name }),
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? localizedError(error)
            : msg("wishlist.unableToAddItemPleaseTryAgain"),
      });
    } finally {
      setAddingId(undefined);
    }
  };

  const prepareAdd = (product: Product) => {
    if (product.preorder_enabled) { router.push({pathname:"/product/[slug]",params:{slug:product.slug}}); return; }
    const selected = defaultWishlistVariant(product, selections[product.id]);
    if (
      requiresWishlistVariant(product) &&
      !isWishlistVariantAvailable(product, selections[product.id])
    ) {
      setVariant(selected);
      setVariantProduct(product);
      return;
    }
    void confirmAdd(product, selected);
  };

  const refresh = async () => {
    await Promise.all([
      productsQuery.refetch(),
      settingsQuery.refetch(),
      recommendationsEnabled
        ? recommendationQuery.refetch()
        : Promise.resolve(),
    ]);
  };

  const header = (
    <>
      <View style={styles.header}>
        <AnimatedPressable
          accessibilityLabel={msg("addresses.back")}
          accessibilityRole="button"
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace("/")
          }
          style={styles.headerAction}
        >
          <Ionicons color={palette.ink} name="arrow-back" size={21} />
        </AnimatedPressable>
        <BrandLogo header />
        <AnimatedPressable
          accessibilityLabel={msg("cart.openWithCount", { count: cartCount })}
          accessibilityRole="button"
          onPress={() => router.push("/cart")}
          style={styles.headerAction}
        >
          <Ionicons color={palette.ink} name="bag-handle-outline" size={21} />
          {cartCount > 0 ? (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>
                {cartCount > 99 ? "99+" : cartCount}
              </Text>
            </View>
          ) : null}
        </AnimatedPressable>
      </View>

      <View style={styles.intro}>
        <Text accessibilityRole="header" style={styles.title}>
          {!settings.app_wishlist_section_title?.trim() || settings.app_wishlist_section_title.trim().toUpperCase() === 'MES FAVORIS' ? msg("common.myFavorites") : settings.app_wishlist_section_title.trim()}
        </Text>
        <Text accessibilityLiveRegion="polite" style={styles.subtitle}>
          {subtitle}
        </Text>
      </View>

      {isOffline ? (
        <StateBanner
          icon="cloud-offline-outline"
          message={msg("wishlist.offlineYourSavedFavoritesAreStillAvailable")}
          onRetry={() => void refresh()}
        />
      ) : null}

      <View style={styles.filters}>
        <View accessibilityRole="tablist" style={styles.filterTabs}>
        <FilterButton
          active={!inStockOnly}
          label={msg("favorites.allCount", { count: savedCount })}
          onPress={() => setInStockOnly(false)}
        />
        <FilterButton
          active={inStockOnly}
          label={msg("productCard.inStock")}
          onPress={() => setInStockOnly(true)}
        />
        </View>
        <AnimatedPressable
          accessibilityRole="button"
          accessibilityLabel={msg("wishlist.sort")}
          accessibilityState={{ expanded: sortOpen }}
          onPress={() => setSortOpen(true)}
          style={styles.sortTrigger}
        >
          <Ionicons name="options-outline" size={17} color="#38513D" />
          <Text style={styles.sortTriggerText}>{msg("wishlist.sort")}</Text>
        </AnimatedPressable>
      </View>

      {split.removed.length > 0 ? (
        <View style={styles.removedState}>
          <View style={styles.removedIcon}>
            <Ionicons color="#6D726E" name="archive-outline" size={19} />
          </View>
          <View style={styles.removedCopy}>
            <Text style={styles.removedTitle}>
              {msg("wishlist.removedCount", { count: split.removed.length })}</Text>
            <Text style={styles.removedText}>
              {msg("wishlist.theseItemsAreNoLongerOfferedAndCanBeRemovedFromYour")}</Text>
          </View>
          <AnimatedPressable
            accessibilityLabel={msg("wishlist.clearUnavailableFavorites")}
            onPress={() =>
              split.removed.forEach((productId) => toggleWishlist(productId))
            }
            style={styles.cleanButton}
          >
            <Text style={styles.cleanButtonText}>{msg("wishlist.clearUppercase")}</Text>
          </AnimatedPressable>
        </View>
      ) : null}
    </>
  );

  return (
    <Screen className="bg-white">
      {productsQuery.isLoading && !productsQuery.data ? (
        <WishlistSkeleton />
      ) : fatalError ? (
        <FullState
          action={msg("notifications.tryAgainUppercase")}
          icon="cloud-offline-outline"
          message={msg("wishlist.unableToLoadYourSavedProducts")}
          onPress={() => void refresh()}
          title={msg("support.signInUnavailable")}
        />
      ) : (
        <FlatList
          ref={listRef}
          {...scrollReturn}
          initialNumToRender={5}
          maxToRenderPerBatch={5}
          updateCellsBatchingPeriod={50}
          windowSize={7}
          removeClippedSubviews={Platform.OS === "android"}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom, 12) + 94 },
          ]}
          data={sortedProducts}
          ItemSeparatorComponent={() => <View style={styles.cardGap} />}
          keyExtractor={(product) => product.id}
          ListEmptyComponent={
            <FullState
              action={
                inStockOnly ? msg("wishlist.viewAllMyFavoritesUppercase") : msg("wishlist.exploreOurProductsUppercase")
              }
              icon={inStockOnly ? "cube-outline" : "heart-outline"}
              message={
                inStockOnly
                  ? msg("wishlist.noneOfYourSavedItemsAreCurrentlyAvailable")
                  : msg("wishlist.saveProductsYouLoveToFindThemHere")
              }
              onPress={() =>
                inStockOnly ? setInStockOnly(false) : router.push("/catalog")
              }
              title={
                inStockOnly
                  ? msg("wishlist.noFavoritesInStock")
                  : msg("common.wishlistEmptyTitle")
              }
            />
          }
          ListFooterComponent={
            <View>
              {recommendationProducts.length > 0 ? (
                <View style={styles.recommendations}>
                  <View style={styles.sectionHeader}>
                    <View>
                      <View style={styles.eyebrowRow}>
                        <View style={styles.eyebrowLine} />
                        <Text style={styles.eyebrow}>{msg("newArrivalsSection.lEcomaxSelectionUppercase")}</Text>
                      </View>
                      <Text style={styles.sectionTitle}>
                        {settings.app_wishlist_recommendations_title?.trim() ||
                          msg("wishlist.youMayAlsoLikeUppercase")}
                      </Text>
                    </View>
                    <AnimatedPressable
                      accessibilityLabel={msg("wishlist.viewAllRecommendations")}
                      onPress={() => router.push("/catalog")}
                      style={styles.seeAll}
                    >
                      <Text style={styles.seeAllText}>{msg("common.viewAll")}</Text>
                      <Ionicons
                        color="#109336"
                        name="arrow-forward"
                        size={15}
                      />
                    </AnimatedPressable>
                  </View>
                  <FlatList
                    contentContainerStyle={styles.recommendationContent}
                    data={recommendationProducts}
                    horizontal
                    initialNumToRender={3}
                    maxToRenderPerBatch={3}
                    windowSize={5}
                    keyExtractor={(product) => product.id}
                    renderItem={({ item }) => (
                      <ProductCard product={item} wide />
                    )}
                    showsHorizontalScrollIndicator={false}
                  />
                </View>
              ) : null}

              {session ? (
                <View style={styles.syncMessage}>
                  <Ionicons color="#109336" name="sync-outline" size={20} />
                  <Text style={styles.syncText}>
                    {msg("wishlist.yourFavoritesFollowYouAcrossYourDevices")}</Text>
                </View>
              ) : null}
            </View>
          }
          ListHeaderComponent={header}
          refreshControl={
            <RefreshControl
              accessibilityLabel={msg("wishlist.refreshFavorites")}
              colors={["#12B83F"]}
              onRefresh={() => void refresh()}
              refreshing={productsQuery.isRefetching}
              tintColor="#12B83F"
            />
          }
          renderItem={({ item }) => (
            <WishlistProductCard
              adding={addingId === item.id}
              onAdd={() => prepareAdd(item)}
              onChoose={() => { setVariant(defaultWishlistVariant(item, selections[item.id])); setVariantProduct(item); }}
              onOpen={() => openProduct(item)}
              onRemove={() => removeFavorite(item)}
              product={item}
              promotionalLabel={settings.app_wishlist_promotional_label?.trim()}
              selection={selections[item.id]}
            />
          )}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Modal
        animationType="fade"
        onRequestClose={() => setSortOpen(false)}
        transparent
        visible={sortOpen}
      >
        <AppViewportOverlay align="bottom">
          <Pressable
            accessibilityLabel={msg("wishlist.closeSortingOptions")}
            onPress={() => setSortOpen(false)}
            style={styles.sheetBackdrop}
          />
          <View
            accessibilityViewIsModal
            style={[
              styles.sheet,
              { paddingBottom: Math.max(insets.bottom, 16) },
            ]}
          >
            <SheetHeader onClose={() => setSortOpen(false)} title={msg("search.sortByUppercase")} />
            {sortOptions.map((option) => (
              <AnimatedPressable
                accessibilityLabel={option.label}
                accessibilityRole="radio"
                accessibilityState={{ checked: sort === option.value }}
                key={option.value}
                onPress={() => {
                  setSelectedSort(option.value);
                  setSortOpen(false);
                }}
                style={[
                  styles.sortOption,
                  sort === option.value && styles.sortOptionSelected,
                ]}
              >
                <Text style={styles.sortOptionText}>{option.label}</Text>
                <Ionicons
                  color={sort === option.value ? "#109336" : "#A1A5A2"}
                  name={
                    sort === option.value
                      ? "checkmark-circle"
                      : "ellipse-outline"
                  }
                  size={22}
                />
              </AnimatedPressable>
            ))}
          </View>
        </AppViewportOverlay>
      </Modal>

      <Modal
        animationType="fade"
        onRequestClose={() => setVariantProduct(undefined)}
        transparent
        visible={Boolean(variantProduct)}
      >
        <AppViewportOverlay align="bottom">
          <Pressable
            accessibilityLabel={msg("wishlist.closeOptionSelector")}
            onPress={() => setVariantProduct(undefined)}
            style={styles.sheetBackdrop}
          />
          {variantProduct ? (
            <View
              accessibilityViewIsModal
              style={[
                styles.sheet,
                { paddingBottom: Math.max(insets.bottom, 16) },
              ]}
            >
              <SheetHeader
                onClose={() => setVariantProduct(undefined)}
                title={msg("wishlist.chooseYourOptionsUppercase")}
              />
              <ScrollView
                contentContainerStyle={styles.variantContent}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.variantProductName}>
                  {variantProduct.name}
                </Text>
                {availableColors(variantProduct).length > 0 ? (
                  <VariantGroup
                    label={msg("wishlist.color")}
                    onSelect={(color) =>
                      setVariant({
                        color,
                        size: availableSizes(variantProduct, color)[0],
                      })
                    }
                    options={availableColors(variantProduct)}
                    selected={variant.color}
                  />
                ) : null}
                {availableSizes(variantProduct, variant.color).some(
                  (size) => size.toLowerCase() !== "taille unique",
                ) ? (
                  <VariantGroup
                    label={msg("shoeSizeGuide.size")}
                    onSelect={(size) =>
                      setVariant((current) => ({ ...current, size }))
                    }
                    options={availableSizes(variantProduct, variant.color)}
                    selected={variant.size}
                  />
                ) : null}
                <AnimatedPressable
                  accessibilityLabel={msg("wishlist.confirmAndAddToCart")}
                  disabled={
                    addingId === variantProduct.id ||
                    !isWishlistVariantAvailable(variantProduct, variant)
                  }
                  onPress={() => void confirmAdd(variantProduct, variant)}
                  style={[
                    styles.confirmButton,
                    (addingId === variantProduct.id ||
                      !isWishlistVariantAvailable(variantProduct, variant)) &&
                      styles.confirmButtonDisabled,
                  ]}
                >
                  {addingId === variantProduct.id ? (
                    <ActivityIndicator color={palette.white} size="small" />
                  ) : (
                    <Ionicons
                      color={palette.white}
                      name="bag-add-outline"
                      size={19}
                    />
                  )}
                  <Text style={styles.confirmButtonText}>
                    {addingId === variantProduct.id
                      ? msg("wishlistProductCard.addingUppercase")
                      : msg("wishlist.addToCartUppercase")}
                  </Text>
                </AnimatedPressable>
              </ScrollView>
            </View>
          ) : null}
        </AppViewportOverlay>
      </Modal>

      {feedback ? (
        <View
          accessibilityLiveRegion="polite"
          style={[
            styles.feedback,
            feedback.type === "error" && styles.feedbackError,
          ]}
        >
          <Ionicons
            color={palette.white}
            name={
              feedback.type === "error"
                ? "alert-circle-outline"
                : feedback.type === "removed"
                  ? "heart-dislike-outline"
                  : "checkmark-circle-outline"
            }
            size={20}
          />
          <Text numberOfLines={2} style={styles.feedbackText}>
            {feedback.message}
          </Text>
          {feedback.type === "removed" ? (
            <AnimatedPressable
              accessibilityLabel={msg("wishlist.undoFavoriteRemoval")}
              onPress={restoreFavorite}
              style={styles.undoButton}
            >
              <Text style={styles.undoText}>{msg("wishlist.undoUppercase")}</Text>
            </AnimatedPressable>
          ) : null}
        </View>
      ) : null}
    </Screen>
  );
}

function FilterButton({
  label,
  active = false,
  icon,
  onPress,
}: {
  label: string;
  active?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  useLocale();
  return (
    <AnimatedPressable
      accessibilityLabel={label}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      haptic={false}
      onPress={onPress}
      style={[styles.filter, active && styles.filterActive]}
    >
      {icon ? <Ionicons color={palette.ink} name={icon} size={15} /> : null}
      <Text style={[styles.filterText, active && styles.filterTextActive]}>
        {label}
      </Text>
    </AnimatedPressable>
  );
}

function StateBanner({
  icon,
  message,
  onRetry,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  message: string;
  onRetry: () => void;
}) {
  useLocale();
  return (
    <View style={styles.stateBanner}>
      <Ionicons color="#6C716D" name={icon} size={19} />
      <Text style={styles.stateBannerText}>{message}</Text>
      <AnimatedPressable
        accessibilityLabel={msg("support.tryAgain")}
        onPress={onRetry}
        style={styles.retrySmall}
      >
        <Text style={styles.retrySmallText}>{msg("notifications.tryAgainUppercase")}</Text>
      </AnimatedPressable>
    </View>
  );
}

function FullState({
  icon,
  title,
  message,
  action,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
  action: string;
  onPress: () => void;
}) {
  useLocale();
  return (
    <View style={styles.fullState}>
      <View style={styles.fullStateIcon}>
        <Ionicons color="#109336" name={icon} size={31} />
      </View>
      <Text style={styles.fullStateTitle}>{title}</Text>
      <Text style={styles.fullStateMessage}>{message}</Text>
      <AnimatedPressable
        accessibilityLabel={action}
        onPress={onPress}
        style={styles.fullStateAction}
      >
        <Text style={styles.fullStateActionText}>{action}</Text>
        <Ionicons color={palette.white} name="arrow-forward" size={17} />
      </AnimatedPressable>
    </View>
  );
}

function WishlistSkeleton() {
  useLocale();
  return (
    <View
      accessibilityLabel={msg("wishlist.loadingFavorites")}
      style={styles.skeletonPage}
    >
      <View style={styles.skeletonHeader}>
        <View style={styles.skeletonAction} />
        <View style={styles.skeletonLogo} />
        <View style={styles.skeletonAction} />
      </View>
      <View style={styles.skeletonTitle} />
      <View style={styles.skeletonSubtitle} />
      <View style={styles.skeletonFilters} />
      {[0, 1].map((item) => (
        <View key={item} style={styles.skeletonCard}>
          <View style={styles.skeletonImage} />
          <View style={styles.skeletonLineWide} />
          <View style={styles.skeletonLine} />
          <View style={styles.skeletonButton} />
        </View>
      ))}
    </View>
  );
}

function SheetHeader({
  title,
  onClose,
}: {
  title: string;
  onClose: () => void;
}) {
  useLocale();
  return (
    <>
      <View style={styles.sheetHandle} />
      <View style={styles.sheetHeader}>
        <Text style={styles.sheetTitle}>{title}</Text>
        <AnimatedPressable
          accessibilityLabel={msg("scanner.close")}
          haptic={false}
          onPress={onClose}
          style={styles.sheetClose}
        >
          <Ionicons color={palette.ink} name="close" size={21} />
        </AnimatedPressable>
      </View>
    </>
  );
}

function VariantGroup({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: string[];
  selected?: string;
  onSelect: (value: string) => void;
}) {
  useLocale();
  return (
    <View style={styles.variantGroup}>
      <Text style={styles.variantGroupLabel}>{label}</Text>
      <View style={styles.variantOptions}>
        {options.map((option) => {
          const active = selected === option;
          return (
            <AnimatedPressable
              accessibilityLabel={`${label} ${localizedContent(option)}`}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
              key={option}
              onPress={() => onSelect(option)}
              style={[
                styles.variantOption,
                active && styles.variantOptionActive,
              ]}
            >
              <Text
                style={[
                  styles.variantOptionText,
                  active && styles.variantOptionTextActive,
                ]}
              >
                {localizedContent(option)}
              </Text>
            </AnimatedPressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  listContent: {flexGrow:1,paddingHorizontal:18,backgroundColor:'#FAFBF9'},
  header: {minHeight:70,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},
  headerAction: {position:'relative',width:42,height:42,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:'#E8EBE2',borderRadius:21,backgroundColor:'#FFFFFF'},
  cartBadge: {position:'absolute',right:-2,top:-2,minWidth:17,height:17,paddingHorizontal:4,alignItems:'center',justifyContent:'center',borderWidth:2,borderColor:'#FAFBF7',borderRadius:9,backgroundColor:'#244A34'},
  cartBadgeText: {color:palette.white,fontFamily:typography.semibold,fontSize:8},
  intro: {paddingTop:12,paddingBottom:20},
  title: {color:'#263F2B',fontFamily:typography.semibold,fontSize:28,lineHeight:35,letterSpacing:-.8},
  subtitle: {marginTop:5,color:'#6E7A6B',fontFamily:typography.regular,fontSize:12,lineHeight:18},
  stateBanner: {
    minHeight: 58,
    marginBottom: 14,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    borderWidth: 1,
    borderColor: "#DDDFDC",
    backgroundColor: "#F6F6F4",
  },
  stateBannerText: {
    minWidth: 0,
    flex: 1,
    color: "#565C58",
    fontFamily: typography.medium,
    fontSize: 9,
    lineHeight: 14,
  },
  retrySmall: { minHeight: 44, justifyContent: "center" },
  retrySmallText: {
    color: palette.ink,
    fontFamily: typography.black,
    fontSize: 8,
    letterSpacing: 0.6,
  },
  filters: {marginBottom:18,flexDirection:'row',alignItems:'center',gap:10},
  filterTabs: {flex:1,minWidth:0,flexDirection:'row',padding:3,borderRadius:13,backgroundColor:'#EDF1E9'},
  filter: {minHeight:44,paddingHorizontal:8,flex:1,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:6,borderRadius:10},
  filterActive: {backgroundColor:'#FFFFFF'},
  filterText: {flexShrink:1,color:'#6A7765',fontFamily:typography.medium,fontSize:11,lineHeight:16,textAlign:'center'},
  filterTextActive: {color:'#294B34',fontFamily:typography.semibold},
  sortTrigger: {minHeight:48,paddingHorizontal:12,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:6,borderWidth:1,borderColor:'#DDE5D8',borderRadius:12,backgroundColor:'#FFFFFF'},
  sortTriggerText: {color:'#38513D',fontFamily:typography.medium,fontSize:11},
  removedState: {
    minHeight: 86,
    marginBottom: 16,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#DDDFDC",
    backgroundColor: "#F6F6F4",
  },
  removedIcon: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8EAE7",
  },
  removedCopy: { minWidth: 0, flex: 1 },
  removedTitle: {
    color: palette.ink,
    fontFamily: typography.bold,
    fontSize: 10,
  },
  removedText: {
    marginTop: 4,
    color: "#686D69",
    fontFamily: typography.regular,
    fontSize: 8,
    lineHeight: 12,
  },
  cleanButton: { minHeight: 44, justifyContent: "center" },
  cleanButtonText: {
    color: palette.red,
    fontFamily: typography.black,
    fontSize: 7.5,
    letterSpacing: 0.6,
  },
  cardGap: {height:20},
  recommendations: { marginHorizontal: -16, marginTop: 35 },
  sectionHeader: {
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 14,
  },
  eyebrowRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  eyebrowLine: { width: 21, height: 2, backgroundColor: "#12B83F" },
  eyebrow: {
    color: "#109336",
    fontFamily: typography.black,
    fontSize: 7,
    letterSpacing: 1,
  },
  sectionTitle: {fontFamily:typography.medium,fontSize:22,lineHeight:29,color:'#2A412E',letterSpacing:-.5,marginTop:7},
  seeAll: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  seeAllText: {
    color: "#109336",
    fontFamily: typography.bold,
    fontSize: 9,
  },
  recommendationContent: {
    gap: 14,
    paddingBottom: 8,
    paddingHorizontal: 16,
    paddingTop: 17,
  },
  syncMessage: {
    minHeight: 64,
    marginTop: 27,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#DDDFDC",
    backgroundColor: "#F6F6F4",
  },
  syncText: {
    color: "#3F4541",
    fontFamily: typography.medium,
    fontSize: 10,
  },
  fullState: {
    minHeight: 360,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  fullStateIcon: {
    width: 72,
    height: 72,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EAF8EE",
  },
  fullStateTitle: {
    marginTop: 20,
    color: palette.ink,
    fontFamily: typography.black,
    fontSize: 22,
    lineHeight: 27,
    textAlign: "center",
  },
  fullStateMessage: {
    maxWidth: 315,
    marginTop: 8,
    color: "#666B67",
    fontFamily: typography.regular,
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
  },
  fullStateAction: {
    minHeight: 52,
    marginTop: 22,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    backgroundColor: palette.ink,
  },
  fullStateActionText: {
    color: palette.white,
    fontFamily: typography.black,
    fontSize: 9,
    letterSpacing: 0.7,
  },
  sheetBackdrop: { position: "absolute", inset: 0 },
  sheet: {maxHeight:'85%',paddingHorizontal:22,paddingTop:11,borderTopLeftRadius:28,borderTopRightRadius:28,backgroundColor:'#FCFDF9'},
  sheetHandle: {
    width: 42,
    height: 4,
    marginBottom: 7,
    marginTop: 9,
    alignSelf: "center",
    borderRadius: 2,
    backgroundColor: "#CDD0CD",
  },
  sheetHeader: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E3E1",
  },
  sheetTitle: {fontFamily:typography.semibold,fontSize:16,color:'#2A412E',letterSpacing:.3},
  sheetClose: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  sortOption: {minHeight:53,marginBottom:7,paddingHorizontal:15,borderWidth:1,borderColor:'#E6EBDF',borderRadius:15,flexDirection:'row',alignItems:'center',justifyContent:'space-between',backgroundColor:'#FFFFFF'},
  sortOptionSelected: {borderColor:'#A7BE9C',backgroundColor:'#EDF4E7'},
  sortOptionText: {fontFamily:typography.medium,fontSize:12,color:'#4F654A'},
  variantContent: { paddingBottom: 4, paddingTop: 15 },
  variantProductName: {
    color: palette.ink,
    fontFamily: typography.black,
    fontSize: 15,
    lineHeight: 20,
  },
  variantGroup: { marginTop: 20 },
  variantGroupLabel: {
    color: palette.ink,
    fontFamily: typography.black,
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  variantOptions: {
    marginTop: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  variantOption: {minWidth:49,minHeight:44,paddingHorizontal:14,borderWidth:1,borderColor:'#E1E7DA',borderRadius:12,alignItems:'center',justifyContent:'center',backgroundColor:'#FFFFFF'},
  variantOptionActive: {
    borderColor: "#12B83F",
    backgroundColor: "#EAF8EE",
  },
  variantOptionText: {
    color: "#5D625E",
    fontFamily: typography.bold,
    fontSize: 10,
  },
  variantOptionTextActive: { color: "#087B2C" },
  confirmButton: {minHeight:52,marginTop:24,paddingHorizontal:18,borderRadius:16,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:9,backgroundColor:'#244A34'},
  confirmButtonDisabled: { opacity: 0.42 },
  confirmButtonText: {
    color: palette.white,
    fontFamily: typography.black,
    fontSize: 10,
    letterSpacing: 0.8,
  },
  feedback: {position:'absolute',bottom:77,left:18,right:18,minHeight:58,paddingHorizontal:16,flexDirection:'row',alignItems:'center',gap:10,borderRadius:18,backgroundColor:'#244A34'},
  feedbackError: { backgroundColor: "#A52222" },
  feedbackText: {
    minWidth: 0,
    flex: 1,
    color: palette.white,
    fontFamily: typography.medium,
    fontSize: 10,
    lineHeight: 15,
  },
  undoButton: { minHeight: 44, justifyContent: "center" },
  undoText: {
    color: "#49DE6D",
    fontFamily: typography.black,
    fontSize: 8,
    letterSpacing: 0.7,
  },
  skeletonPage: {
    flex: 1,
    paddingHorizontal: 16,
    backgroundColor: palette.white,
  },
  skeletonHeader: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  skeletonAction: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: "#ECEEEC",
  },
  skeletonLogo: { width: 104, height: 25, backgroundColor: "#ECEEEC" },
  skeletonTitle: {
    width: 210,
    height: 31,
    marginTop: 15,
    backgroundColor: "#ECEEEC",
  },
  skeletonSubtitle: {
    width: 122,
    height: 11,
    marginTop: 9,
    backgroundColor: "#F0F1F0",
  },
  skeletonFilters: {
    height: 52,
    marginBottom: 17,
    marginTop: 24,
    backgroundColor: "#F0F1F0",
  },
  skeletonCard: {
    marginBottom: 17,
    paddingBottom: 15,
    borderWidth: 1,
    borderColor: "#E2E3E1",
  },
  skeletonImage: { height: 250, backgroundColor: "#ECEEEC" },
  skeletonLineWide: {
    width: "72%",
    height: 17,
    marginLeft: 15,
    marginTop: 15,
    backgroundColor: "#ECEEEC",
  },
  skeletonLine: {
    width: "42%",
    height: 11,
    marginLeft: 15,
    marginTop: 9,
    backgroundColor: "#F0F1F0",
  },
  skeletonButton: {
    height: 52,
    marginHorizontal: 15,
    marginTop: 18,
    backgroundColor: "#E4E6E4",
  },
});
