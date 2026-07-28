import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Application from "expo-application";
import * as Linking from "expo-linking";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Modal, Platform, Pressable, Text, View } from "react-native";
import {
  shouldPresentUpdate,
  trustedUpdateUrl,
  type AndroidReleaseMetadata,
  type UpdateDismissal,
} from "@/lib/app-update";
import { runtimeConfig } from "@/lib/runtime-config";
import { getLatestAndroidRelease } from "@/services/app-releases";

const DISMISSAL_KEY = "LECOMAX_ANDROID_UPDATE_DISMISSAL";

function megabytes(value: number) {
  return `${(value / 1024 / 1024).toFixed(1)} Mo`;
}

export function AppUpdateGate() {
  const [release, setRelease] = useState<AndroidReleaseMetadata | null>(null);
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState("");
  const checked = useRef(false);
  const dismissedThisSession = useRef(new Set<number>());

  useEffect(() => {
    if (Platform.OS !== "android" || checked.current) return;
    checked.current = true;
    let active = true;
    Promise.resolve().then(async () => {
      try {
        const latest = await getLatestAndroidRelease();
        const installedBuild = Number(Application.nativeBuildVersion ?? "0");
        const stored = await AsyncStorage.getItem(DISMISSAL_KEY);
        const dismissal = stored ? JSON.parse(stored) as UpdateDismissal : null;
        if (
          active &&
          !dismissedThisSession.current.has(latest.versionCode) &&
          shouldPresentUpdate(installedBuild, latest, dismissal)
        ) {
          setRelease(latest);
        }
      } catch {
        // Update checks must never prevent customers from using the application.
      }
    });
    return () => { active = false; };
  }, []);

  if (!release) return null;

  async function later() {
    const currentRelease = release;
    if (!currentRelease || currentRelease.required) return;
    dismissedThisSession.current.add(currentRelease.versionCode);
    await AsyncStorage.setItem(DISMISSAL_KEY, JSON.stringify({
      versionCode: currentRelease.versionCode,
      dismissedAt: Date.now(),
    } satisfies UpdateDismissal));
    setRelease(null);
  }

  async function update() {
    const currentRelease = release;
    if (!currentRelease) return;
    const url = trustedUpdateUrl(currentRelease.downloadUrl, runtimeConfig.apiUrl);
    if (!url) {
      setError("Le lien officiel de mise à jour n’a pas pu être vérifié.");
      return;
    }
    setOpening(true);
    setError("");
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) throw new Error("unsupported");
      await Linking.openURL(url);
    } catch {
      setError("Impossible d’ouvrir le téléchargement. Vérifiez votre connexion.");
    } finally {
      setOpening(false);
    }
  }

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => { if (!release.required) void later(); }}
    >
      <View className="flex-1 items-center justify-center bg-black/65 px-5">
        <View accessibilityViewIsModal className="w-full max-w-lg overflow-hidden rounded-[28px] bg-white">
          <View className="bg-ink px-6 pb-6 pt-7">
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-lime">
              <Text className="text-xl font-black text-ink">↓</Text>
            </View>
            <Text className="mt-5 text-[11px] font-black uppercase tracking-[2px] text-lime">
              {release.required ? "Mise à jour requise" : "Nouvelle version disponible"}
            </Text>
            <Text accessibilityRole="header" className="mt-2 text-3xl font-black tracking-tight text-white">
              L’ecomax {release.versionName}
            </Text>
            <Text className="mt-2 text-sm leading-6 text-white/60">
              {megabytes(release.fileSize)} · Android {release.minimumAndroidVersion}+
            </Text>
          </View>
          <View className="p-6">
            {release.releaseNotes.length > 0 && (
              <View>
                <Text className="text-xs font-black uppercase tracking-wider text-muted">Nouveautés</Text>
                <View className="mt-3 gap-2">
                  {release.releaseNotes.map((note) => (
                    <View key={note} className="flex-row gap-3">
                      <Text className="font-black text-success">✓</Text>
                      <Text className="flex-1 text-sm leading-5 text-ink">{note}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
            <Text className="mt-5 text-xs leading-5 text-muted">
              Le téléchargement s’ouvre uniquement sur le site officiel lecomax.com. Android vous demandera toujours de confirmer l’installation.
            </Text>
            {error ? <Text accessibilityLiveRegion="polite" className="mt-3 text-sm font-bold text-danger">{error}</Text> : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Mettre à jour vers L’ecomax ${release.versionName}`}
              disabled={opening}
              onPress={() => void update()}
              className="mt-6 min-h-14 items-center justify-center rounded-full bg-ink px-6 disabled:opacity-60"
            >
              {opening ? <ActivityIndicator color="#ffffff" /> : <Text className="font-black text-white">METTRE À JOUR</Text>}
            </Pressable>
            {!release.required && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Reporter cette mise à jour"
                onPress={() => void later()}
                className="mt-2 min-h-12 items-center justify-center"
              >
                <Text className="text-sm font-bold text-muted">Plus tard</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}
