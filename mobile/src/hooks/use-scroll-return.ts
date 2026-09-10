import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, type RefObject } from "react";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { createScrollReturn } from "@/lib/scroll-return";

type ScrollTarget = {
  scrollTo?: (options: { y: number; animated: boolean }) => void;
  scrollToOffset?: (options: { offset: number; animated: boolean }) => void;
};

/** Restore after focus AND layout, including lists whose data arrives later. */
export function useScrollReturn(ref: RefObject<ScrollTarget | null>, resetKey = "") {
  const position = useMemo(() => {
    // Changing the result set intentionally starts a new scroll position.
    void resetKey;
    return createScrollReturn();
  }, [resetKey]);

  const restore = useCallback(() => {
    const offset = position.restore();
    if (offset === undefined) return;
    if (ref.current?.scrollToOffset) {
      ref.current.scrollToOffset({ offset, animated: false });
    } else {
      ref.current?.scrollTo?.({ y: offset, animated: false });
    }
  }, [position, ref]);

  useFocusEffect(useCallback(() => {
    position.focus();
    const frame = requestAnimationFrame(restore);
    return () => {
      cancelAnimationFrame(frame);
      position.blur();
    };
  }, [position, restore]));

  return useMemo(() => ({
    onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => position.record(event.nativeEvent.contentOffset.y),
    onScrollBeginDrag: () => position.beginDrag(),
    onContentSizeChange: restore,
    onLayout: restore,
    scrollEventThrottle: 16,
  }), [position, restore]);
}
