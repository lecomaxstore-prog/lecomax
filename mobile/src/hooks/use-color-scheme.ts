import { useColorScheme as useDeviceColorScheme } from "react-native";
import { usePreferences } from "@/stores/preferences";

export function useColorScheme() {
  // The customer app intentionally uses the light storefront presentation.
  // Ignore persisted/device dark preferences so clients cannot switch into it.
  return "light" as const;
}
