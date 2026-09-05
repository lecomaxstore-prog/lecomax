import Ionicons from "@expo/vector-icons/Ionicons";
import Constants from "expo-constants";
import { Image } from "expo-image";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import type { Session } from "@supabase/supabase-js";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AnimatedPressable } from "@/components/animated-pressable";
import { AppViewportOverlay } from "@/components/app-viewport";
import { BrandLogo } from "@/components/brand-logo";
import { Screen } from "@/components/screen";
import { typography } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useSettings } from "@/hooks/use-catalog";
import { apiRequest } from "@/lib/api-client";
import { runtimeConfig } from "@/lib/runtime-config";
import { supabase } from "@/lib/supabase";
import { triggerSelectionHaptic } from "@/services/haptics";
import {
  disablePushNotifications,
  getPushNotificationState,
  registerForPushNotifications,
} from "@/services/notifications";
import {
  getMobileNotificationPreferences,
  updateMobileNotificationPreferences,
  type MobileNotificationPreferences,
} from "@/services/mobile-notifications";
import { usePreferences, type Language } from "@/stores/preferences";
import { useUserStore } from "@/stores/user";

const colors = {
  background: "#FFFFFF",
  surface: "#F3F4F2",
  text: "#0B0B0B",
  secondaryText: "#5B605B",
  primary: "#29C954",
  primaryDark: "#10843A",
  border: "#DDE0DC",
  danger: "#E53935",
  dark: "#111411",
  darkSurface: "#1B1F1B",
  white: "#FFFFFF",
};

const languages: { value: Language; label: string; native: string }[] = [
  { value: "fr", label: "Français", native: "FR" },
  { value: "en", label: "English", native: "EN" },
  { value: "ar", label: "العربية", native: "AR" },
];

type Sheet = "settings" | "language" | "appearance" | "notifications" | null;
type NotificationState =
  "loading" | "enabled" | "disabled" | "denied" | "unsupported";

export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const dark = colorScheme === "dark";
  const settingsQuery = useSettings();
  const language = usePreferences((state) => state.language);
  const theme = usePreferences((state) => state.theme);
  const setLanguage = usePreferences((state) => state.setLanguage);
  const setTheme = usePreferences((state) => state.setTheme);
  const hapticsEnabled = usePreferences((state) => state.hapticsEnabled);
  const preferencesHydrated = usePreferences((state) => state.hydrated);
  const setHapticsEnabled = usePreferences((state) => state.setHapticsEnabled);
  const localName = useUserStore((state) => state.name);
  const [session, setSession] = useState<Session | null>();
  const [sessionError, setSessionError] = useState<string>();
  const [sheet, setSheet] = useState<Sheet>(null);
  const [notificationState, setNotificationState] =
    useState<NotificationState>("loading");
  const [notificationSaving, setNotificationSaving] = useState(false);
  const [preferenceSaving, setPreferenceSaving] = useState(false);
  const [notificationPreferences, setNotificationPreferences] = useState<MobileNotificationPreferences>({
    marketing_enabled: true,
    promotions: true,
    new_products: true,
    loyalty: true,
    price_drops: true,
    back_in_stock: true,
  });
  const [logoutLoading, setLogoutLoading] = useState(false);

  const settings = useMemo(
    () =>
      Object.fromEntries(
        (settingsQuery.data ?? []).map((setting) => [
          setting.key,
          String(setting.value ?? ""),
        ]),
      ),
    [settingsQuery.data],
  );
  const wishlistEnabled = settings.enable_wishlist !== "false";
  const notificationsEnabled = settings.app_notifications_enabled !== "false";
  const clubEnabled = settings.enable_ecoclub !== "false";
  const configuredClubTitle = settings.app_club_title?.trim();
  const clubTitle =
    !configuredClubTitle || /^l[’']?ecomax club$/i.test(configuredClubTitle)
      ? "ECOCLUB"
      : configuredClubTitle;

  useEffect(() => {
    let active = true;
    void supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setSessionError("Impossible de charger votre session.");
          setSession(null);
          return;
        }
        setSession(data.session);
        setSessionError(undefined);
      })
      .catch(() => {
        if (!active) return;
        setSessionError("Connexion au compte indisponible.");
        setSession(null);
      });
    const auth = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setSessionError(undefined);
    });
    return () => {
      active = false;
      auth.data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let active = true;
    void getPushNotificationState()
      .then((state) => {
        if (!active) return;
        setNotificationState(
          !state.supported
            ? "unsupported"
            : state.enabled
              ? "enabled"
              : state.status === "denied"
                ? "denied"
                : "disabled",
        );
      })
      .catch(() => {
        if (active) setNotificationState("disabled");
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (sheet !== "notifications" || !session) return;
    let active = true;
    void getMobileNotificationPreferences()
      .then(({ preferences }) => { if (active) setNotificationPreferences(preferences); })
      .catch((error) => { if (active) Alert.alert("Préférences indisponibles", error instanceof Error ? error.message : "Veuillez réessayer."); })
      .finally(() => { if (active) setPreferenceSaving(false); });
    return () => { active = false; };
  }, [session, sheet]);

  const saveNotificationPreference = async (key: keyof MobileNotificationPreferences, value: boolean) => {
    if (preferenceSaving) return;
    const previous = notificationPreferences;
    const next = { ...previous, [key]: value };
    setNotificationPreferences(next);
    setPreferenceSaving(true);
    try {
      const result = await updateMobileNotificationPreferences(next);
      setNotificationPreferences(result.preferences);
    } catch (error) {
      setNotificationPreferences(previous);
      Alert.alert("Préférence non enregistrée", error instanceof Error ? error.message : "Veuillez réessayer.");
    } finally {
      setPreferenceSaving(false);
    }
  };

  const displayName =
    session?.user.user_metadata?.full_name ||
    [
      session?.user.user_metadata?.first_name,
      session?.user.user_metadata?.last_name,
    ]
      .filter(Boolean)
      .join(" ") ||
    localName ||
    "Client L’ECOMAX";
  const email = session?.user.email ?? "";
  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((part: string) => part[0])
    .join("")
    .toUpperCase();
  const accountAvatar = session?.user.user_metadata?.avatar_url ?? session?.user.user_metadata?.picture;
  const avatarUrl = typeof accountAvatar === "string" ? accountAvatar : undefined;
  const languageLabel =
    languages.find((option) => option.value === language)?.label ?? "Français";
  const appearanceLabel =
    theme === "dark" ? "Sombre" : theme === "light" ? "Clair" : "Automatique";
  const appVersion = Constants.expoConfig?.version ?? "1.0.0";

  const requireAccount = (pathname: "/orders" | "/addresses" | "/profile") => {
    if (session) {
      router.push(pathname);
      return;
    }
    router.push({
      pathname: "/auth",
      params: { mode: "login", returnTo: "account" },
    });
  };

  const openWebsitePage = (pathname: string) => {
    void WebBrowser.openBrowserAsync(`${runtimeConfig.apiUrl}${pathname}`);
  };

  const openSupport = () => router.push("/support");

  const toggleNotifications = async (enabled: boolean) => {
    if (notificationSaving || !notificationsEnabled) return;
    if (!session) {
      router.push({
        pathname: "/auth",
        params: { mode: "login", returnTo: "account" },
      });
      return;
    }
    setNotificationSaving(true);
    const previous = notificationState;
    try {
      if (enabled) {
        const token = await registerForPushNotifications(session.user.id);
        const state = await getPushNotificationState();
        if (!token || !state.enabled) {
          setNotificationState(
            state.status === "denied" ? "denied" : "disabled",
          );
          Alert.alert(
            "Notifications désactivées",
            "Autorisez les notifications dans les réglages de votre appareil.",
            [
              { text: "Plus tard", style: "cancel" },
              {
                text: "Ouvrir les réglages",
                onPress: () => void Linking.openSettings(),
              },
            ],
          );
          return;
        }
        setNotificationState("enabled");
      } else {
        await disablePushNotifications();
        setNotificationState("disabled");
      }
    } catch (error) {
      setNotificationState(previous);
      Alert.alert(
        "Préférence non enregistrée",
        error instanceof Error
          ? error.message
          : "Veuillez vérifier votre connexion.",
      );
    } finally {
      setNotificationSaving(false);
    }
  };

  const confirmLogout = () => {
    Alert.alert(
      "Se déconnecter",
      "Votre panier invité et vos préférences seront conservés sur cet appareil.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Se déconnecter",
          style: "destructive",
          onPress: async () => {
            setLogoutLoading(true);
            const { error } = await supabase.auth.signOut();
            setLogoutLoading(false);
            if (error) {
              Alert.alert("Déconnexion impossible", error.message);
              return;
            }
            setSheet(null);
          },
        },
      ],
    );
  };

  const requestDeletion = () => {
    Alert.alert(
      "Supprimer votre compte ?",
      "Une demande sécurisée sera envoyée. Vos données seront traitées selon les obligations légales de conservation.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Envoyer la demande",
          style: "destructive",
          onPress: async () => {
            try {
              const result = await apiRequest<{ message: string }>(
                "/api/account/delete-request",
                { method: "POST", authenticated: true },
              );
              Alert.alert("Demande enregistrée", result.message);
            } catch (error) {
              Alert.alert(
                "Demande impossible",
                error instanceof Error ? error.message : "Veuillez réessayer.",
              );
            }
          },
        },
      ],
    );
  };

  if (session === undefined) {
    return (
      <Screen className="bg-white">
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primaryDark} />
          <Text style={styles.loadingText}>Chargement de votre compte…</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen className={dark ? "bg-ink" : "bg-[#F6F7F4]"}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 16) + 104 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <BrandLogo header />
          <AnimatedPressable
            accessibilityLabel="Ouvrir les réglages du compte"
            onPress={() => setSheet("settings")}
            style={[styles.settingsButton, dark && styles.darkControl]}
          >
            <Ionicons
              color={dark ? colors.white : colors.text}
              name="options-outline"
              size={21}
            />
          </AnimatedPressable>
        </View>

        <View style={styles.heading}>
          <Text style={styles.pageEyebrow}>ESPACE PERSONNEL</Text>
          <Text style={[styles.title, dark && styles.darkText]}>
            Mon compte
          </Text>
          <Text style={[styles.subtitle, dark && styles.darkSecondary]}>
            Votre quotidien, un peu plus simple.
          </Text>
        </View>

        {sessionError ? (
          <View style={styles.errorState}>
            <Ionicons
              color={colors.danger}
              name="cloud-offline-outline"
              size={20}
            />
            <Text style={styles.errorText}>{sessionError}</Text>
            <AnimatedPressable
              accessibilityLabel="Réessayer de charger le compte"
              haptic={false}
              onPress={() => {
                setSession(undefined);
                void supabase.auth.getSession().then(({ data }) => {
                  setSession(data.session);
                  setSessionError(undefined);
                });
              }}
              style={styles.retry}
            >
              <Text style={styles.retryText}>RÉESSAYER</Text>
            </AnimatedPressable>
          </View>
        ) : session ? (
          <View style={[styles.memberCard, dark && styles.memberCardDark]}>
            <View style={styles.memberAccent} />
            <View style={styles.avatar}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} contentFit="cover" style={StyleSheet.absoluteFill} transition={180} />
              ) : (
                <Text style={styles.avatarText}>{initials || "LE"}</Text>
              )}
            </View>
            <View style={styles.memberCopy}>
              <Text
                numberOfLines={1}
                style={[styles.memberName, dark && styles.darkText]}
              >
                {displayName}
              </Text>
              <Text
                numberOfLines={1}
                style={[styles.memberEmail, dark && styles.darkSecondary]}
              >
                {email}
              </Text>
              {clubEnabled ? (
                <View style={styles.clubBadge}>
                  <Ionicons color={colors.primaryDark} name="sparkles" size={9} />
                  <Text style={styles.clubStatus}>MEMBRE ECOCLUB</Text>
                </View>
              ) : null}
            </View>
            <AnimatedPressable
              accessibilityLabel="Modifier mon profil"
              onPress={() => router.push("/profile")}
              style={styles.editProfile}
            >
              <Ionicons color={colors.text} name="create-outline" size={18} />
            </AnimatedPressable>
          </View>
        ) : (
          <View style={styles.guestCard}>
            <View pointerEvents="none" accessible={false} style={styles.guestOrbit} />
            <View pointerEvents="none" accessible={false} style={styles.guestOrbitInner} />
            <View style={styles.guestTopRow}>
              <View style={styles.guestBadge}>
                <View style={styles.guestBadgeDot} />
                <Text style={styles.guestEyebrow}>VOTRE ESPACE, VOS ENVIES</Text>
              </View>
              <View style={styles.guestEmblem}>
                <Ionicons name="person-outline" size={21} color="#C6F6CB" />
              </View>
            </View>
            <Text style={styles.guestTitle}>{"Bienvenue\nchez vous."}</Text>
            <Text style={styles.guestDescription}>
              Vos commandes, vos coups de cœur et tous vos avantages, au même endroit.
            </Text>
            <AnimatedPressable
              accessibilityLabel="Se connecter"
              onPress={() =>
                router.push({
                  pathname: "/auth",
                  params: { mode: "login", returnTo: "account" },
                })
              }
              style={styles.loginButton}
            >
              <Text style={styles.loginButtonText}>Se connecter</Text>
              <View style={styles.loginArrow}>
                <Ionicons color={colors.text} name="arrow-forward" size={18} />
              </View>
            </AnimatedPressable>
            <AnimatedPressable
              accessibilityLabel="Créer un compte"
              haptic={false}
              onPress={() =>
                router.push({
                  pathname: "/auth",
                  params: { mode: "signup", returnTo: "account" },
                })
              }
              style={styles.registerButton}
            >
              <Text style={styles.registerPrompt}>Nouveau ici ? <Text style={styles.registerText}>Créer un compte</Text></Text>
            </AnimatedPressable>
          </View>
        )}

        <SectionTitle dark={dark} title="À portée de main" />
        <View style={styles.services}>
          <ServiceTile
            dark={dark}
            icon="cube-outline"
            onPress={() => requireAccount("/orders")}
            subtitle="Suivre, retourner ou racheter"
            title="Mes commandes"
          />
          {wishlistEnabled ? (
            <ServiceTile
              dark={dark}
              icon="heart-outline"
              onPress={() => router.push("/wishlist")}
              subtitle="Retrouvez vos articles enregistrés"
              title="Mes favoris"
            />
          ) : null}
          <ServiceTile
            dark={dark}
            icon="location-outline"
            onPress={() => requireAccount("/addresses")}
            subtitle="Gérez vos adresses de livraison"
            title="Mes adresses"
          />
          <ServiceTile
            dark={dark}
            icon="headset-outline"
            onPress={openSupport}
            subtitle={
              settings.checkout_contact_subtitle?.trim() ||
              "Nous sommes là pour vous aider"
            }
            title={settings.checkout_contact_title?.trim() || "Assistance"}
          />
          <ServiceTile
            dark={dark}
            icon="person-circle-outline"
            onPress={() => requireAccount("/profile")}
            subtitle="Photo, nom, téléphone et sécurité"
            title="Mon profil"
          />
          <ServiceTile
            dark={dark}
            icon="notifications-outline"
            onPress={() => router.push("/notifications")}
            subtitle="Consultez vos offres et actualités"
            title="Mes notifications"
          />
        </View>

        {clubEnabled ? (
          <AnimatedPressable
            accessibilityLabel={
              settings.app_club_cta_label?.trim() || "Découvrir EcoClub"
            }
            onPress={() =>
              openWebsitePage(
                settings.app_club_cta_destination?.trim() || "/ecoclub",
              )
            }
            pressedScale={0.99}
            style={styles.clubBanner}
          >
            <View style={styles.clubMark}>
              <Ionicons color={colors.text} name="sparkles-outline" size={20} />
            </View>
            <View style={styles.clubCopy}>
              <Text style={styles.clubEyebrow}>
                {clubTitle}
              </Text>
              <Text style={styles.clubDescription}>
                {settings.app_club_description?.trim() ||
                  "Des avantages pensés pour vous."}
              </Text>
            </View>
            <View style={styles.clubCta}>
              <Text style={styles.clubCtaText}>
                {settings.app_club_cta_label?.trim() || "Découvrir"}
              </Text>
              <Ionicons color={colors.text} name="arrow-forward" size={15} />
            </View>
          </AnimatedPressable>
        ) : null}

        <SectionTitle dark={dark} title="PRÉFÉRENCES" />
        <View style={[styles.list, dark && styles.darkSurface]}>
          <PreferenceRow
            dark={dark}
            icon="language-outline"
            label="Langue"
            onPress={() => setSheet("language")}
            value={languageLabel}
          />
          <View style={[styles.rowDivider, dark && styles.darkBorder]} />
          <PreferenceRow
            dark={dark}
            icon="contrast-outline"
            label="Apparence"
            onPress={() => setSheet("appearance")}
            value={appearanceLabel}
          />
          {notificationsEnabled ? (
            <>
              <View style={[styles.rowDivider, dark && styles.darkBorder]} />
              <View style={styles.preferenceRow}>
                <View style={styles.preferenceIcon}>
                  <Ionicons
                    color={colors.primaryDark}
                    name="notifications-outline"
                    size={19}
                  />
                </View>
                <View style={styles.preferenceCopy}>
                  <Text
                    style={[styles.preferenceLabel, dark && styles.darkText]}
                  >
                    Notifications
                  </Text>
                  <Text
                    style={[
                      styles.preferenceValue,
                      dark && styles.darkSecondary,
                    ]}
                  >
                    {notificationState === "denied"
                      ? "Refusées dans les réglages"
                      : notificationState === "unsupported"
                        ? "Non disponibles sur cet appareil"
                        : notificationState === "enabled"
                          ? "Activées"
                          : "Désactivées"}
                  </Text>
                </View>
                {notificationSaving || notificationState === "loading" ? (
                  <ActivityIndicator color={colors.primaryDark} size="small" />
                ) : (
                  <Switch
                    accessibilityLabel="Activer les notifications"
                    disabled={notificationState === "unsupported"}
                    ios_backgroundColor="#D5D9D6"
                    onValueChange={(value) => void toggleNotifications(value)}
                    thumbColor={colors.white}
                    trackColor={{
                      false: "#D5D9D6",
                      true: colors.primary,
                    }}
                    value={notificationState === "enabled"}
                  />
                )}
              </View>
              {notificationState === "enabled" && session ? (
                <AnimatedPressable
                  accessibilityLabel="Personnaliser les notifications"
                  haptic={false}
                  onPress={() => { setPreferenceSaving(true); setSheet("notifications"); }}
                  style={{ minHeight: 44, alignItems: "center", justifyContent: "center", borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: dark ? "#303630" : colors.border }}
                >
                  <Text style={{ color: colors.primaryDark, fontFamily: typography.black, fontSize: 11, letterSpacing: 0.5 }}>PERSONNALISER LES ALERTES</Text>
                </AnimatedPressable>
              ) : null}
            </>
          ) : null}
        </View>

        <SectionTitle dark={dark} title="AIDE & INFORMATIONS" />
        <View style={[styles.list, dark && styles.darkSurface]}>
          <LinkRow
            dark={dark}
            icon="help-circle-outline"
            label="FAQ"
            onPress={() => openWebsitePage("/aide")}
          />
          <View style={[styles.rowDivider, dark && styles.darkBorder]} />
          <LinkRow
            dark={dark}
            icon="car-outline"
            label="Livraison & retours"
            onPress={() => openWebsitePage("/retours")}
          />
          <View style={[styles.rowDivider, dark && styles.darkBorder]} />
          <LinkRow
            dark={dark}
            icon="shield-checkmark-outline"
            label="Confidentialité"
            onPress={() => openWebsitePage("/politique-confidentialite")}
          />
        </View>

        <Text style={[styles.version, dark && styles.darkSecondary]}>
          L’ECOMAX · VERSION {appVersion}
        </Text>
      </ScrollView>

      <Modal
        animationType="fade"
        onRequestClose={() => setSheet(null)}
        transparent
        visible={Boolean(sheet)}
      >
        <AppViewportOverlay align="bottom">
          <Pressable
            accessibilityLabel="Fermer"
            onPress={() => setSheet(null)}
            style={styles.sheetBackdrop}
          />
          <View
            style={[
              styles.sheet,
              dark && styles.sheetDark,
              { paddingBottom: Math.max(insets.bottom, 16) },
            ]}
          >
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, dark && styles.darkText]}>
                {sheet === "language"
                  ? "Langue"
                  : sheet === "appearance"
                    ? "Apparence"
                    : sheet === "notifications"
                      ? "Notifications"
                    : "Réglages"}
              </Text>
              <AnimatedPressable
                accessibilityLabel="Fermer"
                haptic={false}
                onPress={() => setSheet(null)}
                style={[styles.sheetClose, dark && styles.sheetCloseDark]}
              >
                <Ionicons
                  color={dark ? colors.white : colors.text}
                  name="close"
                  size={20}
                />
              </AnimatedPressable>
            </View>

            {sheet === "language" ? (
              <View style={styles.sheetOptions}>
                {languages.map((option) => (
                  <SheetOption
                    dark={dark}
                    key={option.value}
                    label={option.label}
                    leading={option.native}
                    onPress={() => {
                      setLanguage(option.value);
                      setSheet(null);
                    }}
                    selected={language === option.value}
                  />
                ))}
              </View>
            ) : sheet === "appearance" ? (
              <View style={styles.sheetOptions}>
                <SheetOption
                  dark={dark}
                  label="Automatique"
                  leading="AUTO"
                  onPress={() => {
                    setTheme("system");
                    setSheet(null);
                  }}
                  selected={theme === "system"}
                />
                <SheetOption
                  dark={dark}
                  label="Clair"
                  leading="☀"
                  onPress={() => {
                    setTheme("light");
                    setSheet(null);
                  }}
                  selected={theme === "light"}
                />
                <SheetOption
                  dark={dark}
                  label="Sombre"
                  leading="◐"
                  onPress={() => {
                    setTheme("dark");
                    setSheet(null);
                  }}
                  selected={theme === "dark"}
                />
              </View>
            ) : sheet === "notifications" ? (
              <View style={styles.sheetOptions}>
                {([
                  ["marketing_enabled", "Actualités et recommandations"],
                  ["promotions", "Promotions et offres"],
                  ["new_products", "Nouveaux produits"],
                  ["loyalty", "Club et fidélité"],
                  ["price_drops", "Baisses de prix"],
                  ["back_in_stock", "Retours en stock"],
                ] as const).map(([key, label]) => (
                  <View key={key} style={[styles.preferenceRow, dark && styles.darkSurface]}>
                    <View style={styles.preferenceCopy}>
                      <Text style={[styles.preferenceLabel, dark && styles.darkText]}>{label}</Text>
                    </View>
                    {preferenceSaving ? <ActivityIndicator color={colors.primaryDark} size="small" /> : (
                      <Switch
                        accessibilityLabel={label}
                        ios_backgroundColor="#D5D9D6"
                        onValueChange={(value) => void saveNotificationPreference(key, value)}
                        thumbColor={colors.white}
                        trackColor={{ false: "#D5D9D6", true: colors.primary }}
                        value={notificationPreferences[key]}
                      />
                    )}
                  </View>
                ))}
                <Text style={[styles.preferenceValue, dark && styles.darkSecondary, { paddingHorizontal: 4, lineHeight: 18 }]}>Les alertes de service liées à votre compte et à vos commandes restent actives pour assurer le suivi essentiel.</Text>
              </View>
            ) : (
              <View style={styles.settingsList}>
                <Text style={[styles.settingsSectionLabel, dark && styles.darkSecondary]}>COMPTE</Text>
                <View style={[styles.settingsGroup, dark && styles.darkSurface]}>
                  <SettingsRow dark={dark} icon="person-outline" label={session ? "Modifier le profil" : "Se connecter"} subtitle="Photo et informations personnelles" onPress={() => { setSheet(null); requireAccount("/profile"); }} />
                  <SettingsRow dark={dark} icon="shield-checkmark-outline" label="Confidentialité et sécurité" subtitle="Mot de passe et protection du compte" onPress={() => { setSheet(null); if (session) router.push("/profile"); else openWebsitePage("/politique-confidentialite"); }} />
                </View>
                <Text style={[styles.settingsSectionLabel, dark && styles.darkSecondary]}>PRÉFÉRENCES</Text>
                <View style={[styles.settingsGroup, dark && styles.darkSurface]}>
                  <SettingsRow dark={dark} icon="language-outline" label="Langue" subtitle="Français" onPress={() => setSheet("language")} />
                  <SettingsRow dark={dark} icon="contrast-outline" label="Apparence" subtitle="Clair, sombre ou automatique" onPress={() => setSheet("appearance")} />
                  <SettingsToggleRow
                    dark={dark}
                    enabled={hapticsEnabled}
                    hydrated={preferencesHydrated}
                    icon="phone-portrait-outline"
                    label="Vibration & haptics"
                    subtitle="Use vibration feedback for interactions inside the app."
                    onChange={(enabled) => {
                      setHapticsEnabled(enabled);
                      if (enabled) void triggerSelectionHaptic();
                    }}
                  />
                  <SettingsRow dark={dark} icon="headset-outline" label="Assistance" subtitle="Nous sommes là pour vous aider" onPress={() => { setSheet(null); openSupport(); }} />
                </View>
                {session ? (
                  <View style={[styles.settingsGroup, styles.dangerGroup, dark && styles.darkSurface]}>
                    <SettingsRow
                      danger
                      dark={dark}
                      icon="log-out-outline"
                      label={logoutLoading ? "Déconnexion…" : "Se déconnecter"}
                      subtitle="Fermer la session sur cet appareil"
                      onPress={confirmLogout}
                    />
                    <SettingsRow
                      danger
                      dark={dark}
                      icon="trash-outline"
                      label="Supprimer mon compte"
                      subtitle="Demander la suppression de vos données"
                      onPress={requestDeletion}
                    />
                  </View>
                ) : null}
              </View>
            )}
          </View>
        </AppViewportOverlay>
      </Modal>
    </Screen>
  );
}

function SectionTitle({ title, dark }: { title: string; dark: boolean }) {
  return (
    <View style={styles.sectionTitleRow}>
      <View style={styles.sectionLine} />
      <Text style={[styles.sectionTitle, dark && styles.darkText]}>
        {title}
      </Text>
    </View>
  );
}

function ServiceTile({
  title,
  subtitle,
  icon,
  onPress,
  dark,
}: {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  dark: boolean;
}) {
  return (
    <AnimatedPressable
      accessibilityLabel={`${title}. ${subtitle}`}
      onPress={onPress}
      pressedScale={0.975}
      style={[styles.serviceTile, dark && styles.darkSurface]}
    >
      <View style={styles.serviceTileTop}>
        <View style={styles.serviceIcon}>
          <Ionicons color={colors.primaryDark} name={icon} size={21} />
        </View>
        <View style={[styles.serviceArrow, dark && styles.serviceArrowDark]}>
          <Ionicons
            color={dark ? colors.white : colors.text}
            name="arrow-forward"
            size={15}
          />
        </View>
      </View>
      <Text style={[styles.serviceTitle, dark && styles.darkText]}>
        {title}
      </Text>
      <Text
        maxFontSizeMultiplier={1.2}
        numberOfLines={2}
        style={[styles.serviceSubtitle, dark && styles.darkSecondary]}
      >
        {subtitle}
      </Text>
    </AnimatedPressable>
  );
}

function PreferenceRow({
  icon,
  label,
  value,
  onPress,
  dark,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  onPress: () => void;
  dark: boolean;
}) {
  return (
    <AnimatedPressable
      accessibilityLabel={`${label}, ${value}`}
      haptic={false}
      onPress={onPress}
      style={styles.preferenceRow}
    >
      <View style={styles.preferenceIcon}>
        <Ionicons color={colors.primaryDark} name={icon} size={19} />
      </View>
      <View style={styles.preferenceCopy}>
        <Text style={[styles.preferenceLabel, dark && styles.darkText]}>
          {label}
        </Text>
        <Text style={[styles.preferenceValue, dark && styles.darkSecondary]}>
          {value}
        </Text>
      </View>
      <Ionicons
        color={dark ? "#A8ADA8" : colors.secondaryText}
        name="chevron-forward"
        size={18}
      />
    </AnimatedPressable>
  );
}

function LinkRow({
  icon,
  label,
  onPress,
  dark,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  dark: boolean;
}) {
  return (
    <AnimatedPressable
      accessibilityLabel={label}
      haptic={false}
      onPress={onPress}
      style={styles.linkRow}
    >
      <Ionicons color={colors.primaryDark} name={icon} size={19} />
      <Text style={[styles.linkLabel, dark && styles.darkText]}>{label}</Text>
      <Ionicons
        color={dark ? "#A8ADA8" : colors.secondaryText}
        name="chevron-forward"
        size={18}
      />
    </AnimatedPressable>
  );
}

function SheetOption({
  label,
  leading,
  selected,
  onPress,
  dark,
}: {
  label: string;
  leading: string;
  selected: boolean;
  onPress: () => void;
  dark: boolean;
}) {
  return (
    <AnimatedPressable
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.sheetOption,
        dark && styles.darkSurface,
        selected && styles.sheetOptionSelected,
      ]}
    >
      <View
        style={[styles.optionLeading, selected && styles.optionLeadingSelected]}
      >
        <Text
          style={[
            styles.optionLeadingText,
            selected && styles.optionLeadingTextSelected,
          ]}
        >
          {leading}
        </Text>
      </View>
      <Text style={[styles.optionLabel, dark && styles.darkText]}>{label}</Text>
      <Ionicons
        color={selected ? colors.primaryDark : colors.border}
        name={selected ? "checkmark-circle" : "ellipse-outline"}
        size={21}
      />
    </AnimatedPressable>
  );
}

function SettingsRow({
  icon,
  label,
  subtitle,
  onPress,
  dark,
  danger = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtitle?: string;
  onPress: () => void;
  dark: boolean;
  danger?: boolean;
}) {
  return (
    <AnimatedPressable
      accessibilityLabel={label}
      onPress={onPress}
      style={styles.settingsRow}
    >
      <View style={[styles.settingsIcon, danger && styles.settingsIconDanger, dark && styles.settingsIconDark]}>
        <Ionicons color={danger ? colors.danger : colors.primaryDark} name={icon} size={19} />
      </View>
      <View style={styles.settingsCopy}>
        <Text style={[styles.settingsLabel, dark && styles.darkText, danger && styles.dangerText]}>{label}</Text>
        {subtitle ? <Text numberOfLines={1} style={[styles.settingsSubtitle, dark && styles.darkSecondary]}>{subtitle}</Text> : null}
      </View>
      <Ionicons
        color={danger ? colors.danger : colors.secondaryText}
        name="chevron-forward"
        size={18}
      />
    </AnimatedPressable>
  );
}

function SettingsToggleRow({
  dark,
  enabled,
  hydrated,
  icon,
  label,
  subtitle,
  onChange,
}: {
  dark: boolean;
  enabled: boolean;
  hydrated: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtitle: string;
  onChange: (enabled: boolean) => void;
}) {
  return (
    <View style={styles.settingsRow}>
      <View style={[styles.settingsIcon, dark && styles.settingsIconDark]}>
        <Ionicons color={colors.primaryDark} name={icon} size={19} />
      </View>
      <View style={styles.settingsCopy}>
        <Text style={[styles.settingsLabel, dark && styles.darkText]}>{label}</Text>
        <Text numberOfLines={2} style={[styles.settingsSubtitle, dark && styles.darkSecondary]}>{subtitle}</Text>
      </View>
      {hydrated ? (
        <Switch
          accessibilityHint="Turns all vibration feedback generated by L'ecomax on or off."
          accessibilityLabel="Vibration & haptics"
          accessibilityRole="switch"
          accessibilityState={{ checked: enabled }}
          ios_backgroundColor="#D5D9D6"
          onValueChange={onChange}
          thumbColor={colors.white}
          trackColor={{ false: "#D5D9D6", true: colors.primary }}
          value={enabled}
        />
      ) : (
        <ActivityIndicator accessibilityLabel="Loading haptics preference" color={colors.primaryDark} size="small" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    paddingHorizontal: 20,
    backgroundColor: "transparent",
  },
  header: {
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  settingsButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    backgroundColor: colors.white,
  },
  darkControl: {
    borderColor: "#343A35",
    backgroundColor: colors.darkSurface,
  },
  heading: { paddingBottom: 23, paddingTop: 14 },
  pageEyebrow: {
    marginBottom: 7,
    color: colors.primaryDark,
    fontFamily: typography.black,
    fontSize: 8,
    letterSpacing: 1.8,
  },
  title: {
    color: colors.text,
    fontFamily: typography.black,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -1.4,
  },
  subtitle: {
    maxWidth: 350,
    marginTop: 7,
    color: colors.secondaryText,
    fontFamily: typography.regular,
    fontSize: 12.5,
    lineHeight: 19,
  },
  guestCard: {
    padding: 22,
    overflow: "hidden",
    borderRadius: 26,
    backgroundColor: "#12291F",
  },
  guestOrbit: { position: "absolute", width: 280, height: 280, borderRadius: 140, borderWidth: 1, borderColor: "#2D493A", top: -125, right: -136 },
  guestOrbitInner: { position: "absolute", width: 206, height: 206, borderRadius: 103, borderWidth: 1, borderColor: "#2D493A", top: -88, right: -99, backgroundColor: "#193526" },
  guestTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  guestBadge: { flexDirection: "row", alignItems: "center", gap: 7, flexShrink: 1 },
  guestBadgeDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: "#A8EDB1" },
  guestEmblem: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: "#2C4939", borderWidth: 1, borderColor: "#42604B" },
  guestEyebrow: {
    color: "#BAE2C1",
    fontFamily: typography.black,
    fontSize: 8,
    letterSpacing: 1.2,
  },
  guestTitle: {
    maxWidth: 310,
    marginTop: 12,
    color: colors.white,
    fontFamily: typography.black,
    fontSize: 34,
    lineHeight: 37,
    letterSpacing: -1.2,
  },
  guestDescription: {
    maxWidth: 300,
    marginTop: 8,
    color: "#C1D0C5",
    fontFamily: typography.regular,
    fontSize: 12,
    lineHeight: 19,
  },
  loginButton: {
    minHeight: 54,
    marginTop: 18,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 15,
    backgroundColor: "#B8F28B",
  },
  loginButtonText: {
    color: colors.text,
    fontFamily: typography.black,
    fontSize: 13,
    letterSpacing: 0,
  },
  loginArrow: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.3)" },
  registerButton: {
    minHeight: 44,
    marginTop: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  registerText: {
    color: colors.white,
    fontFamily: typography.bold,
    fontSize: 11,
    textDecorationLine: "underline",
  },
  registerPrompt: { color: "#C1D0C5", fontFamily: typography.regular, fontSize: 11 },
  memberCard: {
    minHeight: 112,
    paddingHorizontal: 16,
    paddingVertical: 17,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E7E2",
    borderRadius: 18,
    backgroundColor: "#F7F9F7",
  },
  memberAccent: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: 4,
    backgroundColor: colors.primary,
  },
  memberCardDark: {
    borderColor: "#343A35",
    backgroundColor: colors.darkSurface,
  },
  avatar: {
    overflow: "hidden",
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 28,
    borderWidth: 3,
    borderColor: "#CFF4D9",
    backgroundColor: colors.text,
  },
  avatarText: {
    color: colors.white,
    fontFamily: typography.black,
    fontSize: 17,
  },
  memberCopy: { minWidth: 0, flex: 1, marginLeft: 14 },
  memberName: {
    color: colors.text,
    fontFamily: typography.black,
    fontSize: 16,
  },
  memberEmail: {
    marginTop: 4,
    color: colors.secondaryText,
    fontFamily: typography.medium,
    fontSize: 10.5,
  },
  clubBadge: {
    alignSelf: "flex-start",
    minHeight: 21,
    marginTop: 8,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 11,
    backgroundColor: "#E1F7E7",
  },
  clubStatus: {
    color: colors.primaryDark,
    fontFamily: typography.black,
    fontSize: 7.5,
    letterSpacing: 0.75,
  },
  editProfile: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    backgroundColor: colors.white,
  },
  sectionTitleRow: {
    marginBottom: 13,
    marginTop: 29,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionLine: { width: 24, height: 2, borderRadius: 1, backgroundColor: colors.primary },
  sectionTitle: {
    color: colors.text,
    fontFamily: typography.black,
    fontSize: 16,
    letterSpacing: -0.4,
  },
  services: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  serviceTile: {
    flexBasis: "46%",
    flexGrow: 1,
    minWidth: 0,
    minHeight: 138,
    padding: 16,
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: "#E7EAE3",
    borderRadius: 21,
    backgroundColor: colors.white,
  },
  serviceTileTop: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  serviceIcon: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: "#F0F5E9",
  },
  serviceArrow: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    backgroundColor: "transparent",
  },
  serviceArrowDark: { backgroundColor: "#303530" },
  serviceTitle: {
    marginTop: 14,
    color: colors.text,
    fontFamily: typography.black,
    fontSize: 13,
  },
  serviceSubtitle: {
    marginTop: 5,
    color: colors.secondaryText,
    fontFamily: typography.regular,
    fontSize: 10.5,
    lineHeight: 16,
  },
  clubBanner: {
    minHeight: 96,
    marginTop: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    backgroundColor: "#DDF0CF",
  },
  clubMark: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.62)",
  },
  clubCopy: { minWidth: 0, marginLeft: 11, flex: 1 },
  clubEyebrow: {
    color: colors.text,
    fontFamily: typography.black,
    fontSize: 9,
    letterSpacing: 1,
  },
  clubDescription: {
    marginTop: 4,
    color: "#194522",
    fontFamily: typography.medium,
    fontSize: 9,
    lineHeight: 13,
  },
  clubCta: {
    marginLeft: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  clubCtaText: {
    color: colors.text,
    fontFamily: typography.black,
    fontSize: 8,
  },
  list: {
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    backgroundColor: colors.white,
  },
  preferenceRow: { minHeight: 70, flexDirection: "row", alignItems: "center" },
  preferenceIcon: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
    backgroundColor: "#EAF8EE",
  },
  preferenceCopy: { minWidth: 0, marginHorizontal: 11, flex: 1 },
  preferenceLabel: {
    color: colors.text,
    fontFamily: typography.bold,
    fontSize: 11,
  },
  preferenceValue: {
    marginTop: 3,
    color: colors.secondaryText,
    fontFamily: typography.regular,
    fontSize: 9,
  },
  rowDivider: { height: 1, marginLeft: 49, backgroundColor: colors.border },
  linkRow: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  linkLabel: {
    minWidth: 0,
    flex: 1,
    color: colors.text,
    fontFamily: typography.bold,
    fontSize: 11,
  },
  version: {
    marginTop: 25,
    color: "#929792",
    fontFamily: typography.bold,
    fontSize: 7,
    letterSpacing: 1,
    textAlign: "center",
  },
  errorState: {
    minHeight: 70,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    borderWidth: 1,
    borderColor: "#F0BABB",
    borderRadius: 10,
    backgroundColor: "#FFF8F8",
  },
  errorText: {
    minWidth: 0,
    flex: 1,
    color: "#9A292C",
    fontFamily: typography.medium,
    fontSize: 9,
  },
  retry: { minHeight: 44, paddingHorizontal: 8, justifyContent: "center" },
  retryText: {
    color: colors.danger,
    fontFamily: typography.black,
    fontSize: 8,
  },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: {
    marginTop: 10,
    color: colors.secondaryText,
    fontFamily: typography.medium,
    fontSize: 10,
  },
  sheetBackdrop: { position: "absolute", inset: 0 },
  sheet: {
    maxHeight: "86%",
    paddingHorizontal: 20,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: colors.white,
  },
  sheetDark: { backgroundColor: colors.dark },
  sheetHandle: {
    width: 42,
    height: 4,
    marginTop: 10,
    alignSelf: "center",
    borderRadius: 2,
    backgroundColor: "#CCD1CD",
  },
  sheetHeader: {
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sheetTitle: {
    color: colors.text,
    fontFamily: typography.black,
    fontSize: 22,
    letterSpacing: -0.4,
  },
  sheetClose: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: colors.surface,
  },
  sheetCloseDark: { backgroundColor: colors.darkSurface },
  sheetOptions: { gap: 8, paddingBottom: 8 },
  sheetOption: {
    minHeight: 58,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.white,
  },
  sheetOptionSelected: {
    borderColor: "#98D6A9",
    backgroundColor: "#F0FAF3",
  },
  optionLeading: {
    minWidth: 40,
    height: 36,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  optionLeadingSelected: { backgroundColor: colors.primary },
  optionLeadingText: {
    color: colors.secondaryText,
    fontFamily: typography.black,
    fontSize: 8,
  },
  optionLeadingTextSelected: { color: colors.text },
  optionLabel: {
    minWidth: 0,
    marginHorizontal: 11,
    flex: 1,
    color: colors.text,
    fontFamily: typography.bold,
    fontSize: 11,
  },
  settingsList: { paddingBottom: 8 },
  settingsSectionLabel: {
    marginBottom: 8,
    marginLeft: 4,
    color: colors.secondaryText,
    fontFamily: typography.black,
    fontSize: 7.5,
    letterSpacing: 1.2,
  },
  settingsGroup: {
    marginBottom: 17,
    paddingHorizontal: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 17,
    backgroundColor: colors.white,
  },
  dangerGroup: { borderColor: "#F2D9D8", backgroundColor: "#FFF9F8" },
  settingsRow: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingsIcon: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#EAF8EF",
  },
  settingsIconDanger: { backgroundColor: "#FFF0EF" },
  settingsIconDark: { backgroundColor: "#29332C" },
  settingsCopy: { minWidth: 0, flex: 1 },
  settingsLabel: {
    color: colors.text,
    fontFamily: typography.bold,
    fontSize: 11,
  },
  settingsSubtitle: {
    marginTop: 3,
    color: colors.secondaryText,
    fontFamily: typography.regular,
    fontSize: 8.5,
  },
  dangerText: { color: colors.danger },
  darkText: { color: colors.white },
  darkSecondary: { color: "#A8ADA8" },
  darkSurface: {
    borderColor: "#343A35",
    backgroundColor: colors.darkSurface,
  },
  darkBorder: { backgroundColor: "#343A35" },
});
