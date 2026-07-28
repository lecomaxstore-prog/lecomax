import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import type { Session } from "@supabase/supabase-js";
import { useEffect, useMemo, useState } from "react";
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
import { palette, typography, ui } from "@/constants/theme";
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
  { value: "recommended", label: "Recommandés" },
  { value: "price-asc", label: "Prix croissant" },
  { value: "price-desc", label: "Prix décroissant" },
  { value: "newest", label: "Nouveautés" },
  { value: "rating", label: "Meilleures notes" },
];

type Feedback = {
  type: "success" | "error" | "removed";
  message: string;
  removed?: { product: Product; selection?: WishlistVariant };
};

export default function WishlistScreen() {
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
  const subtitle = `${savedCount} article${savedCount === 1 ? "" : "s"} enregistré${savedCount === 1 ? "" : "s"}`;
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
      message: "Article retiré de vos favoris.",
      removed: { product, selection },
    });
  };

  const restoreFavorite = () => {
    if (!feedback?.removed) return;
    toggleWishlist(feedback.removed.product.id, feedback.removed.selection);
    setFeedback({ type: "success", message: "Article restauré." });
  };

  const confirmAdd = async (product: Product, selected: WishlistVariant) => {
    if (addingId) return;
    setAddingId(product.id);
    try {
      const result = await productsQuery.refetch();
      const fresh = result.data?.find((item) => item.id === product.id);
      if (!fresh?.active) throw new Error("Ce produit n’est plus disponible.");
      if (!isWishlistVariantAvailable(fresh, selected)) {
        throw new Error(
          "La variante choisie vient d’être épuisée. Sélectionnez une autre option.",
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
        message: `${fresh.name} ajouté au panier.`,
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Ajout impossible. Veuillez réessayer.",
      });
    } finally {
      setAddingId(undefined);
    }
  };

  const prepareAdd = (product: Product) => {
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
          accessibilityLabel="Retour"
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
          accessibilityLabel={`Ouvrir le panier, ${cartCount} article${cartCount === 1 ? "" : "s"}`}
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
        <Text style={styles.title}>
          {settings.app_wishlist_section_title?.trim() || "MES FAVORIS"}
        </Text>
        <Text accessibilityLiveRegion="polite" style={styles.subtitle}>
          {subtitle}
        </Text>
      </View>

      {isOffline ? (
        <StateBanner
          icon="cloud-offline-outline"
          message="Mode hors ligne · vos favoris enregistrés restent accessibles."
          onRetry={() => void refresh()}
        />
      ) : null}

      <View accessibilityRole="tablist" style={styles.filters}>
        <FilterButton
          active={!inStockOnly}
          label={`TOUS (${savedCount})`}
          onPress={() => setInStockOnly(false)}
        />
        <FilterButton
          active={inStockOnly}
          label="EN STOCK"
          onPress={() => setInStockOnly(true)}
        />
        <FilterButton
          icon="swap-vertical"
          label="TRIER"
          onPress={() => setSortOpen(true)}
        />
      </View>

      {split.removed.length > 0 ? (
        <View style={styles.removedState}>
          <View style={styles.removedIcon}>
            <Ionicons color="#6D726E" name="archive-outline" size={19} />
          </View>
          <View style={styles.removedCopy}>
            <Text style={styles.removedTitle}>
              {split.removed.length} article
              {split.removed.length > 1 ? "s" : ""} retiré
              {split.removed.length > 1 ? "s" : ""} du catalogue
            </Text>
            <Text style={styles.removedText}>
              Ces références ne sont plus proposées et peuvent être supprimées
              de votre liste.
            </Text>
          </View>
          <AnimatedPressable
            accessibilityLabel="Nettoyer les favoris indisponibles"
            onPress={() =>
              split.removed.forEach((productId) => toggleWishlist(productId))
            }
            style={styles.cleanButton}
          >
            <Text style={styles.cleanButtonText}>NETTOYER</Text>
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
          action="RÉESSAYER"
          icon="cloud-offline-outline"
          message="Impossible de charger vos produits enregistrés."
          onPress={() => void refresh()}
          title="Connexion indisponible"
        />
      ) : (
        <FlatList
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
                inStockOnly ? "VOIR TOUS MES FAVORIS" : "DÉCOUVRIR NOS PRODUITS"
              }
              icon={inStockOnly ? "cube-outline" : "heart-outline"}
              message={
                inStockOnly
                  ? "Aucun de vos articles enregistrés n’est disponible actuellement."
                  : "Enregistrez les produits qui vous plaisent pour les retrouver ici."
              }
              onPress={() =>
                inStockOnly ? setInStockOnly(false) : router.push("/catalog")
              }
              title={
                inStockOnly
                  ? "Aucun favori en stock"
                  : "Votre sélection commence ici"
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
                        <Text style={styles.eyebrow}>SÉLECTION L’ECOMAX</Text>
                      </View>
                      <Text style={styles.sectionTitle}>
                        {settings.app_wishlist_recommendations_title?.trim() ||
                          "VOUS AIMEREZ AUSSI"}
                      </Text>
                    </View>
                    <AnimatedPressable
                      accessibilityLabel="Voir toutes les recommandations"
                      onPress={() => router.push("/catalog")}
                      style={styles.seeAll}
                    >
                      <Text style={styles.seeAllText}>Voir tout</Text>
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
                    Vos favoris vous suivent sur tous vos appareils.
                  </Text>
                </View>
              ) : null}
            </View>
          }
          ListHeaderComponent={header}
          refreshControl={
            <RefreshControl
              accessibilityLabel="Actualiser les favoris"
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
            accessibilityLabel="Fermer le tri"
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
            <SheetHeader onClose={() => setSortOpen(false)} title="TRIER PAR" />
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
            accessibilityLabel="Fermer le choix des options"
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
                title="CHOISIR VOS OPTIONS"
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
                    label="Couleur"
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
                    label="Taille"
                    onSelect={(size) =>
                      setVariant((current) => ({ ...current, size }))
                    }
                    options={availableSizes(variantProduct, variant.color)}
                    selected={variant.size}
                  />
                ) : null}
                <AnimatedPressable
                  accessibilityLabel="Confirmer et ajouter au panier"
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
                      ? "AJOUT EN COURS…"
                      : "AJOUTER AU PANIER"}
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
              accessibilityLabel="Annuler la suppression du favori"
              onPress={restoreFavorite}
              style={styles.undoButton}
            >
              <Text style={styles.undoText}>ANNULER</Text>
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
  return (
    <View style={styles.stateBanner}>
      <Ionicons color="#6C716D" name={icon} size={19} />
      <Text style={styles.stateBannerText}>{message}</Text>
      <AnimatedPressable
        accessibilityLabel="Réessayer"
        onPress={onRetry}
        style={styles.retrySmall}
      >
        <Text style={styles.retrySmallText}>RÉESSAYER</Text>
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
  return (
    <View
      accessibilityLabel="Chargement des favoris"
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
  return (
    <>
      <View style={styles.sheetHandle} />
      <View style={styles.sheetHeader}>
        <Text style={styles.sheetTitle}>{title}</Text>
        <AnimatedPressable
          accessibilityLabel="Fermer"
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
  return (
    <View style={styles.variantGroup}>
      <Text style={styles.variantGroupLabel}>{label}</Text>
      <View style={styles.variantOptions}>
        {options.map((option) => {
          const active = selected === option;
          return (
            <AnimatedPressable
              accessibilityLabel={`${label} ${option}`}
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
                {option}
              </Text>
            </AnimatedPressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    backgroundColor: palette.white,
  },
  header: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerAction: {
    position: "relative",
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#DDE0DC",
    borderRadius: 12,
    backgroundColor: palette.white,
  },
  cartBadge: {
    position: "absolute",
    right: -4,
    top: -5,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: palette.white,
    borderRadius: 9,
    backgroundColor: palette.red,
  },
  cartBadgeText: {
    color: palette.white,
    fontFamily: typography.black,
    fontSize: 8,
  },
  intro: { paddingBottom: 23, paddingTop: 12 },
  title: {
    color: "#080808",
    fontFamily: typography.black,
    fontSize: 32,
    lineHeight: 36,
    letterSpacing: -1.15,
  },
  subtitle: {
    marginTop: 5,
    color: "#666B67",
    fontFamily: typography.medium,
    fontSize: 11,
  },
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
  filters: {
    minHeight: 53,
    marginBottom: 17,
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#DDDFDC",
  },
  filter: {
    minHeight: 52,
    paddingHorizontal: 12,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
  filterActive: { borderBottomColor: "#12B83F" },
  filterText: {
    color: "#686D69",
    fontFamily: typography.black,
    fontSize: 8.5,
    letterSpacing: 0.6,
  },
  filterTextActive: { color: "#080808" },
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
  cardGap: { height: 17 },
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
  sectionTitle: {
    marginTop: 7,
    color: palette.ink,
    fontFamily: typography.black,
    fontSize: 22,
    lineHeight: 26,
    letterSpacing: -0.7,
  },
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
  sheet: {
    maxHeight: "82%",
    paddingHorizontal: 16,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    backgroundColor: palette.white,
  },
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
  sheetTitle: {
    color: palette.ink,
    fontFamily: typography.black,
    fontSize: 18,
    letterSpacing: -0.3,
  },
  sheetClose: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  sortOption: {
    minHeight: 57,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#E8E9E7",
  },
  sortOptionSelected: { backgroundColor: "#F0FAF3" },
  sortOptionText: {
    color: palette.ink,
    fontFamily: typography.bold,
    fontSize: 12,
  },
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
  variantOption: {
    minWidth: 52,
    minHeight: 44,
    paddingHorizontal: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#CFD2CF",
    backgroundColor: palette.white,
  },
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
  confirmButton: {
    minHeight: ui.control.large,
    marginTop: 26,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    backgroundColor: "#080808",
  },
  confirmButtonDisabled: { opacity: 0.42 },
  confirmButtonText: {
    color: palette.white,
    fontFamily: typography.black,
    fontSize: 10,
    letterSpacing: 0.8,
  },
  feedback: {
    position: "absolute",
    bottom: 77,
    left: 16,
    right: 16,
    minHeight: 58,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 8,
    backgroundColor: "#080808",
  },
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
