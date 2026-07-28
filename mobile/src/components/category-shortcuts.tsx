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
  const value = `${category.slug} ${category.label}`.toLowerCase();
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
  if (!categories.length) {
    return (
      <View style={styles.empty}>
        <Ionicons name="grid-outline" size={20} color={colors.textSecondary} />
        <Text style={styles.emptyText}>Les catégories seront bientôt disponibles.</Text>
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
            accessibilityLabel={`Voir la catégorie ${category.label}`}
            onPress={() => router.push({ pathname: "/catalog", params: { category: category.slug } })}
            pressedScale={0.95}
            style={styles.tile}
          >
            <View style={styles.imageWrap}>
              {image ? (
                <Image
                  accessibilityLabel={`Collection ${category.label}`}
                  cachePolicy="memory-disk"
                  contentFit="cover"
                  source={image}
                  style={StyleSheet.absoluteFill}
                  transition={180}
                />
              ) : (
                <Ionicons name={categoryIcon(category)} size={22} color={colors.text} />
              )}
            </View>
            <Text maxFontSizeMultiplier={1.15} numberOfLines={1} style={styles.label}>
              {category.label}
            </Text>
          </AnimatedPressable>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    marginTop: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    gap: 8,
  },
  tile: {
    minWidth: 0,
    minHeight: 108,
    padding: 5,
    flex: 1,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
  },
  imageWrap: {
    width: "100%",
    height: 70,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  label: {
    marginTop: 7,
    color: colors.text,
    fontFamily: typography.bold,
    fontSize: 8.5,
    lineHeight: 11,
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
