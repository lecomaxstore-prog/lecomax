import { useCallback, useState } from "react";
import { ActivityIndicator, AppState, Linking, Platform, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Ionicons from "@expo/vector-icons/Ionicons";
import Animated, { FadeInDown, ReduceMotion } from "react-native-reanimated";
import { AnimatedPressable } from "@/components/animated-pressable";
import { msg, useLocale } from "@/i18n";
import { disablePushNotifications, getPushNotificationState, registerForPushNotifications } from "@/services/notifications";
import { getMobileNotificationPreferences, updateMobileNotificationPreferences } from "@/services/mobile-notifications";
import { supabase } from "@/lib/supabase";
import { useSettings } from "@/hooks/use-catalog";

export function NotificationOptIn({ onEnabled }: { onEnabled?: () => void } = {}) {
  useLocale();
  const client = useQueryClient();
  const settings = useSettings();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const state = useQuery({ queryKey: ["push-permission"], queryFn: getPushNotificationState, staleTime: 0 });
  useFocusEffect(useCallback(() => {
    void client.invalidateQueries({ queryKey: ["push-permission"] });
    const listener = AppState.addEventListener("change", value => {
      if (value === "active") void client.invalidateQueries({ queryKey: ["push-permission"] });
    });
    return () => listener.remove();
  }, [client]));
  if (settings.data?.find(setting => setting.key === "app_notifications_enabled")?.value === "false") return null;

  const enable = async () => {
    if (busy) return;
    setBusy(true); setError(false);
    try {
      const token = await registerForPushNotifications(undefined, { requestPermission: true });
      if (token) {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          const { preferences } = await getMobileNotificationPreferences();
          await updateMobileNotificationPreferences({ ...preferences, marketing_enabled: true, new_products: true, promotions: true });
          await client.invalidateQueries({ queryKey: ["mobile-notification-preferences"] });
        }
      }
      await state.refetch();
      if (token) onEnabled?.();
    } catch { setError(true); }
    finally { setBusy(false); }
  };
  const enabled = state.data?.enabled;
  const disable = async () => {
    if (busy) return;
    setBusy(true); setError(false);
    try { await disablePushNotifications(); await state.refetch(); }
    catch { setError(true); }
    finally { setBusy(false); }
  };
  const denied = state.data?.status === "denied" && !state.data?.canAskAgain;
  const unsupported = state.data && !state.data.supported;
  return (
    <Animated.View entering={FadeInDown.duration(500).reduceMotion(ReduceMotion.System)} style={styles.card}>
      <View style={styles.row}>
        <View style={styles.icon}><Ionicons name={enabled ? "checkmark" : "notifications-outline"} size={23} color="#B8E7C3" /></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>{msg("notificationOptIn.eyebrow")}</Text>
          <Text style={styles.title}>{msg(enabled ? "notificationOptIn.enabled" : "notificationOptIn.title")}</Text>
        </View>
      </View>
      <Text style={styles.description}>{msg(enabled ? "notificationOptIn.enabledBody" : "notificationOptIn.body")}</Text>
      {error ? <Text accessibilityRole="alert" style={styles.error}>{msg("notificationOptIn.error")}</Text> : null}
      {unsupported ? <Text style={styles.note}>{msg(Platform.OS === "web" ? "notificationOptIn.browserUnsupported" : "notificationOptIn.nativeUnsupported")}</Text> : denied ? (
        Platform.OS === "web" ? <Text style={styles.note}>{msg("notificationOptIn.browserDenied")}</Text> :
        <AnimatedPressable accessibilityRole="button" onPress={() => void Linking.openSettings().catch(() => setError(true))} style={styles.button}><Text style={styles.buttonText}>{msg("scanner.openSettings")}</Text><Ionicons name="open-outline" size={17} color="#193D2B" /></AnimatedPressable>
      ) : !enabled || error ? (
        <AnimatedPressable accessibilityRole="button" accessibilityState={{ busy, disabled: busy || state.isPending }} disabled={busy || state.isPending} onPress={() => void enable()} style={[styles.button, busy && { opacity: 0.7 }]}>
          <Text style={styles.buttonText}>{msg(busy ? "notificationOptIn.enabling" : "notificationOptIn.enable")}</Text>
          {busy ? <ActivityIndicator color="#193D2B" /> : <Ionicons name="arrow-forward" size={18} color="#193D2B" />}
        </AnimatedPressable>
      ) : null}
      {enabled ? <AnimatedPressable accessibilityRole="button" disabled={busy} accessibilityState={{ disabled: busy, busy }} onPress={() => void disable()} style={{ minHeight: 44, justifyContent: "center" }}><Text style={styles.note}>{msg("notificationOptIn.disable")}</Text></AnimatedPressable> : <Text style={styles.note}>{msg("notificationOptIn.choice")}</Text>}
    </Animated.View>
  );
}
const styles = StyleSheet.create({
  card: { backgroundColor: "#193D2B", borderRadius: 24, padding: 22, marginBottom: 20, width: "100%", maxWidth: 520, alignSelf: "center" },
  row: { flexDirection: "row", alignItems: "center", gap: 14 },
  icon: { width: 48, height: 48, borderRadius: 16, backgroundColor: "#31543F", alignItems: "center", justifyContent: "center" },
  eyebrow: { color: "#B8E7C3", fontFamily: "Inter_600SemiBold", fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 5 },
  title: { color: "#FFFFFF", fontFamily: "Inter_700Bold", fontSize: 19, lineHeight: 25, letterSpacing: -0.4 },
  description: { color: "#D7E5DA", fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 21, marginTop: 15 },
  button: { marginTop: 18, minHeight: 50, backgroundColor: "#F6F8F0", borderRadius: 25, paddingHorizontal: 19, paddingVertical: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  buttonText: { flexShrink: 1, color: "#193D2B", fontFamily: "Inter_600SemiBold", fontSize: 13 },
  note: { marginTop: 12, color: "#BCD1C1", fontFamily: "Inter_400Regular", fontSize: 11, lineHeight: 17 },
  error: { color: "#FFDBBE", fontSize: 12, lineHeight: 18, marginTop: 12 },
});
