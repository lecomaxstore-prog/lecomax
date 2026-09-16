import { localizedContent } from "@/i18n/content";
import { msg, useLocale } from "@/i18n";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
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
import { AnimatedPressable } from "@/components/animated-pressable";
import { useAndroidBackInterceptor } from "@/components/android-back-controller";
import { BrandLogo } from "@/components/brand-logo";
import { HeaderActionButton } from "@/components/header-action-button";
import { Screen } from "@/components/screen";
import { SearchProductCard } from "@/components/search-product-card";
import { typography } from "@/constants/theme";
import { useCategories, useProducts, useSettings } from "@/hooks/use-catalog";
import { useScrollReturn } from "@/hooks/use-scroll-return";
import { categoryCampaignImage } from "@/lib/category-campaign-images";
import { imageUrl, money } from "@/lib/format";
import { useCommerceStore } from "@/stores/commerce";
import { buildProductSearchIndex, searchProductIndex } from "@/lib/product-search";
import type { Product } from "@/types/commerce";

const colors = {
  background: "#FFFFFF",
  text: "#0B0B0B",
  secondaryText: "#555955",
  primary: "#29C954",
  primaryDark: "#10843A",
  surface: "#F2F3F1",
  border: "#D9DCD8",
  notification: "#E53935",
};

type Sort = "popular" | "new" | "low" | "high";

const webInputReset =
  Platform.OS === "web"
    ? ({
        outlineStyle: "none",
        outlineWidth: 0,
        outlineColor: "transparent",
      } as unknown as TextStyle)
    : undefined;

export default function SearchScreen() {
  useLocale();
  const params = useLocalSearchParams<{ scanned?: string }>();
  const productsQuery = useProducts();
  const categoriesQuery = useCategories();
  const settingsQuery = useSettings();
  const inputRef = useRef<TextInput>(null);
  const appliedScan = useRef(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sort, setSort] = useState<Sort>("popular");
  const [stockOnly, setStockOnly] = useState(false);
  const [promotionOnly, setPromotionOnly] = useState(false);
  const listRef = useRef<FlatList<Product>>(null);
  const scrollReturn = useScrollReturn(listRef, JSON.stringify([debouncedQuery, sort, stockOnly, promotionOnly]));

  const interceptAndroidBack = useCallback(() => {
    if (focused) {
      inputRef.current?.blur();
      Keyboard.dismiss();
      return true;
    }
    if (filtersOpen) {
      setFiltersOpen(false);
      return true;
    }
    return false;
  }, [filtersOpen, focused]);
  useAndroidBackInterceptor(interceptAndroidBack);

  useEffect(() => {
    if (Platform.OS !== "android" || !focused) return;
    const subscription = Keyboard.addListener("keyboardDidHide", () => {
      inputRef.current?.blur();
    });
    return () => subscription.remove();
  }, [focused]);

  const cartCount = useCommerceStore((state) =>
    state.cart.reduce((total, line) => total + line.quantity, 0),
  );
  const cartTotal = useCommerceStore((state) =>
    state.cart.reduce(
      (total, line) => total + line.product.price * line.quantity,
      0,
    ),
  );
  const cartTotalLabel = money(cartTotal);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 260);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (appliedScan.current || !params.scanned) return;
    appliedScan.current = true;
    setQuery(params.scanned);
  }, [params.scanned]);

  const commitSearch = useCallback((rawValue: string) => {
    const value = rawValue.trim();
    if (!value) return;
    void AsyncStorage.getItem("search-history").then((stored) => {
      let history: string[] = [];
      try {
        const parsed = stored ? (JSON.parse(stored) as unknown) : [];
        if (Array.isArray(parsed)) {
          history = parsed.filter(
            (item): item is string => typeof item === "string",
          );
        }
      } catch {
        history = [];
      }
      const next = [
        value,
        ...history.filter((item) => item.toLowerCase() !== value.toLowerCase()),
      ].slice(0, 6);
      return AsyncStorage.setItem("search-history", JSON.stringify(next));
    });
  }, []);

  const searchIndex = useMemo(
    () => buildProductSearchIndex(productsQuery.data ?? []),
    [productsQuery.data],
  );
  const products = useMemo(() => {
    const ranked = searchProductIndex(searchIndex, debouncedQuery);
    const filtered = ranked.filter((product) => {
      const matchesPromotion =
        !promotionOnly ||
        Boolean(
          product.original_price && product.original_price > product.price,
        );
      return (
        matchesPromotion && (!stockOnly || product.stock > 0)
      );
    });

    const sorted = [...filtered].sort((left, right) => {
      if (sort === "low") return left.price - right.price;
      if (sort === "high") return right.price - left.price;
      if (sort === "new")
        return Date.parse(right.created_at) - Date.parse(left.created_at);
      if (debouncedQuery) return 0;
      return (
        (right.rating ?? 0) - (left.rating ?? 0) ||
        Number(right.featured) - Number(left.featured)
      );
    });

    if (debouncedQuery || promotionOnly) return sorted;
    const trends = sorted.filter(
      (product) => product.featured || product.newArrival,
    );
    return (trends.length ? trends : sorted).slice(0, 8);
  }, [debouncedQuery, searchIndex, promotionOnly, sort, stockOnly]);

  const searching = query.trim() !== debouncedQuery;
  const discoveryMode = !debouncedQuery && !promotionOnly;
  const activeFilterCount =
    Number(stockOnly) + Number(sort !== "popular") + Number(promotionOnly);

  const popularSearches = useMemo(() => {
    const configured = settingsQuery.data?.find(
      (setting) => setting.key === "app_popular_searches",
    )?.value;
    return (configured ?? "")
      .split(",")
      .map((label) => label.trim())
      .filter(Boolean)
      .slice(0, 6)
      .map((label) => ({
        label,
        promotion: /promo|promotion|solde/i.test(label),
      }));
  }, [settingsQuery.data]);

  const editorialCategories = useMemo(
    () =>
      (categoriesQuery.data ?? [])
        .filter((category) => category.active !== false)
        .slice(0, 4),
    [categoriesQuery.data],
  );

  const runPopularSearch = (item: (typeof popularSearches)[number]) => {
    setPromotionOnly(item.promotion);
    setSort("popular");
    setQuery(item.promotion ? "" : item.label);
    if (!item.promotion) commitSearch(item.label);
  };

  const openCategory = (slug: string) => {
    router.push({
      pathname: "/catalog",
      params: { category: slug },
    });
  };

  const resetFilters = () => {
    setSort("popular");
    setStockOnly(false);
    setPromotionOnly(false);
  };

  const renderProduct = useCallback(
    ({ item }: { item: Product }) => (
      <SearchProductCard product={item} onOpen={() => commitSearch(query)} />
    ),
    [commitSearch, query],
  );

  return (
    <Screen>
      <FlatList
        ref={listRef}
        {...scrollReturn}
        data={productsQuery.isPending ? [] : products}
        keyExtractor={(item) => item.id}
        renderItem={renderProduct}
        numColumns={2}
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        updateCellsBatchingPeriod={50}
        windowSize={7}
        removeClippedSubviews={Platform.OS === "android"}
        columnWrapperStyle={styles.productRow}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshing={productsQuery.isRefetching}
        onRefresh={() =>
          void Promise.all([productsQuery.refetch(), categoriesQuery.refetch()])
        }
        ListHeaderComponent={
          <View>
            <View style={styles.topBar}>
              <View style={styles.logoSlot}>
                <BrandLogo header />
              </View>
              <HeaderActionButton
                accessibilityLabel={msg("cart.totalAndCount", { total: cartTotalLabel, count: cartCount })}
                icon="cart-outline"
                activeIcon="cart"
                badge={cartCount}
                expandedWidth={108}
                shape="rounded"
                text={cartTotalLabel}
                tone="soft"
                onPress={() => router.push("/cart")}
              />
            </View>

            <View style={styles.hero}>
              <View style={styles.eyebrowRow}>
                <View style={styles.eyebrowLine} />
                <Text style={styles.eyebrow}>
                  {msg("search.findYourNextEssentialUppercase")}</Text>
              </View>
              <Text accessibilityRole="header" style={styles.title}>
                {msg("search.searchUppercase")}</Text>

              <View
                style={[styles.searchBar, focused && styles.searchBarFocused]}
              >
                <Ionicons name="search-outline" size={21} color={colors.text} />
                <TextInput
                  ref={inputRef}
                  accessibilityLabel={msg("search.searchForAProductOrBrand")}
                  value={query}
                  onChangeText={(value) => {
                    setQuery(value);
                    if (promotionOnly) setPromotionOnly(false);
                  }}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  onSubmitEditing={() => commitSearch(query)}
                  placeholder={msg("search.searchForAProductOrBrand")}
                  placeholderTextColor="#858A86"
                  returnKeyType="search"
                  selectionColor={colors.primaryDark}
                  style={[styles.searchInput, webInputReset]}
                />
                {searching ? (
                  <ActivityIndicator color={colors.primaryDark} size="small" />
                ) : query ? (
                  <Pressable
                    accessibilityLabel={msg("search.clearSearch")}
                    hitSlop={8}
                    onPress={() => setQuery("")}
                  >
                    <Ionicons
                      name="close"
                      size={20}
                      color={colors.secondaryText}
                    />
                  </Pressable>
                ) : null}
                <AnimatedPressable
                  accessibilityLabel={filtersOpen ? msg("search.closeFilters") : msg("homeSearchBar.openProductFilters")}
                  accessibilityState={{ expanded: filtersOpen }}
                  onPress={() => setFiltersOpen((open) => !open)}
                  style={styles.filterButton}
                >
                  <Ionicons
                    name="options-outline"
                    size={22}
                    color={colors.background}
                  />
                  {activeFilterCount ? (
                    <View style={styles.filterBadge}>
                      <Text style={styles.filterBadgeText}>
                        {activeFilterCount}
                      </Text>
                    </View>
                  ) : null}
                </AnimatedPressable>
              </View>
            </View>

            {filtersOpen ? (
              <View style={styles.filterPanel}>
                <View style={styles.filterPanelHeader}>
                  <Text style={styles.filterPanelTitle}>{msg("search.filtersUppercase")}</Text>
                  <Pressable
                    accessibilityLabel={msg("search.resetFilters")}
                    accessibilityRole="button"
                    onPress={resetFilters}
                  >
                    <Text style={styles.resetText}>{msg("search.resetUppercase")}</Text>
                  </Pressable>
                </View>
                <Text style={styles.filterLabel}>{msg("search.sortByUppercase")}</Text>
                <View style={styles.sortGrid}>
                  {(
                    [
                      ["popular", debouncedQuery ? msg("search.relevance") : msg("common.popular")],
                      ["new", msg("common.arrivals")],
                      ["low", msg("common.priceLow")],
                      ["high", msg("common.priceHigh")],
                    ] as const
                  ).map(([value, label]) => {
                    const selected = sort === value;
                    return (
                      <AnimatedPressable
                        key={value}
                        accessibilityLabel={label}
                        accessibilityState={{ selected }}
                        onPress={() => setSort(value)}
                        style={[
                          styles.sortOption,
                          selected && styles.sortOptionSelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.sortText,
                            selected && styles.sortTextSelected,
                          ]}
                        >
                          {label}
                        </Text>
                      </AnimatedPressable>
                    );
                  })}
                </View>
                <AnimatedPressable
                  accessibilityLabel={msg("search.inStockOnly")}
                  accessibilityRole="switch"
                  accessibilityState={{ checked: stockOnly }}
                  onPress={() => setStockOnly((value) => !value)}
                  style={styles.stockOption}
                >
                  <View>
                    <Text style={styles.stockTitle}>{msg("search.inStockOnlyUppercase")}</Text>
                    <Text style={styles.stockDescription}>
                      {msg("search.hideUnavailableProducts")}</Text>
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
              </View>
            ) : null}

            {discoveryMode &&
            (popularSearches.length || editorialCategories.length) ? (
              <>
                {popularSearches.length ? (
                  <View style={styles.section}>
                    <SectionHeading
                      eyebrow={msg("search.trendingUppercase")}
                      title={msg("search.popularSearchesUppercase")}
                    />
                    <View style={styles.popularGrid}>
                      {popularSearches.map((item, index) => (
                        <AnimatedPressable
                          key={localizedContent(item.label)}
                          accessibilityLabel={msg("search.searchTerm", { term: item.label })}
                          onPress={() => runPopularSearch(item)}
                          style={styles.popularItem}
                        >
                          <View style={styles.popularCopy}>
                            {index === 0 ? (
                              <Text style={styles.trendLabel}>{msg("search.trendingUppercaseText")}</Text>
                            ) : null}
                            <Text numberOfLines={1} style={styles.popularText}>
                              {localizedContent(item.label)}
                            </Text>
                          </View>
                          <Ionicons
                            name="chevron-forward"
                            size={17}
                            color={colors.text}
                          />
                        </AnimatedPressable>
                      ))}
                    </View>
                  </View>
                ) : null}

                {editorialCategories.length ? (
                  <View style={styles.section}>
                    <SectionHeading eyebrow={msg("search.categoriesUppercase")} title={msg("search.exploreUppercase")} />
                    <View style={styles.categoryGrid}>
                      {editorialCategories.map((item, index) => (
                        <AnimatedPressable
                          key={item.id}
                          accessibilityLabel={msg("categories.exploreNamed", { name: localizedContent(item.label) })}
                          onPress={() => openCategory(item.slug)}
                          pressedScale={0.97}
                          style={styles.categoryTile}
                        >
                          <Image
                            accessibilityLabel={msg("categories.named", { name: localizedContent(item.label) })}
                            cachePolicy="memory-disk"
                            contentFit="cover"
                            source={
                              categoryCampaignImage(item) ??
                              imageUrl(
                                item.image_mobile ||
                                  item.image ||
                                  item.image_desktop,
                              )
                            }
                            style={StyleSheet.absoluteFill}
                            transition={180}
                          />
                          <LinearGradient
                            colors={["transparent", "rgba(0,0,0,0.12)", "rgba(0,0,0,0.72)"]}
                            locations={[0.25, 0.62, 1]}
                            pointerEvents="none"
                            style={StyleSheet.absoluteFill}
                          />
                          <View
                            style={[
                              styles.categoryStrip,
                              index === 0 && styles.categoryStripFeatured,
                            ]}
                          >
                            <Text
                              style={[
                                styles.categoryLabel,
                                index === 0 && styles.categoryLabelFeatured,
                              ]}
                            >
                              {localizedContent(item.label).toUpperCase()}
                            </Text>
                            <Ionicons
                              name="arrow-forward"
                              size={15}
                              color={
                                index === 0 ? colors.text : colors.background
                              }
                            />
                          </View>
                        </AnimatedPressable>
                      ))}
                    </View>
                  </View>
                ) : null}
              </>
            ) : null}

            <View style={styles.productsHeading}>
              <SectionHeading
                eyebrow={discoveryMode ? msg("newArrivalsSection.lEcomaxSelectionUppercase") : msg("search.resultsUppercase")}
                title={
                  discoveryMode
                    ? msg("search.trendingUppercase")
                    : msg("counts.products", { count: products.length })
                }
              />
              {discoveryMode ? (
                <AnimatedPressable
                  accessibilityLabel={msg("search.viewAllProducts")}
                  onPress={() => router.push("/catalog")}
                  style={styles.viewAll}
                >
                  <Text style={styles.viewAllText}>{msg("common.viewAll")}</Text>
                  <Ionicons
                    name="arrow-forward"
                    size={16}
                    color={colors.primaryDark}
                  />
                </AnimatedPressable>
              ) : null}
            </View>
          </View>
        }
        ListEmptyComponent={
          productsQuery.isPending ? (
            <View style={styles.skeletonGrid}>
              {[0, 1, 2, 3].map((item) => (
                <View key={item} style={styles.skeletonCard} />
              ))}
            </View>
          ) : productsQuery.isError ? (
            <EmptyState
              icon="cloud-offline-outline"
              title={msg("checkoutScreen.connectionFailedUppercase")}
              description={msg("search.productsCouldNotBeLoaded")}
              action={msg("notifications.tryAgainUppercase")}
              onPress={() => void productsQuery.refetch()}
            />
          ) : (
            <EmptyState
              icon="search-outline"
              title={msg("search.noResultsUppercase")}
              description={msg("search.tryAnotherProductBrandOrCategory")}
              action={msg("search.clearSearchUppercase")}
              onPress={() => {
                setQuery("");
                resetFilters();
                inputRef.current?.focus();
              }}
            />
          )
        }
      />
    </Screen>
  );
}

function SectionHeading({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  useLocale();
  return (
    <View>
      <Text style={styles.sectionEyebrow}>{eyebrow}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function EmptyState({
  icon,
  title,
  description,
  action,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  action: string;
  onPress: () => void;
}) {
  useLocale();
  return (
    <View style={styles.emptyState}>
      <Ionicons name={icon} size={32} color={colors.primaryDark} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDescription}>{description}</Text>
      <AnimatedPressable
        accessibilityLabel={action}
        onPress={onPress}
        style={styles.emptyAction}
      >
        <Text style={styles.emptyActionText}>{action}</Text>
      </AnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingBottom: 104,
    backgroundColor: colors.background,
  },
  productRow: {
    paddingHorizontal: 16,
    justifyContent: "space-between",
    marginBottom: 16,
  },
  topBar: {
    minHeight: 66,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E8ECE9",
    backgroundColor: colors.background,
  },
  logoSlot: {
    width: 106,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  hero: {
    paddingHorizontal: 16,
    paddingTop: 22,
    paddingBottom: 24,
  },
  eyebrowRow: { flexDirection: "row", alignItems: "center" },
  eyebrowLine: {
    width: 22,
    height: 2,
    marginRight: 8,
    backgroundColor: colors.primary,
  },
  eyebrow: {
    color: colors.primaryDark,
    fontFamily: typography.black,
    fontSize: 8,
    letterSpacing: 1.55,
  },
  title: {
    marginTop: 8,
    color: colors.text,
    fontFamily: typography.black,
    fontSize: 38,
    lineHeight: 42,
    letterSpacing: -1.5,
  },
  searchBar: {
    height: 58,
    marginTop: 18,
    paddingLeft: 14,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.text,
    borderRadius: 5,
    backgroundColor: colors.background,
  },
  searchBarFocused: { borderColor: colors.primaryDark },
  searchInput: {
    minWidth: 0,
    height: "100%",
    marginHorizontal: 11,
    flex: 1,
    borderWidth: 0,
    color: colors.text,
    fontFamily: typography.medium,
    fontSize: 12,
  },
  filterButton: {
    width: 54,
    height: 54,
    marginLeft: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.text,
  },
  filterBadge: {
    position: "absolute",
    right: 4,
    top: 4,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: colors.notification,
  },
  filterBadgeText: {
    color: colors.background,
    fontFamily: typography.black,
    fontSize: 8,
  },
  filterPanel: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.text,
    backgroundColor: colors.surface,
  },
  filterPanelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  filterPanelTitle: {
    color: colors.text,
    fontFamily: typography.black,
    fontSize: 18,
  },
  resetText: {
    color: colors.primaryDark,
    fontFamily: typography.black,
    fontSize: 8,
    letterSpacing: 0.7,
  },
  filterLabel: {
    marginTop: 18,
    color: colors.secondaryText,
    fontFamily: typography.black,
    fontSize: 8,
    letterSpacing: 1,
  },
  sortGrid: {
    marginTop: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  sortOption: {
    width: "48.8%",
    minHeight: 44,
    paddingHorizontal: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  sortOptionSelected: {
    borderColor: colors.text,
    backgroundColor: colors.text,
  },
  sortText: {
    color: colors.secondaryText,
    fontFamily: typography.bold,
    fontSize: 9,
  },
  sortTextSelected: { color: colors.background },
  stockOption: {
    minHeight: 62,
    marginTop: 16,
    paddingTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  stockTitle: {
    color: colors.text,
    fontFamily: typography.black,
    fontSize: 9,
    letterSpacing: 0.5,
  },
  stockDescription: {
    marginTop: 4,
    color: colors.secondaryText,
    fontFamily: typography.regular,
    fontSize: 8,
  },
  switchTrack: {
    width: 42,
    height: 24,
    padding: 3,
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#CACECB",
  },
  switchTrackActive: { backgroundColor: colors.primary },
  switchThumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.background,
  },
  switchThumbActive: { transform: [{ translateX: 18 }] },
  section: {
    paddingHorizontal: 16,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sectionEyebrow: {
    color: colors.primaryDark,
    fontFamily: typography.black,
    fontSize: 8,
    letterSpacing: 1.4,
  },
  sectionTitle: {
    marginTop: 5,
    color: colors.text,
    fontFamily: typography.black,
    fontSize: 23,
    lineHeight: 26,
    letterSpacing: -0.7,
  },
  popularGrid: {
    marginTop: 14,
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 16,
  },
  popularItem: {
    width: "47.8%",
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  popularCopy: { minWidth: 0, flex: 1 },
  trendLabel: {
    marginBottom: 3,
    color: colors.primaryDark,
    fontFamily: typography.black,
    fontSize: 6.5,
    letterSpacing: 0.8,
  },
  popularText: {
    color: colors.text,
    fontFamily: typography.bold,
    fontSize: 10,
  },
  categoryGrid: {
    marginTop: 14,
    paddingBottom: 24,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  categoryTile: {
    width: "48.5%",
    height: 168,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(11,11,11,0.08)",
    borderRadius: 16,
    backgroundColor: colors.surface,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 3,
  },
  categoryStrip: {
    position: "absolute",
    left: 8,
    right: 8,
    bottom: 8,
    minHeight: 38,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.text,
    borderRadius: 10,
  },
  categoryStripFeatured: { backgroundColor: colors.primary },
  categoryLabel: {
    color: colors.background,
    fontFamily: typography.black,
    fontSize: 11,
    letterSpacing: 0.7,
  },
  categoryLabelFeatured: { color: colors.text },
  productsHeading: {
    marginTop: 24,
    marginBottom: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  viewAll: {
    minWidth: 76,
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 5,
  },
  viewAllText: {
    color: colors.primaryDark,
    fontFamily: typography.bold,
    fontSize: 10,
  },
  skeletonGrid: {
    paddingHorizontal: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  skeletonCard: {
    width: "48.8%",
    height: 280,
    backgroundColor: colors.surface,
  },
  emptyState: {
    marginHorizontal: 16,
    padding: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  emptyTitle: {
    marginTop: 14,
    color: colors.text,
    fontFamily: typography.black,
    fontSize: 16,
  },
  emptyDescription: {
    maxWidth: 260,
    marginTop: 7,
    color: colors.secondaryText,
    fontFamily: typography.regular,
    fontSize: 10,
    lineHeight: 15,
    textAlign: "center",
  },
  emptyAction: {
    minHeight: 44,
    marginTop: 18,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.text,
  },
  emptyActionText: {
    color: colors.background,
    fontFamily: typography.black,
    fontSize: 8,
    letterSpacing: 0.7,
  },
});
