import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, Platform, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { useAppOpening } from "@/stores/app-opening";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "@expo/vector-icons/Ionicons";
import { AnimatedPressable } from "@/components/animated-pressable";
import { typography } from "@/constants/theme";

const source = require("../../assets/videos/banner-intro.mp4");

export function LaunchVideo() {
  const opening = useAppOpening((state) => state.opening);
  const finished = useAppOpening((state) => state.finished);
  return finished ? null : <OpeningVideo key={opening} />;
}

function OpeningVideo() {
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  const [needsPlay, setNeedsPlay] = useState(false);
  const [progress, setProgress] = useState(0);
  const mounted = useRef(true);
  const { height } = useWindowDimensions();
  const compact = height < 650;
  const finish = useAppOpening((state) => state.finish);
  const player = useVideoPlayer(source, (instance) => {
    instance.loop = false;
    instance.muted = false;
    instance.volume = 1;
    instance.audioMixingMode = "auto";
    instance.timeUpdateEventInterval = 0.25;
  });

  const play = useCallback(() => {
    if (Platform.OS !== "web") { player.play(); return; }
    // Keep the soundtrack on. If autoplay is blocked, wait for a real tap
    // instead of silently playing the film without its audio.
    const video = document.querySelector<HTMLVideoElement>('[data-testid="launch-video-intro"] video');
    if (!video) return;
    video.muted = false;
    video.volume = 1;
    void video.play().then(() => {
      if (mounted.current) setNeedsPlay(false);
    }).catch((error: unknown) => {
      if (!mounted.current) return;
      if (error instanceof DOMException && error.name === "NotAllowedError") {
        setNeedsPlay(true);
      } else if (!(error instanceof DOMException && error.name === "AbortError")) {
        finish();
      }
    });
  }, [finish, player]);

  useEffect(() => {
    const ended = player.addListener("playToEnd", finish);
    const time = player.addListener("timeUpdate", ({ currentTime }) => {
      if (player.duration > 0) setProgress(Math.min(1, currentTime / player.duration));
    });
    const status = player.addListener("statusChange", ({ status }) => {
      if (status === "error") finish();
    });
    if (player.status === "error") finish();
    return () => { ended.remove(); status.remove(); time.remove(); };
  }, [finish, player]);

  useEffect(() => {
    mounted.current = true;
    play();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active") player.pause();
      else play();
    });
    return () => { mounted.current = false; subscription.remove(); player.pause(); };
  }, [player, play]);

  useEffect(() => {
    if (visible || needsPlay) return;
    // A blocked browser waits for the viewer; only loading has a timeout.
    const timeout = setTimeout(finish, 15_000);
    return () => clearTimeout(timeout);
  }, [finish, visible, needsPlay]);

  return (
    <View testID="launch-video-intro" style={styles.screen}>
      <StatusBar style="light" />
      <LinearGradient colors={["#214935", "#10271C", "#080E0B"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <Text style={styles.brand}>L’ECOMAX</Text>
        <AnimatedPressable accessibilityRole="button" accessibilityLabel="Passer l’introduction" onPress={finish} style={styles.skip}><Text style={styles.skipText}>Passer</Text><Ionicons name="arrow-forward" size={16} color="#D5E0D6" /></AnimatedPressable>
      </View>
      <View style={[styles.stage, compact && { gap: 12 }]}>
      <View style={styles.welcome}><View style={styles.welcomeLine} /><Text style={styles.eyebrow}>BIENVENUE CHEZ VOUS</Text><View style={styles.welcomeLine} /></View>
      <Text style={[styles.title, compact && { fontSize: 28, lineHeight: 32 }]}>Le style. Le choix.{"\n"}<Text style={styles.accent}>Vous.</Text></Text>
      <View style={styles.film}>
      <VideoView
        testID="launch-intro-video"
        player={player}
        nativeControls={false}
        playsInline
        contentFit="cover"
        surfaceType="textureView"
        onFirstFrameRender={() => setVisible(true)}
        style={styles.filmVideo}
      />
      {needsPlay && <AnimatedPressable
        testID="launch-intro-play"
        accessibilityRole="button"
        accessibilityLabel="Lancer le film"
        onPress={play}
        haptic={false}
        pressedScale={1}
        style={styles.playOverlay}
      >
        <View style={styles.playCircle}><Ionicons name="play" size={26} color="#173C28" /></View>
        <Text style={styles.playLabel}>Toucher pour lancer le film</Text>
      </AnimatedPressable>}
      </View>
      <Text style={styles.tagline}>Une nouvelle façon de trouver votre bonheur.</Text>
      {!compact && <View style={styles.categories}><Text style={styles.category}>MODE</Text><View style={styles.dot} /><Text style={styles.category}>LIFESTYLE</Text><View style={styles.dot} /><Text style={styles.category}>DÉCOUVERTES</Text></View>}
      </View>
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
      <View style={styles.progressTrack} accessibilityRole="progressbar" accessibilityLabel="Progression du film" accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>
      <Text style={styles.hint}>{needsPlay ? "Votre univers vous attend." : visible ? "Votre boutique s’ouvre à la fin du film." : "Votre film se prépare…"}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, width: "100%", backgroundColor: "#101813" },
  header: { paddingHorizontal: 24, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  brand: { fontFamily: typography.bold, fontSize: 18, letterSpacing: 3, color: "#EFF6EB" },
  skip: { flexDirection: "row", alignItems: "center", gap: 8, minHeight: 44, paddingHorizontal: 14, borderRadius: 24, borderWidth: 1, borderColor: "rgba(255,255,255,0.15)" },
  skipText: { fontFamily: typography.medium, fontSize: 12, color: "#D5E0D6" },
  stage: { flex: 1, justifyContent: "center", alignItems: "center", gap: 22, paddingHorizontal: 20, paddingVertical: 16 },
  eyebrow: { fontFamily: typography.medium, fontSize: 9, letterSpacing: 2, color: "#A2BAA6" },
  welcome: { flexDirection: "row", alignItems: "center", gap: 12 },
  welcomeLine: { height: 1, width: 22, backgroundColor: "#75977C" },
  title: { fontFamily: typography.bold, fontSize: 44, lineHeight: 49, color: "#F3F5EC", letterSpacing: -1.8, textAlign: "center" },
  accent: { color: "#B8E69C" },
  film: { width: "100%", maxWidth: 760, flexShrink: 1, aspectRatio: 16 / 9, borderRadius: 20, borderWidth: 1, borderColor: "rgba(205,230,201,0.2)", backgroundColor: "#101411", overflow: "hidden" },
  // Crop the bottom/right watermark while retaining the upper-left store branding.
  // The film container clips the enlarged video on both web and native.
  filmVideo: { position: "absolute", top: 0, left: 0, width: "110%", height: "110%" },
  tagline: { fontFamily: typography.regular, fontSize: 12, color: "#ADBDAD", textAlign: "center" },
  categories: { flexDirection: "row", alignItems: "center", gap: 12 },
  category: { fontFamily: typography.medium, fontSize: 8, letterSpacing: 1.6, color: "#93AC96" },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: "#B8E69C" },
  footer: { alignItems: "center", paddingTop: 8, paddingHorizontal: 28, gap: 16 },
  progressTrack: { width: "100%", maxWidth: 360, height: 3, borderRadius: 2, overflow: "hidden", backgroundColor: "rgba(255,255,255,0.12)" },
  progressFill: { height: "100%", borderRadius: 2, backgroundColor: "#B8E69C" },
  hint: { fontFamily: typography.regular, fontSize: 10, color: "#91A194" },
  playOverlay: { position: "absolute", top: 0, bottom: 0, left: 0, right: 0, backgroundColor: "rgba(8,20,13,0.48)", alignItems: "center", justifyContent: "center", gap: 14 },
  playCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: "#E0F1D5", alignItems: "center", justifyContent: "center", paddingLeft: 3 },
  playLabel: { color: "#FFFFFF", fontFamily: typography.semibold, fontSize: 12 },
});
