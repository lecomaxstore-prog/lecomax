import { currentLocale, msg, useLocale } from "@/i18n";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useEffect, useMemo } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { AnimatedPressable } from "@/components/animated-pressable";
import { BrandLogo } from "@/components/brand-logo";
import { NotificationOptIn } from "@/components/notification-opt-in";
import Animated, { FadeInDown, ReduceMotion, ZoomIn } from "react-native-reanimated";
import { Screen } from "@/components/screen";
import { openMobileNotificationLink } from "@/lib/mobile-notification-navigation";
import { getMobileNotificationInbox, markMobileNotificationsRead } from "@/services/mobile-notifications";
import { useNotificationStore } from "@/stores/notifications";

function relativeDate(value: string) {
  const date = new Date(value);
  const minutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60_000));
  if (minutes < 1) return msg("notifications.justNow");
  if (minutes < 60) return msg("notifications.minutesAgo", { count: minutes });
  if (minutes < 1_440) return msg("notifications.hoursAgo", { count: Math.round(minutes / 60) });
  return date.toLocaleDateString(currentLocale(), { day: "2-digit", month: "short" });
}

function NotificationsLoading() {
  useLocale();
  return (
    <View accessibilityLabel={msg("notifications.loadingNotifications")} accessibilityRole="progressbar">
      <View className="mb-5 flex-row items-center rounded-2xl border border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900">
        <ActivityIndicator color="#168526" size="small" />
        <View className="ml-3">
          <Text className="text-sm font-black text-ink dark:text-white">{msg("notifications.updatingYourFeed")}</Text>
          <Text className="mt-0.5 text-xs text-muted">{msg("notifications.yourLatestUpdatesAreOnTheirWay")}</Text>
        </View>
      </View>
      {[0, 1, 2].map((item) => (
        <View key={item} className="mb-3 flex-row rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <View className="h-12 w-12 rounded-xl bg-neutral-200 dark:bg-neutral-800" />
          <View className="ml-4 flex-1 py-1">
            <View className="h-3.5 w-3/5 rounded-full bg-neutral-200 dark:bg-neutral-800" />
            <View className="mt-3 h-2.5 w-full rounded-full bg-neutral-100 dark:bg-neutral-800" />
            <View className="mt-2 h-2.5 w-4/5 rounded-full bg-neutral-100 dark:bg-neutral-800" />
            <View className="mt-4 h-2 w-16 rounded-full bg-neutral-100 dark:bg-neutral-800" />
          </View>
        </View>
      ))}
    </View>
  );
}

function NotificationsEmpty() {
  useLocale();
  return (
    <Animated.View entering={FadeInDown.duration(650).reduceMotion(ReduceMotion.System)} style={styles.emptyContainer}>
      <View className="overflow-hidden rounded-[28px] border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900" style={styles.emptyCard}>
        <View pointerEvents="none" style={styles.illustration} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Animated.View entering={ZoomIn.delay(180).duration(650).reduceMotion(ReduceMotion.System)} style={styles.illustrationImage}>
            <Image
              source={require("../../assets/images/illustrations/notifications-caught-up.png")}
              style={styles.illustrationImage}
              contentFit="contain"
              accessible={false}
            />
          </Animated.View>
        </View>
        <Text accessibilityRole="header" className="text-ink dark:text-white" style={styles.emptyTitle}>{msg("notifications.youReAllCaughtUp")}</Text>
        <Text className="text-muted dark:text-neutral-400" style={styles.emptyDescription}>{msg("notifications.offersNewArrivalsAndImportantInformationWillAppearHere")}</Text>
        <AnimatedPressable accessibilityRole="button" onPress={() => router.push("/catalog")} style={styles.exploreButton}>
          <Text style={styles.exploreLabel}>{msg("common.exploreShop")}</Text>
          <View style={styles.exploreArrow}><Ionicons name="arrow-forward" size={18} color="#FFFFFF" /></View>
        </AnimatedPressable>
      </View>
      <View style={styles.updatesInfo}>
        <Text accessibilityRole="header" className="text-ink dark:text-white" style={styles.infoHeading}>{msg("notifications.whatToExpect")}</Text>
        {([
          ["pricetag-outline", "notifications.offersAndNewArrivals", "notifications.promotionsNewProductsAndLEcomaxBenefits"],
          ["cube-outline", "notifications.ordersAndAccount", "notifications.orderTrackingAndImportantAccountInformation"],
        ] as const).map(([icon, title, description]) => (
          <View key={title} className="border border-[#E4EBE6] bg-white dark:border-neutral-800 dark:bg-neutral-900" style={styles.infoRow}>
            <View className="bg-[#EDF5EF] dark:bg-[#243D2E]" style={styles.infoIcon} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"><Ionicons name={icon} size={22} color="#4D8060" /></View>
            <View style={styles.infoCopy}>
              <Text className="text-ink dark:text-neutral-200" style={styles.infoTitle}>{msg(title)}</Text>
              <Text className="text-[#66736A] dark:text-neutral-400" style={styles.infoDescription}>{msg(description)}</Text>
            </View>
          </View>
        ))}
      </View>
    </Animated.View>
  );
}

function NotificationsError({ onRetry, retrying }: { onRetry: () => void; retrying: boolean }) {
  useLocale();
  return (
    <View className="overflow-hidden rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <View className="flex-row items-start">
        <View className="h-14 w-14 items-center justify-center rounded-2xl bg-[#E8F8EE] dark:bg-green/10">
          <Ionicons color="#168526" name="cloud-offline-outline" size={27} />
        </View>
        <View className="ml-4 min-w-0 flex-1">
          <Text className="text-lg font-black text-ink dark:text-white">{msg("notifications.connectionInterrupted")}</Text>
          <Text className="mt-1 text-sm leading-5 text-muted">{msg("notifications.weCannotRefreshYourNotificationsRightNowYourMessagesWillBeAvailable")}</Text>
        </View>
      </View>
      <View className="mt-5 flex-row items-center justify-between rounded-2xl bg-neutral-100 px-4 py-3 dark:bg-neutral-800">
        <View className="flex-row items-center">
          <View className="h-2 w-2 rounded-full bg-[#E0A11A]" />
          <Text className="ml-2 text-[9px] font-black uppercase tracking-wider text-muted">{msg("notifications.serviceTemporarilyUnavailable")}</Text>
        </View>
        <Ionicons color="#8B918C" name="wifi-outline" size={16} />
      </View>
      <AnimatedPressable
        accessibilityLabel={msg("notifications.tryLoadingNotificationsAgain")}
        accessibilityState={{ busy: retrying, disabled: retrying }}
        disabled={retrying}
        onPress={onRetry}
        style={[styles.retryButton, retrying && styles.retryButtonBusy]}
      >
        {retrying ? <ActivityIndicator color="#3ECF4C" size="small" /> : <Ionicons color="#3ECF4C" name="refresh" size={18} />}
        <Text style={styles.retryLabel}>{retrying ? "RECONNEXION…" : msg("notifications.tryAgainUppercase")}</Text>
      </AnimatedPressable>
      <AnimatedPressable accessibilityLabel={msg("notifications.returnToHome")} onPress={() => router.replace("/")} style={styles.homeButton}>
        <Ionicons color="#59605B" name="home-outline" size={16} />
        <Text style={styles.homeLabel}>{msg("notifications.returnToHome")}</Text>
      </AnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyContainer: { width: "100%", maxWidth: 520, alignSelf: "center" },
  emptyCard: { alignItems: "center", paddingHorizontal: 24, paddingTop: 24, paddingBottom: 28 },
  illustration: { width: 220, height: 196, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  illustrationImage: { width: 220, height: 220 },
  emptyTitle: { fontFamily: "Inter_700Bold", fontSize: 23, lineHeight: 30, letterSpacing: -0.7, textAlign: "center" },
  emptyDescription: { maxWidth: 290, fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 22, textAlign: "center", marginTop: 10 },
  exploreButton: { marginTop: 26, minHeight: 54, width: "100%", maxWidth: 290, borderRadius: 27, backgroundColor: "#193D2B", paddingLeft: 24, paddingRight: 8, paddingVertical: 8, flexDirection: "row", gap: 16, alignItems: "center", justifyContent: "space-between" },
  exploreLabel: { flexShrink: 1, fontFamily: "Inter_600SemiBold", fontSize: 14, color: "#FFFFFF" },
  exploreArrow: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#31533F", alignItems: "center", justifyContent: "center" },
  updatesInfo: { paddingTop: 26, gap: 10 },
  infoHeading: { fontFamily: "Inter_600SemiBold", fontSize: 15, lineHeight: 22, letterSpacing: -0.3, marginBottom: 4, paddingHorizontal: 4 },
  infoRow: { flexDirection: "row", alignItems: "flex-start", gap: 14, padding: 16, borderRadius: 20 },
  infoIcon: { width: 44, height: 44, flexShrink: 0, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  infoCopy: { flex: 1, minWidth: 0, paddingTop: 1 },
  infoTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14, lineHeight: 20, letterSpacing: -0.2 },
  infoDescription: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 20, marginTop: 4 },
  retryButton: {
    width: "100%",
    minHeight: 52,
    marginTop: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: "#0B0B0B",
    shadowColor: "#0B0B0B",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 3,
  },
  retryButtonBusy: { opacity: 0.72 },
  retryLabel: {
    marginLeft: 9,
    color: "#FFFFFF",
    fontFamily: "Inter_900Black",
    fontSize: 11,
    letterSpacing: 0.7,
  },
  homeButton: {
    minHeight: 44,
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  homeLabel: {
    color: "#59605B",
    fontFamily: "Inter_700Bold",
    fontSize: 11,
  },
});

export default function NotificationsScreen() {
  useLocale();
  const markAllRead = useNotificationStore((state) => state.markAllRead);
  const inbox = useQuery({
    queryKey: ["mobile-notifications"],
    queryFn: getMobileNotificationInbox,
    staleTime: 30_000,
  });
  const items = useMemo(() => inbox.data?.items ?? [], [inbox.data?.items]);

  useEffect(() => {
    if (!items.length) return;
    markAllRead();
    const unreadIds = items.filter((item) => !item.read).map((item) => item.id);
    if (unreadIds.length) void markMobileNotificationsRead(unreadIds).catch(() => {});
  }, [items, markAllRead]);

  return (
    <Screen>
      <View className="border-b border-neutral-200 bg-white px-4 pb-4 pt-3 dark:border-neutral-800 dark:bg-ink">
        <View className="flex-row items-center justify-between">
          <AnimatedPressable accessibilityLabel={msg("addresses.back")} onPress={() => router.back()} className="h-11 w-11 items-center justify-center rounded-full border border-neutral-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
            <Ionicons name="arrow-back" size={20} color="#303531" />
          </AnimatedPressable>
          <View className="h-11 flex-1 items-center justify-center">
            <BrandLogo header animated />
          </View>
          <AnimatedPressable accessibilityLabel={msg("notifications.openNotificationSettings")} onPress={() => router.push("/account")} className="h-11 w-11 items-center justify-center rounded-full border border-neutral-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
            <Ionicons name="options-outline" size={19} color="#303531" />
          </AnimatedPressable>
        </View>

        <View className="mt-4 flex-row items-end justify-between px-1">
          <View className="min-w-0 flex-1">
            <View className="flex-row items-center">
              <View className="h-1.5 w-1.5 rounded-full bg-green" />
              <Text className="ml-2 text-[9px] font-black uppercase tracking-[1.8px] text-green">{msg("notifications.updates")}</Text>
            </View>
            <Text accessibilityRole="header" className="mt-1 text-[28px] font-bold tracking-tight text-ink dark:text-white">{msg("common.notifications")}</Text>
          </View>
          {!inbox.isPending && !inbox.isError ? (
            <View className="mb-1 ml-2 flex-row items-center gap-1 rounded-full bg-[#EAF5EC] px-2.5 py-1.5 dark:bg-neutral-800">
              {!items.length ? <Ionicons name="checkmark" size={12} color="#39804B" /> : null}
              <Text className="text-[9px] font-bold text-[#39804B] dark:text-green">
                {items.length ? msg("counts.messages", { count: items.length }) : msg("notifications.upToDateUppercase")}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={inbox.isRefetching} onRefresh={() => void inbox.refetch()} tintColor="#168526" />}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, paddingTop: 24 }}
      >
        <NotificationOptIn />
        {inbox.isPending ? (
          <NotificationsLoading />
        ) : inbox.isError ? (
          <NotificationsError retrying={inbox.isRefetching} onRetry={() => void inbox.refetch()} />
        ) : items.length ? (
          items.map((item) => (
            <AnimatedPressable
              key={item.id}
              accessibilityLabel={`${item.title}. ${item.body}`}
              onPress={() => openMobileNotificationLink(item.deepLink)}
              className="mb-3 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
            >
              {item.imageUrl ? <Image source={{ uri: item.imageUrl }} contentFit="cover" style={{ width: "100%", height: 150 }} transition={180} /> : null}
              <View className="flex-row p-4">
                <View className="h-12 w-12 items-center justify-center rounded-xl bg-ink"><Ionicons name="notifications-outline" size={21} color="#3ECF4C" /></View>
                <View className="ml-4 min-w-0 flex-1">
                  <View className="flex-row items-center">
                    <Text className="flex-1 font-black text-ink dark:text-white">{item.title}</Text>
                    {!item.read ? <View accessibilityLabel={msg("notifications.unread")} className="ml-2 h-2 w-2 rounded-full bg-green" /> : null}
                  </View>
                  <Text className="mt-1 text-sm leading-5 text-muted">{item.body}</Text>
                  <View className="mt-3 flex-row items-center justify-between">
                    <Text className="text-[10px] font-bold uppercase tracking-wider text-muted">{relativeDate(item.publishedAt)}</Text>
                    <View className="h-7 w-7 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
                      <Ionicons name="arrow-forward" size={15} color="#59605B" />
                    </View>
                  </View>
                </View>
              </View>
            </AnimatedPressable>
          ))
        ) : (
          <NotificationsEmpty />
        )}
      </ScrollView>
    </Screen>
  );
}
