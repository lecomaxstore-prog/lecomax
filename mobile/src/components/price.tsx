import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { palette, typography } from "@/constants/theme";
import { money } from "@/lib/format";

export const Price = memo(function Price({
  price,
  oldPrice,
  inverse = false,
  compact = false,
}: {
  price: number;
  oldPrice?: number | null;
  inverse?: boolean;
  compact?: boolean;
}) {
  const previousPrice = oldPrice ?? 0;
  const promotional = previousPrice > price;

  return (
    <View style={[styles.row, compact && styles.compactRow]}>
      <Text style={[styles.current, promotional && styles.promotional, compact && styles.compactCurrent, inverse && styles.inverse]}>
        {money(price)}
      </Text>
      {promotional ? (
        <Text numberOfLines={1} style={[styles.old, compact && styles.compactOld]}>
          {money(previousPrice)}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "baseline", gap: 7 },
  compactRow: { minWidth: 0, flex: 1, gap: 4 },
  current: { color: palette.ink, fontFamily: typography.black, fontSize: 16 },
  promotional: { color: palette.red },
  compactCurrent: { fontSize: 15 },
  inverse: { color: palette.white },
  old: {
    color: "#999999",
    fontFamily: typography.medium,
    fontSize: 11,
    textDecorationLine: "line-through",
  },
  compactOld: { minWidth: 0, flexShrink: 1, fontSize: 9 },
});
