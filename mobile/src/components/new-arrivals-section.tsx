import { msg, useLocale } from "@/i18n";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { AnimatedPressable } from "@/components/animated-pressable";
import { palette, typography } from "@/constants/theme";

const colors = {
  text: palette.ink,
  textSecondary: palette.muted,
  primaryDark: palette.greenDark,
};

export const NewArrivalsSection = memo(function NewArrivalsSection({
  count,
}: {
  count: number;
}) {
  useLocale();
  return (
    <View style={styles.header}>
      <View style={styles.headerCopy}>
        <View style={styles.eyebrowRow}>
          <Text style={styles.eyebrow}>{msg("newArrivalsSection.lEcomaxSelectionUppercase")}</Text>
          <View style={styles.eyebrowRule} />
        </View>
        <Text accessibilityRole="header" style={styles.title}>{msg("common.newArrivalsTitle")}</Text>
        <Text style={styles.count}>{msg("counts.productCount", { count })}</Text>
      </View>
      <AnimatedPressable
        accessibilityRole="button"
        accessibilityLabel={msg("newArrivalsSection.viewAllNewArrivals")}
        onPress={() => router.push({ pathname: "/catalog", params: { sort: "new" } })}
        pressedScale={0.95}
        style={styles.action}
      >
        <Text style={styles.actionText}>{msg("common.viewAll")}</Text>
        <Ionicons name="arrow-forward" size={15} color={colors.primaryDark} />
      </AnimatedPressable>
    </View>
  );
});

const styles = StyleSheet.create({
  header: {
    marginTop: 28,
    marginBottom: 20,
    paddingTop: 24,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
    borderTopWidth: 1,
    borderTopColor: palette.line,
  },
  headerCopy: { flexGrow: 1, flexShrink: 1, flexBasis: 210, minWidth: 0 },
  eyebrowRow: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 2,
    maxWidth: "100%",
  },
  eyebrowRule: {
    width: 28,
    height: 2,
    borderRadius: 1,
    flexShrink: 0,
    backgroundColor: palette.greenDark,
  },
  eyebrow: {
    color: palette.forest,
    fontFamily: typography.semibold,
    fontSize: 10,
    lineHeight: 16,
    letterSpacing: 0.8,
    includeFontPadding: false,
    flexShrink: 1,
  },
  title: {
    marginTop: 10,
    color: colors.text,
    fontFamily: typography.bold,
    fontSize: 30,
    lineHeight: 37,
    letterSpacing: -1,
  },
  count: {
    marginTop: 8,
    color: colors.textSecondary,
    fontFamily: typography.regular,
    fontSize: 13,
    lineHeight: 20,
  },
  action: {
    minWidth: 72,
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#DEE8DA",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  actionText: {
    color: colors.primaryDark,
    fontFamily: typography.semibold,
    fontSize: 11,
  },
});
