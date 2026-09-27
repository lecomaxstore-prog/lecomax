import { localizedContent } from "@/i18n/content";
import { msg, useLocale } from "@/i18n";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { AnimatedPressable } from "@/components/animated-pressable";
import { typography } from "@/constants/theme";
import { categoryCampaignImage } from "@/lib/category-campaign-images";
import type { Category } from "@/types/commerce";

const colors = {
  surface: "#F6F7F5",
  text: "#111111",
  textSecondary: "#626662",
  primary: "#32CD57",
  border: "#E3E6E2",
};

function categoryIcon(category: Category): keyof typeof Ionicons.glyphMap {
  const value = `${category.slug} ${localizedContent(category.label)}`.toLowerCase();
  if (/chauss|shoe|basket/.test(value)) return "footsteps-outline";
  if (/vêtement|vetement|mode|shirt|homme|femme/.test(value)) return "shirt-outline";
  if (/électron|electron|tech|audio|montre/.test(value)) return "headset-outline";
  if (/access|sac|bag/.test(value)) return "bag-handle-outline";
  return "grid-outline";
}

function categoryImage(category: Category): number | string | null {
  return categoryCampaignImage(category) ?? category.image;
}

export const CategoryShortcuts = memo(function CategoryShortcuts({
  categories,
}: {
  categories: Category[];
}) {
  useLocale();
  if (!categories.length) {
    return (
      <View style={styles.empty}>
        <Ionicons name="grid-outline" size={20} color={colors.textSecondary} />
        <Text style={styles.emptyText}>{msg("categoryShortcuts.categoriesWillBeAvailableSoon")}</Text>
      </View>
    );
  }

  return (
    <View style={styles.row}>
      {categories.slice(0, 4).map((category) => {
        const image = categoryImage(category);

        return (
          <AnimatedPressable
            key={category.id}
            accessibilityRole="button"
            accessibilityLabel={msg("categories.viewNamed", { name: localizedContent(category.label) })}
            onPress={() => router.push({ pathname: "/catalog", params: { category: category.slug } })}
            pressedScale={0.97}
            style={styles.tile}
          >
            <View style={styles.imageWrap}>
              {image ? (
                <Image
                  accessibilityLabel={msg("categories.collectionNamed", { name: localizedContent(category.label) })}
                  cachePolicy="memory-disk"
                  contentFit="cover"
                  contentPosition="top center"
                  source={image}
                  style={StyleSheet.absoluteFill}
                  transition={180}
                />
              ) : (
                <Ionicons name={categoryIcon(category)} size={22} color={colors.text} />
              )}
            </View>
              <Text maxFontSizeMultiplier={1.15} numberOfLines={1} style={styles.label}>
                {localizedContent(category.label)}
              </Text>
          </AnimatedPressable>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    marginTop: 24,
    marginBottom: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    gap: 12,
  },
  tile: {
    minWidth: 0,
    minHeight: 112,
    flex: 1,
    alignItems: "center",
  },
  imageWrap: {
    width: "100%",
    aspectRatio: 0.9,
    maxHeight: 160,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(24,42,32,0.16)",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  label: {
    marginTop: 10,
    color: "#3E473E",
    fontFamily: typography.medium,
    fontSize: 10,
    lineHeight: 16,
    letterSpacing: 0.15,
    textAlign: "center",
  },
  empty: {
    minHeight: 74,
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  emptyText: {
    marginLeft: 10,
    color: colors.textSecondary,
    fontFamily: typography.medium,
    fontSize: 11,
  },
});
