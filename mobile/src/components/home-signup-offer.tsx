import Ionicons from "@expo/vector-icons/Ionicons";
import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  type TextStyle,
  View,
} from "react-native";
import { AnimatedPressable } from "@/components/animated-pressable";
import { typography } from "@/constants/theme";
import { ApiError, apiRequest } from "@/lib/api-client";
import { useCommerceStore } from "@/stores/commerce";

type WelcomeOfferResponse = {
  alreadySubscribed: boolean;
  message: string;
  coupon: {
    code: string;
    percent: number;
    expires_at: string | null;
    available: boolean;
    min_order: number;
    eligible_products: "non_promotional_only";
  };
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const webInputReset =
  Platform.OS === "web"
    ? ({
        outlineStyle: "none",
        outlineWidth: 0,
        outlineColor: "transparent",
        borderWidth: 0,
        boxShadow: "none",
        backgroundColor: "transparent",
      } as unknown as TextStyle)
    : undefined;

export function HomeSignupOffer() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "used" | "error"
  >("idle");
  const [message, setMessage] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const [focused, setFocused] = useState(false);
  const copyResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveCoupon = useCommerceStore((state) => state.setCoupon);
  const normalizedEmail = email.normalize("NFKC").trim().toLowerCase();
  const validEmail =
    emailPattern.test(normalizedEmail) && normalizedEmail.length <= 254;

  useEffect(
    () => () => {
      if (copyResetTimer.current) clearTimeout(copyResetTimer.current);
    },
    [],
  );

  const copyCoupon = async () => {
    if (!couponCode) return;
    try {
      await Clipboard.setStringAsync(couponCode);
      setCopyFailed(false);
      setCopied(true);
      if (copyResetTimer.current) clearTimeout(copyResetTimer.current);
      copyResetTimer.current = setTimeout(() => setCopied(false), 2_000);
    } catch {
      setCopied(false);
      setCopyFailed(true);
    }
  };

  const submit = async () => {
    if (status === "loading") return;
    if (!emailPattern.test(normalizedEmail) || normalizedEmail.length > 254) {
      setStatus("error");
      setMessage("Saisis une adresse e-mail valide.");
      return;
    }

    setStatus("loading");
    setMessage("");
    try {
      const response = await apiRequest<WelcomeOfferResponse>(
        "/api/newsletter",
        {
          method: "POST",
          body: JSON.stringify({
            email: normalizedEmail,
            offer: "welcome10",
            source: "mobile_home_welcome_offer",
          }),
          timeoutMs: 15_000,
        },
      );
      setCouponCode(response.coupon.code);
      if (response.coupon.available) {
        saveCoupon(response.coupon.code);
        setStatus("success");
        setMessage("Code enregistré automatiquement pour ton prochain panier.");
      } else {
        setStatus("used");
        setMessage("Cette offre de bienvenue a déjà été utilisée.");
      }
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof ApiError
          ? error.message
          : "Impossible de créer le code pour le moment. Réessaie.",
      );
    }
  };

  const resetFeedback = () => {
    if (status === "error") {
      setStatus("idle");
      setMessage("");
    }
  };

  if (status === "success") {
    return (
      <View accessibilityLiveRegion="polite" style={styles.successCard}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark" size={22} color={colors.ink} />
        </View>
        <Text style={styles.successEyebrow}>BIENVENUE CHEZ L’ECOMAX</Text>
        <Text accessibilityRole="header" style={styles.successTitle}>
          TON -10% EST PRÊT
        </Text>
        <AnimatedPressable
          accessibilityHint="Copie le code dans le presse-papiers"
          accessibilityLabel={`Copier le code promotionnel ${couponCode}`}
          haptic={false}
          onPress={() => void copyCoupon()}
          pressedScale={0.985}
          style={styles.codePill}
        >
          <Text selectable style={styles.codeText}>
            {couponCode}
          </Text>
          <View style={[styles.copyAction, copied && styles.copyActionDone]}>
            <Ionicons
              name={copied ? "checkmark" : "copy-outline"}
              size={15}
              color={copied ? colors.white : colors.ink}
            />
            <Text style={[styles.copyText, copied && styles.copyTextDone]}>
              {copied ? "COPIÉ" : "COPIER"}
            </Text>
          </View>
        </AnimatedPressable>
        <Text accessibilityLiveRegion="polite" style={styles.successMessage}>
          {copied
            ? "Code copié. Tu peux maintenant l’utiliser au panier."
            : copyFailed
              ? "Copie indisponible. Appuie longuement sur le code pour le sélectionner."
              : message}
        </Text>
        <Text style={styles.successFinePrint}>
          Valable 30 jours dès 200 MAD d’articles hors promotion. Une seule
          utilisation par adresse e-mail.
        </Text>
        <AnimatedPressable
          accessibilityLabel="Découvrir les produits éligibles"
          onPress={() => router.push("/catalog")}
          style={styles.shopButton}
        >
          <Text style={styles.shopButtonText}>DÉCOUVRIR LES PRODUITS</Text>
          <Ionicons name="arrow-forward" size={17} color={colors.white} />
        </AnimatedPressable>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.eyebrowRow}>
        <Text style={styles.eyebrow}>OFFRE DE BIENVENUE</Text>
      </View>
      <Text accessibilityRole="header" style={styles.title}>
        Inscris-toi,{"\n"}profite de <Text style={styles.accent}>-10 %</Text>
      </Text>
      <Text style={styles.description}>
        Rejoins L’ECOMAX et reçois immédiatement ton code personnel de
        bienvenue.
      </Text>

      <View style={styles.form}>
        <View style={styles.inputHeader}>
          <Text nativeID="welcome-email-label" style={styles.inputLabel}>
            ADRESSE E-MAIL
          </Text>
          <View style={styles.secureLabel}>
            <Ionicons
              name="lock-closed-outline"
              size={10}
              color={colors.muted}
            />
            <Text style={styles.secureLabelText}>CONFIDENTIEL</Text>
          </View>
        </View>
        <View
          style={[
            styles.inputShell,
            focused && styles.inputShellFocused,
            status === "error" && styles.inputShellError,
          ]}
        >
          <View style={[styles.inputIcon, focused && styles.inputIconFocused]}>
            <Ionicons
              name="mail-outline"
              size={18}
              color={focused ? colors.greenDark : colors.inputMuted}
            />
          </View>
          <TextInput
            accessibilityHint="Saisis ton e-mail pour recevoir le code de bienvenue."
            accessibilityLabel="Adresse e-mail pour recevoir dix pour cent de remise"
            accessibilityLabelledBy="welcome-email-label"
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            cursorColor={colors.green}
            editable={status !== "loading"}
            importantForAutofill="yes"
            keyboardType="email-address"
            maxLength={254}
            onBlur={() => setFocused(false)}
            onChangeText={(value) => {
              setEmail(value);
              resetFeedback();
            }}
            onFocus={() => setFocused(true)}
            onSubmitEditing={() => void submit()}
            placeholder="nom@exemple.com"
            placeholderTextColor={colors.inputMuted}
            returnKeyType="send"
            selectionColor="rgba(61,220,98,0.34)"
            style={[styles.input, webInputReset]}
            textContentType="emailAddress"
            value={email}
          />
          {validEmail ? (
            <View
              accessibilityLabel="Adresse e-mail valide"
              accessibilityRole="image"
              style={styles.validIndicator}
            >
              <Ionicons name="checkmark" size={14} color={colors.white} />
            </View>
          ) : null}
          {email && status !== "loading" ? (
            <AnimatedPressable
              accessibilityLabel="Effacer l’adresse e-mail"
              haptic={false}
              onPress={() => {
                setEmail("");
                resetFeedback();
              }}
              pressedScale={0.9}
              style={styles.clearButton}
            >
              <Ionicons name="close" size={17} color={colors.inputMuted} />
            </AnimatedPressable>
          ) : null}
        </View>
        {message && status === "error" ? (
          <View accessibilityLiveRegion="polite" style={styles.fieldFeedback}>
            <Ionicons
              name="alert-circle-outline"
              size={14}
              color={colors.error}
            />
            <Text style={styles.fieldFeedbackText}>{message}</Text>
          </View>
        ) : null}
        <AnimatedPressable
          accessibilityLabel="Recevoir mon code de dix pour cent"
          accessibilityState={{
            busy: status === "loading",
            disabled: status === "loading",
          }}
          disabled={status === "loading"}
          onPress={() => void submit()}
          pressedScale={0.985}
          style={[
            styles.submitButton,
            status === "loading" && styles.submitButtonDisabled,
          ]}
        >
          {status === "loading" ? (
            <View style={styles.loadingContent}>
              <ActivityIndicator color={colors.white} size="small" />
              <Text style={styles.submitText}>CRÉATION DU CODE…</Text>
            </View>
          ) : (
            <>
              <Text style={styles.submitText}>Recevoir mon code -10 %</Text>
              <View style={styles.submitIcon}>
                <Ionicons name="arrow-forward" size={17} color={colors.white} />
              </View>
            </>
          )}
        </AnimatedPressable>
      </View>

      {message && status === "used" ? (
        <View accessibilityLiveRegion="polite" style={styles.feedback}>
          <Ionicons
            name="information-circle-outline"
            size={16}
            color={colors.green}
          />
          <Text style={styles.feedbackTextUsed}>{message}</Text>
        </View>
      ) : null}

      <View style={styles.terms}>
        <Ionicons
          name="shield-checkmark-outline"
          size={16}
          color={colors.green}
        />
        <Text style={styles.termsText}>
          Offre personnelle dès 200 MAD d’articles hors promotion, valable une
          seule fois par adresse e-mail.
        </Text>
      </View>
    </View>
  );
}

const colors = {
  ink: "#101210",
  white: "#FFFFFF",
  green: "#3DDC62",
  greenDark: "#168A38",
  muted: "#697069",
  inputMuted: "#697069",
  error: "#B42332",
};

const styles = StyleSheet.create({
  card: {
    minHeight: 0,
    marginHorizontal: 16,
    marginTop: 14,
    paddingHorizontal: 20,
    paddingVertical: 24,
    overflow: "hidden",
    borderRadius: 14,
    backgroundColor: "#F5F6F3",
  },
  eyebrowRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  eyebrow: {
    color: colors.greenDark,
    fontFamily: typography.semibold,
    fontSize: 9,
    letterSpacing: 1.1,
  },
  title: {
    marginTop: 12,
    color: colors.ink,
    fontFamily: typography.bold,
    fontSize: 27,
    lineHeight: 33,
    letterSpacing: -0.7,
  },
  accent: { color: colors.greenDark },
  description: {
    maxWidth: 310,
    marginTop: 10,
    color: colors.inputMuted,
    fontFamily: typography.regular,
    fontSize: 12,
    lineHeight: 19,
  },
  form: { marginTop: 19, gap: 9 },
  inputHeader: {
    minHeight: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  inputLabel: {
    color: colors.ink,
    fontFamily: typography.medium,
    fontSize: 10,
    letterSpacing: 0.4,
  },
  secureLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  secureLabelText: {
    color: colors.muted,
    fontFamily: typography.bold,
    fontSize: 6.5,
    letterSpacing: 0.7,
  },
  inputShell: {
    minHeight: 52,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#D7DDD7",
    borderRadius: 10,
    backgroundColor: colors.white,
  },
  inputShellFocused: {
    borderColor: colors.green,
    backgroundColor: colors.white,
  },
  inputShellError: { borderColor: colors.error, backgroundColor: "#FFF7F7" },
  inputIcon: {
    width: 20,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 0,
    backgroundColor: "transparent",
  },
  inputIconFocused: { backgroundColor: "transparent" },
  input: {
    minWidth: 0,
    height: 50,
    flex: 1,
    color: colors.ink,
    fontFamily: typography.regular,
    fontSize: 14,
  },
  validIndicator: {
    width: 23,
    height: 23,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: colors.greenDark,
  },
  clearButton: {
    width: 32,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  fieldFeedback: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  fieldFeedbackText: {
    minWidth: 0,
    flex: 1,
    color: colors.error,
    fontFamily: typography.medium,
    fontSize: 11,
    lineHeight: 16,
  },
  submitButton: {
    minHeight: 50,
    paddingLeft: 16,
    paddingRight: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 10,
    backgroundColor: colors.greenDark,
  },
  submitButtonDisabled: { opacity: 0.65 },
  submitText: {
    color: colors.white,
    fontFamily: typography.semibold,
    fontSize: 13,
    letterSpacing: 0,
  },
  loadingContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  submitIcon: {
    width: 20,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "transparent",
  },
  feedback: {
    marginTop: 11,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
  },
  feedbackTextUsed: {
    minWidth: 0,
    flex: 1,
    color: colors.greenDark,
    fontFamily: typography.medium,
    fontSize: 11,
    lineHeight: 16,
  },
  terms: {
    marginTop: 14,
    paddingTop: 0,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderTopWidth: 0,
    borderTopColor: "#303330",
  },
  termsText: {
    minWidth: 0,
    flex: 1,
    color: colors.muted,
    fontFamily: typography.regular,
    fontSize: 10,
    lineHeight: 16,
  },
  successCard: {
    minHeight: 340,
    marginHorizontal: 16,
    marginTop: 14,
    padding: 22,
    alignItems: "center",
    borderRadius: 14,
    backgroundColor: "#F5F6F3",
  },
  successIcon: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: colors.green,
  },
  successEyebrow: {
    marginTop: 15,
    color: "#11843A",
    fontFamily: typography.black,
    fontSize: 8,
    letterSpacing: 1.2,
  },
  successTitle: {
    marginTop: 6,
    color: colors.ink,
    fontFamily: typography.bold,
    fontSize: 24,
    letterSpacing: -0.8,
  },
  codePill: {
    width: "100%",
    minHeight: 48,
    marginTop: 16,
    paddingLeft: 16,
    paddingRight: 7,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#D7DDD7",
    borderRadius: 10,
    backgroundColor: colors.white,
  },
  codeText: {
    minWidth: 0,
    flex: 1,
    color: colors.ink,
    fontFamily: typography.black,
    fontSize: 13,
    letterSpacing: 0.7,
  },
  copyAction: {
    minWidth: 82,
    minHeight: 34,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 9,
    backgroundColor: "#E8F7EC",
  },
  copyActionDone: {
    backgroundColor: colors.greenDark,
  },
  copyText: {
    color: colors.ink,
    fontFamily: typography.black,
    fontSize: 8,
    letterSpacing: 0.45,
  },
  copyTextDone: { color: colors.white },
  successMessage: {
    marginTop: 13,
    color: "#315B3D",
    fontFamily: typography.semibold,
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
  successFinePrint: {
    maxWidth: 290,
    marginTop: 5,
    color: "#5D7263",
    fontFamily: typography.regular,
    fontSize: 10,
    lineHeight: 16,
    textAlign: "center",
  },
  shopButton: {
    width: "100%",
    minHeight: 49,
    marginTop: 18,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    backgroundColor: colors.ink,
  },
  shopButtonText: {
    color: colors.white,
    fontFamily: typography.black,
    fontSize: 9.5,
    letterSpacing: 0.5,
  },
});
