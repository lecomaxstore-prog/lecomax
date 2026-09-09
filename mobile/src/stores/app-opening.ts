import { useEffect } from "react";
import { AppState, Platform } from "react-native";
import { create } from "zustand";

// Intentionally not persisted: every app opening gets a fresh playback.
export const useAppOpening = create<{
  opening: number;
  finished: boolean;
  reopen: () => void;
  finish: () => void;
}>((set) => ({
  opening: 0,
  finished: false,
  reopen: () => set((state) => ({ opening: state.opening + 1, finished: false })),
  finish: () => set({ finished: true }),
}));

export function useAppOpeningLifecycle() {
  useEffect(() => {
    if (Platform.OS === "web" && typeof document !== "undefined") {
      const onVisibility = () => {
        if (document.visibilityState === "visible") useAppOpening.getState().reopen();
      };
      document.addEventListener("visibilitychange", onVisibility);
      return () => document.removeEventListener("visibilitychange", onVisibility);
    }
    let backgrounded = AppState.currentState === "background";
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "background") backgrounded = true;
      if (state === "active" && backgrounded) {
        backgrounded = false;
        useAppOpening.getState().reopen();
      }
    });
    return () => subscription.remove();
  }, []);
}
