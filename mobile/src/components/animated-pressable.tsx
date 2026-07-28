import { PropsWithChildren, useCallback } from "react";
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { triggerLightHaptic } from "@/services/haptics";

const AnimatedPressableBase = Animated.createAnimatedComponent(Pressable);

type AnimatedPressableProps = PropsWithChildren<
  PressableProps & {
    pressedScale?: number;
    haptic?: boolean;
    style?: StyleProp<ViewStyle>;
  }
>;

export function AnimatedPressable({
  children,
  onPress,
  onPressIn,
  onPressOut,
  pressedScale = 0.97,
  haptic = true,
  style,
  ...props
}: AnimatedPressableProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePress = useCallback<NonNullable<PressableProps["onPress"]>>(
    (event) => {
      if (haptic) void triggerLightHaptic();
      onPress?.(event);
    },
    [haptic, onPress],
  );

  return (
    <AnimatedPressableBase
      {...props}
      onPress={handlePress}
      onPressIn={(event) => {
        scale.set(withSpring(pressedScale, { damping: 18, stiffness: 300 }));
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        scale.set(withSpring(1, { damping: 15, stiffness: 260 }));
        onPressOut?.(event);
      }}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedPressableBase>
  );
}
