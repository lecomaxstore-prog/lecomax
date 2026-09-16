import { useLocale } from "@/i18n";
import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { palette, typography } from "@/constants/theme";
import { money, moneyParts } from "@/lib/format";

export const Price = memo(function Price({
  price,
  oldPrice,
  inverse = false,
  compact = false,
  tight = false,
  emphasized = false,
}: {
  price: number;
  oldPrice?: number | null;
  inverse?: boolean;
  compact?: boolean;
  /** Narrow cards (<152px) where the full-size price would truncate. */
  tight?: boolean;
  /** Strong amount and quieter currency for product card footers. */
  emphasized?: boolean;
}) {
  useLocale();
  const previousPrice = oldPrice ?? 0;
  const promotional = previousPrice > price;
  const parts = emphasized ? moneyParts(price) : [];
  const amount = parts.filter((part) => part.type !== "currency").map((part) => part.value).join("").trim();
  const currency = parts.find((part) => part.type === "currency")?.value ?? "MAD";
  const previousAmount = emphasized && promotional
    ? moneyParts(previousPrice).filter((part) => part.type !== "currency").map((part) => part.value).join("").trim()
    : "";

  return (
    <View style={[styles.row, compact && styles.compactRow]}>
      {emphasized ? (
        <View style={styles.amountRow}>
          <Text
            accessibilityLabel={money(price)}
            style={[styles.emphasizedCurrent, tight && styles.tightCurrent, inverse && styles.inverse]}
          >
            {amount}
          </Text>
          <Text style={[styles.currency, inverse && styles.inverse]}>{currency}</Text>
        </View>
      ) : (
      <Text
        accessibilityLabel={money(price)}
        adjustsFontSizeToFit={compact}
        minimumFontScale={0.85}
        numberOfLines={1}
        style={[styles.current, promotional && styles.promotional, compact && styles.compactCurrent, emphasized && styles.emphasizedCurrent, tight && styles.tightCurrent, inverse && styles.inverse]}
      >
        {money(price)}
      </Text>
      )}
      {promotional ? (
        <Text
          adjustsFontSizeToFit={compact}
          minimumFontScale={0.85}
          numberOfLines={emphasized ? undefined : 1}
          accessibilityLabel={money(previousPrice)}
          style={[styles.old, compact && styles.compactOld, emphasized && styles.emphasizedOld]}
        >
          {emphasized ? `${previousAmount}\u00A0${currency}` : money(previousPrice)}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "baseline", gap: 7 },
  compactRow: {
    minWidth: 0,
    flex: 1,
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "center",
    gap: 4,
  },
  current: {
    color: palette.ink,
    fontFamily: typography.bold,
    fontSize: 16,
    lineHeight: 22,
  },
  promotional: { color: palette.ink },
  amountRow: {
    maxWidth: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "baseline",
    columnGap: 4,
    rowGap: 0,
  },
  compactCurrent: { maxWidth: "100%", fontSize: 14, lineHeight: 20 },
  tightCurrent: { fontSize: 13, lineHeight: 18 },
  emphasizedCurrent: {
    color: "#203D2C",
    fontFamily: typography.semibold,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.3,
    fontVariant: ["tabular-nums"],
    includeFontPadding: false,
  },
  currency: {
    color: "#626D63",
    fontFamily: typography.medium,
    fontSize: 10,
    letterSpacing: 0.2,
  },
  inverse: { color: palette.white },
  old: {
    color: palette.muted,
    fontFamily: typography.medium,
    fontSize: 11,
    lineHeight: 15,
    textDecorationLine: "line-through",
  },
  compactOld: { maxWidth: "100%", fontSize: 10, lineHeight: 14 },
  emphasizedOld: { color: "#737B73", fontFamily: typography.regular, fontVariant: ["tabular-nums"], includeFontPadding: false },
});
