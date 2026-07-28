import Ionicons from "@expo/vector-icons/Ionicons";
import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { AnimatedPressable } from "@/components/animated-pressable";
import { palette, typography } from "@/constants/theme";

export const EmptyState = memo(function EmptyState({
  icon = "bag-outline",
  title,
  message,
  actionLabel,
  onAction,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.container}>
      <View style={styles.icon}>
        <Ionicons name={icon} size={34} color={palette.green} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction ? (
        <AnimatedPressable
          accessibilityLabel={actionLabel}
          onPress={onAction}
          style={styles.action}
        >
          <Text style={styles.actionLabel}>{actionLabel}</Text>
        </AnimatedPressable>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: { padding: 40, alignItems: "center" },
  icon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E7F7EF",
  },
  title: {
    marginTop: 18,
    color: palette.ink,
    fontFamily: typography.black,
    fontSize: 21,
    textAlign: "center",
  },
  message: {
    marginTop: 8,
    color: palette.muted,
    fontFamily: typography.regular,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },
  action: {
    marginTop: 18,
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 10,
    backgroundColor: palette.ink,
  },
  actionLabel: {
    color: palette.white,
    fontFamily: typography.bold,
    fontSize: 11,
  },
});
