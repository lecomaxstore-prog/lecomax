import Constants from "expo-constants";
import * as Linking from "expo-linking";
import { PropsWithChildren } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useSettings } from "@/hooks/use-catalog";

function versionParts(version: string) {
  return version
    .split(".")
    .map((part) => Number.parseInt(part, 10) || 0)
    .slice(0, 3);
}

function isOlder(current: string, minimum: string) {
  const left = versionParts(current);
  const right = versionParts(minimum);
  for (let index = 0; index < 3; index += 1) {
    if ((left[index] ?? 0) !== (right[index] ?? 0)) {
      return (left[index] ?? 0) < (right[index] ?? 0);
    }
  }
  return false;
}

export function AppGate({ children }: PropsWithChildren) {
  const settingsQuery = useSettings();
  const settings = Object.fromEntries(
    (settingsQuery.data ?? []).map((item) => [
      item.key,
      String(item.value ?? ""),
    ]),
  );
  const currentVersion = Constants.expoConfig?.version ?? "1.0.0";
  const updateRequired =
    settings.app_force_update === "true" &&
    Boolean(settings.app_minimum_version) &&
    isOlder(currentVersion, settings.app_minimum_version);

  if (settingsQuery.isLoading && !settingsQuery.data) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator
          accessibilityLabel="Initialisation de L’ECOMAX"
          color="#11843A"
        />
        <Text className="mt-4 font-semibold text-neutral-600">
          Initialisation de L’ECOMAX…
        </Text>
      </View>
    );
  }
  if (settings.maintenance_mode === "true") {
    return (
      <View className="flex-1 items-center justify-center bg-[#111111] px-8">
        <View className="h-16 w-16 items-center justify-center rounded-full bg-[#32CD57]">
          <Text className="text-2xl">⚙</Text>
        </View>
        <Text
          accessibilityRole="header"
          className="mt-6 text-center text-3xl font-black text-white"
        >
          Maintenance en cours
        </Text>
        <Text className="mt-3 text-center leading-6 text-white/65">
          Nous améliorons l’application. Votre panier reste enregistré sur cet
          appareil.
        </Text>
        <Pressable
          accessibilityLabel="Réessayer"
          disabled={settingsQuery.isRefetching}
          onPress={() => void settingsQuery.refetch()}
          className="mt-7 min-h-12 justify-center rounded-xl bg-[#32CD57] px-7 disabled:opacity-40"
        >
          <Text className="font-black text-[#111111]">
            {settingsQuery.isRefetching ? "CHARGEMENT…" : "RÉESSAYER"}
          </Text>
        </Pressable>
      </View>
    );
  }
  if (updateRequired) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-8">
        <Text
          accessibilityRole="header"
          className="text-center text-3xl font-black text-[#111111]"
        >
          Mise à jour requise
        </Text>
        <Text className="mt-3 text-center leading-6 text-[#5E625F]">
          Installez la dernière version de L’ECOMAX pour continuer en toute
          sécurité.
        </Text>
        <Pressable
          accessibilityLabel="Mettre à jour l’application"
          disabled={!settings.app_store_url}
          onPress={() => void Linking.openURL(settings.app_store_url)}
          className="mt-7 min-h-12 justify-center rounded-xl bg-[#32CD57] px-7 disabled:opacity-40"
        >
          <Text className="font-black text-[#111111]">METTRE À JOUR</Text>
        </Pressable>
      </View>
    );
  }
  return children;
}
