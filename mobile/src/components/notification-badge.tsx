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
    right: -3,
    top: -3,
    minWidth: 17,
    height: 17,
    paddingHorizontal: 3,
    borderRadius: 8.5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.red,
    borderColor: palette.white,
    borderWidth: 1.5,
  },
  label: { color: palette.white, fontFamily: typography.black, fontSize: 8, lineHeight: 9, textAlign: "center" },
});
