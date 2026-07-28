import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type Language = "fr" | "en" | "ar";
type ThemeMode = "system" | "light" | "dark";
type State = {
  language: Language;
  theme: ThemeMode;
  hapticsEnabled: boolean;
  hydrated: boolean;
  setLanguage: (language: Language) => void;
  setTheme: (theme: ThemeMode) => void;
  setHapticsEnabled: (enabled: boolean) => void;
  setHydrated: (hydrated: boolean) => void;
};

const initialLanguage: Language = "fr";

export const usePreferences = create<State>()(
  persist(
    (set) => ({
      language: initialLanguage,
      theme: "system",
      hapticsEnabled: true,
      hydrated: false,
      setLanguage: (language) => set({ language }),
      setTheme: (theme) => set({ theme }),
      setHapticsEnabled: (hapticsEnabled) => set({ hapticsEnabled }),
      setHydrated: (hydrated) => set({ hydrated }),
    }),
    {
      name: "lecomax-preferences",
      version: 3,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ language, theme, hapticsEnabled }) => ({ language, theme, hapticsEnabled }),
      migrate: (persisted, version) => ({
        ...(persisted as State),
        ...(version < 2 ? { language: "fr" as Language } : {}),
        ...(version < 3 ? { hapticsEnabled: true } : {}),
      }),
      onRehydrateStorage: () => (state) => state?.setHydrated(true),
    },
  ),
);
