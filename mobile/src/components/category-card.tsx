import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { AnimatedPressable } from "@/components/animated-pressable";
import { palette, typography } from "@/constants/theme";
import type { Category } from "@/types/commerce";

export const CategoryCard = memo(function CategoryCard({
  category,
  index,
}: {
  category: Category;
  index: number;
}) {
  return (
    <Animated.View entering={FadeInUp.delay(index * 60).duration(420)} style={styles.wrapper}>
      <AnimatedPressable
        accessibilityLabel={`Voir ${category.label}`}
        onPress={() =>
          router.push({
            pathname: "/catalog",
            params: { category: category.slug },
          })
        }
        pressedScale={0.96}
        style={styles.card}
      >
        <Image
          source={category.image}
          contentFit="cover"
          transition={300}
          cachePolicy="memory-disk"
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={["rgba(0,0,0,0.03)", "rgba(0,0,0,0.74)"]}
          locations={[0.28, 1]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.content}>
          <Text style={styles.title}>{category.label}</Text>
          <View style={styles.arrow}>
            <Ionicons name="arrow-forward" size={15} color={palette.ink} />
          </View>
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  wrapper: { width: "48.4%", aspectRatio: 0.88 },
  card: { flex: 1, overflow: "hidden", borderRadius: 24, backgroundColor: "#DDDDDD" },
  content: {
    flex: 1,
    padding: 15,
    alignItems: "flex-start",
    justifyContent: "flex-end",
  },
  title: {
    maxWidth: 120,
    color: palette.white,
    fontFamily: typography.black,
    fontSize: 19,
    lineHeight: 22,
    letterSpacing: -0.5,
  },
  arrow: {
    position: "absolute",
    right: 13,
    bottom: 13,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.white,
  },
});
