import { localizedError } from "@/i18n/errors";
import { msg, useLocale } from "@/i18n";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useRef, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Screen } from "@/components/screen";
import { AnimatedPressable } from "@/components/animated-pressable";
import { typography } from "@/constants/theme";
import { apiRequest } from "@/lib/api-client";

const CONFIRMATION = "remove my account";

export default function DeleteAccountScreen() {
  useLocale();
  const confirmationPhrase = msg("deleteAccount.confirmationPhrase");
  const [confirmation, setConfirmation] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const pending = useRef(false);
  const confirmed = confirmation === confirmationPhrase;
  const close = () => router.canGoBack() ? router.back() : router.replace("/account");

  const submit = async () => {
    if (!confirmed || pending.current || message) return;
    pending.current = true;
    setSaving(true);
    setError("");
    try {
      await apiRequest<{ message: string }>("/api/account/delete-request", {
        method: "POST", authenticated: true, retries: 0, timeoutMs: 15_000,
        body: JSON.stringify({ confirmation: CONFIRMATION }),
      });
      setMessage(msg("deleteAccount.requestSaved"));
      setConfirmation("");
    } catch (reason) {
      setError(reason instanceof Error ? localizedError(reason) : msg("deleteAccount.unableToSendYourRequestTryAgain"));
    } finally {
      pending.current = false;
      setSaving(false);
    }
  };

  return <Screen className="bg-white">
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        <View style={styles.panel}>
          <View style={styles.icon}><Ionicons name={message ? "checkmark-outline" : "trash-outline"} size={26} color="#9C3833" /></View>
          <Text accessibilityRole="header" style={styles.title}>{message ? msg("deleteAccount.requestReceived") : msg("deleteAccount.deleteMyAccount")}</Text>
          {message ? <Text accessibilityLiveRegion="polite" style={styles.description}>{message}</Text> : <>
            <Text style={styles.description}>{msg("deleteAccount.yourRequestWillBeReviewedBeforeYourAccountAndItsDataAre")}</Text>
            <Text style={styles.label}>{msg("deleteAccount.toConfirmEnterExactly")}</Text>
            <Text selectable style={styles.phrase}>{confirmationPhrase}</Text>
            <TextInput
              accessibilityLabel={msg("deleteAccount.confirmationHint", { phrase: confirmationPhrase })}
              value={confirmation} onChangeText={setConfirmation}
              editable={!saving} autoCapitalize="none" autoCorrect={false} autoComplete="off"
              placeholder={confirmationPhrase} placeholderTextColor="#9A9D97"
              style={[styles.input, confirmed && styles.inputConfirmed]}
              onSubmitEditing={() => void submit()} returnKeyType="done"
            />
            {error ? <Text accessibilityRole="alert" accessibilityLiveRegion="assertive" style={styles.error}>{error}</Text> : null}
            <AnimatedPressable accessibilityRole="button" accessibilityLabel={msg("deleteAccount.confirmDeletionRequest")}
              accessibilityState={{ disabled: !confirmed || saving, busy: saving }}
              disabled={!confirmed || saving} onPress={() => void submit()}
              style={[styles.confirm, (!confirmed || saving) && styles.disabled]}>
              {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.confirmText}>{msg("deleteAccount.confirm")}</Text>}
            </AnimatedPressable>
          </>}
          <AnimatedPressable accessibilityRole="button" onPress={close} style={styles.cancel}>
            <Text style={styles.cancelText}>{message ? msg("deleteAccount.backToMyAccount") : msg("addresses.cancel")}</Text>
          </AnimatedPressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  </Screen>;
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#F6F7F3" },
  content: { flexGrow: 1, justifyContent: "center", padding: 20 },
  panel: { padding: 24, borderRadius: 24, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E5E8E0" },
  icon: { width: 56, height: 56, borderRadius: 18, backgroundColor: "#FCF0ED", alignItems: "center", justifyContent: "center" },
  title: { marginTop: 20, fontFamily: typography.semibold, fontSize: 23, color: "#203D2C" },
  description: { marginTop: 12, fontFamily: typography.regular, fontSize: 13, lineHeight: 21, color: "#626B61" },
  label: { marginTop: 24, fontFamily: typography.medium, fontSize: 12, color: "#30382F" },
  phrase: { marginTop: 8, fontFamily: typography.semibold, fontSize: 16, color: "#9C3833" },
  input: { marginTop: 14, minHeight: 54, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: "#DDE2D9", fontFamily: typography.regular, fontSize: 15, color: "#203D2C" },
  inputConfirmed: { borderColor: "#527357", backgroundColor: "#F5F8F1" },
  error: { marginTop: 12, fontSize: 12, lineHeight: 18, color: "#9C3833" },
  confirm: { marginTop: 20, minHeight: 52, borderRadius: 13, backgroundColor: "#9C3833", alignItems: "center", justifyContent: "center" },
  disabled: { opacity: 0.4 },
  confirmText: { color: "#FFFFFF", fontFamily: typography.semibold, fontSize: 14 },
  cancel: { marginTop: 10, minHeight: 48, alignItems: "center", justifyContent: "center" },
  cancelText: { color: "#203D2C", fontFamily: typography.semibold, fontSize: 13 },
});
