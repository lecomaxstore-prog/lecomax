import Ionicons from "@expo/vector-icons/Ionicons";
import { useEvent } from "expo";
import { Image } from "expo-image";
import { VideoView, useVideoPlayer } from "expo-video";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Linking,
  Modal,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AnimatedPressable } from "@/components/animated-pressable";
import { AppViewportOverlay, useAppViewport } from "@/components/app-viewport";
import { palette, typography } from "@/constants/theme";
import { imageUrl } from "@/lib/format";

type Props = {
  images: (string | undefined)[];
  video?: string;
  selectedImageIndex?: number;
  selectionVersion?: number;
  productName: string;
  favorite: boolean;
  wishlistEnabled?: boolean;
  cartCount: number;
  onBack: () => void;
  onOpenCart: () => void;
  onToggleFavorite: () => void;
};

type GalleryItem =
  | { id: string; type: "image"; uri?: string }
  | { id: string; type: "video"; uri: string; poster?: string };

function ProductVideo({ active, uri }: { active: boolean; uri: string }) {
  if (/youtube\.com|youtu\.be/i.test(uri)) {
    return (
      <AnimatedPressable
        accessibilityLabel="Ouvrir la vidéo du produit"
        onPress={() => void Linking.openURL(uri)}
        style={styles.externalVideo}
      >
        <View style={styles.playButton}>
          <Ionicons name="play" size={26} color={palette.white} />
        </View>
        <Text style={styles.videoLabel}>VOIR LA VIDÉO</Text>
      </AnimatedPressable>
    );
  }

  return <DirectVideo active={active} uri={uri} />;
}

function DirectVideo({ active, uri }: { active: boolean; uri: string }) {
  const player = useVideoPlayer({ uri: imageUrl(uri), useCaching: true }, (instance) => {
    instance.loop = true;
    instance.muted = true;
  });
  const { isPlaying } = useEvent(player, "playingChange", {
    isPlaying: player.playing,
  });

  useEffect(() => {
    if (active) player.play();
    else player.pause();
  }, [active, player]);

  return (
    <View style={styles.video}>
      <VideoView
        player={player}
        nativeControls={false}
        contentFit="cover"
        style={styles.video}
      />
      <AnimatedPressable
        accessibilityLabel={
          isPlaying ? "Mettre la vidéo en pause" : "Lire la vidéo"
        }
        onPress={() => (isPlaying ? player.pause() : player.play())}
        style={styles.videoTap}
      >
        {!isPlaying ? (
          <View style={styles.playButton}>
            <Ionicons name="play" size={26} color={palette.white} />
          </View>
        ) : null}
      </AnimatedPressable>
    </View>
  );
}

export const ProductGallery = memo(function ProductGallery({
  images,
  video,
  selectedImageIndex,
  selectionVersion,
  productName,
  favorite,
  wishlistEnabled = true,
  cartCount,
  onBack,
  onOpenCart,
  onToggleFavorite,
}: Props) {
  const insets = useSafeAreaInsets();
  const { contentWidth, windowHeight } = useAppViewport();
  const galleryWidth = contentWidth;
  const galleryHeight = Math.min(Math.max(galleryWidth * 1.12, 430), 640);
  const media = useMemo<GalleryItem[]>(
    () => [
      ...(video
        ? [
            {
              id: `video-${video}`,
              type: "video" as const,
              uri: video,
              poster: images[0],
            },
          ]
        : []),
      ...images.map((uri, index) => ({
        id: `image-${uri ?? "fallback"}-${index}`,
        type: "image" as const,
        uri,
      })),
    ],
    [images, video],
  );
  const galleryRef = useRef<FlatList<GalleryItem>>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const skippedInitialImageSelection = useRef(false);
  const [zoomedImage, setZoomedImage] = useState<string>();

  const moveTo = useCallback(
    (index: number) => {
      const next = Math.max(0, Math.min(index, media.length - 1));
      galleryRef.current?.scrollToOffset({
        offset: next * galleryWidth,
        animated: true,
      });
      setActiveIndex(next);
    },
    [galleryWidth, media.length],
  );

  useEffect(() => {
    if (selectedImageIndex === undefined) return;
    if (video && !skippedInitialImageSelection.current) {
      skippedInitialImageSelection.current = true;
      return;
    }
    const frame = requestAnimationFrame(() => moveTo(selectedImageIndex + (video ? 1 : 0)));
    return () => cancelAnimationFrame(frame);
  }, [moveTo, selectedImageIndex, selectionVersion, video]);

  useEffect(() => {
    const next = media[(activeIndex + 1) % media.length];
    if (next?.type === "image" && next.uri)
      void Image.prefetch(imageUrl(next.uri));
  }, [activeIndex, media]);

  const onMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const next = Math.round(event.nativeEvent.contentOffset.x / galleryWidth);
      setActiveIndex(Math.max(0, Math.min(next, media.length - 1)));
    },
    [galleryWidth, media.length],
  );

  return (
    <View style={[styles.shell, { width: contentWidth }]}>
      <View
        style={[
          styles.galleryCard,
          { width: galleryWidth, height: galleryHeight },
        ]}
      >
        <View style={[styles.floatingHeader, { top: Math.max(insets.top, 14) }]}>
          <AnimatedPressable
            accessibilityLabel="Revenir à l’écran précédent"
            accessibilityRole="button"
            onPress={onBack}
            pressedScale={0.92}
            style={styles.roundButton}
          >
            <Ionicons name="arrow-back" size={24} color={palette.ink} />
          </AnimatedPressable>
          <View style={styles.headerActions}>
            <AnimatedPressable
              accessibilityLabel="Ouvrir le panier"
              accessibilityRole="button"
              onPress={onOpenCart}
              pressedScale={0.92}
              style={styles.roundButton}
            >
              <Ionicons name="bag-handle-outline" size={22} color={palette.ink} />
              {cartCount > 0 ? (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>
                    {cartCount > 99 ? "99+" : cartCount}
                  </Text>
                </View>
              ) : null}
            </AnimatedPressable>
            {wishlistEnabled ? (
              <AnimatedPressable
                accessibilityLabel={
                  favorite ? "Retirer des favoris" : "Ajouter aux favoris"
                }
                accessibilityState={{ selected: favorite }}
                onPress={onToggleFavorite}
                style={[styles.roundButton, favorite && styles.favoriteActive]}
              >
                <Ionicons
                  name={favorite ? "heart" : "heart-outline"}
                  size={25}
                  color={favorite ? palette.white : palette.ink}
                />
              </AnimatedPressable>
            ) : null}
          </View>
        </View>
        <FlatList
          ref={galleryRef}
          horizontal
          pagingEnabled
          initialNumToRender={2}
          maxToRenderPerBatch={2}
          windowSize={3}
          data={media}
          keyExtractor={(item) => item.id}
          getItemLayout={(_, index) => ({
            index,
            length: galleryWidth,
            offset: galleryWidth * index,
          })}
          onMomentumScrollEnd={onMomentumScrollEnd}
          showsHorizontalScrollIndicator={false}
          bounces={false}
          decelerationRate="fast"
          renderItem={({ item, index }) => (
            <View style={{ width: galleryWidth, height: galleryHeight }}>
              {item.type === "video" ? (
                <ProductVideo active={index === activeIndex} uri={item.uri} />
              ) : (
                <AnimatedPressable
                  accessibilityLabel={`Agrandir l’image ${index + 1} de ${productName}`}
                  haptic={false}
                  onPress={() => item.uri && setZoomedImage(item.uri)}
                  pressedScale={0.995}
                  style={styles.media}
                >
                  {item.uri ? (
                    <Image
                      source={imageUrl(item.uri)}
                      contentFit="contain"
                      transition={180}
                      cachePolicy="memory-disk"
                      recyclingKey={item.id}
                      style={styles.media}
                    />
                  ) : (
                    <View style={styles.missingImage}>
                      <Ionicons
                        name="image-outline"
                        size={34}
                        color="#999B98"
                      />
                      <Text style={styles.missingImageText}>
                        IMAGE INDISPONIBLE
                      </Text>
                    </View>
                  )}
                </AnimatedPressable>
              )}
            </View>
          )}
        />

        {media.length > 1 ? (
          <>
            <AnimatedPressable
              accessibilityLabel="Afficher le média précédent"
              disabled={activeIndex === 0}
              onPress={() => moveTo(activeIndex - 1)}
              pressedScale={0.9}
              style={[
                styles.galleryArrow,
                styles.galleryArrowLeft,
                activeIndex === 0 && styles.galleryArrowDisabled,
              ]}
            >
              <Ionicons name="chevron-back" size={26} color={palette.ink} />
            </AnimatedPressable>
            <AnimatedPressable
              accessibilityLabel="Afficher le média suivant"
              disabled={activeIndex === media.length - 1}
              onPress={() => moveTo(activeIndex + 1)}
              pressedScale={0.9}
              style={[
                styles.galleryArrow,
                styles.galleryArrowRight,
                activeIndex === media.length - 1 && styles.galleryArrowDisabled,
              ]}
            >
              <Ionicons name="chevron-forward" size={26} color={palette.ink} />
            </AnimatedPressable>
          </>
        ) : null}

        <View style={styles.counter}>
          <Text style={styles.counterText}>
            {activeIndex + 1} / {media.length}
          </Text>
        </View>
      </View>

      <Modal
        animationType="fade"
        onRequestClose={() => setZoomedImage(undefined)}
        transparent
        visible={Boolean(zoomedImage)}
      >
        <AppViewportOverlay>
          <View
            style={[styles.zoom, { width: contentWidth, height: windowHeight }]}
          >
            <AnimatedPressable
              accessibilityLabel="Fermer l’image agrandie"
              onPress={() => setZoomedImage(undefined)}
              style={[styles.zoomClose, { top: Math.max(insets.top, 16) }]}
            >
              <Ionicons name="close" size={26} color={palette.ink} />
            </AnimatedPressable>
            <Image
              source={imageUrl(zoomedImage)}
              contentFit="contain"
              cachePolicy="memory-disk"
              style={{ width: contentWidth, height: windowHeight }}
            />
          </View>
        </AppViewportOverlay>
      </Modal>
    </View>
  );
});

const styles = StyleSheet.create({
  shell: { alignSelf: "center", backgroundColor: "#FFFFFF" },
  floatingHeader: {
    position: "absolute",
    left: 18,
    right: 18,
    zIndex: 5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  roundButton: {
    width: 50,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E7E4DF",
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.97)",
    shadowColor: "#171A18",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  cartBadge: {
    position: "absolute",
    right: 0,
    top: 1,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    backgroundColor: "#16883A",
  },
  cartBadgeText: {
    color: palette.white,
    fontFamily: typography.black,
    fontSize: 7,
  },
  galleryCard: {
    alignSelf: "center",
    overflow: "hidden",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEAE4",
    backgroundColor: "#FFFFFF",
  },
  media: { width: "100%", height: "100%" },
  missingImage: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  missingImageText: {
    color: "#858885",
    fontFamily: typography.bold,
    fontSize: 9,
    letterSpacing: 0.8,
  },
  video: { width: "100%", height: "100%", backgroundColor: "#171A18" },
  videoTap: {
    position: "absolute",
    inset: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  externalVideo: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#171A18",
  },
  playButton: {
    width: 60,
    height: 60,
    paddingLeft: 3,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 30,
    backgroundColor: "rgba(23,26,24,0.84)",
  },
  videoLabel: {
    marginTop: 13,
    color: palette.white,
    fontFamily: typography.black,
    fontSize: 9,
    letterSpacing: 1.2,
  },
  counter: {
    position: "absolute",
    right: 18,
    bottom: 18,
    minWidth: 53,
    height: 34,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    backgroundColor: "rgba(32,34,32,0.72)",
  },
  counterText: {
    color: palette.white,
    fontFamily: typography.semibold,
    fontSize: 12,
  },
  galleryArrow: {
    position: "absolute",
    top: "51%",
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E8E5DF",
    backgroundColor: "rgba(255,255,255,0.94)",
    shadowColor: "#171A18",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 7,
    elevation: 2,
  },
  galleryArrowLeft: { left: 16 },
  galleryArrowRight: { right: 16 },
  galleryArrowDisabled: { opacity: 0.28 },
  favoriteActive: { backgroundColor: "#16883A" },
  zoom: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FAF8F4",
  },
  zoomClose: {
    position: "absolute",
    right: 18,
    zIndex: 2,
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    backgroundColor: palette.white,
  },
});
