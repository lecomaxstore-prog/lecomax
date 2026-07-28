import { useColorScheme as useDeviceColorScheme } from "react-native";
import { usePreferences } from "@/stores/preferences";

export function useColorScheme() {
  const deviceScheme = useDeviceColorScheme();
  const preference = usePreferences((state) => state.theme);
  if (preference === "light" || preference === "dark") return preference;
  return deviceScheme ?? "light";
}
