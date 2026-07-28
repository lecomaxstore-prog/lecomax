import { useEffect } from "react";
import { View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";

export function ProductSkeleton() {
  const opacity = useSharedValue(0.4);
  useEffect(() => { opacity.value = withRepeat(withTiming(0.9, { duration: 700 }), -1, true); }, [opacity]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={style} className="w-[48%] rounded-card bg-white p-2 dark:bg-neutral-900"><View className="h-[210px] rounded-[22px] bg-neutral-200 dark:bg-neutral-800" /><View className="mx-2 mt-4 h-4 rounded-full bg-neutral-200 dark:bg-neutral-800" /><View className="mx-2 mb-3 mt-2 h-4 w-2/3 rounded-full bg-neutral-200 dark:bg-neutral-800" /></Animated.View>;
}
