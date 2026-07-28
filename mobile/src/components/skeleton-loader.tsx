import { memo, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { palette } from "@/constants/theme";

export const SkeletonLoader = memo(function SkeletonLoader({ count = 2 }: { count?: number }) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withRepeat(withTiming(1, { duration: 900 }), -1, true);
  }, [progress]);
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0.45, 0.9]),
  }));

  return (
    <View style={styles.row}>
      {Array.from({ length: count }).map((_, index) => (
        <Animated.View key={index} style={[styles.card, style]}>
          <View style={styles.image} />
          <View style={styles.line} />
          <View style={styles.shortLine} />
        </Animated.View>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  row: { paddingHorizontal: 20, flexDirection: "row", gap: 12 },
  card: { width: "48%", padding: 8, borderRadius: 24, backgroundColor: palette.white },
  image: { height: 180, borderRadius: 18, backgroundColor: "#E6E6E6" },
  line: { width: "82%", height: 12, marginTop: 14, borderRadius: 6, backgroundColor: "#E6E6E6" },
  shortLine: { width: "55%", height: 12, marginBottom: 8, marginTop: 9, borderRadius: 6, backgroundColor: "#E6E6E6" },
});
