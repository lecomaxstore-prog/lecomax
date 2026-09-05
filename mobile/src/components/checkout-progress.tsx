import Ionicons from "@expo/vector-icons/Ionicons";
import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { AnimatedPressable } from "@/components/animated-pressable";
import { typography } from "@/constants/theme";

const steps = ["PANIER", "LIVRAISON", "PAIEMENT"] as const;
type StepNumber = 1 | 2 | 3;

export const CheckoutProgress = memo(function CheckoutProgress({
  currentStep,
  onStepPress,
}: {
  currentStep: StepNumber;
  onStepPress?: (step: StepNumber) => void;
}) {
  return (
    <View
      accessibilityLabel={`Étape ${currentStep} sur 3 : ${steps[currentStep - 1].toLowerCase()}`}
      style={styles.container}
    >
      <View style={styles.track}>
        {steps.map((label, index) => {
          const step = (index + 1) as StepNumber;
          const complete = step < currentStep;
          const active = step === currentStep;
          const enabled = Boolean(onStepPress && step < currentStep);
          return (
            <View key={label} style={styles.step}>
              {index < steps.length - 1 ? (
                <View
                  style={[
                    styles.connector,
                    step < currentStep && styles.connectorComplete,
                  ]}
                />
              ) : null}
              <AnimatedPressable
                accessibilityLabel={`${label}, étape ${step}${complete ? ", terminée" : active ? ", actuelle" : ""}`}
                accessibilityState={{ disabled: !enabled, selected: active }}
                hitSlop={6}
                disabled={!enabled}
                haptic={enabled}
                onPress={() => onStepPress?.(step)}
                pressedScale={0.92}
                style={[
                  styles.node,
                  complete && styles.nodeComplete,
                  active && styles.nodeActive,
                ]}
              >
                {complete ? (
                  <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                ) : (
                  <Text
                    maxFontSizeMultiplier={1.15}
                    style={[styles.number, active && styles.numberActive]}
                  >
                    {step}
                  </Text>
                )}
              </AnimatedPressable>
              <Text
                maxFontSizeMultiplier={1.2}
                style={[
                  styles.label,
                  complete && styles.labelComplete,
                  active && styles.labelActive,
                ]}
              >
                {label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E1E5E1",
    backgroundColor: "#FFFFFF",
  },
  track: {
    flexDirection: "row",
  },
  step: {
    position: "relative",
    flex: 1,
    alignItems: "center",
  },
  connector: {
    position: "absolute",
    zIndex: 0,
    top: 16,
    left: "50%",
    right: "-50%",
    marginHorizontal: 18,
    height: 2,
    backgroundColor: "#DEDFDC",
  },
  connectorComplete: {
    backgroundColor: "#12B83F",
  },
  node: {
    zIndex: 1,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#C9CCC8",
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
  },
  nodeComplete: {
    borderColor: "#118D35",
    backgroundColor: "#118D35",
  },
  nodeActive: {
    borderWidth: 2,
    borderColor: "#12B83F",
    backgroundColor: "#FFFFFF",
  },
  number: {
    color: "#686C68",
    fontFamily: typography.bold,
    fontSize: 12,
  },
  numberActive: {
    color: "#080808",
    fontFamily: typography.black,
  },
  label: {
    marginTop: 6,
    color: "#727672",
    fontFamily: typography.bold,
    fontSize: 10,
    letterSpacing: 0.55,
  },
  labelComplete: {
    color: "#118D35",
  },
  labelActive: {
    color: "#080808",
    fontFamily: typography.black,
  },
});
