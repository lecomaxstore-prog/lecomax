import { useCallback, useState } from "react";
import { Modal, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { NotificationOptIn } from "@/components/notification-opt-in";
import { AnimatedPressable } from "@/components/animated-pressable";
import { useSettings } from "@/hooks/use-catalog";
import { msg, useLocale } from "@/i18n";
import { secureGetItem, secureSetItem } from "@/lib/secure-storage";
import { getPushNotificationState } from "@/services/notifications";

const INVITED_KEY = "lecomax.notification-invitation-shown";

/** Explain the benefit before asking for OS permission; never repeatedly nag. */
export function NotificationInvitation() {
  useLocale();
  const settings = useSettings();
  const [visible, setVisible] = useState(false);
  const permission = useQuery({ queryKey: ["push-permission"], queryFn: getPushNotificationState });
  const allowed = settings.isSuccess && settings.data?.find(item => item.key === "app_notifications_enabled")?.value !== "false";
  const eligible = allowed && permission.data?.supported && !permission.data.enabled && permission.data.status === "undetermined";
  useFocusEffect(useCallback(() => () => setVisible(false), []));

  useFocusEffect(useCallback(() => {
    if (!eligible) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      void (async () => {
        if (await secureGetItem(INVITED_KEY) || cancelled) return;
        await secureSetItem(INVITED_KEY, "true");
        if (!cancelled) setVisible(true);
      })().catch(() => {});
    }, 2500);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [eligible]));

  return (
    <Modal visible={visible && allowed} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
      <View style={styles.backdrop}>
        <ScrollView contentContainerStyle={styles.content}>
          <View accessibilityViewIsModal style={styles.sheet}>
            <NotificationOptIn onEnabled={() => setVisible(false)} />
            <AnimatedPressable accessibilityRole="button" onPress={() => setVisible(false)} style={styles.later}>
              <Text style={styles.label}>{msg("appUpdateGate.later")}</Text>
            </AnimatedPressable>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)" },
  content: { flexGrow: 1, justifyContent: "center", padding: 24 },
  sheet: { width: "100%", maxWidth: 520, alignSelf: "center", backgroundColor: "#193D2B", borderRadius: 24 },
  later: { minHeight: 48, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  label: { color: "#FFFFFF", fontSize: 14, fontFamily: "Inter_600SemiBold" },
});
