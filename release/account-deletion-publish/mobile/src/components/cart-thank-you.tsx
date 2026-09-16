import { msg, useLocale } from "@/i18n";
import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, ReduceMotion, ZoomIn } from "react-native-reanimated";
import { typography } from "@/constants/theme";

export function CartThankYou() {
  useLocale();
  return (
    <Animated.View
      entering={FadeInDown.duration(240).reduceMotion(ReduceMotion.System)}
      style={styles.content}
    >
      <Animated.View
        entering={ZoomIn.springify().damping(15).stiffness(170).reduceMotion(ReduceMotion.System)}
        style={styles.check}
      >
        <Ionicons name="checkmark" size={20} color="#234735" />
      </Animated.View>
      <View style={styles.copy}>
        <Text style={styles.title}>{msg("cartThankYou.thankYou")}</Text>
        <Text numberOfLines={1} adjustsFontSizeToFit style={styles.subtitle}>{msg("cartThankYou.addedToCart")}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  content: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, flexShrink: 1 },
  check: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#E5EFD9", alignItems: "center", justifyContent: "center" },
  copy: { flexShrink: 1, gap: 2 },
  title: { fontFamily: typography.semibold, fontSize: 14, lineHeight: 17, color: "#FFFEF8" },
  subtitle: { fontFamily: typography.regular, fontSize: 10, lineHeight: 13, color: "#D8E5D1" },
});
