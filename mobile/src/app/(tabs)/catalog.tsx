import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type TextStyle,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { AnimatedPressable } from "@/components/animated-pressable";
import { useAndroidBackInterceptor } from "@/components/android-back-controller";
import { HorizontalRail } from "@/components/horizontal-rail";
import { ProductCard } from "@/components/product-card";
import { Screen } from "@/components/screen";
import { useAppViewport } from "@/components/app-viewport";
import { ProductSkeleton } from "@/components/skeleton";
import { palette, typography } from "@/constants/theme";
import { useCategories, useProducts } from "@/hooks/use-catalog";
import { useT } from "@/lib/i18n";
import { productGridColumns, TABLET_NAV_RAIL } from "@/lib/responsive";

import { buildProductSearchIndex, searchProductIndex } from "@/lib/product-search";

type Sort = "popular" | "low" | "high" | "new";

const webInputReset =
  Platform.OS === "web"
    ? ({
        outlineStyle: "none",
        outlineWidth: 0,
        outlineColor: "transparent",
      } as unknown as TextStyle)
    : undefined;

export default function CatalogScreen() {
  const params = useLocalSearchParams<{
    category?: string;
    sort?: Sort;
    filters?: string;
    promotion?: string;
  }>();
  return (
    <CatalogContent
      key={`${params.category ?? "all"}:${params.sort ?? "popular"}:${params.filters ?? "closed"}:${params.promotion ?? "false"}`}
      params={params}
    />
  );
}

function CatalogContent({
  params,
}: {
  params: { category?: string; sort?: Sort; filters?: string; promotion?: string };
}) {
  const { t } = useT();
  const promotionOnly = params.promotion === "true";
  const { contentWidth, isTablet } = useAppViewport();
  const columns = productGridColumns(
    isTablet ? contentWidth - TABLET_NAV_RAIL : contentWidth,
  );
  const { data = [], isLoading, refetch, isRefetching } = useProducts();
  const { data: categories = [] } = useCategories();
  const [category, setCategory] = useState(params.category ?? "all");
  const [sort, setSort] = useState<Sort>(params.sort ?? "popular");
  const [query, setQuery] = useState("");
  const [stockOnly, setStockOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(params.filters === "open");
  const [searchFocused, setSearchFocused] = useState(false);
  const searchInputRef = useRef<TextInput>(null);

  const interceptAndroidBack = useCallback(() => {
    if (searchFocused) {
      searchInputRef.current?.blur();
      Keyboard.dismiss();
      return true;
    }
    if (filtersOpen) {
      setFiltersOpen(false);
      return true;
    }
    return false;
  }, [filtersOpen, searchFocused]);
  useAndroidBackInterceptor(interceptAndroidBack);

  useEffect(() => {
    if (Platform.OS !== "android" || !searchFocused) return;
    const subscription = Keyboard.addListener("keyboardDidHide", () => {
      searchInputRef.current?.blur();
    });
    return () => subscription.remove();
  }, [searchFocused]);

  const sorts = [
    { value: "popular" as const, label: t.popular },
    { value: "new" as const, label: t.arrivals },
    { value: "low" as const, label: t.priceLow },
    { value: "high" as const, label: t.priceHigh },
  ];

  const searchIndex = useMemo(() => buildProductSearchIndex(data), [data]);
  const products = useMemo(() => {
    const ranked = searchProductIndex(searchIndex, query);
    const filtered = ranked.filter((item) => {
      const matchesCategory =
        category === "all" ||
        item.category.toLowerCase().includes(category.toLowerCase()) ||
        category.includes(item.category.toLowerCase());
      const matchesPromotion =
        !promotionOnly || (item.original_price ?? 0) > item.price;
      return matchesCategory && matchesPromotion && (!stockOnly || item.stock > 0);
    });

    return [...filtered].sort((left, right) =>
      sort === "low"
        ? left.price - right.price
        : sort === "high"
          ? right.price - left.price
          : sort === "new"
            ? Date.parse(right.created_at) - Date.parse(left.created_at)
            : query.trim() ? 0 : (right.rating ?? 0) - (left.rating ?? 0),
    );
  }, [category, searchIndex, query, sort, stockOnly, promotionOnly]);

  const activeFilterCount = Number(stockOnly) + Number(sort !== "popular");
  const renderProduct = useCallback(
    ({ item }: { item: (typeof products)[number] }) => (
      <ProductCard product={item} grid columns={columns} />
    ),
    [columns],
  );

  return (
    <Screen>
      <Animated.View entering={FadeInDown.duration(350)} style={styles.header}>
        <View style={styles.headingRow}>
          <View style={styles.headingCopy}>
            <View style={styles.eyebrowRow}>
              <View style={styles.eyebrowLine} />
              <Text style={styles.eyebrow}>LECOMAX SHOP</Text>
            </View>
            <Text style={styles.title}>{promotionOnly ? "Promotions" : t.shopTitle}</Text>
            <View style={styles.titleAccent} />
          </View>
          <View style={styles.inventoryCard}>
            <View style={styles.inventoryCountBadge}>
              <Text style={styles.inventoryCount}>{products.length}</Text>
            </View>
            <Text numberOfLines={2} style={styles.inventoryLabel}>
              {t.articlesAvailable}
            </Text>
          </View>
        </View>

        <View style={styles.toolsRow}>
          <View
            style={[
              styles.searchShell,
              searchFocused && styles.searchShellFocused,
            ]}
          >
            <Ionicons
              name="search-outline"
              size={20}
              color={searchFocused ? palette.ink : "#777D78"}
            />
            <TextInput
              ref={searchInputRef}
              accessibilityLabel={t.searchShop}
              value={query}
              onChangeText={setQuery}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder={t.searchShop}
              placeholderTextColor="#929792"
              selectionColor={palette.greenDark}
              style={[styles.searchInput, webInputReset]}
            />
            {query ? (
              <Pressable
                accessibilityLabel="Effacer"
                onPress={() => setQuery("")}
                hitSlop={8}
              >
                <Ionicons name="close-circle" size={20} color="#8E948F" />
              </Pressable>
            ) : null}
          </View>
          <AnimatedPressable
            accessibilityLabel={t.filters}
            onPress={() => setFiltersOpen((open) => !open)}
            style={[
              styles.filterButton,
              filtersOpen && styles.filterButtonActive,
            ]}
          >
            <Ionicons
              name="options-outline"
              size={21}
              color={filtersOpen ? palette.greenDark : palette.ink}
            />
            {activeFilterCount ? (
              <View style={styles.filterCount}>
                <Text style={styles.filterCountText}>{activeFilterCount}</Text>
              </View>
            ) : null}
          </AnimatedPressable>
        </View>
      </Animated.View>

      <View style={styles.categoryBar}>
        <HorizontalRail
          style={styles.categoryRail}
          contentContainerStyle={styles.categoryContent}
        >
          {[{ id: "all", slug: "all", label: t.all }, ...categories].map(
            (item) => {
              const selected = category === item.slug;
              return (
                <AnimatedPressable
                  key={item.id}
                  accessibilityLabel={item.label}
                  accessibilityState={{ selected }}
                  onPress={() => setCategory(item.slug)}
                  style={[
                    styles.categoryChip,
                    selected && styles.categoryChipSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryLabel,
                      selected && styles.categoryLabelSelected,
                    ]}
                  >
                    {item.label}
                  </Text>
                </AnimatedPressable>
              );
            },
          )}
        </HorizontalRail>
      </View>

      {filtersOpen ? (
        <Animated.View
          entering={FadeInDown.duration(250)}
          style={styles.filterPanel}
        >
          <View style={styles.filterHeading}>
            <View style={styles.filterHeadingCopy}>
              <View style={styles.filterHeadingIcon}>
                <Ionicons
                  name="options-outline"
                  size={17}
                  color={palette.greenDark}
                />
              </View>
              <View>
                <Text style={styles.filterEyebrow}>{t.sortResults}</Text>
                <Text style={styles.filterSummary}>
                  {products.length} {t.articlesAvailable}
                </Text>
              </View>
            </View>
            <Pressable
              accessibilityLabel={t.reset}
              onPress={() => {
                setSort("popular");
                setStockOnly(false);
              }}
              style={styles.resetButton}
            >
              <Ionicons
                name="refresh-outline"
                size={13}
                color={palette.greenDark}
              />
              <Text style={styles.resetLink}>{t.reset.toUpperCase()}</Text>
            </Pressable>
          </View>
          <View style={styles.sortGrid}>
            {sorts.map((item) => {
              const selected = sort === item.value;
              return (
                <AnimatedPressable
                  key={item.value}
                  accessibilityLabel={item.label}
                  accessibilityState={{ selected }}
                  onPress={() => setSort(item.value)}
                  style={[
                    styles.sortButton,
                    selected && styles.sortButtonSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.sortLabel,
                      selected && styles.sortLabelSelected,
                    ]}
                  >
                    {item.label}
                  </Text>
                  <View
                    style={[
                      styles.sortIndicator,
                      selected && styles.sortIndicatorSelected,
                    ]}
                  >
                    {selected ? (
                      <Ionicons
                        name="checkmark"
                        size={12}
                        color={palette.white}
                      />
                    ) : null}
                  </View>
                </AnimatedPressable>
              );
            })}
          </View>
          <AnimatedPressable
            accessibilityLabel={t.stockOnly}
            accessibilityRole="switch"
            accessibilityState={{ checked: stockOnly }}
            onPress={() => setStockOnly((value) => !value)}
            style={styles.stockRow}
          >
            <View style={styles.stockIcon}>
              <Ionicons
                name="cube-outline"
                size={18}
                color={palette.greenDark}
              />
            </View>
            <View style={styles.stockCopy}>
              <Text style={styles.stockText}>{t.stockOnly}</Text>
              <Text style={styles.stockHint}>{t.hideUnavailable}</Text>
            </View>
            <View
              style={[
                styles.switchTrack,
                stockOnly && styles.switchTrackActive,
              ]}
            >
              <View
                style={[
                  styles.switchThumb,
                  stockOnly && styles.switchThumbActive,
                ]}
              />
            </View>
          </AnimatedPressable>
        </Animated.View>
      ) : null}

      <FlatList
        key={`catalog-${columns}`}
        data={isLoading ? [] : products}
        numColumns={columns}
        keyExtractor={(item) => item.id}
        renderItem={renderProduct}
        initialNumToRender={columns * 3}
        maxToRenderPerBatch={columns * 3}
        updateCellsBatchingPeriod={50}
        windowSize={7}
        removeClippedSubviews={Platform.OS === "android"}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.productsContent}
        columnWrapperStyle={styles.productRow}
        refreshing={isRefetching}
        onRefresh={() => void refetch()}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.skeletonRow}>
              <ProductSkeleton />
              <ProductSkeleton />
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="search-outline"
                  size={28}
                  color={palette.greenDark}
                />
              </View>
              <Text style={styles.emptyTitle}>{t.noProducts}</Text>
              <Text style={styles.emptyText}>{t.tryAnotherSearch}</Text>
              <AnimatedPressable
                accessibilityLabel={t.reset}
                onPress={() => {
                  setQuery("");
                  setCategory("all");
                  setStockOnly(false);
                  setSort("popular");
                }}
                style={styles.emptyButton}
              >
                <Text style={styles.emptyButtonText}>
                  {t.reset.toUpperCase()}
                </Text>
              </AnimatedPressable>
            </View>
          )
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 18,
    paddingTop: 17,
    paddingBottom: 14,
    backgroundColor: palette.white,
  },
  headingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headingCopy: { flex: 1, paddingRight: 18 },
  eyebrowRow: { flexDirection: "row", alignItems: "center" },
  eyebrowLine: {
    width: 18,
    height: 2,
    marginRight: 8,
    borderRadius: 1,
    backgroundColor: palette.green,
  },
  eyebrow: {
    color: palette.greenDark,
    fontFamily: typography.black,
    fontSize: 7.5,
    letterSpacing: 1.8,
  },
  title: {
    marginTop: 7,
    color: palette.ink,
    fontFamily: typography.black,
    fontSize: 34,
    lineHeight: 38,
    letterSpacing: -1.35,
  },
  titleAccent: {
    width: 34,
    height: 3,
    marginTop: 9,
    borderRadius: 2,
    backgroundColor: palette.green,
  },
  inventoryCard: {
    width: 112,
    minHeight: 54,
    padding: 7,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DDEBE1",
    borderRadius: 16,
    backgroundColor: "#F4FAF5",
  },
  inventoryCountBadge: {
    width: 38,
    height: 38,
    marginRight: 9,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: palette.green,
  },
  inventoryCount: {
    color: palette.white,
    fontFamily: typography.black,
    fontSize: 16,
    lineHeight: 19,
  },
  inventoryLabel: {
    flex: 1,
    color: palette.ink,
    fontFamily: typography.bold,
    fontSize: 7,
    lineHeight: 10,
  },
  toolsRow: { marginTop: 15, flexDirection: "row", gap: 8 },
  searchShell: {
    height: 54,
    paddingHorizontal: 14,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DDE2DE",
    borderRadius: 10,
    backgroundColor: palette.white,
  },
  searchShellFocused: {
    borderColor: palette.ink,
    backgroundColor: palette.white,
    shadowColor: palette.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  searchInput: {
    minWidth: 0,
    height: "100%",
    marginHorizontal: 10,
    flex: 1,
    borderWidth: 0,
    color: palette.ink,
    fontFamily: typography.medium,
    fontSize: 11,
  },
  filterButton: {
    width: 54,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#DDE2DE",
    borderRadius: 16,
    backgroundColor: palette.white,
    shadowColor: palette.ink,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.055,
    shadowRadius: 8,
    elevation: 1,
  },
  filterButtonActive: {
    borderColor: "#9FD9AD",
    backgroundColor: "#ECF8EF",
    shadowColor: palette.greenDark,
    shadowOpacity: 0.09,
    elevation: 2,
  },
  filterCount: {
    position: "absolute",
    top: -5,
    right: -5,
    minWidth: 19,
    height: 19,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: palette.white,
    borderRadius: 10,
    backgroundColor: palette.red,
  },
  filterCountText: {
    color: palette.white,
    fontFamily: typography.black,
    fontSize: 8,
    lineHeight: 10,
  },
  categoryBar: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#E8EBE9",
    backgroundColor: palette.white,
  },
  categoryRail: { height: 53 },
  categoryContent: { paddingHorizontal: 18, alignItems: "center", gap: 7 },
  categoryChip: {
    height: 43,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  categoryChipSelected: { borderBottomColor: palette.ink },
  categoryLabel: {
    color: "#747A75",
    fontFamily: typography.bold,
    fontSize: 10,
  },
  categoryLabelSelected: { color: palette.ink, fontFamily: typography.black },
  filterPanel: {
    marginHorizontal: 12,
    marginTop: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E7E3",
    borderRadius: 24,
    backgroundColor: "#F8F9F8",
    shadowColor: palette.ink,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
    elevation: 2,
  },
  filterHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  filterHeadingCopy: { flexDirection: "row", alignItems: "center" },
  filterHeadingIcon: {
    width: 38,
    height: 38,
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#E7F6EB",
  },
  filterEyebrow: {
    color: palette.ink,
    fontFamily: typography.black,
    fontSize: 12,
    letterSpacing: -0.15,
  },
  filterSummary: {
    marginTop: 3,
    color: palette.muted,
    fontFamily: typography.medium,
    fontSize: 8,
  },
  resetButton: {
    minHeight: 28,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 8,
    backgroundColor: "transparent",
  },
  resetLink: {
    color: palette.greenDark,
    fontFamily: typography.black,
    fontSize: 7.5,
  },
  sortGrid: {
    marginTop: 14,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 8,
  },
  sortButton: {
    width: "48.8%",
    minHeight: 44,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#DFE4E0",
    borderRadius: 14,
    backgroundColor: palette.white,
  },
  sortButtonSelected: {
    borderColor: "#A9DDB6",
    backgroundColor: "#ECF8EF",
    shadowColor: palette.greenDark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 7,
    elevation: 1,
  },
  sortLabel: { color: "#626863", fontFamily: typography.bold, fontSize: 9.5 },
  sortLabelSelected: { color: palette.ink, fontFamily: typography.black },
  sortIndicator: {
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#D9DEDA",
    borderRadius: 9,
    backgroundColor: "#FAFBFA",
  },
  sortIndicatorSelected: {
    borderColor: palette.green,
    backgroundColor: palette.green,
  },
  stockRow: {
    minHeight: 62,
    marginTop: 14,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderWidth: 1,
    borderColor: "#DFE5E0",
    borderRadius: 16,
    backgroundColor: palette.white,
  },
  stockIcon: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#ECF8EF",
  },
  stockCopy: { minWidth: 0, marginLeft: 10, flex: 1 },
  stockText: {
    color: palette.ink,
    fontFamily: typography.bold,
    fontSize: 10.5,
  },
  stockHint: {
    marginTop: 3,
    color: palette.muted,
    fontFamily: typography.medium,
    fontSize: 8,
  },
  switchTrack: {
    width: 42,
    height: 24,
    padding: 3,
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#E1E5E2",
  },
  switchTrackActive: { backgroundColor: palette.green },
  switchThumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: palette.white,
    shadowColor: palette.ink,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  switchThumbActive: { transform: [{ translateX: 18 }] },
  productsContent: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 125,
    rowGap: 22,
    flexGrow: 1,
  },
  productRow: { justifyContent: "space-between" },
  skeletonRow: { flexDirection: "row", justifyContent: "space-between" },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
    paddingVertical: 58,
  },
  emptyIcon: {
    width: 58,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: "#EAF7ED",
  },
  emptyTitle: {
    marginTop: 15,
    color: palette.ink,
    fontFamily: typography.black,
    fontSize: 17,
  },
  emptyText: {
    marginTop: 7,
    color: palette.muted,
    fontFamily: typography.regular,
    fontSize: 10,
    lineHeight: 15,
    textAlign: "center",
  },
  emptyButton: {
    height: 44,
    marginTop: 17,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: palette.ink,
  },
  emptyButtonText: {
    color: palette.white,
    fontFamily: typography.black,
    fontSize: 9,
    letterSpacing: 0.8,
  },
});
