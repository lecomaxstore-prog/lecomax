import { router, usePathname } from "expo-router";
import { memo, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { BrandLogo } from "@/components/brand-logo";
import { HeaderActionButton } from "@/components/header-action-button";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { supabase } from "@/lib/supabase";
import { useCommerceStore } from "@/stores/commerce";
import { useNotificationStore } from "@/stores/notifications";

export const HomeHeader = memo(function HomeHeader() {
  const [signedIn, setSignedIn] = useState(false);
  const pathname = usePathname();
  const colorScheme = useColorScheme();
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const cartCount = useCommerceStore((state) =>
    state.cart.reduce((total, line) => total + line.quantity, 0),
  );

  useEffect(() => {
    void supabase.auth
      .getSession()
      .then(({ data }) => setSignedIn(Boolean(data.session)));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(Boolean(session));
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return (
    <View style={[styles.root, colorScheme === "dark" && styles.rootDark]}>
      <View style={styles.logoSlot}>
        <BrandLogo header animated />
      </View>
      <View style={[styles.actions, colorScheme === "dark" && styles.actionsDark]}>
        <HeaderActionButton
          accessibilityLabel={`Notifications${unreadCount ? `, ${unreadCount} non lues` : ""}`}
          icon="notifications-outline"
          activeIcon="notifications"
          active={pathname === "/notifications"}
          badge={unreadCount}
          onPress={() => router.push("/notifications")}
        />
        <HeaderActionButton
          accessibilityLabel={signedIn ? "Ouvrir mon profil" : "Se connecter"}
          icon="person-outline"
          activeIcon="person"
          active={pathname === "/profile" || pathname === "/account"}
          onPress={() => router.push(signedIn ? "/profile" : "/auth")}
        />
        <HeaderActionButton
          accessibilityLabel={`Panier${cartCount ? `, ${cartCount} articles` : ""}`}
          icon="bag-handle-outline"
          activeIcon="bag-handle"
          active={pathname === "/cart"}
          badge={cartCount}
          onPress={() => router.push("/cart")}
        />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  root: {
    minHeight: 64,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
  },
  rootDark: { backgroundColor: "#0B0B0B" },
  logoSlot: { width: 106, alignItems: "flex-start" },
  actions: {
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    padding: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E2E6E3",
    borderRadius: 999,
    backgroundColor: "#F4F6F4",
  },
  actionsDark: {
    borderColor: "#303330",
    backgroundColor: "#121312",
  },
});
