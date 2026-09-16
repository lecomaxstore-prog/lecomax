import { msg, useLocale } from "@/i18n";
import * as Updates from "expo-updates";
import { useEffect, useRef } from "react";
import { Alert, Platform } from "react-native";

/** Downloads compatible JavaScript updates and lets the customer apply them safely. */
export function OtaUpdateGate() {
  useLocale();
  const checking = useRef(false);
  const promptedUpdateId = useRef<string | null>(null);

  useEffect(() => {
    if (__DEV__ || Platform.OS === "web" || !Updates.isEnabled || checking.current) return;

    let active = true;
    checking.current = true;

    void (async () => {
      try {
        const available = await Updates.checkForUpdateAsync();
        if (!available.isAvailable) return;

        const fetched = await Updates.fetchUpdateAsync();
        const updateId = fetched.manifest?.id ?? "pending";
        if (!active || promptedUpdateId.current === updateId) return;
        promptedUpdateId.current = updateId;

        Alert.alert(
          msg("otaUpdateGate.updateReady"),
          msg("otaUpdateGate.anImprovementToLEcomaxHasBeenDownloadedRestartNowToApply"),
          [
            { text: msg("appUpdateGate.later"), style: "cancel" },
            {
              text: msg("otaUpdateGate.restart"),
              onPress: () => { void Updates.reloadAsync(); },
            },
          ],
        );
      } catch {
        // A live-update outage must never prevent shopping or checkout.
      } finally {
        checking.current = false;
      }
    })();

    return () => { active = false; };
  }, []);

  return null;
}
