import { msg, useLocale } from "@/i18n";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { Screen } from "@/components/screen";

export default function NotFoundScreen() {
  useLocale();
  return (
    <Screen>
      <View className="flex-1 items-center justify-center px-8">
        <View className="h-24 w-24 items-center justify-center rounded-full bg-lime">
          <Ionicons name="compass-outline" size={42} color="#0A0A0A" />
        </View>
        <Text className="mt-6 text-center text-3xl font-black tracking-tight text-ink dark:text-white">
          {msg("notFound.thisPageHasLostItsWay")}</Text>
        <Text className="mt-3 max-w-[300px] text-center leading-6 text-muted">
          {msg("notFound.findTheLatestLEcomaxArrivalsAndOffersOnTheHomePage")}</Text>
        <Pressable
          accessibilityLabel={msg("notFound.backToHome")}
          onPress={() => router.replace("/(tabs)")}
          className="mt-8 rounded-full bg-ink px-8 py-4 dark:bg-lime"
        >
          <Text className="font-black text-white dark:text-ink">
            {msg("notFound.backToHome")}</Text>
        </Pressable>
      </View>
    </Screen>
  );
}
