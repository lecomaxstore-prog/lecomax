import { localizedError } from "@/i18n/errors";
import { selectPromotionProducts } from "@/lib/store-promotions";
import { msg, useLocale } from "@/i18n";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useCallback, useMemo, useRef } from "react";
import { useScrollReturn } from "@/hooks/use-scroll-return";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AnimatedPressable } from "@/components/animated-pressable";
import { useAppViewport } from "@/components/app-viewport";
import { CampaignHero } from "@/components/campaign-hero";
import { NotificationOptIn } from "@/components/notification-opt-in";
import { CategoryShortcuts } from "@/components/category-shortcuts";
import { HomeHeader } from "@/components/home-header";
import { HomePromotionSection } from "@/components/home-promotion-section";
import { HomeSearchBar } from "@/components/home-search-bar";
import { HomeSignupOffer } from "@/components/home-signup-offer";
import { NewArrivalsSection } from "@/components/new-arrivals-section";
import { ProductCard } from "@/components/product-card";
import { SkeletonLoader } from "@/components/skeleton-loader";
import { TrustStrip } from "@/components/trust-strip";
import { typography } from "@/constants/theme";
import {
  useBanners,
  useCategories,
  useProducts,
  usePromotions,
  useSettings,
} from "@/hooks/use-catalog";
import { discount } from "@/lib/format";
import {
  completeRowCount,
  GRID_EDGE,
  GRID_GUTTER,
  productCardPixelWidth,
  productGridColumns,
  rowAlignedCount,
  TABLET_NAV_RAIL,
} from "@/lib/responsive";
import type { Product } from "@/types/commerce";

const colors = {
  background: "#FFFFFF",
  surface: "#F6F7F5",
  text: "#111111",
  textSecondary: "#626662",
  primary: "#32CD57",
  primaryDark: "#11843A",
  border: "#E3E6E2",
};

export default function HomeScreen() {
  useLocale();
  const scrollRef = useRef<ScrollView>(null);
  const scrollReturn = useScrollReturn(scrollRef);
  const { contentWidth, isTablet } = useAppViewport();
  // On tablets the navigation rail sits inside contentWidth, so the row the
  // cards actually get is narrower than the viewport.
  const gridWidth = isTablet ? contentWidth - TABLET_NAV_RAIL : contentWidth;
  const columns = productGridColumns(gridWidth);
  const productsQuery = useProducts();
  const categoriesQuery = useCategories();
  const bannersQuery = useBanners();
  const promotionsQuery = usePromotions();
  const settingsQuery = useSettings();
  const settingEnabled = useCallback(
    (key: string) => {
      const setting = settingsQuery.data?.find((item) => item.key === key);
      return setting ? setting.value !== "false" : true;
    },
    [settingsQuery.data],
  );
  const refreshing =
    productsQuery.isRefetching ||
    categoriesQuery.isRefetching ||
    bannersQuery.isRefetching ||
    promotionsQuery.isRefetching;

  const newArrivals = useMemo(() => {
    const products = productsQuery.data ?? [];
    const selected = products.filter((product) => product.newArrival);
    const sorted = [...(selected.length ? selected : products)].sort(
      (left, right) =>
        Date.parse(right.created_at) - Date.parse(left.created_at),
    );
    const pool = sorted.slice(0, rowAlignedCount(4, columns));
    return pool.slice(0, completeRowCount(pool.length, columns));
  }, [columns, productsQuery.data]);

  const promotionProducts = useMemo(() => {
    const products = productsQuery.data ?? [];
    return selectPromotionProducts(products, promotionsQuery.data ?? [])
      .sort(
        (left, right) =>
          discount(right.price, right.original_price) -
          discount(left.price, left.original_price),
      ).slice(0, 5);
  }, [productsQuery.data, promotionsQuery.data]);

  const catalogProducts = useMemo(() => {
    const products = productsQuery.data ?? [];
    const reserved = new Set([
      ...newArrivals.map((product) => product.id),
      ...promotionProducts.map((product) => product.id),
    ]);
    const remaining = products
      .filter((product) => !reserved.has(product.id))
      .sort(
        (left, right) =>
          Number(right.featured) - Number(left.featured) ||
          (right.rating ?? 0) - (left.rating ?? 0) ||
          Date.parse(right.created_at) - Date.parse(left.created_at),
      );
    const pool = (remaining.length ? remaining : products).slice(
      0,
      rowAlignedCount(8, columns),
    );
    return pool.slice(0, completeRowCount(pool.length, columns));
  }, [columns, newArrivals, productsQuery.data, promotionProducts]);

  const refresh = useCallback(() => {
    void Promise.all([
      productsQuery.refetch(),
      categoriesQuery.refetch(),
      bannersQuery.refetch(),
      promotionsQuery.refetch(),
      settingsQuery.refetch(),
    ]);
  }, [
    bannersQuery,
    categoriesQuery,
    productsQuery,
    promotionsQuery,
    settingsQuery,
  ]);

  const productError =
    productsQuery.error instanceof Error
      ? localizedError(productsQuery.error)
      : msg("home.unableToLoadNewArrivals");

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <ScrollView
        ref={scrollRef}
        {...scrollReturn}
        style={styles.list}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={colors.primaryDark}
            colors={[colors.primary]}
            progressBackgroundColor={colors.background}
          />
        }
      >
        <HomeHeader />
        <HomeSearchBar />

        {bannersQuery.isPending ? (
          <View style={styles.heroSkeleton}>
            <SkeletonLoader count={1} />
          </View>
        ) : (
          <CampaignHero banner={bannersQuery.data?.[0]} />
        )}

        <CategoryShortcuts categories={categoriesQuery.data ?? []} />
        {categoriesQuery.isError ? (
          <Text style={styles.categoryError}>
            {msg("home.categoriesCouldNotBeRefreshed")}</Text>
        ) : null}

        {productsQuery.isPending ? (
          <View style={styles.productSkeleton}>
            <SkeletonLoader count={4} />
          </View>
        ) : productsQuery.isError ? (
          <InlineState
            icon="cloud-offline-outline"
            title={msg("home.unableToConnect")}
            description={productError}
            action={msg("support.tryAgain")}
            onPress={() => void productsQuery.refetch()}
          />
        ) : (
          <>
            {settingEnabled("app_home_promotions") ? (
              <HomePromotionSection products={promotionProducts} />
            ) : null}

            {settingEnabled("app_home_new_arrivals") ? (
              <>
                <NewArrivalsSection count={newArrivals.length} />
                <ProductGrid products={newArrivals} />
              </>
            ) : null}

            {settingEnabled("app_home_products") ? (
              <>
                <CollectionHeader
                  eyebrow={msg("home.theLEcomaxShopUppercase")}
                  title={msg("home.ourProductsUppercase")}
                  description={msg("home.aSelectionDesignedForYourEveryday")}
                  action={msg("home.exploreAll")}
                  onPress={() => router.push("/catalog")}
                />
                <ProductGrid products={catalogProducts} />
              </>
            ) : null}

            <AnimatedPressable
              accessibilityRole="button"
              accessibilityLabel={msg("home.exploreTheWholeShop")}
              onPress={() => router.push("/catalog")}
              style={styles.catalogCta}
            >
              <Text style={styles.catalogCtaText}>
                {msg("home.exploreTheWholeShop")}
              </Text>
              <View style={styles.catalogCtaArrow}>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
              </View>
            </AnimatedPressable>
          </>
        )}

        <TrustStrip />
        {settingEnabled("enable_newsletter") &&
        settingEnabled("app_home_welcome_offer") ? (
          <HomeSignupOffer />
        ) : null}
        <View style={{ paddingHorizontal: 16, marginTop: 20 }}><NotificationOptIn /></View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InlineState({
  icon,
  title,
  description,
  action,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  action?: string;
  onPress?: () => void;
}) {
  useLocale();
  return (
    <View accessibilityLiveRegion="polite" style={styles.state}>
      <View style={styles.stateIcon}>
        <Ionicons name={icon} size={24} color={colors.primaryDark} />
      </View>
      <View style={styles.stateCopy}>
        <Text style={styles.stateTitle}>{title}</Text>
        <Text style={styles.stateDescription}>{description}</Text>
      </View>
      {action && onPress ? (
        <AnimatedPressable
          accessibilityLabel={action}
          onPress={onPress}
          style={styles.retry}
        >
          <Text style={styles.retryText}>{action}</Text>
        </AnimatedPressable>
      ) : null}
    </View>
  );
}

function ProductGrid({ products }: { products: Product[] }) {
  useLocale();
  const { contentWidth, isTablet } = useAppViewport();
  const gridWidth = isTablet ? contentWidth - TABLET_NAV_RAIL : contentWidth;
  const columns = productGridColumns(gridWidth);
  const cardWidth = productCardPixelWidth(gridWidth, columns);
  if (!products.length) {
    return (
      <InlineState
        icon="sparkles-outline"
        title={msg("home.newProductsAreOnTheirWay")}
        description={msg("home.comeBackSoonToExploreTheNextSelection")}
      />
    );
  }

  return (
    <View style={styles.productGrid}>
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          grid
          columns={columns}
          width={cardWidth}
        />
      ))}
    </View>
  );
}

function CollectionHeader({
  eyebrow,
  title,
  description,
  action,
  onPress,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action: string;
  onPress: () => void;
}) {
  useLocale();
  return (
    <View style={styles.collectionHeader}>
      <Text style={styles.collectionEyebrow}>{eyebrow}</Text>
      <View style={styles.collectionHeadingRow}>
        <Text accessibilityRole="header" style={styles.collectionTitle}>
          {title}
        </Text>
      <AnimatedPressable
        accessibilityRole="button"
        accessibilityLabel={action}
        hitSlop={4}
        onPress={onPress}
        style={styles.collectionAction}
      >
        <Text style={styles.collectionActionText}>{action}</Text>
        <Ionicons name="arrow-forward" size={13} color="#203D2C" />
      </AnimatedPressable>
      </View>
      <Text style={styles.collectionDescription}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    width: "100%",
    maxWidth: "100%",
    overflow: "hidden",
  },
  content: {
    width: "100%",
    maxWidth: "100%",
    paddingBottom: 32,
    backgroundColor: colors.background,
  },
  heroSkeleton: {
    minHeight: 360,
    marginHorizontal: 16,
    overflow: "hidden",
    borderRadius: 14,
    backgroundColor: colors.surface,
  },
  productGrid: {
    paddingHorizontal: GRID_EDGE,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GRID_GUTTER,
  },
  productSkeleton: {
    minHeight: 330,
    marginHorizontal: 16,
    marginTop: 28,
  },
  collectionHeader: {
    marginTop: 30,
    marginBottom: 18,
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 6,
  },
  collectionHeadingRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    columnGap: 12,
    rowGap: 8,
  },
  collectionEyebrow: {
    color: "#667363",
    fontFamily: typography.semibold,
    fontSize: 8,
    lineHeight: 12,
    letterSpacing: 1.5,
  },
  collectionTitle: {
    flexShrink: 1,
    color: "#203D2C",
    fontFamily: typography.bold,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.6,
  },
  collectionDescription: {
    color: colors.textSecondary,
    fontFamily: typography.regular,
    fontSize: 11,
    lineHeight: 16,
  },
  collectionAction: {
    minHeight: 36,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 18,
    backgroundColor: "#EFF4EC",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  collectionActionText: {
    color: "#203D2C",
    fontFamily: typography.semibold,
    fontSize: 10,
    lineHeight: 14,
  },
  catalogCta: {
    minHeight: 64,
    marginHorizontal: 16,
    marginTop: 22,
    paddingLeft: 20,
    paddingRight: 12,
    paddingVertical: 12,
    gap: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 18,
    backgroundColor: "#203D2C",
    borderWidth: 1,
    borderColor: "#35533F",
  },
  catalogCtaText: {
    flex: 1,
    color: "#FFFFFF",
    fontFamily: typography.semibold,
    fontSize: 14,
    lineHeight: 21,
    letterSpacing: -0.15,
  },
  catalogCtaArrow: {
    width: 38,
    height: 38,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  categoryError: {
    marginHorizontal: 16,
    marginTop: 8,
    color: colors.textSecondary,
    fontFamily: typography.medium,
    fontSize: 9,
    textAlign: "center",
  },
  state: {
    minHeight: 104,
    marginHorizontal: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.surface,
  },
  stateIcon: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#E7F6EB",
  },
  stateCopy: { minWidth: 0, marginLeft: 11, flex: 1 },
  stateTitle: {
    color: colors.text,
    fontFamily: typography.black,
    fontSize: 12,
  },
  stateDescription: {
    marginTop: 4,
    color: colors.textSecondary,
    fontFamily: typography.regular,
    fontSize: 9,
    lineHeight: 13,
  },
  retry: {
    minWidth: 72,
    minHeight: 44,
    marginLeft: 8,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: colors.text,
  },
  retryText: {
    color: colors.background,
    fontFamily: typography.black,
    fontSize: 8,
  },
});
