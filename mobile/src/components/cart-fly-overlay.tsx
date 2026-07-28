import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppViewport } from "@/components/app-viewport";
import { palette } from "@/constants/theme";
import { imageUrl } from "@/lib/format";
import { useCartFeedbackStore } from "@/stores/cart-feedback";

const FLIGHT_SIZE = 52;

export function CartFlyOverlay() {
  const flight = useCartFeedbackStore((state) => state.flight);
  const clearFlight = useCartFeedbackStore((state) => state.clearFlight);
  const { contentWidth, horizontalInset, windowHeight } = useAppViewport();
  const insets = useSafeAreaInsets();
  const progress = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (!flight) return;

    progress.set(0);
    opacity.set(1);
    progress.set(
      withTiming(1, { duration: 760, easing: Easing.inOut(Easing.cubic) }),
    );
    opacity.set(withDelay(625, withTiming(0, { duration: 135 })));

    const timer = setTimeout(() => clearFlight(flight.id), 820);
    return () => clearTimeout(timer);
  }, [clearFlight, flight, opacity, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    if (!flight) return { opacity: 0 };

    const originX = flight.originX - horizontalInset;
    const targetX = contentWidth * 0.7 - FLIGHT_SIZE / 2;
    const targetY = windowHeight - Math.max(insets.bottom, 8) - 48;
    const arc = Math.sin(progress.value * Math.PI) * -92;

    return {
      opacity: opacity.value,
      transform: [
        {
          translateX:
            originX -
            FLIGHT_SIZE / 2 +
            (targetX - originX + FLIGHT_SIZE / 2) * progress.value,
        },
        {
          translateY:
            flight.originY -
            FLIGHT_SIZE / 2 +
            (targetY - flight.originY + FLIGHT_SIZE / 2) * progress.value +
            arc,
        },
        { scale: 1 - progress.value * 0.66 },
        { rotate: `${progress.value * 16}deg` },
      ],
    };
  });

  if (!flight) return null;

  return (
    <View pointerEvents="none" style={styles.overlay}>
      <Animated.View style={[styles.flight, animatedStyle]}>
        <Image
          source={imageUrl(flight.image)}
          contentFit="cover"
          cachePolicy="memory-disk"
          style={styles.image}
        />
        <View style={styles.confirm}>
          <Ionicons name="checkmark" size={12} color={palette.white} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    inset: 0,
    zIndex: 999,
    overflow: "hidden",
  },
  flight: {
    position: "absolute",
    left: 0,
    top: 0,
    width: FLIGHT_SIZE,
    height: FLIGHT_SIZE,
    padding: 3,
    borderWidth: 2,
    borderColor: palette.green,
    borderRadius: FLIGHT_SIZE / 2,
    backgroundColor: palette.white,
    shadowColor: palette.ink,
    shadowOffset: { width: 0, height: 9 },
    shadowOpacity: 0.24,
    shadowRadius: 14,
    elevation: 14,
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: FLIGHT_SIZE / 2,
  },
  confirm: {
    position: "absolute",
    right: -4,
    bottom: -4,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: palette.white,
    borderRadius: 10,
    backgroundColor: palette.green,
  },
});
