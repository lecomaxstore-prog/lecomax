import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AnimatedPressable } from "@/components/animated-pressable";
import { Screen } from "@/components/screen";
import { palette, typography } from "@/constants/theme";
import { useUserStore } from "@/stores/user";

export default function AddressesScreen() {
  const insets = useSafeAreaInsets();
  const addresses = useUserStore((state) => state.addresses ?? []);
  const selectedAddressId = useUserStore((state) => state.selectedAddressId);
  const selectAddress = useUserStore((state) => state.selectAddress);
  const removeAddress = useUserStore((state) => state.removeAddress);

  const confirmDelete = (id: string, name: string) => {
    Alert.alert("Supprimer l’adresse", `Supprimer l’adresse de ${name} ?`, [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: () => removeAddress(id),
      },
    ]);
  };

  return (
    <Screen className="bg-white">
      <View style={styles.header}>
        <AnimatedPressable
          accessibilityLabel="Retour"
          onPress={() => router.back()}
          style={styles.back}
        >
          <Ionicons name="arrow-back" size={22} color={palette.ink} />
        </AnimatedPressable>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>MON COMPTE</Text>
          <Text style={styles.title}>Mes adresses</Text>
        </View>
        <AnimatedPressable
          accessibilityLabel="Ajouter une adresse"
          onPress={() =>
            router.push({
              pathname: "/checkout",
              params: { mode: "new", returnTo: "addresses" },
            })
          }
          style={styles.add}
        >
          <Ionicons name="add" size={22} color={palette.white} />
        </AnimatedPressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: Math.max(insets.bottom, 20) + 20,
        }}
      >
        {!addresses.length ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="location-outline"
                size={35}
                color={palette.greenDark}
              />
            </View>
            <Text style={styles.emptyTitle}>Aucune adresse enregistrée</Text>
            <Text style={styles.emptyText}>
              Ajoutez une adresse pour accélérer vos prochaines commandes.
            </Text>
            <AnimatedPressable
              accessibilityLabel="Ajouter une adresse"
              onPress={() =>
                router.push({
                  pathname: "/checkout",
                  params: { mode: "new", returnTo: "addresses" },
                })
              }
              style={styles.emptyButton}
            >
              <Text style={styles.emptyButtonText}>AJOUTER UNE ADRESSE</Text>
            </AnimatedPressable>
          </View>
        ) : (
          addresses.map((address) => {
            const selected = address.id === selectedAddressId;
            return (
              <View
                key={address.id}
                style={[styles.card, selected && styles.cardSelected]}
              >
                <View style={styles.cardTop}>
                  <View
                    style={[
                      styles.location,
                      selected && styles.locationSelected,
                    ]}
                  >
                    <Ionicons
                      name="location-outline"
                      size={20}
                      color={selected ? palette.white : palette.greenDark}
                    />
                  </View>
                  <View style={styles.cardCopy}>
                    <View style={styles.nameRow}>
                      <Text numberOfLines={1} style={styles.name}>
                        {address.name}
                      </Text>
                      {selected ? (
                        <Text style={styles.defaultBadge}>PAR DÉFAUT</Text>
                      ) : null}
                    </View>
                    <Text style={styles.phone}>{address.phone}</Text>
                  </View>
                </View>
                <Text style={styles.address}>
                  {address.address}, {address.city}
                </Text>
                <View style={styles.actions}>
                  {!selected ? (
                    <AnimatedPressable
                      accessibilityLabel="Définir comme adresse par défaut"
                      onPress={() => selectAddress(address.id)}
                      style={styles.secondaryAction}
                    >
                      <Text style={styles.secondaryText}>
                        Définir par défaut
                      </Text>
                    </AnimatedPressable>
                  ) : (
                    <View style={{ flex: 1 }} />
                  )}
                  <AnimatedPressable
                    accessibilityLabel="Modifier cette adresse"
                    onPress={() =>
                      router.push({
                        pathname: "/checkout",
                        params: {
                          addressId: address.id,
                          returnTo: "addresses",
                        },
                      })
                    }
                    style={styles.iconAction}
                  >
                    <Ionicons
                      name="create-outline"
                      size={18}
                      color={palette.ink}
                    />
                  </AnimatedPressable>
                  <AnimatedPressable
                    accessibilityLabel="Supprimer cette adresse"
                    onPress={() => confirmDelete(address.id, address.name)}
                    style={styles.iconAction}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={18}
                      color={palette.red}
                    />
                  </AnimatedPressable>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 76,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E6E9E7",
  },
  back: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#F4F6F4",
  },
  headerCopy: { minWidth: 0, marginHorizontal: 12, flex: 1 },
  eyebrow: {
    color: palette.greenDark,
    fontFamily: typography.black,
    fontSize: 7.5,
    letterSpacing: 1.2,
  },
  title: {
    marginTop: 3,
    color: palette.ink,
    fontFamily: typography.black,
    fontSize: 20,
  },
  add: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: palette.ink,
  },
  empty: {
    minHeight: 510,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyIcon: {
    width: 76,
    height: 76,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: "#EAF7ED",
  },
  emptyTitle: {
    marginTop: 20,
    color: palette.ink,
    fontFamily: typography.black,
    fontSize: 19,
    textAlign: "center",
  },
  emptyText: {
    maxWidth: 290,
    marginTop: 8,
    color: palette.muted,
    fontFamily: typography.regular,
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
  },
  emptyButton: {
    minHeight: 50,
    marginTop: 22,
    paddingHorizontal: 22,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: palette.ink,
  },
  emptyButtonText: {
    color: palette.white,
    fontFamily: typography.black,
    fontSize: 9,
    letterSpacing: 0.8,
  },
  card: {
    marginBottom: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E1E5E2",
    borderRadius: 16,
    backgroundColor: palette.white,
  },
  cardSelected: { borderColor: "#A9DDB6", backgroundColor: "#F5FBF7" },
  cardTop: { flexDirection: "row", alignItems: "center" },
  location: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#EAF7ED",
  },
  locationSelected: { backgroundColor: palette.greenDark },
  cardCopy: { minWidth: 0, marginLeft: 11, flex: 1 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  name: {
    minWidth: 0,
    flexShrink: 1,
    color: palette.ink,
    fontFamily: typography.black,
    fontSize: 12.5,
  },
  defaultBadge: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 7,
    overflow: "hidden",
    color: palette.greenDark,
    backgroundColor: "#DFF4E5",
    fontFamily: typography.black,
    fontSize: 6.5,
  },
  phone: {
    marginTop: 4,
    color: palette.muted,
    fontFamily: typography.medium,
    fontSize: 9,
  },
  address: {
    marginTop: 14,
    color: palette.muted,
    fontFamily: typography.medium,
    fontSize: 10,
    lineHeight: 16,
  },
  actions: {
    marginTop: 15,
    paddingTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "#E7EAE8",
  },
  secondaryAction: {
    minHeight: 44,
    paddingHorizontal: 4,
    flex: 1,
    justifyContent: "center",
  },
  secondaryText: {
    color: palette.greenDark,
    fontFamily: typography.bold,
    fontSize: 9,
  },
  iconAction: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E0E4E1",
    borderRadius: 12,
    backgroundColor: palette.white,
  },
});
