import { useEffect } from "react";
import { AppState, Platform } from "react-native";
import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

const storageKey = "lecomax-intro-last-shown-day";
let lastShownDay: string | null = null;
let initialization: Promise<void> | undefined;

function localDay() {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
}

export const useAppOpening = create<{
  ready: boolean;
  opening: number;
  finished: boolean;
  reopen: () => void;
  finish: () => void;
}>((set) => ({
  ready: false,
  opening: 0,
  finished: false,
  reopen: () => {
    const today = localDay();
    if (lastShownDay === today) return;
    // Count showing (including skipping or interrupted playback) as today's intro.
    lastShownDay = today;
    void AsyncStorage.setItem(storageKey, today).catch(() => undefined);
    set((state) => ({ opening: state.opening + 1, finished: false }));
  },
  finish: () => set({ finished: true }),
}));

export function useAppOpeningLifecycle() {
  useEffect(() => {
    initialization ??= (async () => {
      try { lastShownDay = await AsyncStorage.getItem(storageKey); }
      catch { /* Unavailable storage must not block the app. */ }
      if (lastShownDay === localDay()) useAppOpening.getState().finish();
      else useAppOpening.getState().reopen();
      useAppOpening.setState({ ready: true });
    })();
    const reopen = () => { void initialization!.then(() => useAppOpening.getState().reopen()); };
    if (Platform.OS === "web" && typeof document !== "undefined") {
      const onVisibility = () => {
        if (document.visibilityState === "visible") reopen();
      };
      document.addEventListener("visibilitychange", onVisibility);
      return () => document.removeEventListener("visibilitychange", onVisibility);
    }
    let backgrounded = AppState.currentState === "background";
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "background") backgrounded = true;
      if (state === "active" && backgrounded) {
        backgrounded = false;
        reopen();
      }
    });
    return () => subscription.remove();
  }, []);
}
