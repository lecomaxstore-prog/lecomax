import { localizedContent } from "@/i18n/content";
import { localizedError } from "@/i18n/errors";
import { msg, useLocale } from "@/i18n";
import Ionicons from "@expo/vector-icons/Ionicons";
import Constants from "expo-constants";
import { Image } from "expo-image";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import type { Session } from "@supabase/supabase-js";
import { useEffect, useMemo, useRef, useState } from "react";
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
  useWindowDimensions,
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
];

type Sheet = "settings" | "language" | "appearance" | "notifications" | null;
type NotificationState =
  "loading" | "enabled" | "disabled" | "denied" | "unsupported";

export default function AccountScreen() {
  useLocale();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const colorScheme = useColorScheme();
  const dark = colorScheme === "dark";
  const settingsQuery = useSettings();
  const language = usePreferences((state) => state.language);
  const theme = usePreferences((state) => state.theme);
  const setLanguage = usePreferences((state) => state.setLanguage);
  const languageOverride = usePreferences((state) => state.languageOverride);
  const followPhoneLanguage = usePreferences((state) => state.useDeviceLanguage);
  const setTheme = usePreferences((state) => state.setTheme);
  const hapticsEnabled = usePreferences((state) => state.hapticsEnabled);
  const preferencesHydrated = usePreferences((state) => state.hydrated);
  const setHapticsEnabled = usePreferences((state) => state.setHapticsEnabled);
  const localName = useUserStore((state) => state.name);
  const [session, setSession] = useState<Session | null>();
  const [sessionError, setSessionError] = useState<string>();
  const [sheet, setSheetState] = useState<Sheet>(null);
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
  const [logoutConfirming, setLogoutConfirming] = useState(false);
  const [logoutError, setLogoutError] = useState<string>();
  const logoutPending = useRef(false);

  function setSheet(next: Sheet) {
    setSheetState(next);
    if (next !== "settings") {
      setLogoutConfirming(false);
      setLogoutError(undefined);
    }
  }

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
          setSessionError(msg("account.unableToLoadYourSession"));
          setSession(null);
          return;
        }
        setSession(data.session);
        setSessionError(undefined);
      })
      .catch(() => {
        if (!active) return;
        setSessionError(msg("account.accountSignInIsUnavailable"));
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
      .catch((error) => { if (active) Alert.alert(msg("account.preferencesUnavailable"), error instanceof Error ? localizedError(error) : msg("checkoutScreen.pleaseTryAgain")); })
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
      Alert.alert(msg("account.preferenceNotSaved"), error instanceof Error ? localizedError(error) : msg("checkoutScreen.pleaseTryAgain"));
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
    msg("account.lEcomaxCustomer");
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
    theme === "dark" ? msg("common.dark") : theme === "light" ? msg("common.light") : msg("account.automatic");
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
            msg("account.notificationsDisabled"),
            msg("account.allowNotificationsInYourDeviceSettings"),
            [
              { text: msg("appUpdateGate.later"), style: "cancel" },
              {
                text: msg("scanner.openSettings"),
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
        msg("account.preferenceNotSaved"),
        error instanceof Error
          ? localizedError(error)
          : msg("account.pleaseCheckYourConnection"),
      );
    } finally {
      setNotificationSaving(false);
    }
  };

  const confirmLogout = () => {
    if (logoutPending.current) return;
    setLogoutError(undefined);
    setLogoutConfirming(true);
  };

  const performLogout = async () => {
    if (logoutPending.current) return;
    logoutPending.current = true;
    setLogoutLoading(true);
    setLogoutError(undefined);
    try {
      const { error } = await supabase.auth.signOut({ scope: "local" });
      if (error) throw error;
      setSession(null);
      setLogoutConfirming(false);
      setSheet(null);
    } catch (error) {
      setLogoutError(error instanceof Error ? localizedError(error) : msg("account.pleaseCheckYourConnection"));
    } finally {
      logoutPending.current = false;
      setLogoutLoading(false);
    }
  };

  const requestDeletion = () => {
    setSheet(null);
    router.push("/delete-account");
  };
  if (session === undefined) {
    return (
      <Screen className="bg-white">
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primaryDark} />
          <Text style={styles.loadingText}>{msg("account.loadingYourAccount")}</Text>
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
            accessibilityLabel={msg("account.openAccountSettings")}
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
          <Text style={[styles.title, dark && styles.darkText]}>
            {msg("common.accountTitle")}</Text>
          <Text style={[styles.subtitle, dark && styles.darkSecondary]}>
            {msg("account.yourEverydayALittleSimpler")}</Text>
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
              accessibilityLabel={msg("account.tryLoadingYourAccountAgain")}
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
              <Text style={styles.retryText}>{msg("notifications.tryAgainUppercase")}</Text>
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
                  <Ionicons color={"#0B2A14"} name="sparkles" size={10} />
                  <Text style={styles.clubStatus}>{msg("account.ecoclubMemberUppercase")}</Text>
                </View>
              ) : null}
            </View>
            <AnimatedPressable
              accessibilityLabel={msg("account.editMyProfile")}
              onPress={() => router.push("/profile")}
              style={styles.editProfile}
            >
              <Ionicons color={"#FFFFFF"} name="create-outline" size={18} />
            </AnimatedPressable>
          </View>
        ) : (
          <View style={[styles.guestCard, dark && styles.darkSurface]}>
            <View style={styles.guestTopRow}>
              <View style={[styles.guestEmblem, dark && styles.darkControl]}>
                <Ionicons name="person-outline" size={24} color={dark ? "#DCE6D9" : "#294635"} />
              </View>
              <View style={styles.guestBadge}>
                <Text style={[styles.guestEyebrow, dark && styles.darkSecondary]}>{msg("account.yourSpaceYourStyleUppercase")}</Text>
              </View>
            </View>
            <Text style={[styles.guestTitle, dark && styles.darkText]}>{msg("account.welcomeHome").replace(/\n/g, " ")}</Text>
            <Text style={[styles.guestDescription, dark && styles.darkSecondary]}>
              {msg("account.yourOrdersFavoritesAndBenefitsAllInOnePlace")}</Text>
            <AnimatedPressable
              accessibilityRole="button"
              accessibilityLabel={msg("auth.signInText")}
              onPress={() =>
                router.push({
                  pathname: "/auth",
                  params: { mode: "login", returnTo: "account" },
                })
              }
              style={styles.loginButton}
            >
              <Text style={styles.loginButtonText}>{msg("auth.signInText")}</Text>
              <View style={styles.loginArrow}>
                <Ionicons color="#F6F5EF" name="arrow-forward" size={18} />
              </View>
            </AnimatedPressable>
            <AnimatedPressable
              accessibilityRole="button"
              accessibilityLabel={msg("auth.createAnAccount")}
              haptic={false}
              onPress={() =>
                router.push({
                  pathname: "/auth",
                  params: { mode: "signup", returnTo: "account" },
                })
              }
              style={styles.registerButton}
            >
              <Text style={[styles.registerPrompt, dark && styles.darkSecondary]}>{msg("account.newHere")}</Text>
              <View style={styles.registerLink}>
                <Text style={[styles.registerText, dark && styles.darkText]}>{msg("auth.createAnAccount")}</Text>
                <Ionicons name="chevron-forward" size={14} color={dark ? "#E4EDDE" : "#294635"} />
              </View>
            </AnimatedPressable>
          </View>
        )}

        <SectionTitle dark={dark} title={msg("account.atYourFingertips")} />
        <View style={[styles.services, dark && styles.darkSurface]}>
          <ServiceTile
            dark={dark}
            icon="cube-outline"
            onPress={() => requireAccount("/orders")}
            subtitle={msg("common.ordersSubtitle")}
            title={msg("common.orders")}
          />
          {wishlistEnabled ? (
            <ServiceTile
              dark={dark}
              icon="heart-outline"
              onPress={() => router.push("/wishlist")}
              subtitle={msg("account.findYourSavedItems")}
              title={msg("common.myFavorites")}
            />
          ) : null}
          <ServiceTile
            dark={dark}
            icon="location-outline"
            onPress={() => requireAccount("/addresses")}
            subtitle={msg("account.manageYourDeliveryAddresses")}
            title={msg("addresses.myAddresses")}
          />
          <ServiceTile
            dark={dark}
            icon="headset-outline"
            onPress={openSupport}
            subtitle={
              settings.checkout_contact_subtitle?.trim() ||
              msg("account.weReHereToHelp")
            }
            title={settings.checkout_contact_title?.trim() || msg("support.support")}
          />
          <ServiceTile
            dark={dark}
            icon="person-circle-outline"
            onPress={() => requireAccount("/profile")}
            subtitle={msg("account.photoNamePhoneAndSecurity")}
            title={msg("account.myProfile")}
          />
          <ServiceTile
            last
            dark={dark}
            icon="notifications-outline"
            onPress={() => router.push("/notifications")}
            subtitle={msg("account.viewYourOffersAndUpdates")}
            title={msg("account.myNotifications")}
          />
        </View>

        {clubEnabled ? (
          <AnimatedPressable
            accessibilityLabel={
              localizedContent(settings.app_club_cta_label?.trim()) || msg("account.discoverEcoclub")
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
                {localizedContent(settings.app_club_description?.trim()) ||
                  msg("account.benefitsDesignedForYou")}
              </Text>
            </View>
            <View style={styles.clubCta}>
              <Text style={styles.clubCtaText}>
                {localizedContent(settings.app_club_cta_label?.trim()) || msg("campaignHero.discover")}
              </Text>
              <Ionicons color={colors.text} name="arrow-forward" size={15} />
            </View>
          </AnimatedPressable>
        ) : null}

        <SectionTitle dark={dark} title={msg("common.preferences")} />
        <View style={[styles.list, dark && styles.darkSurface]}>
          <PreferenceRow
            dark={dark}
            icon="language-outline"
            label={msg("account.language")}
            onPress={() => setSheet("language")}
            value={languageLabel}
          />
          <View style={[styles.rowDivider, dark && styles.darkBorder]} />
          <PreferenceRow
            dark={dark}
            icon="contrast-outline"
            label={msg("common.appearance")}
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
                    {msg("common.notifications")}</Text>
                  <Text
                    style={[
                      styles.preferenceValue,
                      dark && styles.darkSecondary,
                    ]}
                  >
                    {notificationState === "denied"
                      ? msg("account.blockedInSettings")
                      : notificationState === "unsupported"
                        ? msg("account.unavailableOnThisDevice")
                        : notificationState === "enabled"
                          ? msg("account.enabled")
                          : msg("account.disabled")}
                  </Text>
                </View>
                {notificationSaving || notificationState === "loading" ? (
                  <ActivityIndicator color={colors.primaryDark} size="small" />
                ) : (
                  <Switch
                    accessibilityLabel={msg("account.enableNotifications")}
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
                  accessibilityLabel={msg("account.customizeNotifications")}
                  haptic={false}
                  onPress={() => { setPreferenceSaving(true); setSheet("notifications"); }}
                  style={{ minHeight: 44, alignItems: "center", justifyContent: "center", borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: dark ? "#303630" : colors.border }}
                >
                  <Text style={{ color: colors.primaryDark, fontFamily: typography.black, fontSize: 11, letterSpacing: 0.5 }}>{msg("account.customizeAlertsUppercase")}</Text>
                </AnimatedPressable>
              ) : null}
            </>
          ) : null}
        </View>

        <SectionTitle dark={dark} title={msg("account.helpInformationUppercase")} />
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
            label={msg("account.deliveryReturns")}
            onPress={() => openWebsitePage("/retours")}
          />
          <View style={[styles.rowDivider, dark && styles.darkBorder]} />
          <LinkRow
            dark={dark}
            icon="shield-checkmark-outline"
            label={msg("account.privacy")}
            onPress={() => openWebsitePage("/politique-confidentialite")}
          />
        </View>

        <Text style={[styles.version, dark && styles.darkSecondary]}>
          {msg("account.lEcomaxVersionUppercase")}{appVersion}
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
            accessibilityLabel={msg("scanner.close")}
            onPress={() => setSheet(null)}
            style={styles.sheetBackdrop}
          />
          <View
            accessibilityViewIsModal
            style={[
              styles.sheet,
              dark && styles.sheetDark,
              { maxHeight: Math.min(windowHeight * 0.9, windowHeight - insets.top - 12) },
            ]}
          >
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, dark && styles.darkText]}>
                {sheet === "language"
                  ? msg("account.language")
                  : sheet === "appearance"
                    ? msg("common.appearance")
                    : sheet === "notifications"
                      ? msg("common.notifications")
                    : msg("account.settings")}
              </Text>
              <AnimatedPressable
                accessibilityLabel={msg("scanner.close")}
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

            <ScrollView
              key={sheet}
              nativeID="account-settings-scroll"
              style={styles.sheetScroll}
              contentContainerStyle={[styles.sheetScrollContent, { paddingBottom: Math.max(insets.bottom, 16) + 12 }]}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
              bounces={false}
              nestedScrollEnabled
            >
            {sheet === "language" ? (
              <View style={styles.sheetOptions}>
                <SheetOption dark={dark} label={msg("account.deviceLanguage")} leading={msg("account.autoUppercase")}
                  selected={languageOverride === null}
                  onPress={() => { followPhoneLanguage(); setSheet(null); }} />
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
                    selected={languageOverride === option.value}
                  />
                ))}
              </View>
            ) : sheet === "appearance" ? (
              <View style={styles.sheetOptions}>
                <SheetOption
                  dark={dark}
                  label={msg("common.light")}
                  leading="☀"
                  onPress={() => {
                    setTheme("light");
                    setSheet(null);
                  }}
                  selected={theme === "light"}
                />
              </View>
            ) : sheet === "notifications" ? (
              <View style={styles.sheetOptions}>
                {([
                  ["marketing_enabled", msg("account.newsAndRecommendations")],
                  ["promotions", msg("account.promotionsAndOffers")],
                  ["new_products", msg("account.newProducts")],
                  ["loyalty", msg("account.clubAndLoyalty")],
                  ["price_drops", msg("account.priceDrops")],
                  ["back_in_stock", msg("account.backInStock")],
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
                <Text style={[styles.preferenceValue, dark && styles.darkSecondary, { paddingHorizontal: 4, lineHeight: 18 }]}>{msg("account.serviceAlertsAboutYourAccountAndOrdersRemainActiveToProvideEssential")}</Text>
              </View>
            ) : (
              <View style={styles.settingsList}>
                <Text style={[styles.settingsSectionLabel, dark && styles.darkSecondary]}>{msg("account.accountUppercase")}</Text>
                <View style={[styles.settingsGroup, dark && styles.darkSurface]}>
                  <SettingsRow dark={dark} icon="person-outline" label={session ? msg("account.editProfile") : msg("auth.signInText")} subtitle={msg("account.photoAndPersonalInformation")} onPress={() => { setSheet(null); requireAccount("/profile"); }} />
                  <SettingsRow dark={dark} icon="shield-checkmark-outline" label={msg("account.privacyAndSecurity")} subtitle={msg("account.passwordAndAccountProtection")} onPress={() => { setSheet(null); if (session) router.push("/profile"); else openWebsitePage("/politique-confidentialite"); }} />
                </View>
                <Text style={[styles.settingsSectionLabel, dark && styles.darkSecondary]}>{msg("common.preferences")}</Text>
                <View style={[styles.settingsGroup, dark && styles.darkSurface]}>
                  <SettingsRow dark={dark} icon="language-outline" label={msg("account.language")} subtitle={languageLabel} onPress={() => setSheet("language")} />
                  <SettingsRow dark={dark} icon="contrast-outline" label={msg("common.appearance")} subtitle={msg("account.lightDarkOrAutomatic")} onPress={() => setSheet("appearance")} />
                  <SettingsToggleRow
                    dark={dark}
                    enabled={hapticsEnabled}
                    hydrated={preferencesHydrated}
                    icon="phone-portrait-outline"
                    label={msg("account.vibrationHaptics")}
                    subtitle={msg("account.useVibrationFeedbackForInteractionsInsideTheApp")}
                    onChange={(enabled) => {
                      setHapticsEnabled(enabled);
                      if (enabled) void triggerSelectionHaptic();
                    }}
                  />
                  <SettingsRow dark={dark} icon="headset-outline" label={msg("support.support")} subtitle={msg("account.weReHereToHelp")} onPress={() => { setSheet(null); openSupport(); }} />
                </View>
                {session ? (
                  <View style={[styles.settingsGroup, styles.dangerGroup, dark && styles.darkSurface]}>
                    <SettingsRow
                      danger
                      dark={dark}
                      icon="log-out-outline"
                      label={logoutLoading ? msg("account.signingOut") : msg("common.signOut")}
                      subtitle={msg("account.signOutOnThisDevice")}
                      onPress={confirmLogout}
                    />
                    {logoutConfirming && (
                      <View style={styles.logoutConfirmation}>
                        <Text style={styles.logoutDescription}>{msg("account.yourGuestCartAndPreferencesWillStayOnThisDevice")}</Text>
                        {logoutError && <Text accessibilityRole="alert" style={styles.logoutError}>{msg("account.unableToSignOut")}: {logoutError}</Text>}
                        <View style={styles.logoutActions}>
                          <AnimatedPressable accessibilityRole="button" disabled={logoutLoading} onPress={() => { setLogoutConfirming(false); setLogoutError(undefined); }} style={styles.logoutCancel}>
                            <Text style={styles.logoutDescription}>{msg("addresses.cancel")}</Text>
                          </AnimatedPressable>
                          <AnimatedPressable accessibilityRole="button" accessibilityState={{ disabled: logoutLoading, busy: logoutLoading }} disabled={logoutLoading} onPress={() => void performLogout()} style={[styles.logoutSubmit, logoutLoading && { opacity: 0.6 }]}>
                            {logoutLoading && <ActivityIndicator size="small" color="#FFFFFF" />}
                            <Text style={styles.logoutSubmitText}>{logoutLoading ? msg("account.signingOut") : msg("common.signOut")}</Text>
                          </AnimatedPressable>
                        </View>
                      </View>
                    )}
                    <SettingsRow
                      danger
                      dark={dark}
                      icon="trash-outline"
                      label={msg("deleteAccount.deleteMyAccount")}
                      subtitle={msg("account.requestDeletionOfYourData")}
                      onPress={requestDeletion}
                    />
                  </View>
                ) : null}
              </View>
            )}
            </ScrollView>
          </View>
        </AppViewportOverlay>
      </Modal>
    </Screen>
  );
}

function SectionTitle({ title, dark }: { title: string; dark: boolean }) {
  useLocale();
  return (
    <View style={styles.sectionTitleRow}>
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
  last = false,
}: {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  dark: boolean;
  last?: boolean;
}) {
  useLocale();
  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}`}
      onPress={onPress}
      pressedScale={0.99}
      style={styles.serviceTile}
    >
      <View style={[styles.serviceIcon, dark && styles.serviceIconDark]}>
        <Ionicons color={dark ? "#C3D5BC" : "#49624C"} name={icon} size={21} />
      </View>
      <View style={[
        styles.serviceBody,
        dark && styles.serviceBodyDark,
        last && styles.serviceBodyLast,
      ]}>
        <View style={styles.serviceCopy}>
          <Text style={[styles.serviceTitle, dark && styles.darkText]}>
            {title}
          </Text>
          <Text style={[styles.serviceSubtitle, dark && styles.darkSecondary]}>
            {subtitle}
          </Text>
        </View>
        <View style={styles.serviceArrow}>
          <Ionicons
            color={dark ? "#89998B" : "#969D91"}
            name="chevron-forward"
            size={16}
          />
        </View>
      </View>
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
  useLocale();
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
  useLocale();
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
  useLocale();
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
  useLocale();
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
  useLocale();
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
          accessibilityHint={msg("account.turnsAllVibrationFeedbackGeneratedByLEcomaxOnOrOff")}
          accessibilityLabel={msg("account.vibrationHaptics")}
          accessibilityRole="switch"
          accessibilityState={{ checked: enabled }}
          ios_backgroundColor="#D5D9D6"
          onValueChange={onChange}
          thumbColor={colors.white}
          trackColor={{ false: "#D5D9D6", true: colors.primary }}
          value={enabled}
        />
      ) : (
        <ActivityIndicator accessibilityLabel={msg("account.loadingHapticsPreference")} color={colors.primaryDark} size="small" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  logoutConfirmation: { paddingHorizontal: 12, paddingBottom: 18, gap: 12 },
  logoutDescription: { fontFamily: typography.medium, fontSize: 12, lineHeight: 18, color: "#5B605B" },
  logoutError: { fontSize: 12, lineHeight: 18, color: "#B42318" },
  logoutActions: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  logoutCancel: { minHeight: 44, paddingHorizontal: 16, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "#F0F2ED" },
  logoutSubmit: { minHeight: 44, paddingHorizontal: 16, borderRadius: 12, flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", backgroundColor: "#B42318" },
  logoutSubmitText: { fontFamily: typography.semibold, fontSize: 12, color: "#FFFFFF" },
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
  heading: { paddingBottom: 28, paddingTop: 20 },
  title: {
    color: "#202B24", fontFamily: typography.medium,
    fontSize: 29, lineHeight: 37, letterSpacing: -1,
  },
  subtitle: {
    marginTop: 7, color: "#72766F", fontFamily: typography.regular,
    fontSize: 13, lineHeight: 21,
  },
  guestCard: {
    paddingHorizontal: 24, paddingTop: 28, paddingBottom: 20,
    borderRadius: 16, borderWidth: 1, borderColor: "#E6E5DD",
    backgroundColor: "#FDFCF8",
    boxShadow: "0px 4px 20px rgba(30, 44, 34, 0.04)",
  },
  guestTopRow: { gap: 20, alignItems: "flex-start" },
  guestBadge: { flexShrink: 1 },
  guestEmblem: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "#EEF0E7", borderWidth: 1, borderColor: "#E3E7DA",
  },
  guestEyebrow: {
    color: "#727965", fontFamily: typography.medium,
    fontSize: 8, lineHeight: 14, letterSpacing: 1.6,
  },
  guestTitle: {
    marginTop: 10, color: "#243A2C", fontFamily: typography.medium,
    fontSize: 27, lineHeight: 35, letterSpacing: -0.9,
  },
  guestDescription: {
    maxWidth: 285, marginTop: 10, color: "#74786F",
    fontFamily: typography.regular, fontSize: 13, lineHeight: 22,
  },
  loginButton: {
    minHeight: 52, marginTop: 28, paddingHorizontal: 19,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    borderRadius: 8, backgroundColor: "#243F2F",
  },
  loginButtonText: {
    color: "#F6F5EF", fontFamily: typography.medium, fontSize: 13, letterSpacing: 0.2,
  },
  loginArrow: { width: 26, height: 26, alignItems: "center", justifyContent: "center" },
  registerButton: {
    minHeight: 48, marginTop: 10, flexDirection: "row", flexWrap: "wrap",
    columnGap: 6, rowGap: 4, alignItems: "center", justifyContent: "center",
  },
  registerText: { color: "#294635", fontFamily: typography.semibold, fontSize: 11 },
  registerPrompt: { color: "#767A72", fontFamily: typography.regular, fontSize: 11 },
  registerLink: { flexDirection: "row", alignItems: "center", gap: 3 },
  memberCard: {
    minHeight: 116,
    paddingHorizontal: 18,
    paddingVertical: 18,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 0,
    borderRadius: 24,
    backgroundColor: "#0F1F16",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  memberAccent: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: 0,
    backgroundColor: "transparent",
  },
  memberCardDark: {
    borderColor: "#1A2A1F",
    backgroundColor: "#0F1F16",
    shadowOpacity: 0.18,
    elevation: 6,
  },
  avatar: {
    overflow: "hidden",
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 32,
    borderWidth: 2.5,
    borderColor: "rgba(255,255,255,0.9)",
    backgroundColor: "#1A3324",
  },
  avatarText: {
    color: colors.white,
    fontFamily: typography.black,
    fontSize: 17,
  },
  memberCopy: { minWidth: 0, flex: 1, marginLeft: 14 },
  memberName: {
    color: colors.white,
    fontFamily: typography.black,
    fontSize: 18,
    letterSpacing: -0.4,
    lineHeight: 20,
  },
  memberEmail: {
    marginTop: 2,
    color: "rgba(255,255,255,0.62)",
    fontFamily: typography.regular,
    fontSize: 12.5,
    lineHeight: 15,
  },
  clubBadge: {
    alignSelf: "flex-start",
    minHeight: 24,
    marginTop: 10,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    backgroundColor: "#B8F28A",
    borderWidth: 0,
  },
  clubStatus: {
    color: "#0B2A14",
    fontFamily: typography.black,
    fontSize: 8.5,
    letterSpacing: 0.8,
  },
  editProfile: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  sectionTitleRow: {
    marginBottom: 13,
    marginTop: 30,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    color: "#364438",
    fontFamily: typography.semibold,
    fontSize: 14,
    lineHeight: 21,
    letterSpacing: -0.2,
  },
  services: {
    borderWidth: 1,
    borderColor: "#E6E5DD",
    borderRadius: 16,
    backgroundColor: "#FDFCF8",
    overflow: "hidden",
  },
  serviceTile: {
    minHeight: 78,
    paddingLeft: 18,
    paddingRight: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  serviceIcon: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#EFF1E9",
  },
  serviceIconDark: { backgroundColor: "#29332B" },
  serviceBody: {
    flex: 1,
    minWidth: 0,
    minHeight: 78,
    paddingVertical: 17,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E2E5DC",
  },
  serviceBodyDark: { borderBottomColor: "#343D35" },
  serviceBodyLast: { borderBottomWidth: 0 },
  serviceCopy: { flex: 1, minWidth: 0 },
  serviceArrow: {
    width: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  serviceTitle: {
    color: "#283A2D",
    fontFamily: typography.semibold,
    fontSize: 13,
    lineHeight: 19,
    letterSpacing: -0.15,
  },
  serviceSubtitle: {
    marginTop: 3,
    color: "#747B70",
    fontFamily: typography.regular,
    fontSize: 11,
    lineHeight: 17,
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
    width: "100%",
    flexShrink: 1,
    overflow: "hidden",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: colors.white,
  },
  sheetDark: { backgroundColor: colors.dark },
  sheetHandle: {
    flexShrink: 0,
    width: 42,
    height: 4,
    marginTop: 10,
    alignSelf: "center",
    borderRadius: 2,
    backgroundColor: "#CCD1CD",
  },
  sheetHeader: {
    flexShrink: 0,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(125,140,128,0.18)",
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
  // A single bounded sheet lets the scroll area use all remaining header space.
  sheetScroll: { flexGrow: 0, flexShrink: 1, minHeight: 0, overflowY: "auto" },
  sheetScrollContent: { paddingTop: 16, paddingHorizontal: 20 },
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
