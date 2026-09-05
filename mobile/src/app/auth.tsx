import { zodResolver } from "@hookform/resolvers/zod";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  type TextStyle,
  View,
} from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { z } from "zod";
import { AnimatedPressable } from "@/components/animated-pressable";
import { BrandLogo } from "@/components/brand-logo";
import { palette, typography } from "@/constants/theme";
import { supabase } from "@/lib/supabase";

const schema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: z.email("Saisissez une adresse email valide."),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères."),
  confirmPassword: z.string(),
});

type FormData = z.infer<typeof schema>;

const webInputReset =
  Platform.OS === "web"
    ? ({
        outlineStyle: "none",
        outlineWidth: 0,
        outlineColor: "transparent",
        borderWidth: 0,
        boxShadow: "none",
      } as unknown as TextStyle)
    : undefined;

export default function AuthScreen() {
  const params = useLocalSearchParams<{
    mode?: "login" | "signup";
    returnTo?: string;
  }>();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<"login" | "signup">(
    params.mode === "signup" ? "signup" : "login",
  );
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<
    "firstName" | "lastName" | "email" | "password" | "confirmPassword"
  >();
  const [feedback, setFeedback] = useState<{
    type: "error" | "success";
    message: string;
  }>();
  const [resetting, setResetting] = useState(false);

  const {
    control,
    getValues,
    handleSubmit,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const submit = handleSubmit(
    async ({ firstName, lastName, email, password, confirmPassword }) => {
      setFeedback(undefined);
      if (
        mode === "signup" &&
        (firstName.trim().length < 2 || lastName.trim().length < 2)
      ) {
        setFeedback({
          type: "error",
          message: "Saisissez votre prénom et votre nom.",
        });
        return;
      }
      if (mode === "signup" && password !== confirmPassword) {
        setFeedback({
          type: "error",
          message: "Les deux mots de passe ne correspondent pas.",
        });
        return;
      }

      const normalizedEmail = email.trim().toLowerCase();
      const result =
        mode === "login"
          ? await supabase.auth.signInWithPassword({
              email: normalizedEmail,
              password,
            })
          : await supabase.auth.signUp({
              email: normalizedEmail,
              password,
              options: {
                data: {
                  first_name: firstName.trim(),
                  last_name: lastName.trim(),
                  full_name: `${firstName.trim()} ${lastName.trim()}`,
                },
              },
            });

      if (result.error) {
        setFeedback({
          type: "error",
          message:
            result.error.message === "Invalid login credentials"
              ? "Adresse email ou mot de passe incorrect."
              : result.error.message,
        });
        return;
      }

      if (mode === "signup") {
        if (result.data.session) {
          router.replace(
            params.returnTo === "account" ? "/account" : "/profile",
          );
          return;
        }
        setFeedback({
          type: "success",
          message:
            "Compte créé. Vérifiez votre boîte email si une confirmation est demandée.",
        });
        return;
      }

      router.replace(params.returnTo === "account" ? "/account" : "/profile");
    },
  );

  const resetPassword = async () => {
    const email = getValues("email").trim().toLowerCase();
    if (!z.email().safeParse(email).success) {
      setFeedback({
        type: "error",
        message: "Saisissez d’abord votre adresse email.",
      });
      return;
    }

    setResetting(true);
    setFeedback(undefined);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setResetting(false);
    setFeedback({
      type: error ? "error" : "success",
      message:
        error?.message ||
        `Un email de réinitialisation a été envoyé à ${email}.`,
    });
  };

  const switchMode = () => {
    setMode((current) => (current === "login" ? "signup" : "login"));
    setFeedback(undefined);
    clearErrors();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.screen}
    >
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 10) }]}>
        <AnimatedPressable
          accessibilityLabel="Retour"
          onPress={() => router.back()}
          style={styles.closeButton}
        >
          <Ionicons name="arrow-back" size={21} color={palette.ink} />
        </AnimatedPressable>
        <BrandLogo header />
        <View
          accessible
          accessibilityLabel="Connexion sécurisée"
          style={styles.headerSecurity}
        >
          <Ionicons
            name="shield-checkmark-outline"
            size={19}
            color={palette.greenDark}
          />
        </View>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 24) + 20 },
        ]}
      >
        <Animated.View entering={FadeIn.duration(320)} style={styles.intro}>
          <Text style={styles.title}>
            {mode === "login" ? "Bon retour parmi nous." : "Bienvenue chez L’ecomax."}
          </Text>
          <Text style={styles.subtitle}>
            {mode === "login"
              ? "Connectez-vous pour retrouver votre compte."
              : "Créez votre compte en quelques instants."}
          </Text>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(100).duration(380)}
          style={styles.form}
        >
          <Text style={styles.formTitle}>{mode === "login" ? "Connexion" : "Créer un compte"}</Text>
          {feedback ? (
            <View
              style={[
                styles.feedback,
                feedback.type === "error"
                  ? styles.feedbackError
                  : styles.feedbackSuccess,
              ]}
            >
              <Ionicons
                name={
                  feedback.type === "error"
                    ? "alert-circle-outline"
                    : "checkmark-circle-outline"
                }
                size={19}
                color={
                  feedback.type === "error" ? palette.red : palette.greenDark
                }
              />
              <Text
                style={[
                  styles.feedbackText,
                  feedback.type === "error"
                    ? styles.feedbackTextError
                    : styles.feedbackTextSuccess,
                ]}
              >
                {feedback.message}
              </Text>
            </View>
          ) : null}

          {mode === "signup" ? (
            <View style={styles.nameRow}>
              <Controller
                control={control}
                name="firstName"
                render={({ field: { value, onChange, onBlur } }) => (
                  <View style={styles.nameField}>
                    <Text style={styles.fieldLabel}>PRÉNOM</Text>
                    <View
                      style={[
                        styles.inputShell,
                        focusedField === "firstName" &&
                          styles.inputShellFocused,
                      ]}
                    >
                      <TextInput
                        accessibilityLabel="Prénom"
                        value={value}
                        onChangeText={onChange}
                        onFocus={() => setFocusedField("firstName")}
                        onBlur={() => {
                          setFocusedField(undefined);
                          onBlur();
                        }}
                        placeholder="Prénom"
                        placeholderTextColor="#A1A5A2"
                        autoCapitalize="words"
                        autoComplete="given-name"
                        returnKeyType="next"
                        selectionColor={palette.greenDark}
                        style={[styles.input, styles.nameInput, webInputReset]}
                      />
                    </View>
                  </View>
                )}
              />
              <Controller
                control={control}
                name="lastName"
                render={({ field: { value, onChange, onBlur } }) => (
                  <View style={styles.nameField}>
                    <Text style={styles.fieldLabel}>NOM</Text>
                    <View
                      style={[
                        styles.inputShell,
                        focusedField === "lastName" && styles.inputShellFocused,
                      ]}
                    >
                      <TextInput
                        accessibilityLabel="Nom"
                        value={value}
                        onChangeText={onChange}
                        onFocus={() => setFocusedField("lastName")}
                        onBlur={() => {
                          setFocusedField(undefined);
                          onBlur();
                        }}
                        placeholder="Nom"
                        placeholderTextColor="#A1A5A2"
                        autoCapitalize="words"
                        autoComplete="family-name"
                        returnKeyType="next"
                        selectionColor={palette.greenDark}
                        style={[styles.input, styles.nameInput, webInputReset]}
                      />
                    </View>
                  </View>
                )}
              />
            </View>
          ) : null}

          <Controller
            control={control}
            name="email"
            render={({ field: { value, onChange, onBlur } }) => (
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>ADRESSE EMAIL</Text>
                <View
                  style={[
                    styles.inputShell,
                    focusedField === "email" && styles.inputShellFocused,
                    errors.email && styles.inputShellError,
                  ]}
                >
                  <View
                    style={[
                      styles.inputIcon,
                      focusedField === "email" && styles.inputIconFocused,
                    ]}
                  >
                    <Ionicons
                      name="mail-outline"
                      size={18}
                      color={focusedField === "email" ? palette.ink : "#787E79"}
                    />
                  </View>
                  <TextInput
                    accessibilityLabel="Adresse e-mail"
                    value={value}
                    onChangeText={onChange}
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => {
                      setFocusedField(undefined);
                      onBlur();
                    }}
                    placeholder="vous@exemple.com"
                    placeholderTextColor="#A1A5A2"
                    autoCapitalize="none"
                    autoComplete="email"
                    keyboardType="email-address"
                    returnKeyType="next"
                    selectionColor={palette.greenDark}
                    style={[styles.input, webInputReset]}
                  />
                  {value && !errors.email ? (
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color={palette.greenDark}
                    />
                  ) : null}
                </View>
                {errors.email ? (
                  <Text style={styles.errorText}>{errors.email.message}</Text>
                ) : null}
              </View>
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { value, onChange, onBlur } }) => (
              <View style={styles.fieldGroup}>
                <View style={styles.passwordLabelRow}>
                  <Text style={styles.fieldLabel}>MOT DE PASSE</Text>
                  {mode === "login" ? (
                    <Pressable
                      accessibilityLabel="Mot de passe oublié"
                      disabled={resetting}
                      onPress={() => void resetPassword()}
                      hitSlop={8}
                    >
                      <Text style={styles.forgotText}>
                        {resetting ? "Envoi…" : "Mot de passe oublié ?"}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
                <View
                  style={[
                    styles.inputShell,
                    focusedField === "password" && styles.inputShellFocused,
                    errors.password && styles.inputShellError,
                  ]}
                >
                  <View
                    style={[
                      styles.inputIcon,
                      focusedField === "password" && styles.inputIconFocused,
                    ]}
                  >
                    <Ionicons
                      name="lock-closed-outline"
                      size={18}
                      color={
                        focusedField === "password" ? palette.ink : "#787E79"
                      }
                    />
                  </View>
                  <TextInput
                    accessibilityLabel="Mot de passe"
                    value={value}
                    onChangeText={onChange}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => {
                      setFocusedField(undefined);
                      onBlur();
                    }}
                    onSubmitEditing={
                      mode === "login" ? () => void submit() : undefined
                    }
                    placeholder={mode === "login" ? "Votre mot de passe" : "8 caractères minimum"}
                    placeholderTextColor="#A1A5A2"
                    autoCapitalize="none"
                    autoComplete={
                      mode === "login" ? "current-password" : "new-password"
                    }
                    returnKeyType={mode === "login" ? "done" : "next"}
                    secureTextEntry={!showPassword}
                    selectionColor={palette.greenDark}
                    style={[styles.input, webInputReset]}
                  />
                  <Pressable
                    accessibilityLabel={
                      showPassword
                        ? "Masquer le mot de passe"
                        : "Afficher le mot de passe"
                    }
                    onPress={() => setShowPassword((visible) => !visible)}
                    hitSlop={8}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color="#737874"
                    />
                  </Pressable>
                </View>
                {errors.password ? (
                  <Text style={styles.errorText}>
                    {errors.password.message}
                  </Text>
                ) : null}
              </View>
            )}
          />

          {mode === "signup" ? (
            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { value, onChange, onBlur } }) => {
                const passwordMatches =
                  value.length > 0 && value === getValues("password");
                return (
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>
                      CONFIRMER LE MOT DE PASSE
                    </Text>
                    <View
                      style={[
                        styles.inputShell,
                        focusedField === "confirmPassword" &&
                          styles.inputShellFocused,
                      ]}
                    >
                      <View
                        style={[
                          styles.inputIcon,
                          focusedField === "confirmPassword" &&
                            styles.inputIconFocused,
                        ]}
                      >
                        <Ionicons
                          name="shield-checkmark-outline"
                          size={18}
                          color="#787E79"
                        />
                      </View>
                      <TextInput
                        accessibilityLabel="Confirmer le mot de passe"
                        value={value}
                        onChangeText={onChange}
                        onFocus={() => setFocusedField("confirmPassword")}
                        onBlur={() => {
                          setFocusedField(undefined);
                          onBlur();
                        }}
                        onSubmitEditing={() => void submit()}
                        placeholder="Confirmez votre mot de passe"
                        placeholderTextColor="#A1A5A2"
                        autoCapitalize="none"
                        autoComplete="new-password"
                        returnKeyType="done"
                        secureTextEntry={!showPassword}
                        selectionColor={palette.greenDark}
                        style={[styles.input, webInputReset]}
                      />
                      {passwordMatches ? (
                        <Ionicons
                          name="checkmark-circle"
                          size={18}
                          color={palette.greenDark}
                        />
                      ) : null}
                    </View>
                  </View>
                );
              }}
            />
          ) : null}

          <AnimatedPressable
            accessibilityLabel={
              mode === "login" ? "Se connecter" : "Créer mon compte"
            }
            disabled={isSubmitting}
            onPress={() => void submit()}
            style={[
              styles.submitButton,
              mode === "signup" && styles.submitButtonSignup,
              isSubmitting && styles.buttonDisabled,
            ]}
          >
            {isSubmitting ? (
              <ActivityIndicator
                color={palette.ink}
              />
            ) : (
              <>
                <Text
                  style={[
                    styles.submitButtonText,
                    mode === "signup" && styles.submitButtonTextSignup,
                  ]}
                >
                  {mode === "login" ? "Se connecter" : "Créer mon compte"}
                </Text>
                {mode === "signup" ? (
                  <View style={styles.signupArrow}>
                    <Ionicons
                      name="arrow-forward"
                      size={17}
                      color={palette.ink}
                    />
                  </View>
                ) : (
                  <View style={styles.signupArrow}><Ionicons
                    name="arrow-forward"
                    size={18}
                    color={palette.ink}
                  /></View>
                )}
              </>
            )}
          </AnimatedPressable>

          <View style={styles.reassurance}>
            <View style={styles.reassuranceIcon}>
              <Ionicons
                name="shield-checkmark-outline"
                size={17}
                color={palette.greenDark}
              />
            </View>
            <View style={styles.reassuranceCopy}>
              <Text style={styles.reassuranceTitle}>
                Vos données sont protégées
              </Text>
              <Text style={styles.reassuranceText}>
                Connexion sécurisée et informations chiffrées
              </Text>
            </View>
          </View>

          {mode === "signup" ? (
            <Text style={styles.termsText}>
              En créant un compte, vous acceptez nos{" "}
              <Text style={styles.termsLink}>Conditions d’utilisation</Text> et
              notre{" "}
              <Text style={styles.termsLink}>Politique de confidentialité</Text>
              .
            </Text>
          ) : null}

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>OU</Text>
            <View style={styles.divider} />
          </View>

          <AnimatedPressable
            accessibilityLabel={
              mode === "login" ? "Créer un compte" : "Se connecter"
            }
            onPress={switchMode}
            style={styles.alternateButton}
          >
            <View style={styles.alternateCopy}><Text style={styles.alternatePrefix}>
              {mode === "login"
                ? "Nouveau chez L’ecomax ?"
                : "Déjà un compte ?"}
            </Text>
            <Text style={styles.alternateLabel}>
              {mode === "login" ? "Créer un compte" : "Se connecter"}
            </Text></View>
            <Ionicons
              name="arrow-forward"
              size={17}
              color={palette.ink}
              style={styles.alternateArrow}
            />
          </AnimatedPressable>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F6F7F4" },
  header: {
    minHeight: 70,
    paddingHorizontal: 16,
    paddingBottom: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F6F7F4",
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E6E3",
    borderRadius: 22,
    backgroundColor: palette.white,
    shadowColor: palette.ink,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  headerSecurity: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#D8EEDF",
    borderRadius: 22,
    backgroundColor: "#F0FAF3",
  },
  scrollContent: {
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  intro: { paddingHorizontal: 4, paddingTop: 24, paddingBottom: 18 },
  title: {
    color: "#18251D",
    fontFamily: typography.bold,
    fontSize: 26,
    lineHeight: 33,
    letterSpacing: -0.8,
  },
  subtitle: {
    maxWidth: 320,
    marginTop: 10,
    color: "#70766F",
    fontFamily: typography.regular,
    fontSize: 13,
    lineHeight: 20,
  },
  form: { marginTop: 16, padding: 20, borderRadius: 24, backgroundColor: palette.white, borderWidth: 1, borderColor: "#E7EAE3" },
  formTitle: { fontFamily: typography.bold, fontSize: 20, letterSpacing: -0.6, color: "#12291F", marginBottom: 22 },
  feedback: {
    marginBottom: 18,
    padding: 13,
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: 1,
    borderRadius: 13,
  },
  feedbackError: { borderColor: "#F0C6C6", backgroundColor: "#FFF4F4" },
  feedbackSuccess: { borderColor: "#CFE9D4", backgroundColor: "#F0FAF3" },
  feedbackText: {
    marginLeft: 9,
    flex: 1,
    fontFamily: typography.medium,
    fontSize: 11,
    lineHeight: 16,
  },
  feedbackTextError: { color: "#A82A2A" },
  feedbackTextSuccess: { color: palette.greenDark },
  nameRow: { flexDirection: "row", gap: 10 },
  nameField: { marginBottom: 18, flex: 1 },
  fieldGroup: { marginBottom: 18 },
  fieldLabel: {
    marginBottom: 8,
    color: "#5D625E",
    fontFamily: typography.black,
    fontSize: 9,
    letterSpacing: 0.8,
  },
  passwordLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  forgotText: {
    marginBottom: 8,
    color: "#27643B",
    fontFamily: typography.semibold,
    fontSize: 10,
    textDecorationLine: "underline",
  },
  inputShell: {
    height: 56,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DDE1DE",
    borderRadius: 15,
    backgroundColor: "#FAFBF8",
  },
  inputShellFocused: {
    borderWidth: 1.5,
    borderColor: "#458853",
    shadowColor: palette.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  inputShellError: { borderColor: palette.red, backgroundColor: "#FFFBFB" },
  inputIcon: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    backgroundColor: "#EFF3E9",
  },
  inputIconFocused: { backgroundColor: "#EAF7ED" },
  input: {
    minWidth: 0,
    height: "100%",
    marginLeft: 10,
    flex: 1,
    borderWidth: 0,
    backgroundColor: "transparent",
    color: palette.ink,
    fontFamily: typography.medium,
    fontSize: 13,
    outlineWidth: 0,
  },
  nameInput: { marginLeft: 5 },
  errorText: {
    marginTop: 6,
    marginLeft: 3,
    color: palette.red,
    fontFamily: typography.medium,
    fontSize: 10,
  },
  submitButton: {
    height: 56,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderWidth: 1,
    borderColor: "#B8F28B",
    borderRadius: 15,
    backgroundColor: "#B8F28B",
    shadowColor: palette.ink,
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0,
    shadowRadius: 13,
    elevation: 0,
  },
  buttonDisabled: { opacity: 0.65 },
  submitButtonSignup: {
    borderColor: "#B8F28B",
    backgroundColor: "#B8F28B",
    shadowColor: palette.greenDark,
    shadowOpacity: 0,
  },
  submitButtonText: {
    color: palette.ink,
    fontFamily: typography.black,
    fontSize: 13,
    letterSpacing: 0,
  },
  submitButtonTextSignup: { color: palette.ink },
  signupArrow: {
    position: "absolute",
    right: 8,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  reassurance: {
    marginTop: 13,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 13,
    backgroundColor: "#F6F8F2",
  },
  reassuranceIcon: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: palette.white,
  },
  reassuranceCopy: { marginLeft: 10, flex: 1 },
  reassuranceTitle: {
    color: palette.greenDark,
    fontFamily: typography.bold,
    fontSize: 10,
  },
  reassuranceText: {
    marginTop: 3,
    color: "#747A75",
    fontFamily: typography.regular,
    fontSize: 9,
  },
  termsText: {
    marginTop: 14,
    paddingHorizontal: 8,
    color: "#858A86",
    fontFamily: typography.regular,
    fontSize: 9.5,
    lineHeight: 15,
    textAlign: "center",
  },
  termsLink: {
    color: palette.ink,
    fontFamily: typography.semibold,
    textDecorationLine: "underline",
  },
  dividerRow: {
    marginVertical: 18,
    flexDirection: "row",
    alignItems: "center",
  },
  divider: { height: 1, flex: 1, backgroundColor: "#E4E7E5" },
  dividerText: {
    marginHorizontal: 12,
    color: "#969B97",
    fontFamily: typography.bold,
    fontSize: 8,
    letterSpacing: 1,
  },
  alternateButton: {
    minHeight: 64,
    paddingHorizontal: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#E0E5DA",
    borderRadius: 15,
    backgroundColor: palette.white,
    shadowColor: palette.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0,
    shadowRadius: 9,
    elevation: 0,
  },
  alternateCopy: { flex: 1, gap: 5 },
  alternatePrefix: {
    color: palette.muted,
    fontFamily: typography.bold,
    fontSize: 10,
  },
  alternateLabel: {
    color: palette.ink,
    fontFamily: typography.black,
    fontSize: 12,
  },
  alternateArrow: { marginLeft: 9 },
});
