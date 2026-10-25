import { useEvent } from "expo";
import { Image } from "expo-image";
import { VideoView, useVideoPlayer } from "expo-video";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { AnimatedPressable } from "@/components/animated-pressable";
import { msg, useLocale } from "@/i18n";
import { imageUrl } from "@/lib/format";
import { productVideoMedia } from "@/lib/product-video";

export function ProductVideoPlayer({ active, uri, poster }: { active: boolean; uri: string; poster?: string }) {
  const [attempt, setAttempt] = useState(0);
  return <VideoPlayback key={`${uri}-${attempt}`} active={active} uri={uri} poster={poster} onRetry={() => setAttempt(value => value + 1)} />;
}

export function VideoPlayback({ active, uri, poster, onRetry }: { active: boolean; uri: string; poster?: string; onRetry: () => void }) {
  useLocale();
  const media = useMemo(() => productVideoMedia(uri, poster ? imageUrl(poster) : undefined), [uri, poster]);
  const source = useMemo(() => media.src ? { uri: media.src, useCaching: true } : null, [media.src]);
  const player = useVideoPlayer(source, instance => {
    instance.loop = true;
    instance.muted = true;
  });
  const { status } = useEvent(player, "statusChange", { status: player.status });
  const [firstFrame, setFirstFrame] = useState(false);
  const [posterFailed, setPosterFailed] = useState(false);
  const failed = Boolean(media.error) || status === "error";
  const cover = posterFailed ? (poster ? imageUrl(poster) : undefined) : media.poster;

  useEffect(() => {
    if (active && status === "readyToPlay") player.play();
    else if (!active) player.pause();
  }, [active, player, status]);

  return (
    <View style={styles.frame}>
      <VideoView player={player} nativeControls={false} playsInline contentFit="cover" style={[StyleSheet.absoluteFill, styles.video]} onFirstFrameRender={() => setFirstFrame(true)} />
      {/* Web can load a cached video before the first-frame listener attaches.
          Readiness must also uncover the playing video. */}
      {((!firstFrame && status !== "readyToPlay") || failed) && cover ? (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <Image source={{ uri: cover }} contentFit="cover" style={StyleSheet.absoluteFill} onError={() => setPosterFailed(true)} />
        </View>
      ) : null}
      {status === "loading" && !failed ? (
        <View pointerEvents="none" style={styles.loading} accessibilityLabel={msg("common.loading")}>
          <ActivityIndicator color="#FFFFFF" />
        </View>
      ) : null}
      {failed ? (
        <View style={styles.error} accessibilityRole="alert">
          <Text style={styles.errorText}>{msg("productGallery.videoUnavailable")}</Text>
          <AnimatedPressable accessibilityRole="button" onPress={onRetry} style={styles.retry}>
            <Text style={styles.errorText}>{msg("productGallery.retryVideo")}</Text>
          </AnimatedPressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  video: { width: "100%", height: "100%", backgroundColor: "#171A18" },
  frame: { width: "100%", height: "100%", overflow: "hidden", backgroundColor: "#171A18" },
  loading: { position: "absolute", top: "45%", alignSelf: "center", padding: 12, borderRadius: 24, backgroundColor: "rgba(0,0,0,0.6)" },
  error: { position: "absolute", top: "30%", left: 48, right: 48, padding: 16, borderRadius: 12, backgroundColor: "rgba(0,0,0,0.85)", alignItems: "center" },
  errorText: { color: "#FFFFFF", textAlign: "center" },
  retry: { marginTop: 12, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: "#FFFFFF" },
});
