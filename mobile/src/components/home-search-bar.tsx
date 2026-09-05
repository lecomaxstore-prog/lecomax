import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { AnimatedPressable } from "@/components/animated-pressable";
import { typography } from "@/constants/theme";

const colors = {
  background: "#F5F6F2",
  textSecondary: "#777E76",
  ink: "#182A20",
  border: "#EBEDE7",
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
        <Ionicons name="search-outline" size={21} color={colors.ink} />
        <Text numberOfLines={1} style={styles.placeholder}>Que recherchez-vous ?</Text>
      </AnimatedPressable>
      <AnimatedPressable
        accessibilityRole="button"
        accessibilityLabel="Ouvrir les filtres produits"
        onPress={() => router.push({ pathname: "/catalog", params: { filters: "open" } })}
        pressedScale={0.92}
        style={styles.filter}
      >
        <Ionicons name="options-outline" size={20} color="#F8F6EF" />
      </AnimatedPressable>
    </View>
  );
});

const styles = StyleSheet.create({
  shell: {
    height: 60,
    marginHorizontal: 16,
    marginBottom: 18,
    paddingRight: 7,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    backgroundColor: colors.background,
  },
  searchTarget: {
    minWidth: 0,
    height: "100%",
    paddingLeft: 18,
    paddingRight: 12,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  placeholder: {
    marginLeft: 12,
    flex: 1,
    color: colors.textSecondary,
    fontFamily: typography.regular,
    fontSize: 12,
    letterSpacing: 0.1,
  },
  filter: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.ink,
  },
});
