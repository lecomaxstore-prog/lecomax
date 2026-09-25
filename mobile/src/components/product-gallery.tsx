import { msg, useLocale } from "@/i18n";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useEvent } from "expo";
import { Image } from "expo-image";
import { VideoView, useVideoPlayer } from "expo-video";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Linking,
  Modal,
  ScrollView,
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
import { ProductPhoto } from "@/components/product-photo";
import { ZoomableProductPhoto } from "@/components/zoomable-product-photo";

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
  useLocale();
  if (/youtube\.com|youtu\.be/i.test(uri)) {
    return (
      <AnimatedPressable
        accessibilityLabel={msg("productGallery.openProductVideo")}
        onPress={() => void Linking.openURL(uri)}
        style={styles.externalVideo}
      >
        <View style={styles.playButton}>
          <Ionicons name="play" size={26} color={palette.white} />
        </View>
        <Text style={styles.videoLabel}>{msg("productGallery.watchVideoUppercase")}</Text>
      </AnimatedPressable>
    );
  }

  return <DirectVideo active={active} uri={uri} />;
}

function DirectVideo({ active, uri }: { active: boolean; uri: string }) {
  useLocale();
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
          isPlaying ? msg("productGallery.pauseVideo") : msg("productGallery.playVideo")
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
  useLocale();
  const insets = useSafeAreaInsets();
  const { contentWidth, windowHeight } = useAppViewport();
  const galleryWidth = contentWidth;
  const galleryHeight = Math.max(
    320,
    Math.min(galleryWidth * 1.12, windowHeight * 0.58, 580),
  );
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
  const photos = useMemo(() => images.filter((uri): uri is string => Boolean(uri)), [images]);
  const zoomIndex = Math.max(0, photos.indexOf(zoomedImage ?? ""));

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
        <View
          style={[
            styles.floatingHeader,
            { top: Math.max(insets.top + 6, 12) },
          ]}
        >
          <AnimatedPressable
            accessibilityLabel={msg("productGallery.returnToPreviousScreen")}
            accessibilityRole="button"
            onPress={onBack}
            pressedScale={0.94}
            style={styles.roundButton}
          >
            <Ionicons name="arrow-back" size={21} color={palette.ink} />
          </AnimatedPressable>
          <View style={styles.headerActions}>
            <AnimatedPressable
              accessibilityLabel={msg("productGallery.openCart")}
              accessibilityRole="button"
              onPress={onOpenCart}
              pressedScale={0.94}
              style={styles.roundButton}
            >
              <Ionicons name="bag-handle-outline" size={21} color={palette.ink} />
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
                  favorite ? msg("productCard.removeFromFavorites") : msg("productCard.addToFavorites")
                }
                accessibilityRole="button"
                accessibilityState={{ selected: favorite }}
                onPress={onToggleFavorite}
                pressedScale={0.94}
                style={[styles.roundButton, favorite && styles.favoriteActive]}
              >
                <Ionicons
                  name={favorite ? "heart" : "heart-outline"}
                  size={21}
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
                  accessibilityLabel={msg("product.enlargeImage", { number: index + 1, name: productName })}
                  haptic={false}
                  onPress={() => item.uri && setZoomedImage(item.uri)}
                  pressedScale={0.995}
                  style={styles.media}
                >
                  {item.uri ? (
                    <ProductPhoto
                      premiumLoading
                      uri={item.uri}
                      contentFit="contain"
                      contentPosition="center"
                      transition={180}
                      cachePolicy="memory-disk"
                      recyclingKey={item.id}
                      style={styles.productImage}
                    />
                  ) : (
                    <View style={styles.missingImage}>
                      <Ionicons
                        name="image-outline"
                        size={34}
                        color="#999B98"
                      />
                      <Text style={styles.missingImageText}>
                        {msg("productCard.imageUnavailableUppercase")}</Text>
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
              accessibilityLabel={msg("productGallery.showPreviousMedia")}
              accessibilityRole="button"
              disabled={activeIndex === 0}
              onPress={() => moveTo(activeIndex - 1)}
              pressedScale={0.9}
              style={[
                styles.galleryArrow,
                styles.galleryArrowLeft,
                activeIndex === 0 && styles.galleryArrowDisabled,
              ]}
            >
              <View style={styles.galleryArrowFace}>
                <Ionicons name="chevron-back" size={18} color={palette.ink} />
              </View>
            </AnimatedPressable>
            <AnimatedPressable
              accessibilityLabel={msg("productGallery.showNextMedia")}
              accessibilityRole="button"
              disabled={activeIndex === media.length - 1}
              onPress={() => moveTo(activeIndex + 1)}
              pressedScale={0.9}
              style={[
                styles.galleryArrow,
                styles.galleryArrowRight,
                activeIndex === media.length - 1 && styles.galleryArrowDisabled,
              ]}
            >
              <View style={styles.galleryArrowFace}>
                <Ionicons name="chevron-forward" size={18} color={palette.ink} />
              </View>
            </AnimatedPressable>
          </>
        ) : null}

        <View pointerEvents="none" style={styles.counter}>
          <Text style={styles.counterText}>
            {activeIndex + 1}<Text style={styles.counterDivider}>{" / "}</Text><Text style={styles.counterTotal}>{media.length}</Text>
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
            accessibilityViewIsModal
            style={[styles.zoom, { width: contentWidth, height: windowHeight, paddingTop: Math.max(insets.top, 16), paddingBottom: Math.max(insets.bottom, 20) }]}
          >
            <View style={styles.zoomHeader}>
              <View style={styles.zoomHeading}>
                <Text numberOfLines={2} style={styles.zoomTitle}>{productName}</Text>
              </View>
            <AnimatedPressable
              accessibilityLabel={msg("productGallery.closeEnlargedImage")}
              accessibilityRole="button"
              onPress={() => setZoomedImage(undefined)}
              style={styles.zoomClose}
            >
              <Ionicons name="close" size={21} color="#244638" />
            </AnimatedPressable>
            </View>
            <View style={styles.zoomStage}>
            {zoomedImage && <ZoomableProductPhoto key={zoomedImage} uri={zoomedImage} name={productName} />}
            </View>
            <View style={styles.zoomNavigation}>
              <AnimatedPressable
                accessibilityRole="button"
                accessibilityLabel={msg("productGallery.showPreviousMedia")}
                disabled={zoomIndex === 0}
                onPress={() => setZoomedImage(photos[zoomIndex - 1])}
                style={[styles.zoomClose, zoomIndex === 0 && styles.zoomDisabled]}
              ><Ionicons name="arrow-back" size={19} color="#244638" /></AnimatedPressable>
              <View style={styles.zoomPagination}>
              <Text accessibilityLiveRegion="polite" style={styles.zoomCount}>
                {String(zoomIndex + 1).padStart(2, "0")}<Text style={styles.zoomCountTotal}> / {String(photos.length).padStart(2, "0")}</Text>
              </Text>
              </View>
              <AnimatedPressable
                accessibilityRole="button"
                accessibilityLabel={msg("productGallery.showNextMedia")}
                disabled={zoomIndex >= photos.length - 1}
                onPress={() => setZoomedImage(photos[zoomIndex + 1])}
                style={[styles.zoomClose, zoomIndex >= photos.length - 1 && styles.zoomDisabled]}
              ><Ionicons name="arrow-forward" size={19} color="#244638" /></AnimatedPressable>
            </View>
            {photos.length > 1 && windowHeight > 520 ? <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.zoomThumbnails} contentContainerStyle={styles.zoomThumbnailRow}>
              {photos.map((uri, index) => <AnimatedPressable
                key={`${uri}-${index}`}
                accessibilityRole="button"
                accessibilityState={{ selected: index === zoomIndex }}
                accessibilityLabel={msg("product.enlargeImage", { number: index + 1, name: productName })}
                onPress={() => setZoomedImage(uri)}
                style={[styles.zoomThumbnail, index === zoomIndex && styles.zoomThumbnailSelected]}
              ><ProductPhoto uri={uri} contentFit="contain" cachePolicy="memory-disk" style={styles.zoomThumbnailImage} /></AnimatedPressable>)}
            </ScrollView> : null}
          </View>
        </AppViewportOverlay>
      </Modal>
    </View>
  );
});

const styles = StyleSheet.create({
  shell: { alignSelf: "center", backgroundColor: "#F8F7F4" },
  floatingHeader: {
    position: "absolute",
    left: 14,
    right: 14,
    zIndex: 5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  roundButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(23,26,24,0.07)",
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.96)",
    shadowColor: "#171A18",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.045,
    shadowRadius: 9,
    elevation: 1,
  },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  cartBadge: {
    position: "absolute",
    right: 2,
    top: 2,
    minWidth: 15,
    height: 15,
    paddingHorizontal: 3,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 7.5,
    borderWidth: 1.5,
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
    borderBottomColor: "rgba(0,0,0,0.06)",
    backgroundColor: "#FFFFFF",
  },
  media: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
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
    right: 16,
    bottom: 16,
    minWidth: 58,
    minHeight: 32,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(35,71,53,0.12)",
    backgroundColor: "rgba(255,255,255,0.96)",
    boxShadow: "0px 2px 8px rgba(17,24,19,0.08)",
  },
  counterText: {
    color: "#234735",
    fontFamily: typography.bold,
    fontSize: 12,
    lineHeight: 18,
    fontVariant: ["tabular-nums"],
  },
  counterDivider: { color: "#A3ADA5", fontFamily: typography.regular },
  counterTotal: { color: "#66746A", fontFamily: typography.medium },
  galleryArrow: {
    position: "absolute",
    top: "50%",
    marginTop: -22,
    // Keep a comfortable touch target around the smaller visible control.
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  galleryArrowFace: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(23,26,24,0.06)",
    backgroundColor: "rgba(255,255,255,0.65)",
  },
  galleryArrowLeft: { left: 0 },
  galleryArrowRight: { right: 0 },
  galleryArrowDisabled: { opacity: 0.14 },
  favoriteActive: { backgroundColor: "#16883A" },
  zoom: {
    // The overlay's inner wrapper is content-sized. flex: 1 would replace this
    // viewer's explicit window height with a zero basis on React Native Web.
    flexGrow: 0,
    flexShrink: 0,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
  },
  zoomHeader: { flexDirection: "row", alignItems: "center", gap: 16, paddingTop: 4, paddingBottom: 16, flexShrink: 0, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#E8ECE7" },
  zoomHeading: { flex: 1, minWidth: 0 },
  zoomTitle: { color: "#233D31", fontFamily: typography.semibold, fontSize: 14, lineHeight: 20, letterSpacing: -0.25 },
  zoomStage: { flex: 1, minHeight: 0, overflow: "hidden", backgroundColor: "#FFFFFF" },
  zoomNavigation: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 24, paddingVertical: 12, flexShrink: 0 },
  zoomPagination: { alignItems: "center", minWidth: 64 },
  zoomCount: { color: "#233D31", fontFamily: typography.semibold, fontSize: 12, letterSpacing: 0.5, fontVariant: ["tabular-nums"] },
  zoomCountTotal: { color: "#818B7E", fontFamily: typography.regular },
  zoomDisabled: { opacity: 0.28 },
  zoomThumbnails: { flexGrow: 0, flexShrink: 0, height: 64 },
  zoomThumbnailRow: { flexGrow: 1, justifyContent: "center", gap: 10, paddingBottom: 4 },
  zoomThumbnail: { width: 58, height: 58, borderRadius: 10, padding: 4, borderWidth: 2, borderColor: "#F0F2EE", backgroundColor: "#FFFFFF" },
  zoomThumbnailSelected: { borderColor: "#345740", backgroundColor: "#F1F5EE" },
  zoomThumbnailImage: { width: "100%", height: "100%", borderRadius: 8, backgroundColor: "#FFFFFF" },
  zoomClose: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: "#F3F5F1",
  },
});
