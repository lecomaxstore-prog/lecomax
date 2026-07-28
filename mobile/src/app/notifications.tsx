import Ionicons from "@expo/vector-icons/Ionicons";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useEffect, useMemo } from "react";
import { ActivityIndicator, Linking, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { AnimatedPressable } from "@/components/animated-pressable";
import { BrandLogo } from "@/components/brand-logo";
import { EmptyState } from "@/components/empty-state";
import { Screen } from "@/components/screen";
import { openMobileNotificationLink } from "@/lib/mobile-notification-navigation";
import { getMobileNotificationInbox, markMobileNotificationsRead } from "@/services/mobile-notifications";
import { useNotificationStore } from "@/stores/notifications";

function relativeDate(value: string) {
  const date = new Date(value);
  const minutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60_000));
  if (minutes < 1) return "À l’instant";
  if (minutes < 60) return `Il y a ${minutes} min`;
  if (minutes < 1_440) return `Il y a ${Math.round(minutes / 60)} h`;
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

function NotificationsLoading() {
  return (
    <View accessibilityLabel="Chargement des notifications" accessibilityRole="progressbar">
      <View className="mb-5 flex-row items-center rounded-2xl border border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900">
        <ActivityIndicator color="#168526" size="small" />
        <View className="ml-3">
          <Text className="text-sm font-black text-ink dark:text-white">Mise à jour de votre espace</Text>
          <Text className="mt-0.5 text-xs text-muted">Vos dernières actualités arrivent…</Text>
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

function NotificationsError({ onRetry, retrying }: { onRetry: () => void; retrying: boolean }) {
  return (
    <View className="overflow-hidden rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <View className="flex-row items-start">
        <View className="h-14 w-14 items-center justify-center rounded-2xl bg-[#E8F8EE] dark:bg-green/10">
          <Ionicons color="#168526" name="cloud-offline-outline" size={27} />
        </View>
        <View className="ml-4 min-w-0 flex-1">
          <Text className="text-lg font-black text-ink dark:text-white">Connexion interrompue</Text>
          <Text className="mt-1 text-sm leading-5 text-muted">Impossible d’actualiser vos notifications pour le moment. Vos messages restent disponibles dès le retour du réseau.</Text>
        </View>
      </View>
      <View className="mt-5 flex-row items-center justify-between rounded-2xl bg-neutral-100 px-4 py-3 dark:bg-neutral-800">
        <View className="flex-row items-center">
          <View className="h-2 w-2 rounded-full bg-[#E0A11A]" />
          <Text className="ml-2 text-[9px] font-black uppercase tracking-wider text-muted">Service temporairement inaccessible</Text>
        </View>
        <Ionicons color="#8B918C" name="wifi-outline" size={16} />
      </View>
      <AnimatedPressable
        accessibilityLabel="Réessayer de charger les notifications"
        accessibilityState={{ busy: retrying, disabled: retrying }}
        disabled={retrying}
        onPress={onRetry}
        style={[styles.retryButton, retrying && styles.retryButtonBusy]}
      >
        {retrying ? <ActivityIndicator color="#3ECF4C" size="small" /> : <Ionicons color="#3ECF4C" name="refresh" size={18} />}
        <Text style={styles.retryLabel}>{retrying ? "RECONNEXION…" : "RÉESSAYER"}</Text>
      </AnimatedPressable>
      <AnimatedPressable accessibilityLabel="Retourner à l’accueil" onPress={() => router.replace("/")} style={styles.homeButton}>
        <Ionicons color="#59605B" name="home-outline" size={16} />
        <Text style={styles.homeLabel}>Retourner à l’accueil</Text>
      </AnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
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
          <AnimatedPressable accessibilityLabel="Retour" onPress={() => router.back()} className="h-11 w-11 items-center justify-center rounded-full border border-neutral-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
            <Ionicons name="arrow-back" size={20} color="#303531" />
          </AnimatedPressable>
          <View className="h-11 flex-1 items-center justify-center">
            <BrandLogo header animated />
          </View>
          <AnimatedPressable accessibilityLabel="Ouvrir les réglages de notifications" onPress={() => void Linking.openSettings()} className="h-11 w-11 items-center justify-center rounded-full border border-neutral-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
            <Ionicons name="options-outline" size={19} color="#303531" />
          </AnimatedPressable>
        </View>

        <View className="mt-4 flex-row items-end justify-between px-1">
          <View className="min-w-0 flex-1">
            <View className="flex-row items-center">
              <View className="h-1.5 w-1.5 rounded-full bg-green" />
              <Text className="ml-2 text-[9px] font-black uppercase tracking-[1.8px] text-green">Centre d’actualités</Text>
            </View>
            <Text accessibilityRole="header" className="mt-1 text-[30px] font-black tracking-tight text-ink dark:text-white">Notifications</Text>
          </View>
          {!inbox.isPending && !inbox.isError ? (
            <View className="mb-1 rounded-full border border-neutral-200 bg-neutral-100 px-3 py-1.5 dark:border-neutral-700 dark:bg-neutral-800">
              <Text className="text-[10px] font-black text-muted">
                {items.length ? `${items.length} message${items.length > 1 ? "s" : ""}` : "À JOUR"}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={inbox.isRefetching} onRefresh={() => void inbox.refetch()} tintColor="#168526" />}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40, paddingTop: 16 }}
      >
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
                    {!item.read ? <View accessibilityLabel="Non lue" className="ml-2 h-2 w-2 rounded-full bg-green" /> : null}
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
          <EmptyState icon="notifications-outline" title="Vous êtes à jour" message="Les offres, nouveautés et informations importantes apparaîtront ici." />
        )}
      </ScrollView>
    </Screen>
  );
}
