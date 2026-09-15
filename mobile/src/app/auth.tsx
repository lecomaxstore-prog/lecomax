import { localizedError } from "@/i18n/errors";
import { msg, useLocale } from "@/i18n";
import { zodResolver } from "@hookform/resolvers/zod";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { useEffect, useRef, useState } from "react";
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
import { AuthConfirmation } from "@/components/auth-confirmation";
import { palette, typography } from "@/constants/theme";
import { supabase } from "@/lib/supabase";
import { runtimeConfig } from "@/lib/runtime-config";
import { completeGoogleSignIn, startGoogleSignIn } from "@/lib/google-auth";

const schema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: z.email({ error: () => msg("auth.enterAValidEmailAddress") }),
  password: z
    .string()
    .min(8, { error: () => msg("auth.yourPasswordMustContainAtLeast8Characters") }),
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
  useLocale();
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
  const [googleLoading, setGoogleLoading] = useState(false);
  const googlePending = useRef(false);
  const [confirmationEmail, setConfirmationEmail] = useState<string>();

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

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const callback = new URL(window.location.href);
    if (!callback.searchParams.has("code") && !callback.searchParams.has("error")) return;
    let active = true;
    setGoogleLoading(true);
    googlePending.current = true;
    void completeGoogleSignIn(callback.href).then(() => {
      if (active) {
        window.history.replaceState(null, "", "/auth");
        router.replace(callback.searchParams.get("returnTo") === "account" ? "/account" : "/profile");
      }
    }).catch(() => {
      if (active) {
        window.history.replaceState(null, "", "/auth");
        setFeedback({ type: "error", message: msg("auth.googleFailed") });
      }
    }).finally(() => {
      if (active) {
        googlePending.current = false;
        setGoogleLoading(false);
      }
    });
    return () => { active = false; };
  }, []);

  const continueWithGoogle = async () => {
    if (googlePending.current || isSubmitting) return;
    googlePending.current = true;
    setGoogleLoading(true);
    setFeedback(undefined);
    try {
      if (await startGoogleSignIn(params.returnTo === "account" ? "account" : "profile")) {
        router.replace(params.returnTo === "account" ? "/account" : "/profile");
      }
    } catch {
      setFeedback({ type: "error", message: msg("auth.googleFailed") });
    } finally {
      googlePending.current = false;
      setGoogleLoading(false);
    }
  };

  const submit = handleSubmit(
    async ({ firstName, lastName, email, password, confirmPassword }) => {
      if (googlePending.current) return;
      setFeedback(undefined);
      if (
        mode === "signup" &&
        (firstName.trim().length < 2 || lastName.trim().length < 2)
      ) {
        setFeedback({
          type: "error",
          message: msg("auth.enterYourFirstAndLastName"),
        });
        return;
      }
      if (mode === "signup" && password !== confirmPassword) {
        setFeedback({
          type: "error",
          message: msg("auth.thePasswordsDoNotMatch"),
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
        if (mode === "login" && result.error.code === "email_not_confirmed") {
          setConfirmationEmail(normalizedEmail);
          return;
        }
        setFeedback({
          type: "error",
          message:
            localizedError(result.error),
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
        setConfirmationEmail(normalizedEmail);
        return;
      }

      router.replace(params.returnTo === "account" ? "/account" : "/profile");
    },
  );

  const resetPassword = async () => {
    if (resetting) return;
    const email = getValues("email").trim().toLowerCase();
    if (!z.email().safeParse(email).success) {
      setFeedback({
        type: "error",
        message: msg("auth.enterYourEmailAddressFirst"),
      });
      return;
    }

    setResetting(true);
    setFeedback(undefined);
    try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${runtimeConfig.apiUrl}/mot-de-passe`,
    });
    setFeedback({
      type: error ? "error" : "success",
      message:
        error ? localizedError(error) : msg("auth.resetEmailSent", { email }),
    });
    } catch {
      setFeedback({ type: "error", message: msg("auth.checkYourConnectionAndTryAgain") });
    } finally {
      setResetting(false);
    }
  };

  const switchMode = () => {
    setMode((current) => (current === "login" ? "signup" : "login"));
    setFeedback(undefined);
    clearErrors();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      enabled
      style={styles.screen}
    >
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 10) }]}>
        <AnimatedPressable
          accessibilityLabel={msg("addresses.back")}
          onPress={() => router.back()}
          style={styles.closeButton}
        >
          <Ionicons name="arrow-back" size={21} color={palette.ink} />
        </AnimatedPressable>
        <BrandLogo header />
        <View
          accessible
          accessibilityLabel={msg("auth.secureSignIn")}
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
        {confirmationEmail ? (
          <AuthConfirmation email={confirmationEmail} onSignIn={() => {
            setConfirmationEmail(undefined);
            setMode("login");
            setFeedback(undefined);
            clearErrors();
          }} />
        ) : <>
        <Animated.View entering={FadeIn.duration(320)} style={styles.intro}>
          <Text style={styles.title}>
            {mode === "login" ? msg("auth.welcomeBack") : msg("auth.welcomeToLEcomax")}
          </Text>
          <Text style={styles.subtitle}>
            {mode === "login"
              ? msg("auth.signInToAccessYourAccount")
              : msg("auth.createYourAccountInJustAFewMoments")}
          </Text>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(100).duration(380)}
          style={styles.form}
        >
          <Text style={styles.formTitle}>{mode === "login" ? msg("auth.signIn") : msg("auth.createAnAccount")}</Text>
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

          <AnimatedPressable accessibilityRole="button" accessibilityLabel={msg("auth.continueWithGoogle")} accessibilityState={{ busy: googleLoading, disabled: googleLoading || isSubmitting }} disabled={googleLoading || isSubmitting} onPress={() => void continueWithGoogle()} style={[styles.googleButton, (googleLoading || isSubmitting) && styles.buttonDisabled]}>
            {googleLoading ? <ActivityIndicator color="#234735" /> : <Ionicons name="logo-google" size={20} color="#4285F4" />}
            <Text style={styles.googleLabel}>{googleLoading ? msg("auth.googleConnecting") : msg("auth.continueWithGoogle")}</Text>
          </AnimatedPressable>
          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>{msg("common.orUppercase")}</Text>
            <View style={styles.divider} />
          </View>

          {mode === "signup" ? (
            <View style={styles.nameRow}>
              <Controller
                control={control}
                name="firstName"
                render={({ field: { value, onChange, onBlur } }) => (
                  <View style={styles.nameField}>
                    <Text style={styles.fieldLabel}>{msg("auth.firstNameUppercase")}</Text>
                    <View
                      style={[
                        styles.inputShell,
                        focusedField === "firstName" &&
                          styles.inputShellFocused,
                      ]}
                    >
                      <TextInput
                        accessibilityLabel={msg("auth.firstName")}
                        value={value}
                        onChangeText={onChange}
                        onFocus={() => setFocusedField("firstName")}
                        onBlur={() => {
                          setFocusedField(undefined);
                          onBlur();
                        }}
                        placeholder={msg("auth.firstName")}
                        placeholderTextColor="#A1A5A2"
                        autoCapitalize="words"
                        autoComplete="given-name"
                        returnKeyType="next"
                        selectionColor={palette.greenDark}
                        showSoftInputOnFocus
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
                    <Text style={styles.fieldLabel}>{msg("auth.lastNameUppercase")}</Text>
                    <View
                      style={[
                        styles.inputShell,
                        focusedField === "lastName" && styles.inputShellFocused,
                      ]}
                    >
                      <TextInput
                        accessibilityLabel={msg("auth.lastName")}
                        value={value}
                        onChangeText={onChange}
                        onFocus={() => setFocusedField("lastName")}
                        onBlur={() => {
                          setFocusedField(undefined);
                          onBlur();
                        }}
                        placeholder={msg("auth.lastName")}
                        placeholderTextColor="#A1A5A2"
                        autoCapitalize="words"
                        autoComplete="family-name"
                        returnKeyType="next"
                        selectionColor={palette.greenDark}
                        showSoftInputOnFocus
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
                <Text style={styles.fieldLabel}>{msg("auth.emailAddressUppercase")}</Text>
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
                    accessibilityLabel={msg("auth.emailAddress")}
                    value={value}
                    onChangeText={onChange}
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => {
                      setFocusedField(undefined);
                      onBlur();
                    }}
                    placeholder={msg("common.emailExample")}
                    placeholderTextColor="#A1A5A2"
                    autoCapitalize="none"
                    autoComplete="email"
                    keyboardType="email-address"
                    returnKeyType="next"
                    selectionColor={palette.greenDark}
                      showSoftInputOnFocus
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
                  <Text style={styles.fieldLabel}>{msg("auth.passwordUppercase")}</Text>
                  {mode === "login" ? (
                    <Pressable
                      accessibilityLabel={msg("auth.forgotPassword")}
                      disabled={resetting}
                      onPress={() => void resetPassword()}
                      hitSlop={8}
                    >
                      <Text style={styles.forgotText}>
                        {resetting ? "Envoi…" : msg("auth.forgotPasswordText")}
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
                    accessibilityLabel={msg("auth.password")}
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
                    placeholder={mode === "login" ? msg("auth.yourPassword") : msg("auth.atLeast8Characters")}
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
                        ? msg("auth.hidePassword")
                        : msg("auth.showPassword")
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
                      {msg("auth.confirmPasswordUppercase")}</Text>
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
                        accessibilityLabel={msg("auth.confirmPassword")}
                        value={value}
                        onChangeText={onChange}
                        onFocus={() => setFocusedField("confirmPassword")}
                        onBlur={() => {
                          setFocusedField(undefined);
                          onBlur();
                        }}
                        onSubmitEditing={() => void submit()}
                        placeholder={msg("auth.confirmYourPassword")}
                        placeholderTextColor="#A1A5A2"
                        autoCapitalize="none"
                        autoComplete="new-password"
                        returnKeyType="done"
                        secureTextEntry={!showPassword}
                        selectionColor={palette.greenDark}
                        showSoftInputOnFocus
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
              mode === "login" ? msg("auth.signInText") : msg("auth.createMyAccount")
            }
            disabled={isSubmitting || googleLoading}
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
                  {mode === "login" ? msg("auth.signInText") : msg("auth.createMyAccount")}
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
                {msg("auth.yourDataIsProtected")}</Text>
              <Text style={styles.reassuranceText}>
                {msg("auth.secureSignInAndEncryptedInformation")}</Text>
            </View>
          </View>

          {mode === "signup" ? (
            <Text style={styles.termsText}>
              {msg("auth.byCreatingAnAccountYouAgreeToOur")}{" "}
              <Text style={styles.termsLink}>{msg("auth.termsOfUse")}</Text> {msg("auth.andOur")}{" "}
              <Text style={styles.termsLink}>{msg("auth.privacyPolicy")}</Text>
              .
            </Text>
          ) : null}

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>{msg("common.orUppercase")}</Text>
            <View style={styles.divider} />
          </View>

          <AnimatedPressable
            accessibilityLabel={
              mode === "login" ? msg("auth.createAnAccount") : msg("auth.signInText")
            }
            onPress={switchMode}
            style={styles.alternateButton}
          >
            <View style={styles.alternateCopy}><Text style={styles.alternatePrefix}>
              {mode === "login"
                ? msg("auth.newToLEcomax")
                : msg("auth.alreadyHaveAnAccount")}
            </Text>
            <Text style={styles.alternateLabel}>
              {mode === "login" ? msg("auth.createAnAccount") : msg("auth.signInText")}
            </Text></View>
            <Ionicons
              name="arrow-forward"
              size={17}
              color={palette.ink}
              style={styles.alternateArrow}
            />
          </AnimatedPressable>
        </Animated.View>
        </>}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  googleButton: { minHeight: 52, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, paddingHorizontal: 16, borderRadius: 14, borderWidth: 1, borderColor: "#DDE1DE", backgroundColor: "#FFFFFF" },
  googleLabel: { fontFamily: typography.semibold, fontSize: 13, color: "#203D2C" },
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
