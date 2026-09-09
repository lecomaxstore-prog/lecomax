import { msg, useLocale } from "@/i18n";
import Ionicons from "@expo/vector-icons/Ionicons";
import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { typography } from "@/constants/theme";

const colors = {
  background: "#FFFFFF",
  text: "#111111",
  textSecondary: "#626662",
  primaryDark: "#11843A",
  border: "#E3E6E2",
};

export const TrustStrip = memo(function TrustStrip() {
  useLocale();
  return (
    <View style={styles.root}>
      <TrustItem icon="car-outline" title={msg("trustStrip.fastDelivery")} subtitle={msg("trustStrip.acrossMorocco")} />
      <View style={styles.divider} />
      <TrustItem icon="shield-checkmark-outline" title={msg("common.secureCheckout")} subtitle={msg("trustStrip.protectedOrder")} />
    </View>
  );
});

function TrustItem({
  icon,
  title,
  subtitle,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
}) {
  useLocale();
  return (
    <View style={styles.item}>
      <Ionicons name={icon} size={20} color={colors.primaryDark} />
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        <Text numberOfLines={1} style={styles.subtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    minHeight: 72,
    marginHorizontal: 16,
    marginTop: 26,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.background,
  },
  item: {
    minWidth: 0,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  copy: { minWidth: 0, marginLeft: 8, flex: 1 },
  title: { color: colors.text, fontFamily: typography.bold, fontSize: 9.5 },
  subtitle: {
    marginTop: 3,
    color: colors.textSecondary,
    fontFamily: typography.regular,
    fontSize: 7.5,
  },
  divider: { width: 1, height: 34, marginHorizontal: 11, backgroundColor: colors.border },
});
