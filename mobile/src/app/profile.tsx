import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useEffect, useState } from "react";
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
      Alert.alert("Profil incomplet", "Renseignez votre prénom et votre nom.");
      return;
    }
    if (
      cleanPhone &&
      !/^(?:0[67]\d{8}|(?:\+|00)?212[67]\d{8})$/.test(
        cleanPhone.replace(/[\s().-]/g, ""),
      )
    ) {
      Alert.alert(
        "Téléphone invalide",
        "Utilisez un numéro marocain valide commençant par 06 ou 07.",
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
      setMessage("Profil mis à jour.");
    } catch (error) {
      Alert.alert(
        "Impossible d’enregistrer",
        error instanceof Error ? error.message : "Réessayez dans un instant.",
      );
    } finally {
      setSaving(false);
    }
  };

  const resetPassword = async () => {
    if (!email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      Alert.alert("Envoi impossible", error.message);
      return;
    }
    Alert.alert(
      "E-mail envoyé",
      "Consultez votre boîte de réception pour choisir un nouveau mot de passe.",
    );
  };

  const chooseAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.82,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const form = new FormData();
    if (asset.file) form.append("file", asset.file);
    else form.append("file", {
      uri: asset.uri,
      name: asset.fileName || `avatar-${Date.now()}.jpg`,
      type: asset.mimeType || "image/jpeg",
    } as unknown as Blob);
    setAvatarSaving(true);
    try {
      const response = await apiRequest<{ avatarUrl: string }>("/api/account/avatar", {
        method: "POST",
        authenticated: true,
        body: form,
        timeoutMs: 30_000,
      });
      setAvatarUrl(response.avatarUrl);
      setAvatarFailed(false);
      await supabase.auth.refreshSession();
      setMessage("Photo de profil mise à jour.");
    } catch (error) {
      Alert.alert("Photo non enregistrée", error instanceof Error ? error.message : "Réessayez dans un instant.");
    } finally {
      setAvatarSaving(false);
    }
  };

  const removeAvatar = () => {
    Alert.alert("Supprimer la photo", "Votre avatar sera remplacé par vos initiales.", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          setAvatarSaving(true);
          try {
            await apiRequest<{ avatarUrl: null }>("/api/account/avatar", { method: "DELETE", authenticated: true });
            setAvatarUrl(undefined);
            setAvatarFailed(false);
            await supabase.auth.refreshSession();
          } catch (error) {
            Alert.alert("Suppression impossible", error instanceof Error ? error.message : "Réessayez dans un instant.");
          } finally {
            setAvatarSaving(false);
          }
        },
      },
    ]);
  };

  const requestDeletion = () => {
    Alert.alert(
      "Demander la suppression",
      "Votre demande sera examinée avant la suppression définitive de votre compte et de ses données.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Envoyer la demande",
          style: "destructive",
          onPress: async () => {
            try {
              const result = await apiRequest<{ message: string }>(
                "/api/account/delete-request",
                {
                  method: "POST",
                  authenticated: true,
                },
              );
              Alert.alert("Demande enregistrée", result.message);
            } catch (error) {
              Alert.alert(
                "Demande impossible",
                error instanceof Error
                  ? error.message
                  : "Réessayez dans un instant.",
              );
            }
          },
        },
      ],
    );
  };

  return (
    <Screen className="bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <View style={styles.header}>
          <AnimatedPressable
            accessibilityLabel="Retour"
            onPress={() => router.back()}
            style={styles.back}
          >
            <Ionicons name="arrow-back" size={21} color={palette.ink} />
          </AnimatedPressable>
          <View style={styles.headerCopy}>
            <View style={styles.headerMeta}>
              <View style={styles.headerDot} />
              <Text style={styles.eyebrow}>MON COMPTE</Text>
            </View>
            <Text style={styles.title}>Mes informations</Text>
          </View>
          <View accessible accessibilityLabel="Profil sécurisé" accessibilityRole="image" style={styles.headerSecurity}>
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
              Mettez à jour les informations utilisées pour vos commandes.
            </Text>
            <View style={styles.profileStatus}>
              <View style={styles.profileStatusIcon}>
                <Ionicons name="shield-checkmark-outline" size={16} color={palette.greenDark} />
              </View>
              <View style={styles.profileStatusCopy}>
                <Text style={styles.profileStatusTitle}>Profil client sécurisé</Text>
                <Text style={styles.profileStatusText}>Vos données servent uniquement à votre compte et à vos commandes.</Text>
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
                <Text style={styles.avatarTitle}>Photo de profil</Text>
                <Text style={styles.avatarHint}>JPG, PNG, WEBP ou AVIF · 5 Mo maximum</Text>
                <View style={styles.avatarActions}>
                  <AnimatedPressable accessibilityLabel="Choisir une photo de profil" disabled={avatarSaving} onPress={() => void chooseAvatar()} style={styles.avatarActionPrimary}>
                    <Ionicons name="image-outline" size={16} color={palette.white} />
                    <Text style={styles.avatarActionPrimaryText}>{avatarUrl ? "MODIFIER" : "AJOUTER"}</Text>
                  </AnimatedPressable>
                  {avatarUrl ? (
                    <AnimatedPressable accessibilityLabel="Supprimer la photo de profil" disabled={avatarSaving} onPress={removeAvatar} style={styles.avatarActionSecondary}>
                      <Ionicons name="trash-outline" size={16} color={palette.red} />
                    </AnimatedPressable>
                  ) : null}
                </View>
              </View>
            </View>
            <View style={styles.card}>
              <View style={styles.formHeading}>
                <Text style={styles.formTitle}>Informations personnelles</Text>
                <Text style={styles.requiredHint}>* Champs obligatoires</Text>
              </View>
              <Field
                label="Prénom *"
                value={prenom}
                onChangeText={setPrenom}
                autoComplete="given-name"
              />
              <Field
                label="Nom *"
                value={nom}
                onChangeText={setNom}
                autoComplete="family-name"
              />
              <Field
                label="Téléphone (optionnel)"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                autoComplete="tel"
              />
              <Field
                label="Adresse e-mail"
                value={email}
                editable={false}
                autoComplete="email"
              />
              {message ? <Text style={styles.success}>{message}</Text> : null}
              <AnimatedPressable
                accessibilityLabel="Enregistrer le profil"
                disabled={saving}
                onPress={() => void save()}
                style={styles.primary}
              >
                {saving ? (
                  <ActivityIndicator color={palette.white} />
                ) : (
                  <Text style={styles.primaryText}>ENREGISTRER</Text>
                )}
              </AnimatedPressable>
            </View>

            <Text style={styles.sectionLabel}>SÉCURITÉ ET DONNÉES</Text>
            <View style={styles.actionCard}>
              <ActionRow
                icon="key-outline"
                title="Modifier le mot de passe"
                subtitle="Recevoir un lien sécurisé par e-mail"
                onPress={() => void resetPassword()}
              />
              <View style={styles.divider} />
              <ActionRow
                danger
                icon="trash-outline"
                title="Supprimer mon compte"
                subtitle="Envoyer une demande de suppression"
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
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        {...props}
        placeholderTextColor="#9CA19D"
        selectionColor={palette.green}
        style={[styles.input, props.editable === false && styles.inputDisabled]}
      />
    </View>
  );
}

function ActionRow({
  danger,
  icon,
  title,
  subtitle,
  onPress,
}: {
  danger?: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <AnimatedPressable
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
        <Text style={styles.actionSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons
        name="chevron-forward"
        size={18}
        color={danger ? palette.red : palette.muted}
      />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
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
    borderRadius: 14,
    backgroundColor: "#F8FAF8",
  },
  headerCopy: { minWidth: 0, marginLeft: 13, flex: 1 },
  headerMeta: { flexDirection: "row", alignItems: "center", gap: 6 },
  headerDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: palette.greenDark },
  eyebrow: {
    color: palette.greenDark,
    fontFamily: typography.black,
    fontSize: 7,
    letterSpacing: 1.35,
  },
  title: {
    marginTop: 4,
    color: palette.ink,
    fontFamily: typography.black,
    fontSize: 21,
    letterSpacing: -0.45,
  },
  headerSecurity: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#D8EEE0",
    borderRadius: 12,
    backgroundColor: "#F1FBF5",
  },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  intro: {
    color: palette.muted,
    fontFamily: typography.regular,
    fontSize: 11,
    lineHeight: 17,
  },
  profileStatus: {
    marginTop: 14,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D8EEE0",
    borderRadius: 15,
    backgroundColor: "#F1FBF5",
  },
  profileStatusIcon: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    backgroundColor: "#DDF6E6",
  },
  profileStatusCopy: { minWidth: 0, marginLeft: 11, flex: 1 },
  profileStatusTitle: { color: palette.ink, fontFamily: typography.black, fontSize: 11 },
  profileStatusText: { marginTop: 2, color: palette.muted, fontFamily: typography.regular, fontSize: 8.5, lineHeight: 13 },
  avatarCard: {
    marginTop: 16,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DCE3DD",
    borderRadius: 18,
    backgroundColor: "#F7FAF7",
  },
  avatarPreview: {
    width: 78,
    height: 78,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#CDEFD7",
    borderRadius: 25,
    backgroundColor: palette.ink,
  },
  avatarInitials: { color: palette.white, fontFamily: typography.black, fontSize: 22 },
  avatarLoading: { position: "absolute", inset: 0, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.52)" },
  avatarCopy: { minWidth: 0, marginLeft: 14, flex: 1 },
  avatarTitle: { color: palette.ink, fontFamily: typography.black, fontSize: 14 },
  avatarHint: { marginTop: 4, color: palette.muted, fontFamily: typography.regular, fontSize: 8.5, lineHeight: 13 },
  avatarActions: { marginTop: 10, flexDirection: "row", alignItems: "center", gap: 8 },
  avatarActionPrimary: { minHeight: 38, paddingHorizontal: 13, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, borderRadius: 11, backgroundColor: palette.ink },
  avatarActionPrimaryText: { color: palette.white, fontFamily: typography.black, fontSize: 8, letterSpacing: 0.7 },
  avatarActionSecondary: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#F0D7D7", borderRadius: 11, backgroundColor: "#FFF5F5" },
  card: {
    marginTop: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E1E5E2",
    borderRadius: 18,
    backgroundColor: palette.white,
  },
  formHeading: {
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  formTitle: { color: palette.ink, fontFamily: typography.black, fontSize: 13 },
  requiredHint: { color: palette.muted, fontFamily: typography.medium, fontSize: 7.5 },
  field: { marginBottom: 14 },
  fieldLabel: {
    marginBottom: 7,
    color: palette.ink,
    fontFamily: typography.bold,
    fontSize: 9,
  },
  input: {
    minHeight: 50,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#DDE2DE",
    borderRadius: 12,
    color: palette.ink,
    backgroundColor: "#FAFBFA",
    fontFamily: typography.medium,
    fontSize: 13,
  },
  inputDisabled: { color: palette.muted, backgroundColor: "#F2F4F2" },
  success: {
    marginBottom: 12,
    color: palette.greenDark,
    fontFamily: typography.bold,
    fontSize: 10,
  },
  primary: {
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: palette.ink,
  },
  primaryText: {
    color: palette.white,
    fontFamily: typography.black,
    fontSize: 10,
    letterSpacing: 0.9,
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
    fontFamily: typography.black,
    fontSize: 11,
  },
  actionSubtitle: {
    marginTop: 4,
    color: palette.muted,
    fontFamily: typography.regular,
    fontSize: 8.5,
  },
  divider: { height: 1, backgroundColor: "#E8EBE9" },
  danger: { color: palette.red },
});
