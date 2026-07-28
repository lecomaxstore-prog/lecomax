import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { AnimatedPressable } from "@/components/animated-pressable";
import { typography } from "@/constants/theme";

const colors = {
  text: "#111111",
  textSecondary: "#626662",
  primaryDark: "#11843A",
};

export const NewArrivalsSection = memo(function NewArrivalsSection({
  count,
}: {
  count: number;
}) {
  return (
    <View style={styles.header}>
      <View>
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
    marginTop: 29,
    marginBottom: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  eyebrow: {
    marginBottom: 4,
    color: colors.primaryDark,
    fontFamily: typography.black,
    fontSize: 7.5,
    letterSpacing: 1.2,
  },
  title: {
    color: colors.text,
    fontFamily: typography.black,
    fontSize: 23,
    letterSpacing: -0.55,
  },
  count: {
    marginTop: 3,
    color: colors.textSecondary,
    fontFamily: typography.medium,
    fontSize: 8,
  },
  action: {
    minWidth: 88,
    minHeight: 44,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 5,
  },
  actionText: {
    color: colors.primaryDark,
    fontFamily: typography.bold,
    fontSize: 10,
  },
});
