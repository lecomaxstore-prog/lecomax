import { msg, useLocale } from "@/i18n";
import Ionicons from "@expo/vector-icons/Ionicons";
import { memo, useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  cancelAnimation, Easing, interpolateColor, useAnimatedStyle,
  useReducedMotion, useSharedValue, withDelay, withSequence, withSpring, withTiming,
} from "react-native-reanimated";
import { AnimatedPressable } from "@/components/animated-pressable";
import { typography } from "@/constants/theme";

const steps = ["common.cart", "support.delivery", "checkoutProgress.payment"] as const;
type StepNumber = 1 | 2 | 3;
type ProgressProps = {
  currentStep: StepNumber;
  compact?: boolean;
  onStepPress?: (step: StepNumber) => void;
};

function ProgressStep({ step, currentStep, onStepPress, compact }: ProgressProps & { step: StepNumber }) {
  useLocale();
  const complete = step < currentStep;
  const active = step === currentStep;
  const enabled = Boolean(onStepPress && complete);
  const reduceMotion = useReducedMotion();
  const status = useSharedValue(complete ? 2 : active ? 1 : 0);
  const fill = useSharedValue(reduceMotion && complete ? 1 : 0);
  const reveal = useSharedValue(reduceMotion ? 1 : 0);
  const emphasis = useSharedValue(1);

  useEffect(() => {
    const target = complete ? 2 : active ? 1 : 0;
    if (reduceMotion) {
      status.set(target);
      fill.set(complete ? 1 : 0);
      reveal.set(1);
      emphasis.set(1);
      return;
    }
    reveal.set(withDelay((step - 1) * 75, withTiming(1, { duration: 360 })));
    status.set(withTiming(target, { duration: 280 }));
    fill.set(withTiming(complete ? 1 : 0, { duration: 520, easing: Easing.inOut(Easing.cubic) }));
    emphasis.set(active
      ? withDelay(140, withSequence(withTiming(1.08, { duration: 220 }), withSpring(1, { damping: 12, stiffness: 180 })))
      : withTiming(1, { duration: 180 }));
    return () => {
      cancelAnimation(reveal);
      cancelAnimation(status);
      cancelAnimation(fill);
      cancelAnimation(emphasis);
    };
  }, [active, complete, reduceMotion, step, status, fill, reveal, emphasis]);

  const entranceStyle = useAnimatedStyle(() => ({
    opacity: reveal.value,
    transform: [{ translateY: (1 - reveal.value) * 7 }],
  }));
  const nodeStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(status.value, [0, 1, 2], ["#FFFFFF", "#183D29", "#EAF3E6"]),
    borderColor: interpolateColor(status.value, [0, 1, 2], ["#DDE3D8", "#183D29", "#C9DCC0"]),
    transform: [{ scale: emphasis.value }],
  }));
  const haloStyle = useAnimatedStyle(() => ({
    opacity: Math.max(0, 1 - Math.abs(status.value - 1)),
    transform: [{ scale: emphasis.value }],
  }));
  const fillStyle = useAnimatedStyle(() => ({ width: `${fill.value * 100}%` }));
  const numberStyle = useAnimatedStyle(() => ({
    opacity: 1 - Math.max(0, status.value - 1),
    color: interpolateColor(status.value, [0, 1, 2], ["#78816F", "#FFFFFF", "#35542E"]),
  }));
  const checkStyle = useAnimatedStyle(() => ({
    opacity: Math.max(0, status.value - 1),
    transform: [{ scale: 0.6 + Math.max(0, status.value - 1) * 0.4 }],
  }));

  return (
    <View style={styles.step}>
      {step < 3 ? (
        <View pointerEvents="none" style={[styles.connector, compact && styles.compactConnector]}>
          <Animated.View style={[styles.connectorFill, fillStyle]} />
        </View>
      ) : null}
      <Animated.View style={entranceStyle}>
        <AnimatedPressable
          accessibilityRole="button"
          accessibilityLabel={msg("checkout.stepDescription", { label: msg(steps[step - 1]), step, status: complete ? msg("checkoutProgress.completed") : active ? msg("checkoutProgress.current") : msg("checkoutProgress.upcoming") })}
          accessibilityState={{ disabled: !enabled, selected: active }}
          disabled={!enabled}
          haptic={enabled}
          onPress={() => onStepPress?.(step)}
          pressedScale={reduceMotion ? 1 : 0.95}
          style={[styles.stepButton, compact && styles.compactStep]}
        >
          <View style={[styles.nodeWrap, compact && styles.compactNodeWrap]}>
            <Animated.View pointerEvents="none" style={[styles.halo, haloStyle]} />
            <Animated.View style={[styles.node, nodeStyle]}>
              <Animated.Text maxFontSizeMultiplier={1.15} style={[styles.number, numberStyle]}>{step}</Animated.Text>
              <Animated.View style={[styles.check, checkStyle]}>
                <Ionicons name="checkmark" size={19} color="#35542E" />
              </Animated.View>
            </Animated.View>
          </View>
          <Text maxFontSizeMultiplier={1.2} style={[styles.label, compact && styles.compactLabel, complete && styles.labelComplete, active && styles.labelActive]}>
            {msg(steps[step - 1])}
          </Text>
          {!compact && <Animated.View style={[styles.activeDot, haloStyle]} />}
        </AnimatedPressable>
      </Animated.View>
    </View>
  );
}

export const CheckoutProgress = memo(function CheckoutProgress(props: ProgressProps) {
  useLocale();
  return (
    <View style={[styles.container, props.compact && styles.compactContainer]}>
      <View style={styles.track}>
        {steps.map((label, index) => <ProgressStep key={label} {...props} step={(index + 1) as StepNumber} />)}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  compactLabel: { marginTop: 0, flexShrink: 1, fontSize: 10 },
  compactContainer: { paddingHorizontal: 4, paddingTop: 10, paddingBottom: 10, backgroundColor: "#FFFFFF" },
  compactStep: { flexDirection: "row", gap: 3, minWidth: 0, maxWidth: "100%", backgroundColor: "#FFFFFF", paddingHorizontal: 2 },
  compactNodeWrap: { width: 36, height: 36 },
  compactConnector: { top: 18, marginHorizontal: 40 },
  container: {
    width: "100%", paddingHorizontal: 24, paddingTop: 12, paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#E5E9E0", backgroundColor: "#F7F6F2",
  },
  track: { flexDirection: "row", width: "100%", maxWidth: 520, alignSelf: "center" },
  step: { position: "relative", flex: 1, alignItems: "center" },
  stepButton: { minWidth: 76, alignItems: "center", paddingHorizontal: 4 },
  connector: {
    position: "absolute", top: 21, left: "50%", right: "-50%", marginHorizontal: 27,
    height: 1, overflow: "hidden", borderRadius: 2, backgroundColor: "#DDE3D6",
  },
  connectorFill: { height: "100%", backgroundColor: "#87A774", borderRadius: 2 },
  nodeWrap: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  halo: { position: "absolute", width: 44, height: 44, borderRadius: 22, backgroundColor: "#E9EEE1" },
  node: { width: 32, height: 32, alignItems: "center", justifyContent: "center", borderWidth: 1, borderRadius: 16 },
  number: { fontFamily: typography.semibold, fontSize: 13 },
  check: { position: "absolute", alignItems: "center", justifyContent: "center" },
  label: { marginTop: 5, color: "#78816F", fontFamily: typography.medium, fontSize: 11 },
  labelComplete: { color: "#617658" },
  labelActive: { color: "#183D29", fontFamily: typography.semibold },
  activeDot: { width: 4, height: 4, marginTop: 6, borderRadius: 2, backgroundColor: "#638357" },
});
