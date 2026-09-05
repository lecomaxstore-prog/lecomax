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
  return (
    <View style={styles.header}>
      <View style={styles.headerCopy}>
        <Text style={styles.eyebrow}>SÉLECTION L’ECOMAX</Text>
        <Text accessibilityRole="header" style={styles.title}>NOUVEAUTÉS</Text>
        <Text style={styles.count}>{count} produit{count > 1 ? "s" : ""}</Text>
      </View>
      <AnimatedPressable
        accessibilityLabel="Voir toutes les nouveautés"
        onPress={() => router.push({ pathname: "/catalog", params: { sort: "new" } })}
        pressedScale={0.95}
        style={styles.action}
      >
        <Text style={styles.actionText}>Voir tout</Text>
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
    borderTopWidth: 1,
    borderTopColor: palette.line,
  },
  headerCopy: { flex: 1, minWidth: 0 },
  eyebrow: {
    color: colors.primaryDark,
    fontFamily: typography.semibold,
    fontSize: 9,
    letterSpacing: 1.4,
  },
  title: {
    marginTop: 6,
    color: colors.text,
    fontFamily: typography.bold,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.7,
  },
  count: {
    marginTop: 5,
    color: colors.textSecondary,
    fontFamily: typography.regular,
    fontSize: 11,
    lineHeight: 17,
  },
  action: {
    minWidth: 72,
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 6,
  },
  actionText: {
    color: colors.primaryDark,
    fontFamily: typography.semibold,
    fontSize: 11,
  },
});
