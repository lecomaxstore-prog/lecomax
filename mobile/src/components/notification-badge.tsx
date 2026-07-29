import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { palette, typography } from "@/constants/theme";

export const NotificationBadge = memo(function NotificationBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <View style={styles.badge}>
      <Text style={styles.label}>{count > 9 ? "9+" : count}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  badge: {
    position: "absolute",
    right: -5,
    top: -5,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 3,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DC2F3A",
    borderColor: palette.white,
    borderWidth: 2,
  },
  label: { color: palette.white, fontFamily: typography.bold, fontSize: 9, lineHeight: 10, textAlign: "center" },
});
