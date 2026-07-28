import { memo, useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { typography } from "@/constants/theme";

const BRAND_GREEN = "#3ECF4C";

export const BrandLogo = memo(function BrandLogo({
  compact = false,
  header = false,
  animated = false,
  inverse = false,
}: {
  compact?: boolean;
  header?: boolean;
  animated?: boolean;
  inverse?: boolean;
}) {
  const width = header ? 106 : compact ? 135 : 146;
  const height = header ? 32 : compact ? 40 : 43;
  const scale = header ? 0.78 : compact ? 1 : 1.08;
  const underlineProgress = useSharedValue(animated ? 0.72 : 1);

  useEffect(() => {
    if (!animated) {
      underlineProgress.set(1);
      return;
    }
    underlineProgress.set(
      withRepeat(
        withSequence(
          withTiming(1, { duration: 620, easing: Easing.out(Easing.cubic) }),
          withDelay(
            850,
            withTiming(0.72, {
              duration: 430,
              easing: Easing.inOut(Easing.quad),
            }),
          ),
        ),
        -1,
        true,
      ),
    );
  }, [animated, underlineProgress]);

  const underlineStyle = useAnimatedStyle(() => ({
    opacity: 0.62 + underlineProgress.value * 0.38,
    transform: [{ scaleX: underlineProgress.value }],
  }));

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel="L'ecomax"
      style={[styles.logo, { width, height }]}
    >
      <View style={[styles.artwork, { transform: [{ scale }] }]}>
        <Text
          allowFontScaling={false}
          style={[styles.eco, inverse && styles.ecoInverse]}
        >
          {"L'eco"}
        </Text>
        <Text allowFontScaling={false} style={styles.max}>
          max
        </Text>
        <Animated.View style={[styles.smile, underlineStyle]}>
          <Svg width={63} height={9} viewBox="0 0 84 12">
            <Path
              d="M0 1 Q42 10 84 1"
              fill="none"
              stroke={BRAND_GREEN}
              strokeWidth={3}
              strokeLinecap="round"
            />
          </Svg>
        </Animated.View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  logo: {
    position: "relative",
    alignSelf: "center",
    justifyContent: "center",
    overflow: "visible",
  },
  artwork: {
    position: "relative",
    width: 135,
    height: 40,
    transformOrigin: "left center",
  },
  eco: {
    position: "absolute",
    left: 0,
    top: 2,
    color: "#000000",
    fontFamily: typography.black,
    fontSize: 25.5,
    lineHeight: 34,
    letterSpacing: -0.75,
  },
  ecoInverse: { color: "#FFFFFF" },
  max: {
    position: "absolute",
    left: 69.75,
    top: 2,
    color: BRAND_GREEN,
    fontFamily: typography.black,
    fontSize: 25.5,
    lineHeight: 34,
    letterSpacing: -0.75,
  },
  smile: {
    position: "absolute",
    left: 69.75,
    top: 30.75,
    width: 63,
    height: 9,
    overflow: "visible",
  },
});
