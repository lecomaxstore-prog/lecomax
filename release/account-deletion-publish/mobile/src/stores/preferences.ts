import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { getLocales } from "expo-localization";
import { Platform } from "react-native";
import { deviceLanguage, resolveLanguage, type Language } from "@/lib/language-policy";

export type { Language } from "@/lib/language-policy";
type ThemeMode = "system" | "light" | "dark";
type State = {
  language: Language;
  languageOverride: Language | null;
  syncDeviceLanguage: () => void;
  useDeviceLanguage: () => void;
  theme: ThemeMode;
  hapticsEnabled: boolean;
  hydrated: boolean;
  setLanguage: (language: Language) => void;
  setTheme: (theme: ThemeMode) => void;
  setHapticsEnabled: (enabled: boolean) => void;
  setHydrated: (hydrated: boolean) => void;
};

const initialLanguage = deviceLanguage(getLocales());
const serverRendering = Platform.OS === "web" && typeof window === "undefined";
const preferenceStorage = {
  getItem: (key: string) => serverRendering ? Promise.resolve(null) : AsyncStorage.getItem(key),
  // Hydration also invokes persist's writer. A failed storage write must not
  // crash startup after recovering from an unavailable storage read.
  setItem: (key: string, value: string) => serverRendering ? Promise.resolve() : AsyncStorage.setItem(key, value).catch(() => undefined),
  removeItem: (key: string) => serverRendering ? Promise.resolve() : AsyncStorage.removeItem(key),
};

export const usePreferences = create<State>()(
  persist(
    (set) => ({
      language: initialLanguage,
      languageOverride: null,
      theme: "system",
      hapticsEnabled: true,
      hydrated: false,
      setLanguage: (language) => set({ language, languageOverride: language }),
      syncDeviceLanguage: () => set((state) => ({ language: resolveLanguage(state.languageOverride, deviceLanguage(getLocales())) })),
      useDeviceLanguage: () => set({ languageOverride: null, language: deviceLanguage(getLocales()) }),
      setTheme: (theme) => set({ theme }),
      setHapticsEnabled: (hapticsEnabled) => set({ hapticsEnabled }),
      setHydrated: (hydrated) => set({ hydrated }),
    }),
    {
      name: "lecomax-preferences",
      version: 4,
      storage: createJSONStorage(() => preferenceStorage),
      partialize: ({ languageOverride, theme, hapticsEnabled }) => ({ languageOverride, theme, hapticsEnabled }),
      migrate: (persisted, version) => ({
        ...(persisted as State),
        // Older versions saved a forced French default, not an explicit choice.
        ...(version < 4 ? { languageOverride: null, language: deviceLanguage(getLocales()) } : {}),
        ...(version < 3 ? { hapticsEnabled: true } : {}),
      }),
      merge: (persisted, current) => {
        const saved = persisted as Partial<State> | undefined;
        const override = saved?.languageOverride === "fr" || saved?.languageOverride === "en" ? saved.languageOverride : null;
        return { ...current, ...saved, languageOverride: override, language: resolveLanguage(override, deviceLanguage(getLocales())) };
      },
      onRehydrateStorage: (initialState) => (state) => (state ?? initialState).setHydrated(true),
    },
  ),
);
