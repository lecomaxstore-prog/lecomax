import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { AnimatedPressable } from "@/components/animated-pressable";
import { msg, useLocale } from "@/i18n";
import { localizedError } from "@/i18n/errors";
import { supabase } from "@/lib/supabase";

export function AuthConfirmation({ email, onSignIn }: { email: string; onSignIn: () => void }) {
  useLocale();
  const [seconds, setSeconds] = useState(60);
  const nextSend = useRef(0);
  const sending = useRef(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ error?: boolean; text: string }>();

  useEffect(() => {
    nextSend.current = Date.now() + 60_000;
    const timer = setInterval(() => setSeconds(Math.max(0, Math.ceil((nextSend.current - Date.now()) / 1000))), 1000);
    return () => clearInterval(timer);
  }, []);

  async function resend() {
    if (sending.current || Date.now() < nextSend.current) return;
    sending.current = true;
    setBusy(true);
    setFeedback(undefined);
    try {
      const { error } = await supabase.auth.resend({ type: "signup", email });
      setFeedback(error ? { error: true, text: localizedError(error) } : { text: msg("auth.confirmResent") });
      nextSend.current = Date.now() + 60_000;
      setSeconds(60);
    } catch {
      setFeedback({ error: true, text: msg("auth.checkYourConnectionAndTryAgain") });
    } finally {
      sending.current = false;
      setBusy(false);
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.hero}>
        <View style={styles.icon}><Ionicons name="mail-outline" size={30} color="#D6F5CD" /></View>
        <Text style={styles.eyebrow}>{msg("auth.confirmEyebrow")}</Text>
        <Text accessibilityRole="header" style={styles.title}>{msg("auth.confirmTitle")}</Text>
        <Text style={styles.heroText}>{msg("auth.confirmIntro")}</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.label}>{msg("auth.confirmSentTo")}</Text>
        <Text selectable style={styles.email}>{email}</Text>
        <Text style={styles.copy}>{msg("auth.confirmInstructions")}</Text>
        <View style={styles.tip}>
          <Ionicons name="information-circle-outline" size={20} color="#53604F" />
          <Text style={styles.tipText}>{msg("auth.confirmSpam")}</Text>
        </View>
        {feedback ? <Text accessibilityLiveRegion="polite" style={[styles.copy, { color: feedback.error ? "#B42318" : "#168526" }]}>{feedback.text}</Text> : null}
        <AnimatedPressable accessibilityRole="button" onPress={onSignIn} style={styles.primary}>
          <Text style={styles.primaryText}>{msg("auth.confirmSignIn")}</Text>
          <Ionicons name="arrow-forward" size={19} color="#FFFFFF" />
        </AnimatedPressable>
        <AnimatedPressable accessibilityRole="button" accessibilityState={{ disabled: busy || seconds > 0 }} disabled={busy || seconds > 0} onPress={() => void resend()} style={styles.secondary}>
          {busy ? <ActivityIndicator color="#183D29" /> : <Text style={[styles.secondaryText, seconds > 0 && { color: "#677162" }]}>{seconds > 0 ? msg("auth.confirmResendWait", { seconds }) : msg("auth.confirmResend")}</Text>}
        </AnimatedPressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { width: "100%", maxWidth: 480, alignSelf: "center", borderRadius: 24, overflow: "hidden", backgroundColor: "#FFFFFF", marginTop: 24 },
  hero: { backgroundColor: "#183D29", padding: 28, paddingVertical: 32 },
  icon: { width: 60, height: 60, borderRadius: 18, backgroundColor: "#2B4D36", alignItems: "center", justifyContent: "center", marginBottom: 28 },
  eyebrow: { color: "#BBEDAD", fontSize: 10, fontWeight: "700", letterSpacing: 2, marginBottom: 14 },
  title: { color: "#FFFFFF", fontSize: 34, fontWeight: "800", letterSpacing: -1, lineHeight: 39 },
  heroText: { color: "#E0E9DF", fontSize: 15, lineHeight: 24, marginTop: 14 },
  body: { padding: 28, gap: 14 },
  label: { color: "#667060", fontSize: 12 },
  email: { color: "#111811", fontSize: 18, fontWeight: "700", flexShrink: 1 },
  copy: { color: "#566052", fontSize: 14, lineHeight: 23 },
  tip: { flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: "#F3F5EF", padding: 14, borderRadius: 12, marginVertical: 4 },
  tipText: { flex: 1, color: "#53604F", fontSize: 12, lineHeight: 19 },
  primary: { minHeight: 54, borderRadius: 10, backgroundColor: "#111811", flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 12, padding: 16 },
  primaryText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700", flexShrink: 1 },
  secondary: { minHeight: 48, justifyContent: "center", alignItems: "center" },
  secondaryText: { color: "#183D29", fontSize: 13, fontWeight: "600", textAlign: "center" },
});
