import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { AnimatedPressable } from "@/components/animated-pressable";
import { typography } from "@/constants/theme";

const colors = {
  background: "#FFFFFF",
  surface: "#F6F7F5",
  text: "#111111",
  textSecondary: "#626662",
  primary: "#32CD57",
  border: "#E3E6E2",
};

export const HomeSearchBar = memo(function HomeSearchBar() {
  return (
    <View style={styles.shell}>
      <AnimatedPressable
        accessibilityLabel="Ouvrir la recherche de produits"
        accessibilityRole="search"
        onPress={() => router.push("/search")}
        pressedScale={0.99}
        style={styles.searchTarget}
      >
        <Ionicons name="search-outline" size={20} color={colors.textSecondary} />
        <Text numberOfLines={1} style={styles.placeholder}>Que recherchez-vous ?</Text>
      </AnimatedPressable>
      <View style={styles.divider} />
      <AnimatedPressable
        accessibilityLabel="Ouvrir les filtres produits"
        onPress={() => router.push({ pathname: "/catalog", params: { filters: "open" } })}
        pressedScale={0.92}
        style={styles.filter}
      >
        <Ionicons name="options-outline" size={21} color={colors.text} />
      </AnimatedPressable>
    </View>
  );
});

const styles = StyleSheet.create({
  shell: {
    height: 54,
    marginHorizontal: 16,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.background,
  },
  searchTarget: {
    minWidth: 0,
    height: "100%",
    paddingLeft: 15,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  placeholder: {
    marginLeft: 10,
    flex: 1,
    color: colors.textSecondary,
    fontFamily: typography.medium,
    fontSize: 13,
  },
  divider: { width: 1, height: 28, backgroundColor: colors.border },
  filter: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
});
