import { formatNumber } from "@/lib/format";
import { msg, useLocale } from "@/i18n";
import Ionicons from "@expo/vector-icons/Ionicons";
import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { palette, typography } from "@/constants/theme";

export const Rating = memo(function Rating({
  value = 4.8,
  reviews,
}: {
  value?: number;
  reviews?: number;
}) {
  useLocale();
  const hasReviews = value > 0 && (reviews === undefined || reviews > 0);

  if (!hasReviews) {
    return (
      <View style={styles.row}>
        <Ionicons name="sparkles-outline" size={12} color={palette.muted} />
        <Text style={styles.newLabel}>{msg("rating.new")}</Text>
      </View>
    );
  }

  return (
    <View style={styles.row}>
      <Ionicons name="star" size={13} color={palette.gold} />
      <Text style={styles.value}>{formatNumber(value, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</Text>
      {typeof reviews === "number" ? <Text style={styles.reviews}>({reviews})</Text> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 3 },
  value: { color: palette.ink, fontFamily: typography.bold, fontSize: 11 },
  reviews: { color: palette.muted, fontFamily: typography.regular, fontSize: 10 },
  newLabel: { color: palette.muted, fontFamily: typography.medium, fontSize: 10 },
});
