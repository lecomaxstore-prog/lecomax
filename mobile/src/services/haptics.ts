import * as Haptics from "expo-haptics";
import { usePreferences } from "@/stores/preferences";

function enabled() {
  const preference = usePreferences.getState();
  return preference.hydrated && preference.hapticsEnabled;
}

async function safely(trigger: () => Promise<void>) {
  if (!enabled()) return;
  try {
    await trigger();
  } catch {
    // Haptics may be unavailable or disabled by the operating system.
  }
}

export function isHapticsEnabled() {
  return enabled();
}

export function setHapticsEnabled(value: boolean) {
  usePreferences.getState().setHapticsEnabled(value);
}

export function triggerSelectionHaptic() {
  return safely(() => Haptics.selectionAsync());
}

export function triggerLightHaptic() {
  return safely(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}

export function triggerMediumHaptic() {
  return safely(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
}

export function triggerSuccessHaptic() {
  return safely(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
}

export function triggerWarningHaptic() {
  return safely(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
}

export function triggerErrorHaptic() {
  return safely(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
}
