import { msg, useLocale } from "@/i18n";
import Ionicons from "@expo/vector-icons/Ionicons";
import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { AnimatedPressable } from "@/components/animated-pressable";
import { palette, typography } from "@/constants/theme";

type Props = {
  eyebrow?: string;
  title: string;
  actionLabel?: string;
  onAction?: () => void;
};

export const SectionHeader = memo(function SectionHeader({
  eyebrow,
  title,
  actionLabel = msg("sectionHeader.viewAllUppercase"),
  onAction,
}: Props) {
  useLocale();
  return (
    <View style={styles.row}>
      <View style={styles.copy}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.title}>{title}</Text>
      </View>
      {onAction ? (
        <AnimatedPressable
          accessibilityLabel={actionLabel}
          onPress={onAction}
          style={styles.action}
        >
          <Text style={styles.actionLabel}>{actionLabel}</Text>
          <Ionicons name="arrow-forward" size={15} color={palette.ink} />
        </AnimatedPressable>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  copy: { flex: 1 },
  eyebrow: {
    marginBottom: 7,
    color: palette.greenDark,
    fontFamily: typography.black,
    fontSize: 8,
    letterSpacing: 1.5,
  },
  title: {
    color: palette.ink,
    fontFamily: typography.black,
    fontSize: 26,
    lineHeight: 29,
    letterSpacing: -1,
  },
  action: {
    height: 34,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#DDE2DE",
    borderRadius: 17,
    backgroundColor: palette.white,
  },
  actionLabel: {
    color: palette.ink,
    fontFamily: typography.black,
    fontSize: 8,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
});
