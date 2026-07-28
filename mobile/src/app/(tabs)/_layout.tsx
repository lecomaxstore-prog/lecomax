import { Tabs } from "expo-router";
import { StyleSheet, View } from "react-native";
import { BottomNavigation } from "@/components/bottom-navigation";
import { CartFlyOverlay } from "@/components/cart-fly-overlay";
import { useT } from "@/lib/i18n";
import { useAppViewport } from "@/components/app-viewport";

export default function TabsLayout() {
  const { t } = useT();
  const { isTablet } = useAppViewport();
  return (
    <View style={styles.root}>
      <Tabs
        backBehavior="history"
        tabBar={(props) => <BottomNavigation {...props} />}
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: "#F5F5F5" },
          tabBarPosition: isTablet ? "left" : "bottom",
        }}
      >
        <Tabs.Screen name="index" options={{ title: t.home }} />
        <Tabs.Screen name="search" options={{ title: t.search }} />
        <Tabs.Screen name="wishlist" options={{ title: t.wishlist }} />
        <Tabs.Screen name="cart" options={{ title: t.cart }} />
        <Tabs.Screen name="account" options={{ title: t.account }} />
        <Tabs.Screen name="catalog" options={{ href: null }} />
      </Tabs>
      <CartFlyOverlay />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
