import { msg, useLocale } from "@/i18n";
import Ionicons from "@expo/vector-icons/Ionicons";
import { memo, useCallback, useRef, useState } from "react";
import { FlatList, StyleSheet, View, type ViewToken } from "react-native";
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
  type SharedValue,
} from "react-native-reanimated";
import { AnimatedPressable } from "@/components/animated-pressable";
import { useAppViewport } from "@/components/app-viewport";
import { HeroCard } from "@/components/hero-card";
import { palette } from "@/constants/theme";
import type { Banner } from "@/types/commerce";

const GAP = 14;
const SIDE_PADDING = 20;

export const HeroCarousel = memo(function HeroCarousel({
  parentScrollY,
  banners,
}: {
  parentScrollY?: SharedValue<number>;
  banners: Banner[];
}) {
  useLocale();
  const { contentWidth } = useAppViewport();
  const cardWidth = contentWidth * 0.85;
  const interval = cardWidth + GAP;
  const scrollX = useSharedValue(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<FlatList<Banner>>(null);

  const moveTo = useCallback(
    (index: number) => {
      const nextIndex = Math.max(0, Math.min(index, banners.length - 1));
      listRef.current?.scrollToOffset({
        offset: nextIndex * interval,
        animated: true,
      });
      setActiveIndex(nextIndex);
    },
    [banners.length, interval],
  );

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken<Banner>[] }) => {
      const next = viewableItems.find((item) => item.isViewable)?.index;
      if (typeof next === "number") setActiveIndex(next);
    },
    [],
  );

  if (!banners.length) return null;

  return (
    <View>
      <Animated.FlatList
        ref={listRef}
        horizontal
        data={banners}
        initialNumToRender={2}
        maxToRenderPerBatch={2}
        windowSize={3}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <HeroCard
            banner={item}
            index={index}
            cardWidth={cardWidth}
            interval={interval}
            scrollX={scrollX}
          />
        )}
        onScroll={scrollHandler}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 55 }}
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={interval}
        snapToAlignment="start"
        disableIntervalMomentum
        bounces={false}
        scrollEventThrottle={16}
        getItemLayout={(_, index) => ({
          index,
          length: interval,
          offset: interval * index,
        })}
        contentContainerStyle={{
          paddingHorizontal: SIDE_PADDING,
          gap: GAP,
          paddingBottom: 16,
        }}
      />
      <View style={styles.controls}>
        <AnimatedPressable
          accessibilityLabel={msg("heroCarousel.previousBanner")}
          disabled={activeIndex === 0}
          onPress={() => moveTo(activeIndex - 1)}
          style={[
            styles.arrowButton,
            activeIndex === 0 && styles.disabledArrow,
          ]}
        >
          <Ionicons name="arrow-back" size={18} color={palette.ink} />
        </AnimatedPressable>
        <View style={styles.pagination}>
          {banners.map((banner, index) => (
            <AnimatedPressable
              key={banner.id}
              accessibilityLabel={msg("banners.showNumber", { number: index + 1 })}
              onPress={() => moveTo(index)}
              haptic={false}
              style={[styles.dot, index === activeIndex && styles.activeDot]}
            />
          ))}
        </View>
        <AnimatedPressable
          accessibilityLabel={msg("heroCarousel.nextBanner")}
          disabled={activeIndex === banners.length - 1}
          onPress={() => moveTo(activeIndex + 1)}
          style={[
            styles.arrowButton,
            styles.nextButton,
            activeIndex === banners.length - 1 && styles.disabledArrow,
          ]}
        >
          <Ionicons name="arrow-forward" size={18} color={palette.white} />
        </AnimatedPressable>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  controls: {
    height: 46,
    marginHorizontal: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#E6E9E7",
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.72)",
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: "#D2D6D3" },
  activeDot: { width: 22, backgroundColor: palette.green },
  arrowButton: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E0E4E1",
    backgroundColor: palette.white,
  },
  nextButton: { borderColor: palette.ink, backgroundColor: palette.ink },
  disabledArrow: { opacity: 0.32, backgroundColor: "#F5F6F5" },
});
