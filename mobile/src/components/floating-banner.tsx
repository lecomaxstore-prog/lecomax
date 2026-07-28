import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { memo, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
import { AnimatedPressable } from "@/components/animated-pressable";
import { palette, typography } from "@/constants/theme";

const STORAGE_KEY = "lecomax-reward-banner-dismissed";

export const FloatingBanner = memo(function FloatingBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let mounted = true;
    void AsyncStorage.getItem(STORAGE_KEY).then((value) => {
      if (mounted && value !== "true") setVisible(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const dismiss = () => {
    setVisible(false);
    void AsyncStorage.setItem(STORAGE_KEY, "true");
  };

  if (!visible) return null;
  return (
    <Animated.View
      entering={FadeInDown.springify().damping(18)}
      exiting={FadeOutDown.duration(220)}
      style={styles.banner}
    >
      <AnimatedPressable
        accessibilityLabel="Fermer la bannière de récompense"
        onPress={dismiss}
        style={styles.close}
      >
        <Ionicons name="close" size={18} color={palette.white} />
      </AnimatedPressable>
      <AnimatedPressable
        accessibilityLabel="Créer un compte L’ECOMAX"
        onPress={() => router.push("/auth")}
        style={styles.content}
      >
        <View style={styles.copy}>
          <Text style={styles.eyebrow}>LECOMAX REWARDS</Text>
          <Text style={styles.message}>
            Create your Lecomax account and unlock exclusive offers.
          </Text>
        </View>
        <View style={styles.arrow}>
          <Ionicons name="arrow-forward" size={19} color={palette.green} />
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  banner: {
    position: "absolute",
    zIndex: 100,
    left: 12,
    right: 12,
    bottom: 88,
    minHeight: 82,
    padding: 9,
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: palette.green,
    shadowColor: palette.ink,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 12,
  },
  close: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  content: {
    minWidth: 0,
    flex: 1,
    marginLeft: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  copy: { minWidth: 0, flex: 1, flexShrink: 1, overflow: "hidden" },
  eyebrow: {
    marginBottom: 3,
    color: "rgba(255,255,255,0.7)",
    fontFamily: typography.bold,
    fontSize: 8,
    letterSpacing: 1.3,
  },
  message: {
    flexShrink: 1,
    color: palette.white,
    fontFamily: typography.bold,
    fontSize: 12,
    lineHeight: 17,
  },
  arrow: {
    flexShrink: 0,
    width: 40,
    height: 40,
    marginLeft: 8,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.white,
  },
});
