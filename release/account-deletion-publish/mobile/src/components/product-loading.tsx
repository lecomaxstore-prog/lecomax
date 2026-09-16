import { useEffect } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import Animated, { cancelAnimation, Easing, ReduceMotion, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AnimatedPressable } from "@/components/animated-pressable";
import { palette, typography } from "@/constants/theme";
import { msg, useLocale } from "@/i18n";

export function ProductLoadingMark() {
  useLocale();
  const opacity = useSharedValue(0.45);
  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.ease), reduceMotion: ReduceMotion.System }), -1, true);
    return () => cancelAnimation(opacity);
  }, [opacity]);
  const pulse = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <View accessibilityRole="progressbar" accessibilityLabel={msg("product.loadingProduct")} accessibilityState={{ busy: true }} style={styles.mark}>
      <View style={styles.emblem}><Text style={styles.monogram}>L’</Text></View>
      <Text style={styles.brand}>L’ECOMAX</Text>
      <View style={styles.track}><Animated.View style={[styles.trackFill, pulse]} /></View>
      <Text style={styles.caption}>{msg("product.loadingProduct")}</Text>
    </View>
  );
}

export function ProductLoadingScreen({ onBack }: { onBack: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.toolbar}>
        <AnimatedPressable accessibilityRole="button" accessibilityLabel={msg("addresses.back")} onPress={onBack} style={styles.back}>
          <Ionicons name="arrow-back" size={21} color={palette.forest} />
        </AnimatedPressable>
        <Text style={styles.toolbarBrand}>L’ECOMAX</Text>
        <View style={styles.toolbarSpacer} />
      </View>
      <View style={styles.gallery}><ProductLoadingMark /></View>
      <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden style={styles.details}>
        <View style={[styles.line, { width: 72, height: 8 }]} />
        <View style={[styles.line, { width: "88%", height: 22, marginTop: 18 }]} />
        <View style={[styles.line, { width: "58%", height: 22, marginTop: 9 }]} />
        <View style={[styles.line, { width: 110, height: 26, marginTop: 22 }]} />
        <View style={styles.divider} />
        <View style={styles.options}>{[0, 1, 2, 3].map(i => <View key={i} style={styles.option} />)}</View>
        <View style={styles.button} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FFFFFF" },
  content: { width: "100%", maxWidth: 640, alignSelf: "center", paddingHorizontal: 20 },
  toolbar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 },
  back: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: palette.line, alignItems: "center", justifyContent: "center" },
  toolbarSpacer: { width: 44 },
  toolbarBrand: { fontFamily: typography.semibold, fontSize: 11, letterSpacing: 2.5, color: palette.forest },
  gallery: { aspectRatio: 1, maxHeight: 420, borderRadius: 24, backgroundColor: "#F6F7F4", borderWidth: 1, borderColor: "#EEF0EB", alignItems: "center", justifyContent: "center" },
  mark: { alignItems: "center", justifyContent: "center", padding: 24 },
  emblem: { width: 64, height: 64, borderRadius: 20, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E2E8DF", alignItems: "center", justifyContent: "center", transform: [{ rotate: "-6deg" }] },
  monogram: { fontFamily: typography.semibold, fontSize: 30, letterSpacing: -2, color: palette.forest },
  brand: { marginTop: 20, fontFamily: typography.semibold, fontSize: 11, letterSpacing: 3, color: palette.forest },
  track: { width: 72, height: 2, backgroundColor: "#DFE5DB", marginTop: 18, borderRadius: 1, overflow: "hidden" },
  trackFill: { width: "100%", height: "100%", backgroundColor: palette.greenDark },
  caption: { marginTop: 12, fontFamily: typography.regular, fontSize: 11, color: "#70796E", textAlign: "center" },
  details: { paddingTop: 26 },
  line: { backgroundColor: "#ECEFE9", borderRadius: 5 },
  divider: { height: 1, backgroundColor: "#EEF0EB", marginVertical: 24 },
  options: { flexDirection: "row", gap: 10 },
  option: { width: 46, height: 42, borderRadius: 10, backgroundColor: "#F1F3EE" },
  button: { height: 54, marginTop: 26, borderRadius: 16, backgroundColor: "#E6EDE3" },
});
