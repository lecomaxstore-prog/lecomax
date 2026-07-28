import * as Updates from "expo-updates";
import { useEffect, useRef } from "react";
import { Alert, Platform } from "react-native";

/** Downloads compatible JavaScript updates and lets the customer apply them safely. */
export function OtaUpdateGate() {
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
          "Mise à jour prête",
          "Une amélioration de L’ecomax a été téléchargée. Redémarrez maintenant pour l’appliquer.",
          [
            { text: "Plus tard", style: "cancel" },
            {
              text: "Redémarrer",
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
