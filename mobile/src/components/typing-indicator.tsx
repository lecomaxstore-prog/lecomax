import { useEffect, useState } from "react";
import { Animated, Easing, Platform, StyleSheet, View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { msg } from "@/i18n";

export function TypingIndicator() {
  const [progress] = useState(() => new Animated.Value(0));
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;
    const animation = Animated.loop(Animated.timing(progress, {
      toValue: 1,
      duration: 1400,
      easing: Easing.linear,
      useNativeDriver: Platform.OS !== "web",
      isInteraction: false,
    }));
    animation.start();
    return () => {
      animation.stop();
      progress.setValue(0);
    };
  }, [progress, reduceMotion]);

  return (
    <View style={styles.container}>
      <View style={styles.bubble} accessible accessibilityRole="progressbar" accessibilityLabel={msg("common.loadingUppercase")}>
        {[0, 1, 2].map(index => {
          const inputRange = [0, 0.08 + index * 0.14, 0.22 + index * 0.14, 0.36 + index * 0.14, 1];
          return <Animated.View key={index} style={[styles.dot, !reduceMotion && {
            opacity: progress.interpolate({ inputRange, outputRange: [0.4, 0.4, 1, 0.4, 0.4] }),
            transform: [{ translateY: progress.interpolate({ inputRange, outputRange: [0, 0, -5, 0, 0] }) }],
          }]} />;
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingVertical: 12, alignItems: "flex-start" },
  bubble: { width: 84, height: 48, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 24, borderTopLeftRadius: 7, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E3E8DF" },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#76A68A" },
});
