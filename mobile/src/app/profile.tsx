import { localizedError } from "@/i18n/errors";
import { msg, useLocale } from "@/i18n";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AnimatedPressable } from "@/components/animated-pressable";
import { Screen } from "@/components/screen";
import { palette, typography } from "@/constants/theme";
import { apiRequest } from "@/lib/api-client";
import { supabase } from "@/lib/supabase";
import { uploadFile } from "@/lib/upload-file";

type ProfileResponse = {
  profile: { prenom: string; nom: string; full_name: string; phone: string };
};

function profileNames(metadata: Record<string, unknown>) {
  const fullName =
    typeof metadata.full_name === "string" ? metadata.full_name.trim() : "";
  const parts = fullName.split(/\s+/).filter(Boolean);
  return {
    prenom:
      (typeof metadata.prenom === "string" && metadata.prenom) ||
      (typeof metadata.first_name === "string" && metadata.first_name) ||
      parts[0] ||
      "",
    nom:
      (typeof metadata.nom === "string" && metadata.nom) ||
      (typeof metadata.last_name === "string" && metadata.last_name) ||
      parts.slice(1).join(" "),
    phone: typeof metadata.phone === "string" ? metadata.phone : "",
  };
}

export default function ProfileScreen() {
  useLocale();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string>();
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const resetPending = useRef(false);
  const lastResetAt = useRef(0);
  const [message, setMessage] = useState<string>();

  useEffect(() => {
    void supabase.auth.getUser().then(({ data, error }) => {
      if (error || !data.user) {
        router.replace("/auth");
        return;
      }
      const values = profileNames(data.user.user_metadata ?? {});
      setEmail(data.user.email ?? "");
      setPrenom(values.prenom);
      setNom(values.nom);
      setPhone(values.phone);
      const avatar = data.user.user_metadata?.avatar_url ?? data.user.user_metadata?.picture;
      setAvatarUrl(typeof avatar === "string" ? avatar : undefined);
      setAvatarFailed(false);
      setLoading(false);
    });
  }, []);

  const save = async () => {
    const cleanFirstName = prenom.trim();
    const cleanLastName = nom.trim();
    const cleanPhone = phone.trim();
    if (!cleanFirstName || !cleanLastName) {
      Alert.alert(msg("profile.incompleteProfile"), msg("profile.enterYourFirstAndLastName"));
      return;
    }
    if (
      cleanPhone &&
      !/^(?:0[67]\d{8}|(?:\+|00)?212[67]\d{8})$/.test(
        cleanPhone.replace(/[\s().-]/g, ""),
      )
    ) {
      Alert.alert(
        msg("profile.invalidPhoneNumber"),
        msg("profile.useAValidMoroccanNumberStartingWith06Or07"),
      );
      return;
    }

    setSaving(true);
    setMessage(undefined);
    try {
      const response = await apiRequest<ProfileResponse>(
        "/api/account/profile",
        {
          method: "POST",
          authenticated: true,
          body: JSON.stringify({
            prenom: cleanFirstName,
            nom: cleanLastName,
            phone: cleanPhone,
          }),
        },
      );
      setPrenom(response.profile.prenom);
      setNom(response.profile.nom);
      setPhone(response.profile.phone);
      await supabase.auth.refreshSession();
      setMessage(msg("profile.profileUpdated"));
    } catch (error) {
      Alert.alert(
        msg("profile.unableToSave"),
        error instanceof Error ? localizedError(error) : msg("profile.tryAgainInAMoment"),
      );
    } finally {
      setSaving(false);
    }
  };

  const resetPassword = async () => {
    if (resetPending.current) return;
    if (Date.now() - lastResetAt.current < 60_000) {
      Alert.alert(msg("profile.linkAlreadyRequested"), msg("profile.waitAMinuteAndCheckYourSpamFolderBeforeTryingAgain"));
      return;
    }
    resetPending.current = true;
    setResettingPassword(true);
    try {
      await apiRequest<{ message: string }>("/api/account/password-reset", {
        method: "POST",
        authenticated: true,
        retries: 0,
        timeoutMs: 15_000,
      });
      lastResetAt.current = Date.now();
      Alert.alert(msg("profile.passwordResetLinkRequested"), msg("profile.checkInboxForReset"));
    } catch (error) {
      Alert.alert(msg("profile.unableToSend"), error instanceof Error ? localizedError(error) : msg("auth.checkYourConnectionAndTryAgain"));
    } finally {
      resetPending.current = false;
      setResettingPassword(false);
    }
  };
  const chooseAvatar = async () => {
    if (avatarSaving) return;
    setAvatarSaving(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.82,
      });
      if (result.canceled || !result.assets[0]) return;
      const asset = result.assets[0];
      const form = new FormData();
      form.append("file", uploadFile(asset));
      const response = await apiRequest<{ avatarUrl: string }>("/api/account/avatar", {
        method: "POST",
        authenticated: true,
        body: form,
        timeoutMs: 30_000,
      });
      setAvatarUrl(response.avatarUrl);
      setAvatarFailed(false);
      await supabase.auth.refreshSession();
      setMessage(msg("profile.profilePhotoUpdated"));
    } catch (error) {
      Alert.alert(msg("profile.photoNotSaved"), error instanceof Error ? localizedError(error) : msg("profile.tryAgainInAMoment"));
    } finally {
      setAvatarSaving(false);
    }
  };

  const removeAvatar = () => {
    Alert.alert(msg("profile.removePhoto"), msg("profile.yourAvatarWillBeReplacedByYourInitials"), [
      { text: msg("addresses.cancel"), style: "cancel" },
      {
        text: msg("addresses.remove"),
        style: "destructive",
        onPress: async () => {
          setAvatarSaving(true);
          try {
            await apiRequest<{ avatarUrl: null }>("/api/account/avatar", { method: "DELETE", authenticated: true });
            setAvatarUrl(undefined);
            setAvatarFailed(false);
            await supabase.auth.refreshSession();
          } catch (error) {
            Alert.alert(msg("profile.unableToRemove"), error instanceof Error ? localizedError(error) : msg("profile.tryAgainInAMoment"));
          } finally {
            setAvatarSaving(false);
          }
        },
      },
    ]);
  };

  const requestDeletion = () => {
    router.push("/delete-account");
  };
  return (
    <Screen className="bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <View style={styles.header}>
          <AnimatedPressable
            accessibilityLabel={msg("addresses.back")}
            accessibilityRole="button"
            onPress={() => router.canGoBack() ? router.back() : router.replace("/account")}
            style={styles.back}
          >
            <Ionicons name="arrow-back" size={21} color={palette.ink} />
          </AnimatedPressable>
          <View style={styles.headerCopy}>
            <View style={styles.headerMeta}>
              <View style={styles.headerDot} />
              <Text style={styles.eyebrow}>{msg("addresses.myAccountUppercase")}</Text>
            </View>
            <Text style={styles.title}>{msg("profile.myInformation")}</Text>
          </View>
          <View accessible accessibilityLabel={msg("profile.secureProfile")} accessibilityRole="image" style={styles.headerSecurity}>
            <Ionicons name="shield-checkmark-outline" size={18} color={palette.greenDark} />
          </View>
        </View>

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={palette.greenDark} />
          </View>
        ) : (
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              padding: 17,
              paddingBottom: Math.max(insets.bottom, 20) + 30,
            }}
          >
            <Text style={styles.intro}>
              {msg("profile.updateTheDetailsUsedForYourOrders")}</Text>
            <View style={styles.profileStatus}>
              <View style={styles.profileStatusIcon}>
                <Ionicons name="shield-checkmark-outline" size={16} color={palette.greenDark} />
              </View>
              <View style={styles.profileStatusCopy}>
                <Text style={styles.profileStatusTitle}>{msg("profile.secureCustomerProfile")}</Text>
                <Text style={styles.profileStatusText}>{msg("profile.yourDataIsOnlyUsedForYourAccountAndOrders")}</Text>
              </View>
            </View>
            <View style={styles.avatarCard}>
              <View style={styles.avatarPreview}>
                {avatarUrl && !avatarFailed ? (
                  <Image
                    source={{ uri: avatarUrl }}
                    contentFit="cover"
                    onError={() => setAvatarFailed(true)}
                    style={StyleSheet.absoluteFill}
                    transition={180}
                  />
                ) : (
                  <Text style={styles.avatarInitials}>{`${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase() || "LE"}</Text>
                )}
                {avatarSaving ? <View style={styles.avatarLoading}><ActivityIndicator color={palette.white} /></View> : null}
              </View>
              <View style={styles.avatarCopy}>
                <Text style={styles.avatarTitle}>{msg("profile.profilePhoto")}</Text>
                <Text style={styles.avatarHint}>{msg("profile.jpgPngWebpOrAvif5MbMaximum")}</Text>
                <View style={styles.avatarActions}>
                  <AnimatedPressable accessibilityLabel={msg("profile.chooseAProfilePhoto")} disabled={avatarSaving} onPress={() => void chooseAvatar()} style={styles.avatarActionPrimary}>
                    <Ionicons name="image-outline" size={16} color={palette.white} />
                    <Text style={styles.avatarActionPrimaryText}>{avatarUrl ? msg("profile.edit") : msg("profile.add")}</Text>
                  </AnimatedPressable>
                  {avatarUrl ? (
                    <AnimatedPressable accessibilityLabel={msg("profile.removeProfilePhoto")} disabled={avatarSaving} onPress={removeAvatar} style={styles.avatarActionSecondary}>
                      <Ionicons name="trash-outline" size={16} color={palette.red} />
                    </AnimatedPressable>
                  ) : null}
                </View>
              </View>
            </View>
            <View style={styles.card}>
              <View style={styles.formHeading}>
                <Text style={styles.formTitle}>{msg("profile.personalInformation")}</Text>
                <Text style={styles.requiredHint}>{msg("profile.requiredFields")}</Text>
              </View>
              <Field
                label={msg("profile.firstName")}
                value={prenom}
                onChangeText={setPrenom}
                autoComplete="given-name"
              />
              <Field
                label={msg("profile.lastName")}
                value={nom}
                onChangeText={setNom}
                autoComplete="family-name"
              />
              <Field
                label={msg("profile.phoneOptional")}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                autoComplete="tel"
              />
              <Field
                label={msg("auth.emailAddress")}
                value={email}
                editable={false}
                autoComplete="email"
              />
              {message ? <Text style={styles.success}>{message}</Text> : null}
              <AnimatedPressable
                accessibilityLabel={msg("profile.saveProfile")}
                disabled={saving}
                onPress={() => void save()}
                style={styles.primary}
              >
                {saving ? (
                  <ActivityIndicator color={palette.white} />
                ) : (
                  <>
                    <Ionicons name="checkmark-outline" size={18} color={palette.white} />
                    <Text style={styles.primaryText}>{msg("profile.saveChanges")}</Text>
                  </>
                )}
              </AnimatedPressable>
            </View>

            <Text style={styles.sectionLabel}>{msg("profile.securityAndDataUppercase")}</Text>
            <View style={styles.actionCard}>
              <ActionRow
                busy={resettingPassword}
                icon="key-outline"
                title={msg("profile.changePassword")}
                subtitle={msg("profile.receiveASecureLinkByEmail")}
                onPress={() => void resetPassword()}
              />
              <View style={styles.divider} />
              <ActionRow
                danger
                icon="trash-outline"
                title={msg("deleteAccount.deleteMyAccount")}
                subtitle={msg("profile.submitADeletionRequest")}
                onPress={requestDeletion}
              />
            </View>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </Screen>
  );
}

function Field({
  label,
  ...props
}: React.ComponentProps<typeof TextInput> & { label: string }) {
  useLocale();
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        {...props}
        onFocus={(event) => { setFocused(true); props.onFocus?.(event); }}
        onBlur={(event) => { setFocused(false); props.onBlur?.(event); }}
        placeholderTextColor="#9CA19D"
        selectionColor="#365B43"
        style={[styles.input, focused && styles.inputFocused, props.editable === false && styles.inputDisabled]}
      />
    </View>
  );
}

function ActionRow({
  busy = false,
  danger,
  icon,
  title,
  subtitle,
  onPress,
}: {
  busy?: boolean;
  danger?: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  useLocale();
  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={{ busy, disabled: busy }}
      disabled={busy}
      accessibilityLabel={title}
      onPress={onPress}
      style={styles.actionRow}
    >
      <View style={[styles.actionIcon, danger && styles.actionIconDanger]}>
        <Ionicons
          name={icon}
          size={20}
          color={danger ? palette.red : palette.greenDark}
        />
      </View>
      <View style={styles.actionCopy}>
        <Text style={[styles.actionTitle, danger && styles.danger]}>
          {title}
        </Text>
        <Text accessibilityLiveRegion="polite" style={styles.actionSubtitle}>{busy ? msg("profile.sendingSecureLink") : subtitle}</Text>
      </View>
      {busy ? <ActivityIndicator color="#203D2C" size="small" /> : <Ionicons
        name="chevron-forward"
        size={18}
        color={danger ? palette.red : palette.muted}
      />}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#F6F7F3" },
  header: {
    minHeight: 82,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E7EAE8",
    backgroundColor: palette.white,
  },
  back: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E9E6",
    borderRadius: 22,
    backgroundColor: "#F8FAF8",
  },
  headerCopy: { minWidth: 0, marginLeft: 13, flex: 1 },
  headerMeta: { flexDirection: "row", alignItems: "center", gap: 6 },
  headerDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: palette.greenDark },
  eyebrow: {
    color: "#64745F",
    fontFamily: typography.semibold,
    fontSize: 8,
    letterSpacing: 1.35,
  },
  title: {
    marginTop: 4,
    color: palette.ink,
    fontFamily: typography.semibold,
    fontSize: 21,
    letterSpacing: -0.45,
  },
  headerSecurity: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E1E8DB",
    borderRadius: 12,
    backgroundColor: "#EDF2E8",
  },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  intro: {
    color: palette.muted,
    fontFamily: typography.regular,
    fontSize: 12,
    lineHeight: 19,
  },
  profileStatus: {
    marginTop: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E1E8DB",
    borderRadius: 18,
    backgroundColor: "#EDF2E8",
  },
  profileStatusIcon: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    backgroundColor: "#E0E9D7",
  },
  profileStatusCopy: { minWidth: 0, marginLeft: 11, flex: 1 },
  profileStatusTitle: { color: "#294332", fontFamily: typography.semibold, fontSize: 12 },
  profileStatusText: { marginTop: 4, color: "#66735F", fontFamily: typography.regular, fontSize: 10, lineHeight: 15 },
  avatarCard: {
    marginTop: 16,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E8E0",
    borderRadius: 22,
    backgroundColor: palette.white,
  },
  avatarPreview: {
    width: 78,
    height: 78,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#E5EBDD",
    borderRadius: 39,
    backgroundColor: "#203D2C",
  },
  avatarInitials: { color: palette.white, fontFamily: typography.black, fontSize: 22 },
  avatarLoading: { position: "absolute", inset: 0, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.52)" },
  avatarCopy: { minWidth: 0, marginLeft: 14, flex: 1 },
  avatarTitle: { color: palette.ink, fontFamily: typography.semibold, fontSize: 14 },
  avatarHint: { marginTop: 4, color: palette.muted, fontFamily: typography.regular, fontSize: 8.5, lineHeight: 13 },
  avatarActions: { marginTop: 10, flexDirection: "row", alignItems: "center", gap: 8 },
  avatarActionPrimary: { minHeight: 44, paddingHorizontal: 13, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, borderRadius: 13, backgroundColor: "#203D2C" },
  avatarActionPrimaryText: { color: palette.white, fontFamily: typography.semibold, fontSize: 11 },
  avatarActionSecondary: { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#F0E4E1", borderRadius: 13, backgroundColor: "#FCF8F6" },
  card: {
    marginTop: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E1E5E2",
    borderRadius: 22,
    backgroundColor: palette.white,
  },
  formHeading: {
    marginBottom: 22,
    gap: 6,
  },
  formTitle: { color: palette.ink, fontFamily: typography.semibold, fontSize: 15 },
  requiredHint: { color: palette.muted, fontFamily: typography.regular, fontSize: 10 },
  field: { marginBottom: 18 },
  fieldLabel: {
    marginBottom: 7,
    color: palette.ink,
    fontFamily: typography.medium,
    fontSize: 11,
  },
  input: {
    minHeight: 52,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#DDE2DE",
    borderRadius: 12,
    color: palette.ink,
    backgroundColor: "#FCFCFA",
    fontFamily: typography.medium,
    fontSize: 13,
  },
  inputDisabled: { color: palette.muted, backgroundColor: "#F2F4F2" },
  inputFocused: { borderColor: "#527357", backgroundColor: "#F5F8F1" },
  success: {
    marginBottom: 12,
    color: palette.greenDark,
    fontFamily: typography.bold,
    fontSize: 10,
  },
  primary: {
    minHeight: 52,
    paddingHorizontal: 12,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: "#203D2C",
  },
  primaryText: {
    color: palette.white,
    fontFamily: typography.semibold,
    fontSize: 11,
    flexShrink: 1,
    textAlign: "center",
  },
  sectionLabel: {
    marginBottom: 10,
    marginTop: 28,
    color: palette.greenDark,
    fontFamily: typography.black,
    fontSize: 8,
    letterSpacing: 1.2,
  },
  actionCard: {
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "#E1E5E2",
    borderRadius: 16,
    backgroundColor: palette.white,
  },
  actionRow: { minHeight: 74, flexDirection: "row", alignItems: "center" },
  actionIcon: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#EAF7ED",
  },
  actionIconDanger: { backgroundColor: "#FFF0F0" },
  actionCopy: { minWidth: 0, marginHorizontal: 11, flex: 1 },
  actionTitle: {
    color: palette.ink,
    fontFamily: typography.semibold,
    fontSize: 12,
  },
  actionSubtitle: {
    marginTop: 4,
    color: palette.muted,
    fontFamily: typography.regular,
    fontSize: 10,
    lineHeight: 15,
  },
  divider: { height: 1, backgroundColor: "#E8EBE9" },
  danger: { color: palette.red },
});
